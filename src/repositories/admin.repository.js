import { pool } from "../config/db.js";

function buildOffset(page, limit) {
  return (page - 1) * limit;
}

export async function getVendors({
  page = 1,
  limit = 10,
  search = "",
  status = "",
}) {
  const offset = buildOffset(page, limit);

  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(
      `(vp.farm_name ILIKE $${idx} OR vp.farm_location ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  if (status) {
    where.push(`vp.certification_status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM vendor_profiles vp
    INNER JOIN users u ON u.id = vp.user_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      vp.id,
      vp.user_id,
      vp.farm_name,
      vp.certification_status,
      vp.farm_location,
      vp.latitude,
      vp.longitude,
      vp.bio,
      vp.approved_by,
      vp.approved_at,
      vp.created_at,
      vp.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      u.status AS user_status
    FROM vendor_profiles vp
    INNER JOIN users u ON u.id = vp.user_id
    ${whereClause}
    ORDER BY vp.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows,
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function getVendorById(vendorId) {
  const result = await pool.query(
    `
    SELECT
      vp.id,
      vp.user_id,
      vp.farm_name,
      vp.certification_status,
      vp.farm_location,
      vp.latitude,
      vp.longitude,
      vp.bio,
      vp.approved_by,
      vp.approved_at,
      vp.created_at,
      vp.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      u.status AS user_status,
      u.role AS user_role
    FROM vendor_profiles vp
    INNER JOIN users u ON u.id = vp.user_id
    WHERE vp.id = $1
    LIMIT 1
    `,
    [vendorId]
  );

  return result.rows[0] || null;
}

export async function approveVendor(vendorId, adminId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `SELECT id, user_id FROM vendor_profiles WHERE id = $1 LIMIT 1`,
      [vendorId]
    );

    if (vendorResult.rowCount === 0) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    const vendor = vendorResult.rows[0];

    await client.query(
      `
      UPDATE users
      SET status = 'active'
      WHERE id = $1
      `,
      [vendor.user_id]
    );

    await client.query(
      `
      UPDATE vendor_profiles
      SET certification_status = 'approved',
          approved_by = $2,
          approved_at = NOW()
      WHERE id = $1
      `,
      [vendorId, adminId]
    );

    const updated = await client.query(
      `
      SELECT
        vp.id,
        vp.user_id,
        vp.farm_name,
        vp.certification_status,
        vp.farm_location,
        vp.latitude,
        vp.longitude,
        vp.bio,
        vp.approved_by,
        vp.approved_at,
        vp.created_at,
        vp.updated_at,
        u.name AS user_name,
        u.email AS user_email,
        u.status AS user_status
      FROM vendor_profiles vp
      INNER JOIN users u ON u.id = vp.user_id
      WHERE vp.id = $1
      LIMIT 1
      `,
      [vendorId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectVendor(vendorId, adminId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `SELECT id, user_id FROM vendor_profiles WHERE id = $1 LIMIT 1`,
      [vendorId]
    );

    if (vendorResult.rowCount === 0) {
      throw new Error("VENDOR_NOT_FOUND");
    }

    const vendor = vendorResult.rows[0];

    await client.query(
      `
      UPDATE users
      SET status = 'suspended'
      WHERE id = $1
      `,
      [vendor.user_id]
    );

    await client.query(
      `
      UPDATE vendor_profiles
      SET certification_status = 'rejected',
          approved_by = $2,
          approved_at = NOW()
      WHERE id = $1
      `,
      [vendorId, adminId]
    );

    const updated = await client.query(
      `
      SELECT
        vp.id,
        vp.user_id,
        vp.farm_name,
        vp.certification_status,
        vp.farm_location,
        vp.latitude,
        vp.longitude,
        vp.bio,
        vp.approved_by,
        vp.approved_at,
        vp.created_at,
        vp.updated_at,
        u.name AS user_name,
        u.email AS user_email,
        u.status AS user_status
      FROM vendor_profiles vp
      INNER JOIN users u ON u.id = vp.user_id
      WHERE vp.id = $1
      LIMIT 1
      `,
      [vendorId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getCertifications({
  page = 1,
  limit = 10,
  search = "",
  status = "",
}) {
  const offset = buildOffset(page, limit);

  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(
      `(sc.certifying_agency ILIKE $${idx} OR vp.farm_name ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  if (status) {
    where.push(`sc.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM sustainability_certs sc
    INNER JOIN vendor_profiles vp ON vp.id = sc.vendor_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      sc.id,
      sc.vendor_id,
      sc.certifying_agency,
      sc.certification_date,
      sc.expiry_date,
      sc.document_url,
      sc.status,
      sc.reviewed_by,
      sc.review_notes,
      sc.created_at,
      sc.updated_at,
      vp.farm_name,
      vp.farm_location
    FROM sustainability_certs sc
    INNER JOIN vendor_profiles vp ON vp.id = sc.vendor_id
    ${whereClause}
    ORDER BY sc.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows,
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function approveCertification(certId, adminId, notes = null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const certResult = await client.query(
      `SELECT id, vendor_id FROM sustainability_certs WHERE id = $1 LIMIT 1`,
      [certId]
    );

    if (certResult.rowCount === 0) {
      throw new Error("CERTIFICATION_NOT_FOUND");
    }

    const cert = certResult.rows[0];

    await client.query(
      `
      UPDATE sustainability_certs
      SET status = 'approved',
          reviewed_by = $2,
          review_notes = $3
      WHERE id = $1
      `,
      [certId, adminId, notes]
    );

    await client.query(
      `
      UPDATE vendor_profiles
      SET certification_status = 'approved'
      WHERE id = $1
      `,
      [cert.vendor_id]
    );

    const updated = await client.query(
      `
      SELECT
        sc.id,
        sc.vendor_id,
        sc.certifying_agency,
        sc.certification_date,
        sc.expiry_date,
        sc.document_url,
        sc.status,
        sc.reviewed_by,
        sc.review_notes,
        sc.created_at,
        sc.updated_at,
        vp.farm_name,
        vp.farm_location
      FROM sustainability_certs sc
      INNER JOIN vendor_profiles vp ON vp.id = sc.vendor_id
      WHERE sc.id = $1
      LIMIT 1
      `,
      [certId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectCertification(certId, adminId, notes = null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const certResult = await client.query(
      `SELECT id, vendor_id FROM sustainability_certs WHERE id = $1 LIMIT 1`,
      [certId]
    );

    if (certResult.rowCount === 0) {
      throw new Error("CERTIFICATION_NOT_FOUND");
    }

    const cert = certResult.rows[0];

    await client.query(
      `
      UPDATE sustainability_certs
      SET status = 'rejected',
          reviewed_by = $2,
          review_notes = $3
      WHERE id = $1
      `,
      [certId, adminId, notes]
    );

    await client.query(
      `
      UPDATE vendor_profiles
      SET certification_status = 'rejected'
      WHERE id = $1
      `,
      [cert.vendor_id]
    );

    const updated = await client.query(
      `
      SELECT
        sc.id,
        sc.vendor_id,
        sc.certifying_agency,
        sc.certification_date,
        sc.expiry_date,
        sc.document_url,
        sc.status,
        sc.reviewed_by,
        sc.review_notes,
        sc.created_at,
        sc.updated_at,
        vp.farm_name,
        vp.farm_location
      FROM sustainability_certs sc
      INNER JOIN vendor_profiles vp ON vp.id = sc.vendor_id
      WHERE sc.id = $1
      LIMIT 1
      `,
      [certId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}