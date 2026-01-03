// Migration script to add resume analysis columns
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Running migration: Adding resume analysis columns...');
    
    // Add compatibility_score column
    await client.query(`
      ALTER TABLE opportunity_applications 
      ADD COLUMN IF NOT EXISTS compatibility_score INTEGER DEFAULT NULL
    `);
    console.log('✅ Added compatibility_score column');
    
    // Add skill_analysis column
    await client.query(`
      ALTER TABLE opportunity_applications 
      ADD COLUMN IF NOT EXISTS skill_analysis JSONB DEFAULT NULL
    `);
    console.log('✅ Added skill_analysis column');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
