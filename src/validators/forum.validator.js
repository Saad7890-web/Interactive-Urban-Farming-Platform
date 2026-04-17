import { z } from "zod";

export const forumPostFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  moderationStatus: z.enum(["visible", "hidden", "removed"]).optional(),
  userId: z.string().uuid().optional(),
});

export const forumPostIdParamsSchema = z.object({
  postId: z.string().uuid(),
});

export const createForumPostSchema = z.object({
  postContent: z.string().trim().min(3).max(10000),
});

export const updateForumPostSchema = z.object({
  postContent: z.string().trim().min(3).max(10000),
});

export const moderateForumPostSchema = z.object({
  moderationStatus: z.enum(["visible", "hidden", "removed"]),
  moderationNotes: z.string().trim().max(2000).optional().nullable(),
});