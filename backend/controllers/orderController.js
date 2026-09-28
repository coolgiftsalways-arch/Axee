import Order from "../models/Order.js";

/* =========================================================
   HELPERS
========================================================= */

const createOrderNumber = () => {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `AX-${time}-${random}`;
};

const normalizeOrderItem = (item = {}) => {
  const quantity = Math.max(1, Number(item.quantity || 1));

  const price = Math.max(0, Number(item.price || 0));

  return {
    productId: String(item.productId || item._id || item.id || ""),

    name: String(item.name || item.title || "AXIEE Product").trim(),

    image: item.image || item.mainImage || item.images?.[0] || "",

    size: String(item.size || "").trim(),

    color: String(item.color || "").trim(),

    quantity,

    price,

    lineTotal: quantity * price,
  };
};

/* =========================================================
   CREATE ORDER

   POST /api/orders
========================================================= */

export const createOrder = async (req, res) => {
  try {
    const {
      cartId = "",
      customer,
      shippingAddress,
      items,
      paymentMethod,
      notes = "",
    } = req.body;

    /* =====================================================
       VALIDATE ITEMS
    ===================================================== */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    /* =====================================================
       CUSTOMER
    ===================================================== */

    if (
      !customer?.firstName ||
      !customer?.lastName ||
      !customer?.email ||
      !customer?.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer information is incomplete.",
      });
    }

    /* =====================================================
       ADDRESS
    ===================================================== */

    if (
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is incomplete.",
      });
    }

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const normalizedPaymentMethod = String(paymentMethod || "")
      .trim()
      .toLowerCase();

    if (!["upi", "card", "cod"].includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    /* =====================================================
       NORMALIZE ITEMS
    ===================================================== */

    const normalizedItems = items.map(normalizeOrderItem);

    /* =====================================================
       TOTAL
    ===================================================== */

    const subtotal = normalizedItems.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );

    /*
      Change this later if you want shipping charges.
    */
    const shipping = 0;

    const total = subtotal + shipping;

    /* =====================================================
       STATUS
    ===================================================== */

    const isCOD = normalizedPaymentMethod === "cod";

    const paymentStatus = "pending";

    const orderStatus = isCOD ? "placed" : "pending_payment";

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    let orderNumber = createOrderNumber();

    /*
      Very small possibility of duplicate.
      Generate again if one already exists.
    */

    while (
      await Order.exists({
        orderNumber,
      })
    ) {
      orderNumber = createOrderNumber();
    }

    const order = await Order.create({
      orderNumber,

      cartId: String(cartId || "").trim(),

      customer: {
        firstName: String(customer.firstName).trim(),

        lastName: String(customer.lastName).trim(),

        email: String(customer.email).trim().toLowerCase(),

        phone: String(customer.phone).trim(),
      },

      shippingAddress: {
        address: String(shippingAddress.address).trim(),

        apartment: String(shippingAddress.apartment || "").trim(),

        city: String(shippingAddress.city).trim(),

        state: String(shippingAddress.state).trim(),

        pincode: String(shippingAddress.pincode).trim(),

        country: String(shippingAddress.country || "India").trim(),
      },

      items: normalizedItems,

      subtotal,

      shipping,

      total,

      paymentMethod: normalizedPaymentMethod,

      paymentStatus,

      orderStatus,

      notes: String(notes || "").trim(),
    });

    return res.status(201).json({
      success: true,

      message: "Order created successfully",

      order,
    });
  } catch (error) {
    console.error("❌ CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to create order",

      error: error.message,
    });
  }
};

/* =========================================================
   GET ALL ORDERS

   GET /api/orders
========================================================= */

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      count: orders.length,

      orders,
    });
  } catch (error) {
    console.error("❌ GET ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to load orders",

      error: error.message,
    });
  }
};

/* =========================================================
   GET ONE ORDER

   GET /api/orders/:orderNumber
========================================================= */

export const getOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,

      order,
    });
  } catch (error) {
    console.error("❌ GET ORDER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to load order",

      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE ORDER STATUS

   PATCH /api/orders/:orderNumber/status
========================================================= */

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const { orderStatus, paymentStatus } = req.body;

    const allowedOrderStatuses = [
      "pending_payment",
      "placed",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    const order = await Order.findOne({
      orderNumber,
    });

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found",
      });
    }

    if (orderStatus) {
      if (!allowedOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,

          message: "Invalid order status",
        });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,

          message: "Invalid payment status",
        });
      }

      order.paymentStatus = paymentStatus;
    }

    await order.save();

    return res.status(200).json({
      success: true,

      message: "Order updated",

      order,
    });
  } catch (error) {
    console.error("❌ UPDATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to update order",

      error: error.message,
    });
  }
};

/* =========================================================
   REAL BEST SELLERS
   ---------------------------------------------------------
   This reads REAL orders from MongoDB.

   Example:
   GET /api/orders/best-sellers?limit=8

   Result:
   [
     {
       productId: "...",
       name: "...",
       image: "...",
       totalSold: 23,
       totalRevenue: 45000
     }
   ]
========================================================= */

export const getBestSellers = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit || 8);

    const limit = Math.min(50, Math.max(1, requestedLimit));

    const bestSellers = await Order.aggregate([
      /* ===============================================
           DO NOT COUNT CANCELLED / UNPAID ORDERS
        =============================================== */

      {
        $match: {
          orderStatus: {
            $in: ["placed", "confirmed", "processing", "shipped", "delivered"],
          },
        },
      },

      /*
          Sort newest first so $first below uses
          the newest product name/image/price saved
          inside an order.
        */

      {
        $sort: {
          createdAt: -1,
        },
      },

      /* ===============================================
           ONE ORDER ITEM PER DOCUMENT
        =============================================== */

      {
        $unwind: "$items",
      },

      /* ===============================================
           IGNORE ITEMS WITHOUT PRODUCT ID
        =============================================== */

      {
        $match: {
          "items.productId": {
            $nin: ["", null],
          },
        },
      },

      /* ===============================================
           GROUP SAME PRODUCT
        =============================================== */

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

      /* ===============================================
           COUNT ORDERS
        =============================================== */

      {
        $addFields: {
          orderCount: {
            $size: "$orderIds",
          },
        },
      },

      /* ===============================================
           MOST SOLD FIRST
        =============================================== */

      {
        $sort: {
          totalSold: -1,
          totalRevenue: -1,
        },
      },

      {
        $limit: limit,
      },

      /* ===============================================
           RESPONSE FORMAT
        =============================================== */

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

    return res.status(200).json({
      success: true,

      count: bestSellers.length,

      bestSellers,
    });
  } catch (error) {
    console.error("❌ BEST SELLERS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to load best sellers",

      error: error.message,
    });
  }
};
