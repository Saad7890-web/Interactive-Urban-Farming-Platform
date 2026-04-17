import { Router } from "express";
import {
    approveCertificationController,
    approveVendorController,
    getCertificationsController,
    getVendorByIdController,
    getVendorsController,
    rejectCertificationController,
    rejectVendorController,
} from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminRateLimit } from "../middlewares/rateLimit.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect);
router.use(requireRole("admin"));

router.get("/vendors", getVendorsController);
router.get("/vendors/:vendorId", getVendorByIdController);
router.patch("/vendors/:vendorId/approve", adminRateLimit, approveVendorController);
router.patch("/vendors/:vendorId/reject", adminRateLimit, rejectVendorController);

router.get("/certifications", getCertificationsController);
router.patch("/certifications/:certId/approve", adminRateLimit, approveCertificationController);
router.patch("/certifications/:certId/reject", adminRateLimit, rejectCertificationController);

export default router;