import { Router } from "express";
import { loginController, meController, registerController } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authRateLimit, strictAuthRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", strictAuthRateLimit, registerController);
router.post("/login", authRateLimit, loginController);
router.get("/me", protect, meController);

export default router;