import { pool } from "../config/db.js";

function mapPost(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    postContent: row.post_content,
    postDate: row.post_date,
    moderationStatus: row.moderation_status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    moderationNotes: row.moderation_notes,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listForumPosts({
  page = 1,
  limit = 10,
  search = "",
  moderationStatus,
  userId = null,
  includeHidden = false,
  includeRemoved = false,
}) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(
      `(cp.post_content ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  if (moderationStatus) {
    where.push(`cp.moderation_status = $${idx}`);
    params.push(moderationStatus);
    idx++;
  } else {
    if (!includeHidden) {
      where.push(`cp.moderation_status = 'visible'`);
    }
    if (!includeRemoved) {
      where.push(`cp.moderation_status <> 'removed'`);
    }
  }

  if (userId) {
    where.push(`cp.user_id = $${idx}`);
    params.push(userId);
    idx++;
  }

  where.push(`cp.deleted_at IS NULL`);

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM community_posts cp
    INNER JOIN users u ON u.id = cp.user_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      cp.*,
      u.name AS user_name,
      u.email AS user_email
    FROM community_posts cp
    INNER JOIN users u ON u.id = cp.user_id
    ${whereClause}
    ORDER BY cp.post_date DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countResult = await pool.query(countQuery, params);
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    items: dataResult.rows.map(mapPost),
    total: countResult.rows[0]?.total || 0,
    page,
    limit,
  };
}

export async function getForumPostById(postId) {
  const result = await pool.query(
    `
    SELECT
      cp.*,
      u.name AS user_name,
      u.email AS user_email
    FROM community_posts cp
    INNER JOIN users u ON u.id = cp.user_id
    WHERE cp.id = $1
    LIMIT 1
    `,
    [postId]
  );

  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

export async function createForumPost({ userId, postContent }, client = pool) {
  const result = await client.query(
    `
    INSERT INTO community_posts (user_id, post_content, moderation_status)
    VALUES ($1, $2, 'visible')
    RETURNING *
    `,
    [userId, postContent]
  );

  return result.rows[0] || null;
}

export async function updateOwnForumPost(postId, userId, postContent, client = pool) {
  const result = await client.query(
    `
    UPDATE community_posts
    SET post_content = $3
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING *
    `,
    [postId, userId, postContent]
  );

  return result.rows[0] || null;
}

export async function updateForumPostById(postId, postContent, client = pool) {
  const result = await client.query(
    `
    UPDATE community_posts
    SET post_content = $2
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
    `,
    [postId, postContent]
  );

  return result.rows[0] || null;
}

export async function softDeleteOwnForumPost(postId, userId, client = pool) {
  const result = await client.query(
    `
    UPDATE community_posts
    SET deleted_at = NOW(),
        moderation_status = 'removed'
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING *
    `,
    [postId, userId]
  );

  return result.rows[0] || null;
}

export async function softDeleteForumPostById(postId, client = pool) {
  const result = await client.query(
    `
    UPDATE community_posts
    SET deleted_at = NOW(),
        moderation_status = 'removed'
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
    `,
    [postId]
  );

  return result.rows[0] || null;
}

export async function moderateForumPost(
  postId,
  {
    moderationStatus,
    moderationNotes = null,
    moderatedBy,
  },
  client = pool
) {
  const result = await client.query(
    `
    UPDATE community_posts
    SET moderation_status = $2,
        moderation_notes = $3,
        moderated_by = $4,
        moderated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
    `,
    [postId, moderationStatus, moderationNotes, moderatedBy]
  );

  return result.rows[0] || null;
}