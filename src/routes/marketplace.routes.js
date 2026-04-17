import { Router } from "express";
import {
    createOrderController,
    createProductController,
    deleteProductController,
    getProductController,
    listOrdersController,
    listProductsController,
    updateProductController,
} from "../controllers/marketplace.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { writeRateLimit } from "../middlewares/rateLimit.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/products", listProductsController);
router.get("/products/:productId", getProductController);

router.post("/products", writeRateLimit, protect, requireRole("admin", "vendor"), createProductController);
router.patch("/products/:productId", writeRateLimit, protect, requireRole("admin", "vendor"), updateProductController);
router.delete("/products/:productId", writeRateLimit, protect, requireRole("admin", "vendor"), deleteProductController);

router.post("/orders", writeRateLimit, protect, requireRole("customer"), createOrderController);
router.get("/orders", protect, requireRole("admin", "vendor", "customer"), listOrdersController);

export default router;