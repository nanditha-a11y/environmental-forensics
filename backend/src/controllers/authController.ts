import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from '../db';

// Force load backend/.env explicitly
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_forensics_key_2026_safe';
const TOKEN_EXPIRE = '24h';

// 1. User Registration
export const register = async (req: Request, res: Response): Promise<void> => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
    return;
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ status: 'error', message: 'Email is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userRole = ['admin', 'investigator', 'analyst'].includes(role) ? role : 'investigator';

    const newUserQuery = `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role, created_at;
    `;
    const result = await pool.query(newUserQuery, [full_name, email, password_hash, userRole]);
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration Error Details:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error during registration.' });
  }
};

// 2. User Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login Error Details:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error during login.' });
  }
};