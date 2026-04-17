import { z } from "zod";

export const rentalSpaceFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  minSize: z.coerce.number().positive().optional(),
  maxSize: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  availability: z.coerce.boolean().optional(),
  vendorId: z.string().uuid().optional(),
  sortBy: z.enum(["created_at", "price", "size"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const rentalSpaceIdParamsSchema = z.object({
  spaceId: z.string().uuid(),
});

export const createRentalSpaceSchema = z.object({
  location: z.string().trim().min(2).max(500),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  size: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
  availability: z.coerce.boolean().optional().default(true),
});

export const updateRentalSpaceSchema = z.object({
  location: z.string().trim().min(2).max(500).optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  size: z.coerce.number().positive().optional(),
  price: z.coerce.number().nonnegative().optional(),
  availability: z.coerce.boolean().optional(),
});

export const bookingFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["pending", "approved", "active", "completed", "cancelled"]).optional(),
});

export const bookingIdParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const createBookingSchema = z.object({
  rentalSpaceId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["pending", "approved", "active", "completed", "cancelled"]),
});