import { Router } from "express";
import {
    adminUpdateBookingStatusController,
    cancelBookingController,
    createBookingController,
    createRentalSpaceController,
    deleteRentalSpaceController,
    getBookingController,
    getRentalSpaceController,
    listBookingsController,
    listRentalSpacesController,
    updateRentalSpaceController,
} from "../controllers/rental.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { bookingRateLimit, writeRateLimit } from "../middlewares/rateLimit.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/spaces", listRentalSpacesController);
router.get("/spaces/:spaceId", getRentalSpaceController);

router.post("/spaces", writeRateLimit, protect, requireRole("vendor", "admin"), createRentalSpaceController);
router.patch("/spaces/:spaceId", writeRateLimit, protect, requireRole("vendor", "admin"), updateRentalSpaceController);
router.delete("/spaces/:spaceId", writeRateLimit, protect, requireRole("vendor", "admin"), deleteRentalSpaceController);

router.post("/bookings", bookingRateLimit, protect, requireRole("customer"), createBookingController);
router.get("/bookings", protect, requireRole("admin", "vendor", "customer"), listBookingsController);
router.get("/bookings/:bookingId", protect, requireRole("admin", "vendor", "customer"), getBookingController);
router.patch("/bookings/:bookingId/cancel", bookingRateLimit, protect, requireRole("admin", "vendor", "customer"), cancelBookingController);

router.get("/admin/bookings", protect, requireRole("admin"), listBookingsController);
router.patch("/admin/bookings/:bookingId/status", writeRateLimit, protect, requireRole("admin"), adminUpdateBookingStatusController);

export default router;