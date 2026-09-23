import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/* =========================================================
   DATABASE
========================================================= */

const getDatabase = () => {
  return mongoose.connection.db;
};

/* =========================================================
   FORMAT IMAGE PATH
========================================================= */

const imageUrl = (id) => {
  if (!id) return "";

  return `/api/catalog/images/${String(id)}`;
};

/* =========================================================
   PRODUCT IMAGES
========================================================= */

const getProductImages = (product) => {
  const images = [];

  if (Array.isArray(product.imageFiles)) {
    const sorted = [...product.imageFiles].sort(
      (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
    );

    sorted.forEach((item) => {
      const fileId = item?.fileId || item?._id || item?.id;

      if (fileId) {
        images.push(imageUrl(fileId));
      }
    });
  }

  if (images.length === 0 && Array.isArray(product.images)) {
    product.images.forEach((item) => {
      if (!item) return;

      const value = String(item);

      if (value.startsWith("/api/images/")) {
        images.push(value.replace("/api/images/", "/api/catalog/images/"));
      } else {
        images.push(value);
      }
    });
  }

  if (images.length === 0 && product.image) {
    const value = String(product.image);

    if (value.startsWith("/api/images/")) {
      images.push(value.replace("/api/images/", "/api/catalog/images/"));
    } else {
      images.push(value);
    }
  }

  return images;
};

/* =========================================================
   FORMAT PRODUCT
========================================================= */

const formatProduct = (product) => {
  const images = getProductImages(product);

  return {
    ...product,

    _id: String(product._id),

    id: String(product._id),

    image: images[0] || product.image || "",

    images,
  };
};

/* =========================================================
   GET ALL CATEGORY NAMES

   GET /api/categories
========================================================= */

router.get("/", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const categories = await db.collection("products").distinct("category", {
      isActive: {
        $ne: false,
      },
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("❌ Categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
});

/* =========================================================
   GET PRODUCTS BY CATEGORY

   Example:

   /api/categories/Pants/products
========================================================= */

router.get("/:category/products", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const cleanCategory = String(req.params.category).trim();

    const safeCategory = cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = {
      category: {
        $regex: `^${safeCategory}$`,
        $options: "i",
      },

      isActive: {
        $ne: false,
      },
    };

    const products = await db
      .collection("products")
      .find(filter)
      .sort({
        createdAt: -1,
      })
      .toArray();

    const formattedProducts = products.map(formatProduct);

    return res.status(200).json({
      success: true,

      category: cleanCategory,

      count: formattedProducts.length,

      products: formattedProducts,
    });
  } catch (error) {
    console.error("❌ Category products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get category products",
    });
  }
});

export default router;
