import mongoose from "mongoose";

/* =========================================================
   ORDER ITEM
========================================================= */

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  {
    _id: false,
  },
);

/* =========================================================
   CUSTOMER
========================================================= */

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },

  {
    _id: false,
  },
);

/* =========================================================
   SHIPPING ADDRESS
========================================================= */

const shippingAddressSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    apartment: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },
  },

  {
    _id: false,
  },
);

/* =========================================================
   ORDER
========================================================= */

const orderSchema = new mongoose.Schema(
  {
    /* =====================================================
         ORDER NUMBER
      ===================================================== */

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* =====================================================
         CART
      ===================================================== */

    cartId: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
         CUSTOMER
      ===================================================== */

    customer: {
      type: customerSchema,

      required: true,
    },

    /* =====================================================
         SHIPPING
      ===================================================== */

    shippingAddress: {
      type: shippingAddressSchema,

      required: true,
    },

    /* =====================================================
         PRODUCTS
      ===================================================== */

    items: {
      type: [orderItemSchema],

      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,

        message: "Order must contain at least one item.",
      },
    },

    /* =====================================================
         MONEY
      ===================================================== */

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =====================================================
         PAYMENT METHOD
      ===================================================== */

    paymentMethod: {
      type: String,

      enum: ["upi", "card", "cod"],

      required: true,
    },

    /* =====================================================
         PAYMENT STATUS
      ===================================================== */

    paymentStatus: {
      type: String,

      enum: ["pending", "paid", "failed", "refunded"],

      default: "pending",
    },

    /* =====================================================
         ORDER STATUS
      ===================================================== */

    orderStatus: {
      type: String,

      enum: [
        "pending_payment",
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],

      default: "placed",
    },

    /* =====================================================
         RAZORPAY
      ===================================================== */

    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
         NOTES
      ===================================================== */

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },

  {
    timestamps: true,
  },
);

/* =========================================================
   INDEXES

   Useful for:
   Customers page
   customer deletion
   order searching
========================================================= */

orderSchema.index({
  "customer.email": 1,
});

orderSchema.index({
  "customer.phone": 1,
});

orderSchema.index({
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  "items.productId": 1,
});

/* =========================================================
   NORMALIZE CUSTOMER BEFORE SAVE
========================================================= */

orderSchema.pre(
  "save",

  function (next) {
    if (this.customer) {
      if (this.customer.firstName) {
        this.customer.firstName = String(this.customer.firstName).trim();
      }

      if (this.customer.lastName) {
        this.customer.lastName = String(this.customer.lastName).trim();
      }

      if (this.customer.email) {
        this.customer.email = String(this.customer.email).trim().toLowerCase();
      }

      if (this.customer.phone) {
        this.customer.phone = String(this.customer.phone).trim();
      }
    }

    next();
  },
);

/* =========================================================
   MODEL
========================================================= */

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
