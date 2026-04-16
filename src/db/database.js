// src/db/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function toPostgres(sql) {
  return sql;
}

async function initPg() {
  const client = await pool.connect();
  client.release();
}

async function getDb() {
  return pool;
}

async function query(db, sql, params = []) {
  const result = await db.query(toPostgres(sql), params);
  return result.rows;
}

async function run(db, sql, params = []) {
  const result = await db.query(toPostgres(sql), params);
  return result;
}

module.exports = { initPg, getDb, query, run, toPostgres };
