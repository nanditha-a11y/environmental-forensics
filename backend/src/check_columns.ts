import { pool } from './db';

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'evidence';
    `);
    
    console.log('--- EVIDENCE TABLE COLUMNS ---');
    console.table(result.rows);
  } catch (error) {
    console.error('Error fetching columns:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();