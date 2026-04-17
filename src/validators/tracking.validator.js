import { z } from "zod";

export const plantFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  healthStatus: z.enum(["healthy", "needs_attention", "critical", "harvest_ready"]).optional(),
  growthStage: z.enum(["seedling", "vegetative", "flowering", "fruiting", "harvested"]).optional(),
});

export const plantIdParamsSchema = z.object({
  plantId: z.string().uuid(),
});

export const createPlantTrackSchema = z.object({
  userId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  rentalBookingId: z.string().uuid().optional().nullable(),
  plantName: z.string().trim().min(2).max(200),
  species: z.string().trim().max(200).optional().nullable(),
  plantedAt: z.coerce.date().optional().nullable(),
  expectedHarvestDate: z.coerce.date().optional().nullable(),
  healthStatus: z.enum(["healthy", "needs_attention", "critical", "harvest_ready"]).default("healthy"),
  growthStage: z.enum(["seedling", "vegetative", "flowering", "fruiting", "harvested"]).default("seedling"),
  currentNotes: z.string().trim().max(5000).optional().nullable(),
});

export const updatePlantTrackSchema = z.object({
  healthStatus: z.enum(["healthy", "needs_attention", "critical", "harvest_ready"]).optional(),
  growthStage: z.enum(["seedling", "vegetative", "flowering", "fruiting", "harvested"]).optional(),
  currentNotes: z.string().trim().max(5000).optional().nullable(),
  expectedHarvestDate: z.coerce.date().optional().nullable(),
});

export const createPlantEventSchema = z.object({
  eventType: z.string().trim().min(2).max(100),
  eventPayload: z.record(z.any()).optional().nullable(),
});