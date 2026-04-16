import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { createUser, findUserByEmail, findUserById } from "../repositories/user.repository.js";
import { createVendorProfile, getVendorProfileByUserId } from "../repositories/vendor.repository.js";
import AppError from "../utils/AppError.js";
import { signAccessToken } from "../utils/jwt.js";

function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function register(payload) {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const status = payload.role === "vendor" ? "pending" : "active";

    const user = await createUser(
      {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
        status,
      },
      client
    );

    let vendorProfile = null;

    if (payload.role === "vendor") {
      vendorProfile = await createVendorProfile(
        {
          userId: user.id,
          farmName: payload.farmName,
          farmLocation: payload.farmLocation,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          bio: payload.bio ?? null,
        },
        client
      );
    }

    await client.query("COMMIT");

    const token = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    return {
      user: safeUser(user),
      vendorProfile,
      token,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function login({ email, password }) {
  const userRow = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email]
  );

  const user = userRow.rows[0];
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw new AppError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = signAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    token,
  };
}

export async function me(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const vendorProfile = user.role === "vendor"
    ? await getVendorProfileByUserId(user.id)
    : null;

  return {
    user,
    vendorProfile,
  };
}