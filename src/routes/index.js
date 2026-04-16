import { Router } from "express";

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

export default router;