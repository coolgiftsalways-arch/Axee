import mongoose from "mongoose";

/* =========================================================
   CART ITEM
========================================================= */

const cartItemSchema = new mongoose.Schema(
  {
    /*
      Keep productId as String.

      This supports:
      - MongoDB ObjectId products
      - local/static AXIEE products
    */
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    _id: true,
  },
);

/* =========================================================
   CART
========================================================= */

const cartSchema = new mongoose.Schema(
  {
    /*
      We are NOT using userId anymore.

      Every browser/device gets a cartId stored in:
      localStorage["axiee-cart-id"]
    */
    cartId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   MODEL
========================================================= */

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export default Cart;
