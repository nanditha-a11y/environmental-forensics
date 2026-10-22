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

// Debug log to verify database connection host & database name
pool.query('SELECT current_database(), current_user, inet_server_addr();')
  .then((res) => console.log('CONNECTED TO DB:', res.rows[0]))
  .catch((err) => console.error('DB CONNECTION ERROR:', err));