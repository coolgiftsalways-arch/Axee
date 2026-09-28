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
   CUSTOMER NORMALIZATION

   Customers page identifies a customer using:

   NAME + EMAIL + PHONE

   So deletion uses the same rule.
========================================================= */

const normalizeText = (value = "") => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const normalizeEmail = (value = "") => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

const normalizePhone = (value = "") => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .trim();
};

const getCustomerFullName = (order) => {
  return [order?.customer?.firstName, order?.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const normalizeCustomerName = (order) => {
  return normalizeText(getCustomerFullName(order));
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
    /* =====================================================
       DATABASE CHECK
    ===================================================== */

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

    /* =====================================================
       CUSTOMER VALIDATION
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
       ADDRESS VALIDATION
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
       CART VALIDATION
    ===================================================== */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your bag is empty.",
      });
    }

    /* =====================================================
       PAYMENT VALIDATION
    ===================================================== */

    if (!["upi", "card", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    /* =====================================================
       NORMALIZE PRODUCTS
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
       PRODUCT ID VALIDATION
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
       CALCULATE TOTAL
    ===================================================== */

    const subtotal = normalizedItems.reduce(
      (total, item) => total + Number(item.lineTotal || 0),
      0,
    );

    const shipping = 0;

    const total = subtotal + shipping;

    /* =====================================================
       PAYMENT RULE
    ===================================================== */

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

      total,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: paymentRequired ? "pending_payment" : "placed",

      notes: String(notes || "").trim(),
    });

    /* =====================================================
       ORDER EMAIL
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
   REAL BEST SELLERS

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
        ? Math.min(50, Math.max(1, Math.floor(requestedLimit)))
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
   DELETE CUSTOMER + ALL THEIR ORDERS

   DELETE /api/orders/customer

   BODY:
   {
     "name": "Ahmed Khan",
     "email": "example@gmail.com",
     "phone": "9191379609"
   }

   IMPORTANT:
   Keep this BEFORE /:id.
========================================================= */

router.delete(
  "/customer",

  async (req, res) => {
    try {
      /* ===================================================
         DATABASE
      =================================================== */

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,

          message: "Database is not connected.",
        });
      }

      /* ===================================================
         CUSTOMER DATA
      =================================================== */

      const name = normalizeText(req.body?.name);

      const email = normalizeEmail(req.body?.email);

      const phone = normalizePhone(req.body?.phone);

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,

          message: "Customer name, email and phone are required.",
        });
      }

      /* ===================================================
         LOAD CUSTOMER ORDERS

         Email is already normalized/lowercase in MongoDB,
         so use it to reduce the search first.
      =================================================== */

      const possibleOrders = await Order.find({
        "customer.email": email,
      }).select("_id customer orderNumber total items createdAt");

      /* ===================================================
         EXACT MATCH

         Same identity rule as Customers.jsx:

         NAME + EMAIL + PHONE
      =================================================== */

      const matchedOrders = possibleOrders.filter((order) => {
        const orderName = normalizeCustomerName(order);

        const orderEmail = normalizeEmail(order?.customer?.email);

        const orderPhone = normalizePhone(order?.customer?.phone);

        return (
          orderName === name && orderEmail === email && orderPhone === phone
        );
      });

      /* ===================================================
         NOTHING FOUND
      =================================================== */

      if (matchedOrders.length === 0) {
        return res.status(404).json({
          success: false,

          message: "Customer orders not found.",
        });
      }

      /* ===================================================
         IDS
      =================================================== */

      const orderIds = matchedOrders.map((order) => order._id);

      /* ===================================================
         TOTALS BEFORE DELETE
      =================================================== */

      const deletedRevenue = matchedOrders.reduce(
        (total, order) => total + Number(order.total || 0),
        0,
      );

      const deletedItems = matchedOrders.reduce((total, order) => {
        const itemCount = Array.isArray(order.items)
          ? order.items.reduce(
              (itemTotal, item) => itemTotal + Number(item?.quantity || 1),
              0,
            )
          : 0;

        return total + itemCount;
      }, 0);

      /* ===================================================
         DELETE ALL CUSTOMER ORDERS
      =================================================== */

      const result = await Order.deleteMany({
        _id: {
          $in: orderIds,
        },
      });

      console.log(`🗑 Customer deleted: ${name}`);

      console.log(`🗑 Orders deleted: ${result.deletedCount}`);

      /* ===================================================
         RESPONSE
      =================================================== */

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
      console.error("❌ Track order error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to track order.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   UPDATE ORDER STATUS

   PATCH /api/orders/:id/status

   IMPORTANT:
   Keep this before GET /:id if possible.
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

      /* ===================================================
         VALIDATE ID
      =================================================== */

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order ID.",
        });
      }

      /* ===================================================
         VALIDATE STATUS
      =================================================== */

      if (!allowedStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order status.",
        });
      }

      /* ===================================================
         UPDATE
      =================================================== */

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

   DELETE /api/orders/:id

   This also affects:
   Orders
   Customers
   Dashboard
   Best Sellers

   because all of those use the Order collection.
========================================================= */

router.delete(
  "/:id",

  async (req, res) => {
    try {
      /* ===================================================
         VALIDATE ID
      =================================================== */

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order ID.",
        });
      }

      /* ===================================================
         DELETE
      =================================================== */

      const order = await Order.findByIdAndDelete(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,

          message: "Order not found.",
        });
      }

      /* ===================================================
         RESPONSE
      =================================================== */

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

   GET /api/orders/:id

   IMPORTANT:
   Keep below:
   /best-sellers
   /customer
   /track/:orderNumber
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
