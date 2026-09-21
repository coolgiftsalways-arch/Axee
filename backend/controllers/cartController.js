import mongoose from "mongoose";
import Cart from "../models/Cart.js";

const getProduct = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return null;
  }

  return mongoose.connection.db
    .collection("products")
    .findOne({
      _id: new mongoose.Types.ObjectId(productId),
    });
};

// ======================================================
// GET CART
// ======================================================

export const getCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    let cart = await Cart.findOne({ cartId });

    if (!cart) {
      cart = await Cart.create({
        cartId,
        items: [],
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get cart",
    });
  }
};

// ======================================================
// ADD TO CART
// ======================================================

export const addToCart = async (req, res) => {
  try {
    const {
      cartId,
      productId,
      size,
      quantity = 1,
    } = req.body;

    if (!cartId || !productId || !size) {
      return res.status(400).json({
        success: false,
        message: "cartId, productId and size are required",
      });
    }

    const product = await getProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ cartId });

    if (!cart) {
      cart = new Cart({
        cartId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        String(item.productId) === String(productId) &&
        item.size === size
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        10,
        existingItem.quantity + Number(quantity)
      );
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: Number(product.price || 699),
        image: product.image || product.mainImage || "",
        size,
        quantity: Math.min(
          10,
          Math.max(1, Number(quantity))
        ),
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};

// ======================================================
// UPDATE QUANTITY
// ======================================================

export const updateCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.quantity = Math.min(
      10,
      Math.max(1, Number(quantity))
    );

    await cart.save();

    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

// ======================================================
// REMOVE ITEM
// ======================================================

export const removeCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => String(item._id) !== String(itemId)
    );

    await cart.save();

    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove item",
    });
  }
};

// ======================================================
// CLEAR CART
// ======================================================

export const clearCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { cartId },
      {
        $set: {
          items: [],
        },
      },
      {
        new: true,
      }
    );

    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};