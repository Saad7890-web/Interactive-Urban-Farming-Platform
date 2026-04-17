import { pool } from "../config/db.js";

function mapSpace(row) {
  if (!row) return null;

  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    farmName: row.farm_name,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    size: Number(row.size),
    price: Number(row.price),
    availability: row.availability,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBooking(row) {
  if (!row) return null;

  return {
    id: row.id,
    rentalSpaceId: row.rental_space_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    farmName: row.farm_name,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: Number(row.total_price),
    status: row.status,
    bookedAt: row.booked_at,
    updatedAt: row.updated_at,
  };
}

export async function listRentalSpaces(filters) {
  const {
    page = 1,
    limit = 10,
    search = "",
    location = "",
    minSize,
    maxSize,
    minPrice,
    maxPrice,
    availability,
    vendorId,
    sortBy = "created_at",
    sortOrder = "desc",
  } = filters;

  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(`(rs.location ILIKE $${idx} OR vp.farm_name ILIKE $${idx} OR u.name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (location) {
    where.push(`rs.location ILIKE $${idx}`);
    params.push(`%${location}%`);
    idx++;
  }

  if (minSize !== undefined) {
    where.push(`rs.size >= $${idx}`);
    params.push(minSize);
    idx++;
  }

  if (maxSize !== undefined) {
    where.push(`rs.size <= $${idx}`);
    params.push(maxSize);
    idx++;
  }

  if (minPrice !== undefined) {
    where.push(`rs.price >= $${idx}`);
    params.push(minPrice);
    idx++;
  }

  if (maxPrice !== undefined) {
    where.push(`rs.price <= $${idx}`);
    params.push(maxPrice);
    idx++;
  }

  if (availability !== undefined) {
    where.push(`rs.availability = $${idx}`);
    params.push(availability);
    idx++;
  }

  if (vendorId) {
    where.push(`rs.vendor_id = $${idx}`);
    params.push(vendorId);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortColumns = {
    created_at: "rs.created_at",
    price: "rs.price",
    size: "rs.size",
  };

  const orderBy = `${sortColumns[sortBy] || "rs.created_at"} ${sortOrder.toUpperCase()}`;

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM rental_spaces rs
    INNER JOIN vendor_profiles vp ON vp.id = rs.vendor_id
    INNER JOIN users u ON u.id = vp.user_id
    ${whereClause}
    `,
    params
  );

  const dataResult = await pool.query(
    `
    SELECT
      rs.*,
      vp.farm_name,
      u.name AS vendor_name
    FROM rental_spaces rs
    INNER JOIN vendor_profiles vp ON vp.id = rs.vendor_id
    INNER JOIN users u ON u.id = vp.user_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...params, limit, offset]
  );

  return {
    items: dataResult.rows.map(mapSpace),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function getRentalSpaceById(spaceId) {
  const result = await pool.query(
    `
    SELECT
      rs.*,
      vp.farm_name,
      u.name AS vendor_name
    FROM rental_spaces rs
    INNER JOIN vendor_profiles vp ON vp.id = rs.vendor_id
    INNER JOIN users u ON u.id = vp.user_id
    WHERE rs.id = $1
    LIMIT 1
    `,
    [spaceId]
  );

  return result.rows[0] ? mapSpace(result.rows[0]) : null;
}

export async function createRentalSpace(
  { vendorId, location, latitude = null, longitude = null, size, price, availability = true },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO rental_spaces
      (vendor_id, location, latitude, longitude, size, price, availability)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [vendorId, location, latitude, longitude, size, price, availability]
  );

  return result.rows[0] || null;
}

export async function updateRentalSpaceById(spaceId, updates, client = pool) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (!fields.length) return null;

  values.push(spaceId);

  const result = await client.query(
    `
    UPDATE rental_spaces
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    values
  );

  return result.rows[0] || null;
}

export async function softDeleteRentalSpace(spaceId, client = pool) {
  const result = await client.query(
    `
    UPDATE rental_spaces
    SET availability = FALSE
    WHERE id = $1
    RETURNING *
    `,
    [spaceId]
  );

  return result.rows[0] || null;
}

export async function getBookingById(bookingId) {
  const result = await pool.query(
    `
    SELECT
      rb.*,
      u.name AS customer_name,
      u.email AS customer_email,
      vp.farm_name,
      vp.id AS vendor_id,
      vu.name AS vendor_name,
      rs.location
    FROM rental_bookings rb
    INNER JOIN users u ON u.id = rb.customer_id
    INNER JOIN vendor_profiles vp ON vp.id = rb.vendor_id
    INNER JOIN users vu ON vu.id = vp.user_id
    INNER JOIN rental_spaces rs ON rs.id = rb.rental_space_id
    WHERE rb.id = $1
    LIMIT 1
    `,
    [bookingId]
  );

  return result.rows[0] ? mapBooking(result.rows[0]) : null;
}

export async function listBookings({
  page = 1,
  limit = 10,
  status,
  userId = null,
  vendorId = null,
}) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (status) {
    where.push(`rb.status = $${idx}`);
    params.push(status);
    idx++;
  }

  if (userId) {
    where.push(`rb.customer_id = $${idx}`);
    params.push(userId);
    idx++;
  }

  if (vendorId) {
    where.push(`rb.vendor_id = $${idx}`);
    params.push(vendorId);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM rental_bookings rb
    ${whereClause}
    `,
    params
  );

  const dataResult = await pool.query(
    `
    SELECT
      rb.*,
      u.name AS customer_name,
      u.email AS customer_email,
      vp.farm_name,
      vp.id AS vendor_id,
      vu.name AS vendor_name,
      rs.location
    FROM rental_bookings rb
    INNER JOIN users u ON u.id = rb.customer_id
    INNER JOIN vendor_profiles vp ON vp.id = rb.vendor_id
    INNER JOIN users vu ON vu.id = vp.user_id
    INNER JOIN rental_spaces rs ON rs.id = rb.rental_space_id
    ${whereClause}
    ORDER BY rb.booked_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...params, limit, offset]
  );

  return {
    items: dataResult.rows.map(mapBooking),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function createBookingTransactional(
  { rentalSpaceId, customerId, vendorId, startDate, endDate },
  client = pool
) {
  const result = await client.query(
    `
    SELECT rs.*, vp.farm_name
    FROM rental_spaces rs
    INNER JOIN vendor_profiles vp ON vp.id = rs.vendor_id
    WHERE rs.id = $1
    FOR UPDATE
    `,
    [rentalSpaceId]
  );

  if (!result.rowCount) {
    return null;
  }

  const space = result.rows[0];

  if (!space.availability) {
    throw new Error("SPACE_NOT_AVAILABLE");
  }

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
  const totalPrice = Number((Number(space.price) * days).toFixed(2));

  const bookingResult = await client.query(
    `
    INSERT INTO rental_bookings
      (rental_space_id, customer_id, vendor_id, start_date, end_date, total_price, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
    `,
    [rentalSpaceId, customerId, vendorId, startDate, endDate, totalPrice]
  );

  return bookingResult.rows[0] || null;
}

export async function cancelBookingById(bookingId, client = pool) {
  const result = await client.query(
    `
    UPDATE rental_bookings
    SET status = 'cancelled'
    WHERE id = $1
    RETURNING *
    `,
    [bookingId]
  );

  return result.rows[0] || null;
}

export async function updateBookingStatusById(bookingId, status, client = pool) {
  const result = await client.query(
    `
    UPDATE rental_bookings
    SET status = $2
    WHERE id = $1
    RETURNING *
    `,
    [bookingId, status]
  );

  return result.rows[0] || null;
}