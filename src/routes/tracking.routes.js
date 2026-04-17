import { Router } from "express";
import {
    createPlantEventController,
    createPlantTrackController,
    getPlantTrackController,
    listPlantEventsController,
    listPlantTracksController,
    updatePlantTrackController,
} from "../controllers/tracking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/plants", protect, requireRole("admin", "vendor", "customer"), listPlantTracksController);
router.get("/plants/:plantId", protect, requireRole("admin", "vendor", "customer"), getPlantTrackController);

router.post("/plants", protect, requireRole("admin", "vendor", "customer"), createPlantTrackController);
router.patch("/plants/:plantId", protect, requireRole("admin", "vendor", "customer"), updatePlantTrackController);

router.get("/plants/:plantId/events", protect, requireRole("admin", "vendor", "customer"), listPlantEventsController);
router.post("/plants/:plantId/events", protect, requireRole("admin", "vendor", "customer"), createPlantEventController);

export default router;