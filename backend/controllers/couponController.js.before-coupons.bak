import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";

const normalizeCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeEmail = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizePhone = (value = "") => String(value || "").replace(/\D/g, "");

const roundMoney = (value) => Math.max(0, Math.round(Number(value || 0)));

const normalizeExpiryDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999`);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

/* =========================================================
   CALCULATE DISCOUNT
========================================================= */

export const calculateCouponDiscount = (coupon, subtotal) => {
  const safeSubtotal = roundMoney(subtotal);

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(
      safeSubtotal * (Number(coupon.discountValue || 0) / 100),
    );
  } else {
    discountAmount = roundMoney(coupon.discountValue);
  }

  if (Number(coupon.maxDiscountAmount || 0) > 0) {
    discountAmount = Math.min(
      discountAmount,
      roundMoney(coupon.maxDiscountAmount),
    );
  }

  return Math.min(discountAmount, safeSubtotal);
};

/* =========================================================
   VALIDATE COUPON
========================================================= */

export const validateCouponForOrder = async ({
  code,
  subtotal,
  email = "",
  phone = "",
}) => {
  const normalizedCode = normalizeCode(code);

  const safeSubtotal = roundMoney(subtotal);

  if (!normalizedCode) {
    return {
      valid: false,
      status: 400,
      message: "Enter a coupon code.",
    };
  }

  const coupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (!coupon) {
    return {
      valid: false,
      status: 404,
      message: "Coupon code not found.",
    };
  }

  /* INACTIVE */

  if (!coupon.isActive) {
    return {
      valid: false,
      status: 400,
      message: "This coupon is currently inactive.",
    };
  }

  /* EXPIRED */

  const now = new Date();

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return {
      valid: false,
      status: 400,
      message: "This coupon has expired.",
    };
  }

  /* MINIMUM ORDER */

  const minOrderAmount = roundMoney(coupon.minOrderAmount);

  if (safeSubtotal < minOrderAmount) {
    return {
      valid: false,
      status: 400,

      message: `Minimum order amount for ${coupon.code} is ₹${minOrderAmount.toLocaleString(
        "en-IN",
      )}.`,

      coupon,
    };
  }

  /* =====================================================
       FIRST ORDER ONLY
    ===================================================== */

  if (coupon.firstOrderOnly) {
    const normalizedEmail = normalizeEmail(email);

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail && !normalizedPhone) {
      return {
        valid: false,
        status: 400,

        message:
          "Enter your email or phone number to use this first-order coupon.",

        coupon,
      };
    }

    const customerConditions = [];

    if (normalizedEmail) {
      customerConditions.push({
        "customer.email": normalizedEmail,
      });
    }

    if (normalizedPhone) {
      customerConditions.push({
        "customer.phone": normalizedPhone,
      });
    }

    const previousOrder = await Order.exists({
      orderStatus: {
        $in: ["placed", "confirmed", "processing", "shipped", "delivered"],
      },

      $or: customerConditions,
    });

    if (previousOrder) {
      return {
        valid: false,
        status: 400,

        message: "This coupon is only available on your first order.",

        coupon,
      };
    }
  }

  const discountAmount = calculateCouponDiscount(coupon, safeSubtotal);

  const totalAfterDiscount = Math.max(0, safeSubtotal - discountAmount);

  return {
    valid: true,
    status: 200,

    message: `${coupon.code} applied successfully.`,

    coupon,

    discountAmount,

    totalAfterDiscount,
  };
};

/* =========================================================
   SERIALIZE
========================================================= */

const serializeCoupon = (coupon, subtotal = null) => {
  const document = coupon?.toObject ? coupon.toObject() : coupon;

  const safeSubtotal = subtotal === null ? null : roundMoney(subtotal);

  let eligible = true;

  let eligibilityMessage = "Coupon available";

  if (
    safeSubtotal !== null &&
    safeSubtotal < roundMoney(document.minOrderAmount)
  ) {
    eligible = false;

    eligibilityMessage = `Minimum order ₹${roundMoney(
      document.minOrderAmount,
    ).toLocaleString("en-IN")}`;
  }

  return {
    _id: document._id,

    code: document.code,

    description: document.description || "",

    discountType: document.discountType,

    discountValue: document.discountValue,

    minOrderAmount: roundMoney(document.minOrderAmount),

    maxDiscountAmount: roundMoney(document.maxDiscountAmount),

    firstOrderOnly: Boolean(document.firstOrderOnly),

    isActive: Boolean(document.isActive),

    expiryDate: document.expiryDate,

    createdAt: document.createdAt,

    updatedAt: document.updatedAt,

    eligible,

    eligibilityMessage,
  };
};

/* =========================================================
   GET ALL COUPONS - ADMIN
========================================================= */

export const getCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      count: coupons.length,

      coupons: coupons.map((coupon) => serializeCoupon(coupon)),
    });
  } catch (error) {
    console.error("❌ Get coupons error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load coupons.",

      error: error.message,
    });
  }
};

/* =========================================================
   AVAILABLE COUPONS FOR CHECKOUT
========================================================= */

export const getAvailableCoupons = async (req, res) => {
  try {
    const subtotal = roundMoney(req.query.subtotal || 0);

    const now = new Date();

    /*
        IMPORTANT:

        Only ACTIVE + NOT EXPIRED
        coupons come to Checkout.

        Inactive coupons are hidden.
      */

    const coupons = await Coupon.find({
      isActive: true,

      expiryDate: {
        $gte: now,
      },
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      coupons: coupons.map((coupon) => serializeCoupon(coupon, subtotal)),
    });
  } catch (error) {
    console.error("❌ Available coupons error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load available coupons.",

      error: error.message,
    });
  }
};

/* =========================================================
   APPLY COUPON
========================================================= */

export const applyCoupon = async (req, res) => {
  try {
    const { code = "", subtotal = 0, email = "", phone = "" } = req.body || {};

    const result = await validateCouponForOrder({
      code,
      subtotal,
      email,
      phone,
    });

    if (!result.valid) {
      return res.status(result.status || 400).json({
        success: false,

        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,

      message: result.message,

      coupon: {
        ...serializeCoupon(result.coupon, subtotal),

        discountAmount: result.discountAmount,

        totalAfterDiscount: result.totalAfterDiscount,
      },
    });
  } catch (error) {
    console.error("❌ Apply coupon error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to apply coupon.",

      error: error.message,
    });
  }
};

/* =========================================================
   CREATE COUPON
========================================================= */

export const createCoupon = async (req, res) => {
  try {
    const {
      code,

      description = "",

      discountType = "percentage",

      discountValue,

      minOrderAmount = 3000,

      maxDiscountAmount = 0,

      firstOrderOnly = false,

      isActive = true,

      expiryDate,
    } = req.body || {};

    if (!normalizeCode(code)) {
      return res.status(400).json({
        success: false,

        message: "Coupon code is required.",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,

        message: "Expiry date is required.",
      });
    }

    const coupon = await Coupon.create({
      code: normalizeCode(code),

      description,

      discountType,

      discountValue: Number(discountValue || 0),

      minOrderAmount: Number(minOrderAmount || 0),

      maxDiscountAmount: Number(maxDiscountAmount || 0),

      firstOrderOnly: Boolean(firstOrderOnly),

      isActive: Boolean(isActive),

      expiryDate: normalizeExpiryDate(expiryDate),
    });

    return res.status(201).json({
      success: true,

      message: "Coupon created successfully.",

      coupon: serializeCoupon(coupon),
    });
  } catch (error) {
    console.error("❌ Create coupon error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message: "That coupon code already exists.",
      });
    }

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to create coupon.",
    });
  }
};

/* =========================================================
   UPDATE COUPON
========================================================= */

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,

        message: "Coupon not found.",
      });
    }

    const allowedFields = [
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscountAmount",
      "firstOrderOnly",
      "isActive",
      "expiryDate",
    ];

    if (req.body?.code !== undefined) {
      coupon.code = normalizeCode(req.body.code);
    }

    allowedFields.forEach((field) => {
      if (req.body?.[field] === undefined) {
        return;
      }

      if (field === "expiryDate") {
        coupon.expiryDate = normalizeExpiryDate(req.body.expiryDate);

        return;
      }

      coupon[field] = req.body[field];
    });

    await coupon.save();

    return res.status(200).json({
      success: true,

      message: "Coupon updated successfully.",

      coupon: serializeCoupon(coupon),
    });
  } catch (error) {
    console.error("❌ Update coupon error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message: "That coupon code already exists.",
      });
    }

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to update coupon.",
    });
  }
};

/* =========================================================
   ACTIVE / INACTIVE
========================================================= */

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,

        message: "Coupon not found.",
      });
    }

    if (typeof req.body?.isActive === "boolean") {
      coupon.isActive = req.body.isActive;
    } else {
      coupon.isActive = !coupon.isActive;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,

      message: coupon.isActive ? "Coupon activated." : "Coupon deactivated.",

      coupon: serializeCoupon(coupon),
    });
  } catch (error) {
    console.error("❌ Toggle coupon error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to update coupon status.",

      error: error.message,
    });
  }
};

/* =========================================================
   DELETE COUPON
========================================================= */

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,

        message: "Coupon not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Delete coupon error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete coupon.",

      error: error.message,
    });
  }
};
