import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
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
    },

    color: {
      type: String,
      default: "",
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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    cartId: {
      type: String,
      default: "",
    },

    customer: {
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

    shippingAddress: {
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

    items: {
      type: [orderItemSchema],

      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item.",
      },
    },

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

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cod"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "partially_paid",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

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

    codAdvanceRequired: {
      type: Boolean,
      default: false,
    },

    advancePercentage: {
      type: Number,
      default: 0,
    },

    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceDueOnDelivery: {
      type: Number,
      default: 0,
      min: 0,
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

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

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;