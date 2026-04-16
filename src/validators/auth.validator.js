import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
    role: z.enum(["vendor", "customer"]),
    farmName: z.string().trim().min(2).max(200).optional(),
    farmLocation: z.string().trim().min(2).max(500).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    bio: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "vendor") {
      if (!data.farmName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["farmName"],
          message: "farmName is required for vendor registration",
        });
      }

      if (!data.farmLocation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["farmLocation"],
          message: "farmLocation is required for vendor registration",
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});