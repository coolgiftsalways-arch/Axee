import crypto from "node:crypto";
import mongoose from "mongoose";

import Cart from "../models/Cart.js";

/* =========================================================
   HELPERS
========================================================= */

const createCartId = () => {
  return crypto.randomUUID();
};

/* =========================================================
   MONGODB ERROR HANDLER
========================================================= */

const sendDatabaseError = (res, error, defaultMessage) => {
  console.error(`❌ ${defaultMessage}:`, error);

  const message = String(error?.message || "");
  const code = error?.code;

  /* =======================================================
     MONGODB ATLAS STORAGE FULL
  ======================================================= */

  if (
    code === 8000 ||
    message.toLowerCase().includes("space quota") ||
    message.toLowerCase().includes("writes are blocked") ||
    message.toLowerCase().includes("over your space quota")
  ) {
    return res.status(507).json({
      success: false,
      message: "MongoDB Atlas storage is full",
      error:
        "Your MongoDB Atlas cluster has reached its storage limit. " +
        "Free some storage or upgrade the Atlas cluster before trying again.",
      code: "MONGODB_STORAGE_FULL",
    });
  }

  /* =======================================================
     DUPLICATE KEY
  ======================================================= */

  if (code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate database record",
      error: message,
      code: "DUPLICATE_KEY",
    });
  }

  /* =======================================================
     NORMAL SERVER ERROR
  ======================================================= */

  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: message || "Unknown server error",
  });
};

/* =========================================================
   NORMALIZE IMAGE URL
========================================================= */

const normalizeImageUrl = (image) => {
  if (!image) return "";

  let value = image;

  /* =======================================================
     ARRAY
  ======================================================= */

  if (Array.isArray(value)) {
    value = value[0];
  }

  /* =======================================================
     OBJECT
  ======================================================= */

  if (value && typeof value === "object") {
    value =
      value.url ||
      value.src ||
      value.path ||
      value.image ||
      value.fileId ||
      value._id ||
      value.id ||
      "";
  }

  if (!value) return "";

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) return "";

  /* =======================================================
     FULL URL / DATA URL
  ======================================================= */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /* =======================================================
     OLD GRIDFS URL

     /api/images/ID
     ->
     /api/catalog/images/ID
  ======================================================= */

  if (value.startsWith("/api/images/")) {
    return value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    return `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  /* =======================================================
     CURRENT GRIDFS URL
  ======================================================= */

  if (value.startsWith("/api/catalog/images/")) {
    return value;
  }

  if (value.startsWith("api/catalog/images/")) {
    return `/${value}`;
  }

  /* =======================================================
     UPLOADS
  ======================================================= */

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

  /* =======================================================
     1. imageFiles
  ======================================================= */

  if (Array.isArray(product.imageFiles) && product.imageFiles.length > 0) {
    const sortedImages = [...product.imageFiles].sort(
      (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
    );

    for (const item of sortedImages) {
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

  /* =======================================================
     2. imageIds
  ======================================================= */

  if (Array.isArray(product.imageIds) && product.imageIds.length > 0) {
    const imageId = product.imageIds[0];

    if (imageId) {
      return `/api/catalog/images/${String(imageId)}`;
    }
  }

  /* =======================================================
     3. images
  ======================================================= */

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

  /* =======================================================
     4. imageId
  ======================================================= */

  if (product.imageId) {
    return `/api/catalog/images/${String(product.imageId)}`;
  }

  /* =======================================================
     5. mainImage
  ======================================================= */

  if (product.mainImage) {
    return normalizeImageUrl(product.mainImage);
  }

  /* =======================================================
     6. image
  ======================================================= */

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
    if (!productId) {
      return null;
    }

    if (!mongoose.connection.db) {
      console.error("❌ MongoDB connection is not available");

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
    /* =====================================================
       NORMALIZE EXISTING IMAGE
    ===================================================== */

    if (item.image) {
      const normalizedImage = normalizeImageUrl(item.image);

      if (normalizedImage && normalizedImage !== item.image) {
        item.image = normalizedImage;
        changed = true;
      }

      continue;
    }

    /* =====================================================
       IMAGE IS MISSING
    ===================================================== */

    const product = await findProduct(item.productId);

    if (!product) {
      continue;
    }

    const productImage = getProductImage(product);

    if (productImage) {
      item.image = productImage;
      changed = true;
    }
  }

  /*
    IMPORTANT:

    If Atlas storage is full, even repairing an
    old image could trigger a save error.

    Because getting a cart should still work,
    we don't allow image repair to completely
    break GET /api/cart/:cartId.
  */

  if (changed) {
    try {
      await cart.save();
    } catch (error) {
      console.warn("⚠️ Could not save repaired cart images:", error.message);
    }
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
      cartId: String(cartId).trim(),
    });

    /* =====================================================
       CART DOES NOT EXIST
    ===================================================== */

    if (!cart) {
      return res.status(200).json({
        success: true,

        cart: {
          cartId,
          items: [],
        },
      });
    }

    /* =====================================================
       REPAIR OLD IMAGES
    ===================================================== */

    cart = await repairCartImages(cart);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return sendDatabaseError(res, error, "Failed to get cart");
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
    } = req.body || {};

    /* =====================================================
       VALIDATE PRODUCT ID
    ===================================================== */

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    /* =====================================================
       GET PRODUCT FROM DATABASE
    ===================================================== */

    const product = await findProduct(productId);

    /*
      MongoDB products normally come from the database.

      But incoming values are kept as a fallback so
      local/static frontend products can also work.
    */

    /* =====================================================
       NAME
    ===================================================== */

    const name = String(
      product?.name || product?.title || incomingName || "UNBOUND Product",
    ).trim();

    /* =====================================================
       CATEGORY
    ===================================================== */

    const category = String(product?.category || incomingCategory || "").trim();

    /* =====================================================
       PRICE
    ===================================================== */

    const price = Number(
      product?.price ?? product?.salePrice ?? incomingPrice ?? 0,
    );

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    /* =====================================================
       IMAGE
    ===================================================== */

    const productImage = getProductImage(product);

    const image = productImage || normalizeImageUrl(incomingImage) || "";

    /* =====================================================
       SIZE
    ===================================================== */

    const size = String(incomingSize || product?.size || "ONE SIZE").trim();

    if (!size) {
      return res.status(400).json({
        success: false,
        message: "Product size is required",
      });
    }

    /* =====================================================
       QUANTITY
    ===================================================== */

    let quantity = Number(incomingQuantity || 1);

    if (!Number.isFinite(quantity)) {
      quantity = 1;
    }

    quantity = Math.floor(quantity);

    quantity = Math.min(10, Math.max(1, quantity));

    /* =====================================================
       CART ID
    ===================================================== */

    const cartId = String(incomingCartId || "").trim() || createCartId();

    /* =====================================================
       FIND EXISTING CART
    ===================================================== */

    let cart = await Cart.findOne({
      cartId,
    });

    /* =====================================================
       CREATE CART
    ===================================================== */

    if (!cart) {
      cart = new Cart({
        cartId,
        items: [],
      });
    }

    /* =====================================================
       FIND SAME PRODUCT + SAME SIZE
    ===================================================== */

    const existingItem = cart.items.find((item) => {
      const sameProduct = String(item.productId) === String(productId);

      const sameSize =
        String(item.size || "")
          .trim()
          .toLowerCase() ===
        String(size || "")
          .trim()
          .toLowerCase();

      return sameProduct && sameSize;
    });

    /* =====================================================
       ITEM ALREADY EXISTS
    ===================================================== */

    if (existingItem) {
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
      /* ===================================================
         ADD NEW CART ITEM
      =================================================== */

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

    /* =====================================================
       SAVE CART

       THIS REQUIRES MONGODB WRITE ACCESS.
    ===================================================== */

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Product added to cart",

      cartId: cart.cartId,

      cart,
    });
  } catch (error) {
    return sendDatabaseError(res, error, "Failed to add product to cart");
  }
};

/* =========================================================
   UPDATE CART ITEM

   PATCH /api/cart/:cartId/item/:itemId
========================================================= */

export const updateCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    const { quantity, size } = req.body || {};

    /* =====================================================
       FIND CART
    ===================================================== */

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    /* =====================================================
       FIND ITEM
    ===================================================== */

    const item = cart.items.find(
      (cartItem) => String(cartItem._id) === String(itemId),
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    /* =====================================================
       QUANTITY
    ===================================================== */

    if (quantity !== undefined && quantity !== null) {
      const nextQuantity = Number(quantity);

      if (!Number.isFinite(nextQuantity)) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a valid number",
        });
      }

      /* ===================================================
         QUANTITY 0 = REMOVE ITEM
      =================================================== */

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

      /* ===================================================
         QUANTITY 1 - 10
      =================================================== */

      item.quantity = Math.min(10, Math.max(1, Math.floor(nextQuantity)));
    }

    /* =====================================================
       SIZE
    ===================================================== */

    if (size !== undefined) {
      const nextSize = String(size).trim();

      if (!nextSize) {
        return res.status(400).json({
          success: false,
          message: "Size cannot be empty",
        });
      }

      item.size = nextSize;
    }

    /* =====================================================
       FIX MISSING IMAGE
    ===================================================== */

    if (!item.image) {
      const product = await findProduct(item.productId);

      const image = getProductImage(product);

      if (image) {
        item.image = image;
      }
    }

    /* =====================================================
       SAVE
    ===================================================== */

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Cart item updated",

      cart,
    });
  } catch (error) {
    return sendDatabaseError(res, error, "Failed to update cart item");
  }
};

/* =========================================================
   REMOVE CART ITEM

   DELETE /api/cart/:cartId/item/:itemId
========================================================= */

export const removeCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    /* =====================================================
       FIND CART
    ===================================================== */

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    /* =====================================================
       REMOVE ITEM
    ===================================================== */

    const previousLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => String(item._id) !== String(itemId),
    );

    if (cart.items.length === previousLength) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    /* =====================================================
       SAVE
    ===================================================== */

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Item removed from cart",

      cart,
    });
  } catch (error) {
    return sendDatabaseError(res, error, "Failed to remove cart item");
  }
};

/* =========================================================
   CLEAR CART

   DELETE /api/cart/:cartId/clear
========================================================= */

export const clearCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    /* =====================================================
       FIND CART
    ===================================================== */

    const cart = await Cart.findOne({
      cartId,
    });

    /* =====================================================
       ALREADY EMPTY / DOES NOT EXIST
    ===================================================== */

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

    /* =====================================================
       CLEAR ITEMS
    ===================================================== */

    cart.items = [];

    /* =====================================================
       SAVE
    ===================================================== */

    await cart.save();

    return res.status(200).json({
      success: true,

      message: "Cart cleared",

      cart,
    });
  } catch (error) {
    return sendDatabaseError(res, error, "Failed to clear cart");
  }
};

