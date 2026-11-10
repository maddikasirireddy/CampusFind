// backend/src/db.js
// PostgreSQL connection pool and reusable query helper.
// Supports DATABASE_URL for hosted providers (e.g. Render, Neon) or individual env variables for local dev.

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;

  // Use appropriate TLS settings when DATABASE_URL is provided in hosted environments
  // Do NOT disable certificate verification globally; respect provider CA or enable SSL if required
  if (process.env.DB_SSL === 'true' || isProduction) {
    // If a custom CA cert is supplied, use it; otherwise allow provider SSL connection
    if (process.env.DB_CA_CERT) {
      poolConfig.ssl = {
        ca: process.env.DB_CA_CERT,
        rejectUnauthorized: true,
      };
    } else {
      // Managed cloud DBs like Render/Neon use TLS. We don't disable verification globally elsewhere in Node.
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }
  }
} else {
  poolConfig = {
    host:     process.env.DB_HOST     || '/tmp',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    user:     process.env.DB_USER     || 'sirireddy',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'campusfind',
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { pool, query };
