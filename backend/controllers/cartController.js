import crypto from "node:crypto";
import mongoose from "mongoose";

import Cart from "../models/Cart.js";

/* =========================================================
   CART ID
========================================================= */

const createCartId = () => {
  return crypto.randomUUID();
};

/* =========================================================
   DATABASE ERROR HANDLER
========================================================= */

const sendDatabaseError = (res, error, defaultMessage) => {
  console.error(`❌ ${defaultMessage}:`, error);

  const message = String(error?.message || "");

  const code = error?.code;

  /* =======================================================
     MONGODB STORAGE FULL
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
     NORMAL ERROR
  ======================================================= */

  return res.status(500).json({
    success: false,

    message: defaultMessage,

    error: message || "Unknown server error",
  });
};

/* =========================================================
   CHECK LOCAL HOSTNAME
========================================================= */

const isLocalHostname = (hostname) => {
  const host = String(hostname || "")
    .trim()
    .toLowerCase();

  if (!host) {
    return false;
  }

  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }

  const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);

  if (match172) {
    const secondPart = Number(match172[1]);

    return secondPart >= 16 && secondPart <= 31;
  }

  return false;
};

/* =========================================================
   NORMALIZE IMAGE URL
========================================================= */

const normalizeImageUrl = (image) => {
  if (!image) {
    return "";
  }

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
    /*
      Always prefer actual image URL/path first.

      Do not automatically use _id because _id can
      simply be a MongoDB subdocument ID.
    */

    const directUrl =
      value?.url ||
      value?.src ||
      value?.path ||
      value?.image ||
      value?.imageUrl ||
      value?.location ||
      "";

    if (directUrl) {
      return normalizeImageUrl(directUrl);
    }

    /*
      Actual GridFS file ID.
    */

    if (value?.fileId) {
      return `/api/catalog/images/${String(value.fileId)}`;
    }

    /*
      Legacy explicit ID fallback.
    */

    if (value?.id) {
      return `/api/catalog/images/${String(value.id)}`;
    }

    return "";
  }

  /* =======================================================
     STRING
  ======================================================= */

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  /* =======================================================
     DATA / BLOB
  ======================================================= */

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  /* =======================================================
     FULL URL
  ======================================================= */

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);

      /*
        Old localhost URLs should not be saved
        into production carts.

        Example:

        http://localhost:5000/api/catalog/images/123

        becomes:

        /api/catalog/images/123
      */

      if (isLocalHostname(url.hostname)) {
        return `${url.pathname}${url.search}`;
      }

      /*
        Backend-owned resources can use the
        current domain.
      */

      if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/product-images/") ||
        url.pathname.startsWith("/uploads/")
      ) {
        return `${url.pathname}${url.search}`;
      }

      /*
        External CDN URL.
      */

      return value;
    } catch {
      return value;
    }
  }

  /* =======================================================
     OLD GRIDFS
  ======================================================= */

  if (value.startsWith("/api/images/")) {
    return value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    return `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  /* =======================================================
     CURRENT GRIDFS
  ======================================================= */

  if (value.startsWith("/api/catalog/images/")) {
    return value;
  }

  if (value.startsWith("api/catalog/images/")) {
    return `/${value}`;
  }

  /* =======================================================
     OTHER API
  ======================================================= */

  if (value.startsWith("/api/")) {
    return value;
  }

  if (value.startsWith("api/")) {
    return `/${value}`;
  }

  /* =======================================================
     PRODUCT IMAGES
  ======================================================= */

  if (value.startsWith("/product-images/")) {
    return value;
  }

  if (value.startsWith("product-images/")) {
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

  /* =======================================================
     WINDOWS PATH FIX
  ======================================================= */

  const productImagesIndex = value.indexOf("/product-images/");

  if (productImagesIndex !== -1) {
    return value.slice(productImagesIndex);
  }

  const uploadsIndex = value.indexOf("/uploads/");

  if (uploadsIndex !== -1) {
    return value.slice(uploadsIndex);
  }

  return value;
};

/* =========================================================
   GET FIRST IMAGE FROM ARRAY
========================================================= */

const getFirstImageFromArray = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return "";
  }

  for (const image of images) {
    const normalized = normalizeImageUrl(image);

    if (normalized) {
      return normalized;
    }
  }

  return "";
};

/* =========================================================
   GET PRODUCT IMAGE

   IMPORTANT PRIORITY:

   1. product.images
   2. product.mainImage
   3. product.image
   4. product.imageFiles
   5. product.imageIds
   6. product.imageId
   7. thumbnail
========================================================= */

const getProductImage = (product) => {
  if (!product) {
    return "";
  }

  /* =======================================================
     1. CURRENT PRODUCT IMAGES
  ======================================================= */

  const currentImage = getFirstImageFromArray(product.images);

  if (currentImage) {
    return currentImage;
  }

  /* =======================================================
     2. MAIN IMAGE
  ======================================================= */

  if (product.mainImage) {
    const mainImage = normalizeImageUrl(product.mainImage);

    if (mainImage) {
      return mainImage;
    }
  }

  /* =======================================================
     3. SINGLE IMAGE
  ======================================================= */

  if (product.image) {
    const image = normalizeImageUrl(product.image);

    if (image) {
      return image;
    }
  }

  /* =======================================================
     4. LEGACY IMAGE FILES

     Only fallback.
  ======================================================= */

  if (Array.isArray(product.imageFiles) && product.imageFiles.length > 0) {
    const sorted = [...product.imageFiles].sort(
      (a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0),
    );

    /*
      Actual URL/path first.
    */

    for (const imageFile of sorted) {
      if (!imageFile) {
        continue;
      }

      const directUrl =
        imageFile?.url ||
        imageFile?.src ||
        imageFile?.path ||
        imageFile?.image ||
        imageFile?.imageUrl ||
        imageFile?.location ||
        "";

      if (directUrl) {
        const normalized = normalizeImageUrl(directUrl);

        if (normalized) {
          return normalized;
        }
      }
    }

    /*
      GridFS fileId.
    */

    for (const imageFile of sorted) {
      if (imageFile?.fileId) {
        return `/api/catalog/images/${String(imageFile.fileId)}`;
      }
    }

    /*
      Legacy explicit id.

      Do not use imageFile._id automatically.
    */

    for (const imageFile of sorted) {
      if (imageFile?.id) {
        return `/api/catalog/images/${String(imageFile.id)}`;
      }
    }
  }

  /* =======================================================
     5. IMAGE IDS
  ======================================================= */

  if (Array.isArray(product.imageIds) && product.imageIds.length > 0) {
    const imageId = product.imageIds[0];

    if (imageId) {
      return `/api/catalog/images/${String(imageId)}`;
    }
  }

  /* =======================================================
     6. IMAGE ID
  ======================================================= */

  if (product.imageId) {
    return `/api/catalog/images/${String(product.imageId)}`;
  }

  /* =======================================================
     7. THUMBNAIL
  ======================================================= */

  if (product.thumbnail) {
    const thumbnail = normalizeImageUrl(product.thumbnail);

    if (thumbnail) {
      return thumbnail;
    }
  }

  return "";
};

/* =========================================================
   NORMALIZE PRODUCT ID
========================================================= */

const normalizeProductId = (productId) => {
  if (!productId) {
    return "";
  }

  if (typeof productId === "object") {
    return String(productId?._id || productId?.id || "");
  }

  return String(productId);
};

/* =========================================================
   FIND PRODUCT
========================================================= */

const findProduct = async (productId) => {
  try {
    const id = normalizeProductId(productId);

    if (!id) {
      return null;
    }

    if (!mongoose.connection.db) {
      console.error("❌ MongoDB connection is not available");

      return null;
    }

    /*
      Static/local product IDs may not be Mongo ObjectIds.
    */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const objectId = new mongoose.Types.ObjectId(id);

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
   REPAIR ONE CART ITEM IMAGE
========================================================= */

const repairSingleCartItemImage = async (item) => {
  if (!item) {
    return false;
  }

  const originalImage = String(item.image || "");

  /*
      Normalize whatever is already stored.
    */

  const storedImage = normalizeImageUrl(item.image);

  /*
      Try to get the latest/current product.
    */

  const product = await findProduct(item.productId);

  const productImage = normalizeImageUrl(getProductImage(product));

  /*
      Current product image should win.
    */

  const nextImage = productImage || storedImage || "";

  if (!nextImage) {
    return false;
  }

  if (originalImage !== nextImage) {
    item.image = nextImage;

    return true;
  }

  return false;
};

/* =========================================================
   REPAIR ALL CART IMAGES
========================================================= */

const repairCartImages = async (cart) => {
  if (!cart || !Array.isArray(cart.items)) {
    return cart;
  }

  let changed = false;

  for (const item of cart.items) {
    try {
      const itemChanged = await repairSingleCartItemImage(item);

      if (itemChanged) {
        changed = true;
      }
    } catch (error) {
      console.warn("⚠️ Could not repair cart item image:", {
        productId: item?.productId,

        error: error?.message,
      });
    }
  }

  /*
    Do not break GET cart just because repair save fails.
  */

  if (changed) {
    try {
      await cart.save();

      console.log("✅ Cart images repaired");
    } catch (error) {
      console.warn("⚠️ Cart image repair save failed:", error?.message);
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
         CART NOT FOUND
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

    /*
        Fix old cart images automatically.
      */

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
         PRODUCT ID
      ===================================================== */

    if (!productId) {
      return res.status(400).json({
        success: false,

        message: "Product ID is required",
      });
    }

    const normalizedProductId = normalizeProductId(productId);

    if (!normalizedProductId) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    /* =====================================================
         DATABASE PRODUCT
      ===================================================== */

    const product = await findProduct(normalizedProductId);

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

         DATABASE PRODUCT IMAGE FIRST.
         FRONTEND IMAGE FALLBACK SECOND.
      ===================================================== */

    const databaseImage = normalizeImageUrl(getProductImage(product));

    const frontendImage = normalizeImageUrl(incomingImage);

    const image = databaseImage || frontendImage || "";

    console.log("🖼 CART IMAGE:", {
      productId: normalizedProductId,

      name,

      databaseImage,

      incomingImage,

      finalImage: image,
    });

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
         FIND CART
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
      const existingProductId = normalizeProductId(item.productId);

      const sameProduct =
        String(existingProductId) === String(normalizedProductId);

      const existingSize = String(item.size || "")
        .trim()
        .toLowerCase();

      const newSize = String(size || "")
        .trim()
        .toLowerCase();

      return sameProduct && existingSize === newSize;
    });

    /* =====================================================
         UPDATE EXISTING
      ===================================================== */

    if (existingItem) {
      existingItem.quantity = Math.min(
        10,

        Number(existingItem.quantity || 1) + quantity,
      );

      existingItem.name = name;

      existingItem.category = category;

      existingItem.price = price;

      /*
          Refresh image every time.
        */

      if (image) {
        existingItem.image = image;
      } else if (existingItem.image) {
        existingItem.image = normalizeImageUrl(existingItem.image);
      }
    } else {
      /* ===================================================
           ADD NEW
        =================================================== */

      cart.items.push({
        productId: normalizedProductId,

        name,

        category,

        price,

        image,

        size,

        quantity,
      });
    }

    /* =====================================================
         SAVE
      ===================================================== */

    await cart.save();

    /*
        Final image repair.
      */

    cart = await repairCartImages(cart);

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

    let cart = await Cart.findOne({
      cartId: String(cartId || "").trim(),
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

      /*
          Quantity zero = remove.
        */

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

      item.quantity = Math.min(
        10,

        Math.max(
          1,

          Math.floor(nextQuantity),
        ),
      );
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
         IMAGE REPAIR
      ===================================================== */

    await repairSingleCartItemImage(item);

    /* =====================================================
         SAVE
      ===================================================== */

    await cart.save();

    cart = await repairCartImages(cart);

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
      cartId: String(cartId || "").trim(),
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
      cartId: String(cartId || "").trim(),
    });

    /* =====================================================
         ALREADY EMPTY
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
         CLEAR
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
