// backend/src/db.js
// PostgreSQL connection pool and reusable query helper.
// Uses DATABASE_URL from .env — works for local and cloud (Neon).

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL for cloud databases (Neon), skip for localhost
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { pool, query };
