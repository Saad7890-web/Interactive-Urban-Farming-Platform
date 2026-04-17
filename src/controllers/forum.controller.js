import {
    browsePosts,
    createPost,
    deletePost,
    editPost,
    moderatePost,
    viewPost,
} from "../services/forum.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
    createForumPostSchema,
    forumPostFiltersSchema,
    forumPostIdParamsSchema,
    moderateForumPostSchema,
    updateForumPostSchema,
} from "../validators/forum.validator.js";

export async function listForumPostsController(req, res, next) {
  try {
    const parsed = forumPostFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browsePosts(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Forum posts fetched successfully",
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.page * result.limit < result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getForumPostController(req, res, next) {
  try {
    const paramsParsed = forumPostIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const post = await viewPost(req.user, paramsParsed.data.postId);

    return successResponse(res, {
      statusCode: 200,
      message: "Forum post fetched successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function createForumPostController(req, res, next) {
  try {
    const parsed = createForumPostSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const post = await createPost(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Forum post created successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateForumPostController(req, res, next) {
  try {
    const paramsParsed = forumPostIdParamsSchema.safeParse(req.params);
    const bodyParsed = updateForumPostSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const post = await editPost(req.user, paramsParsed.data.postId, bodyParsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Forum post updated successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteForumPostController(req, res, next) {
  try {
    const paramsParsed = forumPostIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const post = await deletePost(req.user, paramsParsed.data.postId);

    return successResponse(res, {
      statusCode: 200,
      message: "Forum post deleted successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function moderateForumPostController(req, res, next) {
  try {
    const paramsParsed = forumPostIdParamsSchema.safeParse(req.params);
    const bodyParsed = moderateForumPostSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const post = await moderatePost(req.user, paramsParsed.data.postId, bodyParsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Forum post moderated successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
}