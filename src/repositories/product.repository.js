import { pool } from "../config/db.js";

function mapProduct(row) {
  if (!row) return null;

  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorFarmName: row.farm_name,
    vendorLocation: row.farm_location,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    certificationStatus: row.certification_status,
    availableQuantity: row.available_quantity,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(filters) {
  const {
    page = 1,
    limit = 10,
    search = "",
    category,
    certificationStatus = "approved",
    vendorId,
    minPrice,
    maxPrice,
    sortBy = "created_at",
    sortOrder = "desc",
  } = filters;

  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let idx = 1;

  where.push(`p.is_active = TRUE`);
  where.push(`p.available_quantity > 0`);

  if (search) {
    where.push(
      `(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR vp.farm_name ILIKE $${idx} OR vp.farm_location ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  if (category) {
    where.push(`p.category = $${idx}`);
    params.push(category);
    idx++;
  }

  if (certificationStatus) {
    where.push(`p.certification_status = $${idx}`);
    params.push(certificationStatus);
    idx++;
  }

  if (vendorId) {
    where.push(`p.vendor_id = $${idx}`);
    params.push(vendorId);
    idx++;
  }

  if (minPrice !== undefined) {
    where.push(`p.price >= $${idx}`);
    params.push(minPrice);
    idx++;
  }

  if (maxPrice !== undefined) {
    where.push(`p.price <= $${idx}`);
    params.push(maxPrice);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortColumns = {
    created_at: "p.created_at",
    price: "p.price",
    name: "p.name",
  };

  const orderBy = `${sortColumns[sortBy] || "p.created_at"} ${sortOrder.toUpperCase()}`;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM produce p
    INNER JOIN vendor_profiles vp ON vp.id = p.vendor_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      p.*,
      vp.farm_name,
      vp.farm_location,
      u.name AS vendor_name
    FROM produce p
    INNER JOIN vendor_profiles vp ON vp.id = p.vendor_id
    INNER JOIN users u ON u.id = vp.user_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows.map(mapProduct),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function getProductById(productId) {
  const result = await pool.query(
    `
    SELECT
      p.*,
      vp.farm_name,
      vp.farm_location,
      u.name AS vendor_name
    FROM produce p
    INNER JOIN vendor_profiles vp ON vp.id = p.vendor_id
    INNER JOIN users u ON u.id = vp.user_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [productId]
  );

  return result.rows[0] ? mapProduct(result.rows[0]) : null;
}

export async function createProduct(
  {
    vendorId,
    name,
    description = null,
    price,
    category,
    availableQuantity = 0,
    certificationStatus = "approved",
  },
  client = pool
) {
  const result = await client.query(
    `
    INSERT INTO produce
      (vendor_id, name, description, price, category, certification_status, available_quantity, is_active)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING *
    `,
    [vendorId, name, description, price, category, certificationStatus, availableQuantity]
  );

  return result.rows[0];
}

export async function updateProductById(productId, updates, client = pool) {
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

  values.push(productId);

  const result = await client.query(
    `
    UPDATE produce
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    values
  );

  return result.rows[0] || null;
}

export async function updateOwnProductById(productId, vendorId, updates, client = pool) {
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

  values.push(productId, vendorId);

  const result = await client.query(
    `
    UPDATE produce
    SET ${fields.join(", ")}
    WHERE id = $${idx} AND vendor_id = $${idx + 1}
    RETURNING *
    `,
    values
  );

  return result.rows[0] || null;
}

export async function softDeleteOwnProduct(productId, vendorId, client = pool) {
  const result = await client.query(
    `
    UPDATE produce
    SET is_active = FALSE, available_quantity = 0
    WHERE id = $1 AND vendor_id = $2
    RETURNING *
    `,
    [productId, vendorId]
  );

  return result.rows[0] || null;
}

export async function softDeleteProductById(productId, client = pool) {
  const result = await client.query(
    `
    UPDATE produce
    SET is_active = FALSE, available_quantity = 0
    WHERE id = $1
    RETURNING *
    `,
    [productId]
  );

  return result.rows[0] || null;
}

export async function getProductForOrder(productId, client = pool) {
  const result = await client.query(
    `
    SELECT *
    FROM produce
    WHERE id = $1
    FOR UPDATE
    `,
    [productId]
  );

  return result.rows[0] || null;
}

export async function decrementProductQuantity(productId, quantity, client = pool) {
  const result = await client.query(
    `
    UPDATE produce
    SET available_quantity = available_quantity - $2,
        is_active = CASE WHEN available_quantity - $2 <= 0 THEN FALSE ELSE is_active END
    WHERE id = $1
    RETURNING *
    `,
    [productId, quantity]
  );

  return result.rows[0] || null;
}