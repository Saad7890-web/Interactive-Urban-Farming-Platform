import { pool } from "../config/db.js";

export async function createVendorProfile(
  {
    userId,
    farmName,
    farmLocation,
    latitude = null,
    longitude = null,
    bio = null,
  },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO vendor_profiles
      (user_id, farm_name, certification_status, farm_location, latitude, longitude, bio)
    VALUES
      ($1, $2, 'pending', $3, $4, $5, $6)
    RETURNING *
    `,
    [userId, farmName, farmLocation, latitude, longitude, bio]
  );

  return result.rows[0];
}

export async function getVendorProfileByUserId(userId, client = pool) {
  const result = await client.query(
    `
    SELECT *
    FROM vendor_profiles
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}