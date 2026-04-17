import { pool } from "../config/db.js";

function mapOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    produceId: row.produce_id,
    productName: row.product_name,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    status: row.status,
    orderDate: row.order_date,
    updatedAt: row.updated_at,
  };
}

export async function createOrderTransactional({
  userId,
  produceId,
  quantity,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `
      SELECT
        p.*,
        vp.certification_status AS vendor_certification_status,
        vp.user_id AS vendor_user_id
      FROM produce p
      INNER JOIN vendor_profiles vp ON vp.id = p.vendor_id
      WHERE p.id = $1
      FOR UPDATE
      `,
      [produceId]
    );

    if (productResult.rowCount === 0) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const product = productResult.rows[0];

    if (!product.is_active) {
      throw new Error("PRODUCT_INACTIVE");
    }

    if (product.certification_status !== "approved") {
      throw new Error("PRODUCT_NOT_APPROVED");
    }

    if (product.available_quantity < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const updatedQty = product.available_quantity - quantity;
    const totalPrice = Number((Number(product.price) * quantity).toFixed(2));

    await client.query(
      `
      UPDATE produce
      SET available_quantity = $2,
          is_active = CASE WHEN $2 <= 0 THEN FALSE ELSE TRUE END
      WHERE id = $1
      `,
      [produceId, updatedQty]
    );

    const orderResult = await client.query(
      `
      INSERT INTO orders
        (user_id, produce_id, vendor_id, quantity, unit_price, total_price, status)
      VALUES
        ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
      `,
      [userId, product.id, product.vendor_id, quantity, product.price, totalPrice]
    );

    const fullOrder = await client.query(
      `
      SELECT
        o.*,
        u.name AS user_name,
        u.email AS user_email,
        p.name AS product_name,
        vp.id AS vendor_id,
        vu.name AS vendor_name
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      INNER JOIN produce p ON p.id = o.produce_id
      INNER JOIN vendor_profiles vp ON vp.id = o.vendor_id
      INNER JOIN users vu ON vu.id = vp.user_id
      WHERE o.id = $1
      LIMIT 1
      `,
      [orderResult.rows[0].id]
    );

    await client.query("COMMIT");
    return mapOrder(fullOrder.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrders({
  page = 1,
  limit = 10,
  status,
  userId = null,
  vendorProfileId = null,
}) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (status) {
    where.push(`o.status = $${idx}`);
    params.push(status);
    idx++;
  }

  if (userId) {
    where.push(`o.user_id = $${idx}`);
    params.push(userId);
    idx++;
  }

  if (vendorProfileId) {
    where.push(`o.vendor_id = $${idx}`);
    params.push(vendorProfileId);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM orders o
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      o.*,
      u.name AS user_name,
      u.email AS user_email,
      p.name AS product_name,
      vp.id AS vendor_id,
      vu.name AS vendor_name
    FROM orders o
    INNER JOIN users u ON u.id = o.user_id
    INNER JOIN produce p ON p.id = o.produce_id
    INNER JOIN vendor_profiles vp ON vp.id = o.vendor_id
    INNER JOIN users vu ON vu.id = vp.user_id
    ${whereClause}
    ORDER BY o.order_date DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows.map(mapOrder),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}