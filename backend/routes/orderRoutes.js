import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import { sendOrderEmails } from "../utils/orderEmail.js";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

const getItemName = (item) =>
  item?.product?.name ||
  item?.productId?.name ||
  item?.name ||
  "UNBOUND Product";

const getItemPrice = (item) =>
  Number(
    item?.price ??
      item?.product?.salePrice ??
      item?.product?.price ??
      item?.productId?.salePrice ??
      item?.productId?.price ??
      0,
  );

const getItemQuantity = (item) => {
  const quantity = Number(item?.quantity || 1);

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
};

const getItemProductId = (item) =>
  item?.product?._id ||
  item?.product?.id ||
  item?.productId?._id ||
  item?.productId?.id ||
  (typeof item?.productId === "string" ? item.productId : "") ||
  item?._id ||
  "";

const getItemImage = (item) => {
  const value =
    item?.product?.images?.[0]?.url ||
    item?.product?.images?.[0] ||
    item?.product?.mainImage ||
    item?.product?.image ||
    item?.productId?.images?.[0]?.url ||
    item?.productId?.images?.[0] ||
    item?.productId?.mainImage ||
    item?.productId?.image ||
    item?.image ||
    "";

  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(value?.url || value?.fileId || value?._id || value?.id || "");
  }

  return String(value);
};

/* =========================================================
   ORDER NUMBER
========================================================= */

const makeOrderNumber = () => {
  const date = new Date();

  const year = date.getFullYear().toString().slice(-2);

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const time = Date.now().toString().slice(-6);

  const random = Math.floor(100 + Math.random() * 900);

  return `UB${year}${month}${day}-${time}${random}`;
};

/* =========================================================
   CREATE ORDER
   POST /api/orders
========================================================= */

router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,

        message: "Database is not connected.",
      });
    }

    const {
      cartId = "",
      customer,
      shippingAddress,
      notes = "",
      paymentMethod,
      items = [],
    } = req.body;

    /* ================================
       CUSTOMER VALIDATION
    ================================= */

    if (
      !customer?.firstName?.trim() ||
      !customer?.lastName?.trim() ||
      !customer?.email?.trim() ||
      !customer?.phone?.trim()
    ) {
      return res.status(400).json({
        success: false,

        message: "Customer details are incomplete.",
      });
    }

    /* ================================
       ADDRESS VALIDATION
    ================================= */

    if (
      !shippingAddress?.address?.trim() ||
      !shippingAddress?.city?.trim() ||
      !shippingAddress?.state?.trim() ||
      !shippingAddress?.pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,

        message: "Delivery address is incomplete.",
      });
    }

    /* ================================
       CART VALIDATION
    ================================= */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,

        message: "Your bag is empty.",
      });
    }

    /* ================================
       PAYMENT VALIDATION
    ================================= */

    if (!["upi", "card", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,

        message: "Invalid payment method.",
      });
    }

    /* ================================
       NORMALIZE PRODUCTS
    ================================= */

    const normalizedItems = items.map((item) => {
      const price = getItemPrice(item);

      const quantity = getItemQuantity(item);

      return {
        productId: String(getItemProductId(item) || ""),

        name: getItemName(item),

        image: getItemImage(item),

        size: String(item?.size || ""),

        color: String(item?.color || ""),

        quantity,

        price,

        lineTotal: price * quantity,
      };
    });

    const invalidPrice = normalizedItems.some(
      (item) => !Number.isFinite(item.price) || item.price < 0,
    );

    if (invalidPrice) {
      return res.status(400).json({
        success: false,

        message: "One or more products have an invalid price.",
      });
    }

    /* ================================
       CALCULATE TOTAL
    ================================= */

    const subtotal = normalizedItems.reduce(
      (total, item) => total + item.lineTotal,

      0,
    );

    const shipping = 0;

    const total = subtotal + shipping;

    /* ================================
       PAYMENT RULE

       COD = FULL PAYMENT ON DELIVERY

       NO 10% ADVANCE

       UPI / CARD =
       ONLINE PAYMENT REQUIRED
    ================================= */

    const paymentRequired = paymentMethod !== "cod";

    /* ================================
       SAVE ORDER
    ================================= */

    const order = await Order.create({
      orderNumber: makeOrderNumber(),

      cartId: String(cartId || ""),

      customer: {
        firstName: customer.firstName.trim(),

        lastName: customer.lastName.trim(),

        email: customer.email.trim().toLowerCase(),

        phone: customer.phone.trim(),
      },

      shippingAddress: {
        address: shippingAddress.address.trim(),

        apartment: shippingAddress.apartment?.trim() || "",

        city: shippingAddress.city.trim(),

        state: shippingAddress.state.trim(),

        pincode: shippingAddress.pincode.trim(),

        country: shippingAddress.country?.trim() || "India",
      },

      items: normalizedItems,

      subtotal,

      shipping,

      total,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: paymentRequired ? "pending_payment" : "placed",

      notes: String(notes || "").trim(),
    });

    /* ================================
       EMAIL

       COD:
       order is placed immediately,
       so send email immediately.

       UPI/CARD:
       DO NOT SEND YET.

       Later we will send only after
       Razorpay confirms payment.
    ================================= */

    let emailStatus = {
      attempted: false,
      adminSent: false,
      customerSent: false,
    };

    if (paymentMethod === "cod") {
      emailStatus.attempted = true;

      try {
        const result = await sendOrderEmails(order);

        emailStatus = {
          attempted: true,

          ...result,
        };
      } catch (emailError) {
        console.error("❌ Order email error:", emailError);
      }
    }

    /* ================================
       RESPONSE
    ================================= */

    return res.status(201).json({
      success: true,

      message: paymentRequired
        ? "Order saved. Complete online payment to confirm the order."
        : "COD order placed successfully.",

      paymentRequired,

      emailStatus,

      order: {
        _id: order._id,

        orderNumber: order.orderNumber,

        customer: order.customer,

        shippingAddress: order.shippingAddress,

        items: order.items,

        subtotal: order.subtotal,

        shipping: order.shipping,

        total: order.total,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: order.orderStatus,

        paymentRequired,

        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Create order error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to create order.",

      error: error.message,
    });
  }
});

/* =========================================================
   GET ALL ORDERS
   GET /api/orders
========================================================= */

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      count: orders.length,

      orders,
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load orders.",

      error: error.message,
    });
  }
});

/* =========================================================
   TRACK ORDER
   GET /api/orders/track/:orderNumber
========================================================= */

router.get(
  "/track/:orderNumber",

  async (req, res) => {
    try {
      const order = await Order.findOne({
        orderNumber: req.params.orderNumber,
      });

      if (!order) {
        return res.status(404).json({
          success: false,

          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,

        order,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        message: "Failed to track order.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   GET SINGLE ORDER
   GET /api/orders/:id
========================================================= */

router.get(
  "/:id",

  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order ID.",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,

          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,

        order,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        message: "Failed to load order.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   UPDATE ORDER STATUS
   PATCH /api/orders/:id/status
========================================================= */

router.patch(
  "/:id/status",

  async (req, res) => {
    try {
      const allowedStatuses = [
        "pending_payment",
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      const { orderStatus } = req.body;

      if (!allowedStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order status.",
        });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,

        {
          orderStatus,
        },

        {
          new: true,
          runValidators: true,
        },
      );

      if (!order) {
        return res.status(404).json({
          success: false,

          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,

        order,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        message: "Failed to update order status.",

        error: error.message,
      });
    }
  },
);

export default router;
