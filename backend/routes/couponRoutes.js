import express from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";

import {
  applyCoupon,
  createCoupon,
  deleteCoupon,
  getAvailableCoupons,
  getCoupons,
  toggleCouponStatus,
  updateCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

/* =========================================================
   CHECKOUT
========================================================= */

router.get("/available", getAvailableCoupons);

router.post("/apply", applyCoupon);

/* =========================================================
   ADMIN
========================================================= */

router.get("/", requireAdmin, getCoupons);

router.post("/", requireAdmin, createCoupon);

router.put("/:id", requireAdmin, updateCoupon);

router.patch("/:id/status", requireAdmin, toggleCouponStatus);

router.delete("/:id", requireAdmin, deleteCoupon);

export default router;
