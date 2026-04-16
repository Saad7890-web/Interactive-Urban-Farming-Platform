import { Router } from "express";
import authRoutes from "./auth.routes.js";

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

export default router;