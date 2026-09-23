import mongoose from "mongoose";
import Cart from "../models/Cart.js";

/* =========================================================
   FIND PRODUCT FROM MAIN PRODUCTS COLLECTION
========================================================= */

const getMongoProduct = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return null;
    }

    return await mongoose.connection.db.collection("products").findOne({
      _id: new mongoose.Types.ObjectId(productId),
    });
  } catch (error) {
    console.error("Product lookup error:", error);
    return null;
  }
};

/* =========================================================
   GET BEST PRODUCT IMAGE
========================================================= */

const getProductImage = (product) => {
  if (!product) return "";

  if (Array.isArray(product.imageFiles) && product.imageFiles.length > 0) {
    const sortedImages = [...product.imageFiles].sort(
      (a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0),
    );

    const firstImage = sortedImages[0];

    if (firstImage?.fileId) {
      return `/api/catalog/images/${String(firstImage.fileId)}`;
    }

    if (firstImage?.url) {
      const url = String(firstImage.url);

      if (url.startsWith("/api/images/")) {
        return url.replace("/api/images/", "/api/catalog/images/");
      }

      return url;
    }
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = String(product.images[0]);

    if (firstImage.startsWith("/api/images/")) {
      return firstImage.replace("/api/images/", "/api/catalog/images/");
    }

    return firstImage;
  }

  const image = product.image || product.mainImage || "";

  if (typeof image === "string" && image.startsWith("/api/images/")) {
    return image.replace("/api/images/", "/api/catalog/images/");
  }

  return image;
};

/* =========================================================
   GET CART
   GET /api/cart/:cartId
========================================================= */

export const getCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    let cart = await Cart.findOne({ cartId });

    if (!cart) {
      cart = await Cart.create({
        cartId,
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("❌ Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get cart",
    });
  }
};

/* =========================================================
   ADD TO CART
   POST /api/cart/add
========================================================= */

export const addToCart = async (req, res) => {
  try {
    const {
      cartId,
      productId,
      size,
      quantity = 1,

      // Fallback information for local products.
      name,
      price,
      image,
      category,
    } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!size) {
      return res.status(400).json({
        success: false,
        message: "Please select a size",
      });
    }

    const safeQuantity = Math.min(10, Math.max(1, Number(quantity) || 1));

    /*
      If this is a real MongoDB ID, get the latest product
      information directly from MongoDB.
    */
    const mongoProduct = await getMongoProduct(productId);

    /*
      Mongo product takes priority.
      If it is a local product, use information supplied
      by the frontend.
    */
    const productName = mongoProduct?.name || name || "AXIEE Product";

    const productPrice = Number(mongoProduct?.price ?? price ?? 0);

    const productImage = mongoProduct
      ? getProductImage(mongoProduct)
      : image || "";

    const productCategory = mongoProduct?.category || category || "";

    /*
      Mongo IDs must exist in products collection.
      Local IDs are allowed to use frontend snapshot data.
    */
    if (mongoose.Types.ObjectId.isValid(productId) && !mongoProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found in MongoDB",
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
        String(item.size) === String(size),
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        10,
        Number(existingItem.quantity || 0) + safeQuantity,
      );

      // Keep product details updated.
      existingItem.name = productName;
      existingItem.price = productPrice;
      existingItem.image = productImage;
      existingItem.category = productCategory;
    } else {
      cart.items.push({
        productId: String(productId),
        name: productName,
        category: productCategory,
        price: productPrice,
        image: productImage,
        size,
        quantity: safeQuantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Added to cart",
      cart,
    });
  } catch (error) {
    console.error("❌ Add cart error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add product to cart",
    });
  }
};

/* =========================================================
   UPDATE CART ITEM
   PATCH /api/cart/:cartId/item/:itemId
========================================================= */

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

    item.quantity = Math.min(10, Math.max(1, Number(quantity) || 1));

    await cart.save();

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("❌ Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

/* =========================================================
   REMOVE CART ITEM
   DELETE /api/cart/:cartId/item/:itemId
========================================================= */

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
      (item) => String(item._id) !== String(itemId),
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("❌ Remove cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove item",
    });
  }
};

/* =========================================================
   CLEAR CART
   DELETE /api/cart/:cartId/clear
========================================================= */

export const clearCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    let cart = await Cart.findOne({ cartId });

    if (!cart) {
      cart = await Cart.create({
        cartId,
        items: [],
      });

      return res.status(200).json({
        success: true,
        cart,
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("❌ Clear cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};
