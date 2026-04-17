import { Router } from "express";
import {
    createForumPostController,
    deleteForumPostController,
    getForumPostController,
    listForumPostsController,
    moderateForumPostController,
    updateForumPostController,
} from "../controllers/forum.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminRateLimit, forumRateLimit } from "../middlewares/rateLimit.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/posts", protect, requireRole("admin", "vendor", "customer"), listForumPostsController);
router.get("/posts/:postId", protect, requireRole("admin", "vendor", "customer"), getForumPostController);

router.post("/posts", forumRateLimit, protect, requireRole("admin", "vendor", "customer"), createForumPostController);
router.patch("/posts/:postId", forumRateLimit, protect, requireRole("admin", "vendor", "customer"), updateForumPostController);
router.delete("/posts/:postId", forumRateLimit, protect, requireRole("admin", "vendor", "customer"), deleteForumPostController);

router.patch("/posts/:postId/moderate", adminRateLimit, protect, requireRole("admin"), moderateForumPostController);

export default router;