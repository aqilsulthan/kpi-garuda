// lib/db.ts — Koneksi PostgreSQL Perusahaan
import postgres from 'postgres'

const sql = postgres({
  host:     process.env.PGHOST!,
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE!,
  username: process.env.PGUSER!,
  password: process.env.PGPASSWORD!,
  ssl:      { rejectUnauthorized: false },
  max:      10,
  idle_timeout: 20,
  connect_timeout: 30,
})

export default sql
