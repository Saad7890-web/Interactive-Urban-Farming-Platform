import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const reviewSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});