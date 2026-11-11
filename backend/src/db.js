// backend/src/db.js
// PostgreSQL connection pool and reusable query helper.
// Supports DATABASE_URL for hosted providers (e.g. Render, Neon) or individual env variables for local dev.

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;

  // Use TLS if explicit, or if cloud host (Neon/Render/sslmode=require), or in production
  const requiresSsl =
    process.env.DB_SSL === 'true' ||
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('sslmode=require') ||
    isProduction;

  if (requiresSsl) {
    if (process.env.DB_CA_CERT) {
      poolConfig.ssl = {
        ca: process.env.DB_CA_CERT,
        rejectUnauthorized: true,
      };
    } else {
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
