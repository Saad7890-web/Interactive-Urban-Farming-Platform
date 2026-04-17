import { pool } from "../config/db.js";

function mapTrack(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorFarmName: row.farm_name,
    rentalBookingId: row.rental_booking_id,
    plantName: row.plant_name,
    species: row.species,
    plantedAt: row.planted_at,
    expectedHarvestDate: row.expected_harvest_date,
    healthStatus: row.health_status,
    growthStage: row.growth_stage,
    currentNotes: row.current_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    plantTrackId: row.plant_track_id,
    eventType: row.event_type,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  };
}

export async function listPlantTracks({
  page = 1,
  limit = 10,
  search = "",
  healthStatus,
  growthStage,
  userId = null,
  vendorId = null,
}) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(
      `(pt.plant_name ILIKE $${idx} OR pt.species ILIKE $${idx} OR pt.current_notes ILIKE $${idx} OR u.name ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  if (healthStatus) {
    where.push(`pt.health_status = $${idx}`);
    params.push(healthStatus);
    idx++;
  }

  if (growthStage) {
    where.push(`pt.growth_stage = $${idx}`);
    params.push(growthStage);
    idx++;
  }

  if (userId) {
    where.push(`pt.user_id = $${idx}`);
    params.push(userId);
    idx++;
  }

  if (vendorId) {
    where.push(`pt.vendor_id = $${idx}`);
    params.push(vendorId);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM plant_tracks pt
    INNER JOIN users u ON u.id = pt.user_id
    LEFT JOIN vendor_profiles vp ON vp.id = pt.vendor_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      pt.*,
      u.name AS user_name,
      u.email AS user_email,
      vp.farm_name,
      vu.name AS vendor_name
    FROM plant_tracks pt
    INNER JOIN users u ON u.id = pt.user_id
    LEFT JOIN vendor_profiles vp ON vp.id = pt.vendor_id
    LEFT JOIN users vu ON vu.id = vp.user_id
    ${whereClause}
    ORDER BY pt.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows.map(mapTrack),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function getPlantTrackById(plantId) {
  const result = await pool.query(
    `
    SELECT
      pt.*,
      u.name AS user_name,
      u.email AS user_email,
      vp.farm_name,
      vu.name AS vendor_name
    FROM plant_tracks pt
    INNER JOIN users u ON u.id = pt.user_id
    LEFT JOIN vendor_profiles vp ON vp.id = pt.vendor_id
    LEFT JOIN users vu ON vu.id = vp.user_id
    WHERE pt.id = $1
    LIMIT 1
    `,
    [plantId]
  );

  return result.rows[0] ? mapTrack(result.rows[0]) : null;
}

export async function createPlantTrack(
  {
    userId,
    vendorId = null,
    rentalBookingId = null,
    plantName,
    species = null,
    plantedAt = null,
    expectedHarvestDate = null,
    healthStatus = "healthy",
    growthStage = "seedling",
    currentNotes = null,
  },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO plant_tracks
      (user_id, vendor_id, rental_booking_id, plant_name, species, planted_at, expected_harvest_date, health_status, growth_stage, current_notes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
    [
      userId,
      vendorId,
      rentalBookingId,
      plantName,
      species,
      plantedAt,
      expectedHarvestDate,
      healthStatus,
      growthStage,
      currentNotes,
    ]
  );

  return result.rows[0] || null;
}

export async function updatePlantTrackById(plantId, updates, client = pool) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(plantId);

  const result = await client.query(
    `
    UPDATE plant_tracks
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    values
  );

  return result.rows[0] || null;
}

export async function listPlantTrackingEvents({
  plantId,
  page = 1,
  limit = 10,
}) {
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM plant_tracking_events
    WHERE plant_track_id = $1
    `,
    [plantId]
  );

  const dataResult = await pool.query(
    `
    SELECT *
    FROM plant_tracking_events
    WHERE plant_track_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [plantId, limit, offset]
  );

  return {
    items: dataResult.rows.map(mapEvent),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function addPlantTrackingEvent(
  { plantTrackId, eventType, eventPayload = null },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO plant_tracking_events (plant_track_id, event_type, event_payload)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [plantTrackId, eventType, eventPayload]
  );

  return result.rows[0] || null;
}