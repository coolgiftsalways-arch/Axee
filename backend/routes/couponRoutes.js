import express from "express";

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

router.get("/", getCoupons);

router.post("/", createCoupon);

router.put("/:id", updateCoupon);

router.patch("/:id/status", toggleCouponStatus);

router.delete("/:id", deleteCoupon);

export default router;
