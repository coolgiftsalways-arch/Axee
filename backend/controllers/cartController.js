import crypto from "node:crypto";
import mongoose from "mongoose";

import Cart from "../models/Cart.js";

/* =========================================================
   HELPERS
========================================================= */

const createCartId = () => {
  return crypto.randomUUID();
};

const normalizeImageUrl = (image) => {
  if (!image) return "";

  let value = image;

  if (Array.isArray(value)) {
    value = value[0];
  }

  if (value && typeof value === "object") {
    value =
      value.url ||
      value.src ||
      value.path ||
      value.image ||
      value.fileId ||
      value._id ||
      "";
  }

  if (!value) return "";

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) return "";

  /* =========================================
     FULL URL
  ========================================= */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /* =========================================
     OLD GRIDFS URL

     /api/images/ID
     ->
     /api/catalog/images/ID
  ========================================= */

  if (value.startsWith("/api/images/")) {
    return value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    return `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  /* =========================================
     CURRENT GRIDFS URL
  ========================================= */

  if (value.startsWith("/api/catalog/images/")) {
    return value;
  }

  if (value.startsWith("api/catalog/images/")) {
    return `/${value}`;
  }

  /* =========================================
     UPLOADS
  ========================================= */

  if (value.startsWith("/uploads/")) {
    return value;
  }

  if (value.startsWith("uploads/")) {
    return `/${value}`;
  }

  return value;
};

/* =========================================================
   GET PRODUCT IMAGE
========================================================= */

const getProductImage = (product) => {
  if (!product) return "";

  /* =========================================
     1. imageFiles
  ========================================= */

  if (Array.isArray(product.imageFiles) && product.imageFiles.length > 0) {
    const sorted = [...product.imageFiles].sort(
      (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
    );

    for (const item of sorted) {
      if (!item) continue;

      const fileId = item.fileId || item._id || item.id;

      if (fileId) {
        return `/api/catalog/images/${String(fileId)}`;
      }

      if (item.url) {
        return normalizeImageUrl(item.url);
      }
    }
  }

  /* =========================================
     2. imageIds
  ========================================= */

  if (Array.isArray(product.imageIds) && product.imageIds.length > 0) {
    const id = product.imageIds[0];

    if (id) {
      return `/api/catalog/images/${String(id)}`;
    }
  }

  /* =========================================
     3. images
  ========================================= */

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];

    if (firstImage) {
      if (typeof firstImage === "object") {
        const fileId = firstImage.fileId || firstImage._id || firstImage.id;

        if (fileId) {
          return `/api/catalog/images/${String(fileId)}`;
        }

        return normalizeImageUrl(
          firstImage.url ||
            firstImage.src ||
            firstImage.path ||
            firstImage.image ||
            "",
        );
      }

      return normalizeImageUrl(firstImage);
    }
  }

  /* =========================================
     4. imageId
  ========================================= */

  if (product.imageId) {
    return `/api/catalog/images/${String(product.imageId)}`;
  }

  /* =========================================
     5. mainImage
  ========================================= */

  if (product.mainImage) {
    return normalizeImageUrl(product.mainImage);
  }

  /* =========================================
     6. image
  ========================================= */

  if (product.image) {
    return normalizeImageUrl(product.image);
  }

  return "";
};

/* =========================================================
   FIND PRODUCT IN MONGODB
========================================================= */

const findProduct = async (productId) => {
  try {
    if (!productId) return null;

    if (!mongoose.connection.db) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      return null;
    }

    const objectId = new mongoose.Types.ObjectId(String(productId));

    const product = await mongoose.connection.db
      .collection("products")
      .findOne({
        _id: objectId,
      });

    return product || null;
  } catch (error) {
    console.error("❌ Find cart product error:", error);

    return null;
  }
};

/* =========================================================
   REPAIR OLD CART IMAGES
========================================================= */

const repairCartImages = async (cart) => {
  if (!cart || !Array.isArray(cart.items)) {
    return cart;
  }

  let changed = false;

  for (const item of cart.items) {
    /* =========================================
       NORMALIZE EXISTING IMAGE
    ========================================= */

    if (item.image) {
      const normalized = normalizeImageUrl(item.image);

      if (normalized !== item.image) {
        item.image = normalized;
        changed = true;
      }

      continue;
    }

    /* =========================================
       IMAGE MISSING
    ========================================= */

    const product = await findProduct(item.productId);

    if (!product) {
      continue;
    }

    const image = getProductImage(product);

    if (image) {
      item.image = image;
      changed = true;
    }
  }

  if (changed) {
    await cart.save();
  }

  return cart;
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

    let cart = await Cart.findOne({
      cartId,
    });

    /* =========================================
       CART DOES NOT EXIST
    ========================================= */

    if (!cart) {
      return res.status(200).json({
        success: true,

        cart: {
          cartId,
          items: [],
        },
      });
    }

    /* =========================================
       FIX OLD IMAGES
    ========================================= */

    cart = await repairCartImages(cart);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("❌ Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: error.message,
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
      cartId: incomingCartId,

      productId,

      name: incomingName,

      category: incomingCategory,

      price: incomingPrice,

      image: incomingImage,

      size: incomingSize,

      quantity: incomingQuantity = 1,
    } = req.body;

    /* =========================================
       VALIDATION
    ========================================= */

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    /* =========================================
       GET PRODUCT
    ========================================= */

    const product = await findProduct(productId);

    /* =========================================
       NAME
    ========================================= */

    const name =
      product?.name || product?.title || incomingName || "AXIEE Product";

    /* =========================================
       CATEGORY
    ========================================= */

    const category = product?.category || incomingCategory || "";

    /* =========================================
       PRICE
    ========================================= */

    const price = Number(
      product?.price ?? product?.salePrice ?? incomingPrice ?? 0,
    );

    /* =========================================
       IMAGE
    ========================================= */

    const productImage = getProductImage(product);

    const image = productImage || normalizeImageUrl(incomingImage) || "";

    /* =========================================
       SIZE
    ========================================= */

    const size = incomingSize || product?.size || "ONE SIZE";

    /* =========================================
       QUANTITY
    ========================================= */

    const quantity = Math.min(10, Math.max(1, Number(incomingQuantity || 1)));

    /* =========================================
       CART ID
    ========================================= */

    const cartId = String(incomingCartId || "").trim() || createCartId();

    /* =========================================
       FIND / CREATE CART
    ========================================= */

    let cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      cart = new Cart({
        cartId,
        items: [],
      });
    }

    /* =========================================
       CHECK SAME PRODUCT + SIZE
    ========================================= */

    const existingItem = cart.items.find(
      (item) =>
        String(item.productId) === String(productId) &&
        String(item.size || "")
          .trim()
          .toLowerCase() ===
          String(size || "")
            .trim()
            .toLowerCase(),
    );

    if (existingItem) {
      /* =======================================
         UPDATE EXISTING ITEM
      ======================================= */

      existingItem.quantity = Math.min(
        10,
        Number(existingItem.quantity || 1) + quantity,
      );

      existingItem.name = name;

      existingItem.category = category;

      existingItem.price = price;

      if (image) {
        existingItem.image = image;
      }
    } else {
      /* =======================================
         ADD NEW ITEM
      ======================================= */

      cart.items.push({
        productId: String(productId),

        name,

        category,

        price,

        image,

        size,

        quantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Product added to cart",

      cartId: cart.cartId,

      cart,
    });
  } catch (error) {
    console.error("❌ Add to cart error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to add product to cart",

      error: error.message,
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

    const { quantity, size } = req.body;

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (cartItem) => String(cartItem._id) === String(itemId),
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    /* =========================================
       QUANTITY
    ========================================= */

    if (quantity !== undefined && quantity !== null) {
      const nextQuantity = Number(quantity);

      if (!Number.isFinite(nextQuantity)) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a valid number",
        });
      }

      /* =======================================
         IMPORTANT FIX

         Quantity 0 = REMOVE PRODUCT
      ======================================= */

      if (nextQuantity <= 0) {
        cart.items = cart.items.filter(
          (cartItem) => String(cartItem._id) !== String(itemId),
        );

        await cart.save();

        return res.status(200).json({
          success: true,

          message: "Item removed from cart",

          cart,
        });
      }

      /* =======================================
         QUANTITY 1 - 10
      ======================================= */

      item.quantity = Math.min(10, nextQuantity);
    }

    /* =========================================
       SIZE
    ========================================= */

    if (size) {
      item.size = String(size).trim();
    }

    /* =========================================
       REPAIR IMAGE
    ========================================= */

    if (!item.image) {
      const product = await findProduct(item.productId);

      const image = getProductImage(product);

      if (image) {
        item.image = image;
      }
    }

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Cart item updated",

      cart,
    });
  } catch (error) {
    console.error("❌ Update cart item error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to update cart item",

      error: error.message,
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

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const before = cart.items.length;

    cart.items = cart.items.filter(
      (item) => String(item._id) !== String(itemId),
    );

    if (cart.items.length === before) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Item removed from cart",

      cart,
    });
  } catch (error) {
    console.error("❌ Remove cart item error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to remove cart item",

      error: error.message,
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

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,

        message: "Cart is already empty",

        cart: {
          cartId,
          items: [],
        },
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Cart cleared",

      cart,
    });
  } catch (error) {
    console.error("❌ Clear cart error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to clear cart",

      error: error.message,
    });
  }
};
