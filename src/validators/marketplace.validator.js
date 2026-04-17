import { z } from "zod";

export const productFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  category: z.enum(["seeds", "tools", "organic_products", "fresh_produce", "other"]).optional(),
  certificationStatus: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
  vendorId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["created_at", "price", "name"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productIdParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const createProductSchema = z.object({
  vendorId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().positive(),
  category: z.enum(["seeds", "tools", "organic_products", "fresh_produce", "other"]),
  availableQuantity: z.coerce.number().int().nonnegative().default(0),
  certificationStatus: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.coerce.number().positive().optional(),
  category: z.enum(["seeds", "tools", "organic_products", "fresh_produce", "other"]).optional(),
  availableQuantity: z.coerce.number().int().nonnegative().optional(),
  certificationStatus: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createOrderSchema = z.object({
  produceId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1),
});

export const orderFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["pending", "confirmed", "paid", "shipped", "completed", "cancelled", "refunded"]).optional(),
});