import { pool } from "../config/db.js";

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function findUserByEmail(email, client = pool) {
  const result = await client.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email]
  );
  return result.rows[0] ? {
    ...result.rows[0],
    ...mapUser(result.rows[0]),
  } : null;
}

export async function findUserById(id, client = pool) {
  const result = await client.query(
    `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return result.rows[0] ? {
    ...result.rows[0],
    ...mapUser(result.rows[0]),
  } : null;
}

export async function createUser(
  { name, email, passwordHash, role, status },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, status, created_at, updated_at, deleted_at
    `,
    [name, email, passwordHash, role, status]
  );

  return mapUser(result.rows[0]);
}