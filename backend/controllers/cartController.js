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

    return await mongoose.connection.db
      .collection("products")
      .findOne({
        _id: new mongoose.Types.ObjectId(productId),
      });
  } catch (error) {
    console.error("Product lookup error:", error);
    return null;
  }
};

/* =========================================================
   NORMALIZE IMAGE URL
========================================================= */

const normalizeImageUrl = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    if (value?.url) {
      return normalizeImageUrl(value.url);
    }

    const fileId =
      value?.fileId ||
      value?._id ||
      value?.id;

    if (fileId) {
      return `/api/catalog/images/${String(fileId)}`;
    }

    return "";
  }

  const image = String(value).trim();

  if (!image) {
    return "";
  }

  if (image.includes("/api/images/")) {
    const imageId =
      image.split("/api/images/")[1];

    if (imageId) {
      return `/api/catalog/images/${imageId}`;
    }
  }

  if (image.includes("/api/catalog/images/")) {
    const imageId =
      image.split("/api/catalog/images/")[1];

    if (imageId) {
      return `/api/catalog/images/${imageId}`;
    }
  }

  return image;
};

/* =========================================================
   GET BEST PRODUCT IMAGE
========================================================= */

const getProductImage = (product) => {
  if (!product) {
    return "";
  }

  /* =====================================================
     GRIDFS IMAGE FILES
  ===================================================== */

  if (
    Array.isArray(product.imageFiles) &&
    product.imageFiles.length > 0
  ) {
    const sortedImages =
      [...product.imageFiles].sort(
        (a, b) =>
          Number(a?.order ?? 0) -
          Number(b?.order ?? 0),
      );

    for (const imageFile of sortedImages) {
      const imageUrl =
        normalizeImageUrl(imageFile);

      if (imageUrl) {
        return imageUrl;
      }
    }
  }

  /* =====================================================
     IMAGES ARRAY
  ===================================================== */

  if (
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    for (const imageItem of product.images) {
      const imageUrl =
        normalizeImageUrl(imageItem);

      if (imageUrl) {
        return imageUrl;
      }
    }
  }

  /* =====================================================
     MAIN IMAGE
  ===================================================== */

  const mainImage =
    normalizeImageUrl(
      product.mainImage,
    );

  if (mainImage) {
    return mainImage;
  }

  /* =====================================================
     NORMAL IMAGE
  ===================================================== */

  const image =
    normalizeImageUrl(
      product.image,
    );

  if (image) {
    return image;
  }

  return "";
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

    let cart =
      await Cart.findOne({
        cartId,
      });

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
    console.error(
      "❌ Get cart error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get cart",
    });
  }
};

/* =========================================================
   ADD TO CART
   POST /api/cart/add
========================================================= */

export const addToCart = async (
  req,
  res,
) => {
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

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message:
          "Cart ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message:
          "Product ID is required",
      });
    }

    if (!size) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a size",
      });
    }

    const safeQuantity =
      Math.min(
        10,
        Math.max(
          1,
          Number(quantity) || 1,
        ),
      );

    /* =====================================================
       GET PRODUCT FROM MONGODB
    ===================================================== */

    const mongoProduct =
      await getMongoProduct(
        productId,
      );

    /*
      Mongo ObjectId products must actually exist.
      Local/string IDs are still allowed.
    */

    if (
      mongoose.Types.ObjectId.isValid(
        productId,
      ) &&
      !mongoProduct
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found in MongoDB",
      });
    }

    /* =====================================================
       PRODUCT DETAILS
    ===================================================== */

    const productName =
      mongoProduct?.name ||
      name ||
      "AXIEE Product";

    const productPrice =
      Number(
        mongoProduct?.price ??
          price ??
          0,
      );

    /*
      MongoDB image first.

      If MongoDB product has no usable image,
      use the image sent by the frontend.
    */

    const mongoProductImage =
      getProductImage(
        mongoProduct,
      );

    const frontendImage =
      normalizeImageUrl(
        image,
      );

    const productImage =
      mongoProductImage ||
      frontendImage ||
      "";

    const productCategory =
      mongoProduct?.category ||
      category ||
      "";

    /* =====================================================
       DEBUG IMAGE
    ===================================================== */

    console.log(
      "🖼 CART PRODUCT IMAGE:",
      {
        productId,
        name:
          productName,

        frontendImage:
          image,

        mongoImageFiles:
          mongoProduct?.imageFiles,

        mongoImages:
          mongoProduct?.images,

        mongoMainImage:
          mongoProduct?.mainImage,

        mongoImage:
          mongoProduct?.image,

        finalImage:
          productImage,
      },
    );

    /* =====================================================
       GET / CREATE CART
    ===================================================== */

    let cart =
      await Cart.findOne({
        cartId,
      });

    if (!cart) {
      cart = new Cart({
        cartId,
        items: [],
      });
    }

    /* =====================================================
       FIND EXISTING ITEM
    ===================================================== */

    const existingItem =
      cart.items.find(
        (item) =>
          String(
            item.productId,
          ) ===
            String(
              productId,
            ) &&
          String(
            item.size,
          ) ===
            String(
              size,
            ),
      );

    /* =====================================================
       UPDATE EXISTING ITEM
    ===================================================== */

    if (existingItem) {
      existingItem.quantity =
        Math.min(
          10,
          Number(
            existingItem.quantity ||
              0,
          ) +
            safeQuantity,
        );

      /*
        Always refresh product information.
      */

      existingItem.name =
        productName;

      existingItem.price =
        productPrice;

      existingItem.image =
        productImage;

      existingItem.category =
        productCategory;
    } else {
      /* ===================================================
         ADD NEW ITEM
      =================================================== */

      cart.items.push({
        productId:
          String(productId),

        name:
          productName,

        category:
          productCategory,

        price:
          productPrice,

        image:
          productImage,

        size,

        quantity:
          safeQuantity,
      });
    }

    /* =====================================================
       SAVE
    ===================================================== */

    await cart.save();

    return res.status(200).json({
      success: true,
      message:
        "Added to cart",
      cart,
    });
  } catch (error) {
    console.error(
      "❌ Add cart error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to add product to cart",
    });
  }
};

/* =========================================================
   UPDATE CART ITEM
   PATCH /api/cart/:cartId/item/:itemId
========================================================= */

export const updateCartItem = async (
  req,
  res,
) => {
  try {
    const {
      cartId,
      itemId,
    } = req.params;

    const {
      quantity,
    } = req.body;

    const cart =
      await Cart.findOne({
        cartId,
      });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message:
          "Cart not found",
      });
    }

    const item =
      cart.items.id(
        itemId,
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Cart item not found",
      });
    }

    item.quantity =
      Math.min(
        10,
        Math.max(
          1,
          Number(quantity) || 1,
        ),
      );

    await cart.save();

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error(
      "❌ Update cart error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update cart",
    });
  }
};

/* =========================================================
   REMOVE CART ITEM
   DELETE /api/cart/:cartId/item/:itemId
========================================================= */

export const removeCartItem = async (
  req,
  res,
) => {
  try {
    const {
      cartId,
      itemId,
    } = req.params;

    const cart =
      await Cart.findOne({
        cartId,
      });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message:
          "Cart not found",
      });
    }

    cart.items =
      cart.items.filter(
        (item) =>
          String(
            item._id,
          ) !==
          String(
            itemId,
          ),
      );

    await cart.save();

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error(
      "❌ Remove cart item error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove item",
    });
  }
};

/* =========================================================
   CLEAR CART
   DELETE /api/cart/:cartId/clear
========================================================= */

export const clearCart = async (
  req,
  res,
) => {
  try {
    const {
      cartId,
    } = req.params;

    let cart =
      await Cart.findOne({
        cartId,
      });

    if (!cart) {
      cart =
        await Cart.create({
          cartId,
          items: [],
        });

      return res
        .status(200)
        .json({
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
    console.error(
      "❌ Clear cart error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to clear cart",
    });
  }
};