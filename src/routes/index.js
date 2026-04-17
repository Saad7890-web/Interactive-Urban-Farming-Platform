import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import marketplaceRoutes from "./marketplace.routes.js";
import trackingRoutes from "./tracking.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    data: {
      service: "urban-farming-backend",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/marketplace", marketplaceRoutes);
router.use("/tracking", trackingRoutes);

export default router;