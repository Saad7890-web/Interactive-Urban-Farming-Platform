import { createForumPost, getForumPostById, listForumPosts, moderateForumPost, softDeleteForumPostById, softDeleteOwnForumPost, updateForumPostById, updateOwnForumPost } from "../repositories/forum.repository.js";
import AppError from "../utils/AppError.js";

function canAccessPost(user, post) {
  if (user.role === "admin") return true;
  if (post.deletedAt) return false;
  if (post.moderationStatus === "visible") return true;
  return post.userId === user.id;
}

export async function browsePosts(user, query) {
  if (user.role === "admin") {
    return listForumPosts({
      ...query,
      includeHidden: true,
      includeRemoved: true,
    });
  }

  return listForumPosts({
    ...query,
    includeHidden: false,
    includeRemoved: false,
  });
}

export async function viewPost(user, postId) {
  const post = await getForumPostById(postId);
  if (!post) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  if (user.role === "admin") {
    return post;
  }

  if (post.deletedAt) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  if (post.moderationStatus !== "visible" && post.userId !== user.id) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return post;
}

export async function createPost(user, payload) {
  return createForumPost({
    userId: user.id,
    postContent: payload.postContent,
  });
}

export async function editPost(user, postId, payload) {
  const post = await getForumPostById(postId);
  if (!post) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  if (user.role !== "admin" && post.userId !== user.id) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (post.deletedAt) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  const updated = user.role === "admin"
    ? await updateForumPostById(postId, payload.postContent)
    : await updateOwnForumPost(postId, user.id, payload.postContent);

  if (!updated) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  return updated;
}

export async function deletePost(user, postId) {
  const post = await getForumPostById(postId);
  if (!post) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  if (user.role !== "admin" && post.userId !== user.id) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const deleted = user.role === "admin"
    ? await softDeleteForumPostById(postId)
    : await softDeleteOwnForumPost(postId, user.id);

  if (!deleted) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  return deleted;
}

export async function moderatePost(user, postId, payload) {
  if (user.role !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const moderated = await moderateForumPost(
    postId,
    {
      moderationStatus: payload.moderationStatus,
      moderationNotes: payload.moderationNotes ?? null,
      moderatedBy: user.id,
    }
  );

  if (!moderated) {
    throw new AppError("Post not found", 404, "POST_NOT_FOUND");
  }

  return moderated;
}