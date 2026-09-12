import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Force dotenv to load .env relative to this file's position inside backend/
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});