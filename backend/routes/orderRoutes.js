import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";

import { validateCouponForOrder } from "../controllers/couponController.js";

import { sendOrderEmails } from "../utils/orderEmail.js";
import ShiprocketShipment from "../models/ShiprocketShipment.js";

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
   CUSTOMER NORMALIZATION
========================================================= */

const normalizeText = (value = "") =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeEmail = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizePhone = (value = "") =>
  String(value ?? "")
    .replace(/\D/g, "")
    .trim();

const getCustomerFullName = (order) =>
  [order?.customer?.firstName, order?.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

const normalizeCustomerName = (order) =>
  normalizeText(getCustomerFullName(order));

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

router.post(
  "/",

  async (req, res) => {
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

        couponCode = "",

        items = [],
      } = req.body || {};

      /* =====================================================
         CUSTOMER
      ===================================================== */

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

      /* =====================================================
         ADDRESS
      ===================================================== */

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

      /* =====================================================
         ITEMS
      ===================================================== */

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,

          message: "Your bag is empty.",
        });
      }

      /* =====================================================
         PAYMENT METHOD
      ===================================================== */

      if (!["upi", "card", "cod"].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,

          message: "Invalid payment method.",
        });
      }

      /* =====================================================
         NORMALIZE ITEMS
      ===================================================== */

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

      /* =====================================================
         PRICE VALIDATION
      ===================================================== */

      const invalidPrice = normalizedItems.some(
        (item) => !Number.isFinite(item.price) || item.price < 0,
      );

      if (invalidPrice) {
        return res.status(400).json({
          success: false,

          message: "One or more products have an invalid price.",
        });
      }

      /* =====================================================
         PRODUCT VALIDATION
      ===================================================== */

      const invalidProduct = normalizedItems.some(
        (item) => !String(item.productId || "").trim(),
      );

      if (invalidProduct) {
        return res.status(400).json({
          success: false,

          message: "One or more products are missing product ID.",
        });
      }

      /* =====================================================
         SUBTOTAL
      ===================================================== */

      const subtotal = normalizedItems.reduce(
        (total, item) => total + Number(item.lineTotal || 0),

        0,
      );

      const shipping = 0;

      /* =====================================================
         COUPON

         BACKEND VALIDATES COUPON AGAIN.
      ===================================================== */

      let appliedCoupon = null;

      let discountAmount = 0;

      if (String(couponCode || "").trim()) {
        const couponResult = await validateCouponForOrder({
          code: couponCode,

          subtotal,

          email: customer.email,

          phone: customer.phone,
        });

        if (!couponResult.valid) {
          return res.status(couponResult.status || 400).json({
            success: false,

            message: couponResult.message,
          });
        }

        appliedCoupon = couponResult.coupon;

        discountAmount = Number(couponResult.discountAmount || 0);
      }

      /* =====================================================
         FINAL TOTAL

         Example:
         ₹7595 subtotal
         - ₹759 coupon
         = ₹6836

         COD customer pays ₹6836 ON DELIVERY.
      ===================================================== */

      const total = Math.max(
        0,

        subtotal + shipping - discountAmount,
      );

      /* =====================================================
         PAYMENT RULE

         FULL CASH ON DELIVERY

         No 10% advance.
         No ₹2000 rule.
         No Razorpay for COD.

         Online payments still use Razorpay.
      ===================================================== */

      const codAdvanceRequired = false;

      const advancePercentage = 0;

      const advanceAmount = 0;

      const balanceDueOnDelivery = paymentMethod === "cod" ? total : 0;

      /*
        IMPORTANT:

        COD:
        paymentRequired = false

        UPI / Card:
        paymentRequired = true
      */

      const paymentRequired = paymentMethod !== "cod";

      /* =====================================================
         SAVE ORDER
      ===================================================== */

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

        couponCode: appliedCoupon?.code || "",

        discountType: appliedCoupon?.discountType || "",

        discountValue: Number(appliedCoupon?.discountValue || 0),

        discountAmount,

        total,

        paymentMethod,

        paymentStatus: "pending",

        /*
            COD gets PLACED immediately.

            UPI/Card remains
            pending_payment until
            Razorpay succeeds.
          */

        orderStatus: paymentRequired ? "pending_payment" : "placed",

        /* OLD ADVANCE FIELDS KEPT FOR SCHEMA COMPATIBILITY */

        codAdvanceRequired: false,

        advancePercentage: 0,

        advanceAmount: 0,

        balanceDueOnDelivery,

        notes: String(notes || "").trim(),
      });

      /* =====================================================
         ORDER EMAIL

         COD sends immediately.
         Online payment email can send after verification.
      ===================================================== */

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

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(201).json({
        success: true,

        message: paymentRequired
          ? "Order saved. Complete online payment to confirm the order."
          : "Cash on Delivery order placed successfully.",

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

          couponCode: order.couponCode,

          discountType: order.discountType,

          discountValue: order.discountValue,

          discountAmount: order.discountAmount,

          total: order.total,

          paymentMethod: order.paymentMethod,

          paymentStatus: order.paymentStatus,

          orderStatus: order.orderStatus,

          codAdvanceRequired: false,

          advancePercentage: 0,

          advanceAmount: 0,

          balanceDueOnDelivery: order.balanceDueOnDelivery,

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
  },
);

/* =========================================================
   GET ORDERS
========================================================= */

router.get(
  "/",

  async (_req, res) => {
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
  },
);

/* =========================================================
   BEST SELLERS

   GET /api/orders/best-sellers
========================================================= */

router.get(
  "/best-sellers",

  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,

          message: "Database is not connected.",
        });
      }

      const requestedLimit = Number(req.query.limit || 8);

      const limit = Number.isFinite(requestedLimit)
        ? Math.min(
            50,

            Math.max(
              1,

              Math.floor(requestedLimit),
            ),
          )
        : 8;

      const bestSellers = await Order.aggregate([
        {
          $match: {
            orderStatus: {
              $in: [
                "placed",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
              ],
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $unwind: "$items",
        },

        {
          $match: {
            "items.productId": {
              $exists: true,

              $nin: ["", null],
            },
          },
        },

        {
          $group: {
            _id: "$items.productId",

            totalSold: {
              $sum: "$items.quantity",
            },

            totalRevenue: {
              $sum: "$items.lineTotal",
            },

            name: {
              $first: "$items.name",
            },

            image: {
              $first: "$items.image",
            },

            price: {
              $first: "$items.price",
            },

            lastSoldAt: {
              $first: "$createdAt",
            },

            orderIds: {
              $addToSet: "$_id",
            },
          },
        },

        {
          $addFields: {
            orderCount: {
              $size: "$orderIds",
            },
          },
        },

        {
          $sort: {
            totalSold: -1,

            totalRevenue: -1,

            lastSoldAt: -1,
          },
        },

        {
          $limit: limit,
        },

        {
          $project: {
            _id: 0,

            productId: "$_id",

            name: 1,

            image: 1,

            price: 1,

            totalSold: 1,

            totalRevenue: 1,

            orderCount: 1,

            lastSoldAt: 1,
          },
        },
      ]);

      const rankedBestSellers = bestSellers.map((product, index) => ({
        rank: index + 1,

        ...product,
      }));

      return res.status(200).json({
        success: true,

        count: rankedBestSellers.length,

        bestSellers: rankedBestSellers,
      });
    } catch (error) {
      console.error("❌ Best sellers error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to load best sellers.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   DELETE CUSTOMER

   Keep before /:id
========================================================= */

router.delete(
  "/customer",

  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,

          message: "Database is not connected.",
        });
      }

      const name = normalizeText(req.body?.name);

      const email = normalizeEmail(req.body?.email);

      const phone = normalizePhone(req.body?.phone);

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,

          message: "Customer name, email and phone are required.",
        });
      }

      const possibleOrders = await Order.find({
        "customer.email": email,
      }).select("_id customer orderNumber total items createdAt");

      const matchedOrders = possibleOrders.filter((order) => {
        const orderName = normalizeCustomerName(order);

        const orderEmail = normalizeEmail(order?.customer?.email);

        const orderPhone = normalizePhone(order?.customer?.phone);

        return (
          orderName === name && orderEmail === email && orderPhone === phone
        );
      });

      if (matchedOrders.length === 0) {
        return res.status(404).json({
          success: false,

          message: "Customer orders not found.",
        });
      }

      const orderIds = matchedOrders.map((order) => order._id);

      const deletedRevenue = matchedOrders.reduce(
        (total, order) => total + Number(order.total || 0),

        0,
      );

      const deletedItems = matchedOrders.reduce(
        (total, order) => {
          const itemCount = Array.isArray(order.items)
            ? order.items.reduce(
                (itemTotal, item) => itemTotal + Number(item?.quantity || 1),

                0,
              )
            : 0;

          return total + itemCount;
        },

        0,
      );

      const result = await Order.deleteMany({
        _id: {
          $in: orderIds,
        },
      });

      return res.status(200).json({
        success: true,

        message: "Customer and all matching orders deleted successfully.",

        deletedCustomer: {
          name,
          email,
          phone,
        },

        deletedOrders: Number(result.deletedCount || 0),

        deletedItems,

        deletedRevenue,
      });
    } catch (error) {
      console.error("❌ Delete customer error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to delete customer.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   TRACK ORDER
========================================================= */
/* =========================================================
   TRACK ORDER

   GET /api/orders/track/:orderNumber
========================================================= */

router.get(
  "/track/:orderNumber",

  async (req, res) => {
    try {
      const orderNumber =
        String(
          req.params.orderNumber ||
            "",
        ).trim();

      if (!orderNumber) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Order number is required.",
          });
      }

      /* =====================================================
         FIND ORDER
      ===================================================== */

      const order =
        await Order.findOne({
          orderNumber,
        }).lean();

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Order not found.",
          });
      }

      /* =====================================================
         FIND SHIPROCKET SHIPMENT
      ===================================================== */

      const shipment =
        await ShiprocketShipment
          .findOne({
            orderId:
              order._id,
          })
          .lean();

      /* =====================================================
         CUSTOMER NAME
      ===================================================== */

      const customerName =
        [
          order?.customer
            ?.firstName,

          order?.customer
            ?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

      /* =====================================================
         DESTINATION
      ===================================================== */

      const destination =
        [
          order
            ?.shippingAddress
            ?.city,

          order
            ?.shippingAddress
            ?.state,

          order
            ?.shippingAddress
            ?.country ||
            "India",
        ]
          .filter(Boolean)
          .join(", ");

      /* =====================================================
         SHIPROCKET STATUS
      ===================================================== */

      const shippingStatus =
        shipment?.status ||
        "not_sent";

      const currentStatus =
        shipment?.currentStatus ||
        shipment?.shipmentStatus ||
        shippingStatus;

      /* =====================================================
         STATUS STEP
      ===================================================== */

      let trackingStep = 1;

      const normalizedStatus =
        String(
          currentStatus || "",
        )
          .trim()
          .toUpperCase();

      const normalizedLocal =
        String(
          shippingStatus || "",
        )
          .trim()
          .toLowerCase();

      if (
        normalizedLocal ===
          "delivered" ||
        normalizedStatus.includes(
          "DELIVERED",
        )
      ) {
        trackingStep = 8;
      } else if (
        normalizedStatus.includes(
          "OUT FOR DELIVERY",
        )
      ) {
        trackingStep = 7;
      } else if (
        normalizedLocal ===
          "in_transit" ||
        normalizedStatus.includes(
          "IN TRANSIT",
        )
      ) {
        trackingStep = 6;
      } else if (
        normalizedStatus.includes(
          "REACHED DESTINATION",
        ) ||
        normalizedStatus.includes(
          "DESTINATION HUB",
        )
      ) {
        trackingStep = 6;
      } else if (
        normalizedStatus.includes(
          "FLIGHT",
        ) ||
        normalizedStatus.includes(
          "AIR TRANSIT",
        )
      ) {
        trackingStep = 5;
      } else if (
        normalizedStatus.includes(
          "HUB",
        )
      ) {
        trackingStep = 4;
      } else if (
        normalizedLocal ===
          "pickup_scheduled" ||
        normalizedStatus.includes(
          "PICKED",
        ) ||
        normalizedStatus.includes(
          "PICKUP",
        )
      ) {
        trackingStep = 3;
      } else if (
        normalizedLocal ===
          "awb_assigned" ||
        normalizedLocal ===
          "order_created" ||
        order.orderStatus ===
          "processing" ||
        order.orderStatus ===
          "confirmed"
      ) {
        trackingStep = 2;
      }

      /* =====================================================
         ESTIMATED DELIVERY
      ===================================================== */

      const estimatedDelivery =
        shipment?.tracking
          ?.tracking_data
          ?.etd ||
        shipment?.tracking
          ?.etd ||
        shipment
          ?.lastWebhookPayload
          ?.etd ||
        null;

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res
        .status(200)
        .json({
          success: true,

          order: {
            _id:
              order._id,

            orderNumber:
              order.orderNumber,

            customerName,

            phone:
              order?.customer
                ?.phone ||
              "",

            email:
              order?.customer
                ?.email ||
              "",

            destination,

            city:
              order
                ?.shippingAddress
                ?.city ||
              "",

            state:
              order
                ?.shippingAddress
                ?.state ||
              "",

            country:
              order
                ?.shippingAddress
                ?.country ||
              "India",

            orderStatus:
              order.orderStatus,

            paymentStatus:
              order.paymentStatus,

            paymentMethod:
              order.paymentMethod,

            total:
              Number(
                order.total ||
                  0,
              ),

            createdAt:
              order.createdAt,

            items:
              order.items ||
              [],
          },

          shipping: {
            available:
              Boolean(
                shipment,
              ),

            status:
              shippingStatus,

            currentStatus,

            currentStatusId:
              shipment
                ?.currentStatusId ??
              null,

            shipmentStatus:
              shipment
                ?.shipmentStatus ||
              "",

            shipmentStatusId:
              shipment
                ?.shipmentStatusId ??
              null,

            trackingStep,

            awb:
              shipment?.awb ||
              "",

            courier:
              shipment
                ?.courierName ||
              "",

            courierId:
              shipment
                ?.courierId ||
              "",

            shiprocketOrderId:
              shipment
                ?.shiprocketOrderId ||
              "",

            shipmentId:
              shipment
                ?.shipmentId ||
              "",

            pickupScheduled:
              Boolean(
                shipment
                  ?.pickupScheduled,
              ),

            pickupScheduledAt:
              shipment
                ?.pickupScheduledAt ||
              null,

            labelUrl:
              shipment
                ?.labelUrl ||
              "",

            estimatedDelivery,

            tracking:
              shipment
                ?.tracking ||
              null,

            lastWebhookAt:
              shipment
                ?.lastWebhookAt ||
              null,
          },
        });
    } catch (error) {
      console.error(
        "❌ Track order error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to track order.",

          error:
            error.message,
        });
    }
  },
);

/* =========================================================
   UPDATE ORDER STATUS
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

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order ID.",
        });
      }

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

        message: "Order status updated.",

        order,
      });
    } catch (error) {
      console.error("❌ Update order status error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to update order status.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   DELETE SINGLE ORDER
========================================================= */

router.delete(
  "/:id",

  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order ID.",
        });
      }

      const order = await Order.findByIdAndDelete(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,

          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,

        message: "Order deleted successfully.",

        deletedOrder: {
          _id: order._id,

          orderNumber: order.orderNumber,

          total: order.total,

          customer: order.customer,
        },
      });
    } catch (error) {
      console.error("❌ Delete order error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to delete order.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   GET SINGLE ORDER

   KEEP THIS AFTER SPECIAL ROUTES
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
      console.error("❌ Get single order error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to load order.",

        error: error.message,
      });
    }
  },
);

export default router;
