import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

const getDatabase = () => {
  return mongoose.connection.db;
};

const getGridFSBucket = () => {
  const db = getDatabase();

  if (!db) {
    return null;
  }

  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: "productImages",
  });
};

/* =========================================================
   GET PRODUCTS

   Examples:

   /api/catalog/products

   /api/catalog/products?category=Pants

   /api/catalog/products?category=TRACK%20PANTS
========================================================= */

router.get("/products", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const { category } = req.query;

    const filter = {};

    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    if (category) {
      const cleanCategory = String(category).trim();

      /*
        Your frontend currently requests:

        ?category=Pants

        This will also allow products stored as:
        Pants
        TRACK PANTS
        Track Pants
      */

      if (cleanCategory.toLowerCase() === "pants") {
        filter.category = {
          $regex: "^(pants|track pants)$",
          $options: "i",
        };
      } else {
        filter.category = {
          $regex: `^${cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        };
      }
    }

    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    const products = await db
      .collection("products")
      .find(filter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .toArray();

    /* =====================================================
       FORMAT PRODUCTS
    ===================================================== */

    const formattedProducts = products.map((product) => {
      const formatted = {
        ...product,

        _id: String(product._id),

        id: String(product._id),
      };

      /*
        Convert GridFS IDs into frontend URLs.

        Supports fields such as:

        imageId
        imageIds

        If your product already contains normal URLs in
        image/images, those are kept.
      */

      if (product.imageId) {
        formatted.image = `/api/catalog/images/${String(product.imageId)}`;
      }

      if (Array.isArray(product.imageIds) && product.imageIds.length > 0) {
        formatted.images = product.imageIds.map(
          (imageId) => `/api/catalog/images/${String(imageId)}`,
        );

        if (!formatted.image) {
          formatted.image = formatted.images[0];
        }
      }

      return formatted;
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("❌ Get products error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get products",
      error: error.message,
    });
  }
});

/* =========================================================
   GET SINGLE PRODUCT

   Example:

   /api/catalog/products/68d...
========================================================= */

router.get("/products/:id", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await db.collection("products").findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const formatted = {
      ...product,

      _id: String(product._id),

      id: String(product._id),
    };

    if (product.imageId) {
      formatted.image = `/api/catalog/images/${String(product.imageId)}`;
    }

    if (Array.isArray(product.imageIds) && product.imageIds.length > 0) {
      formatted.images = product.imageIds.map(
        (imageId) => `/api/catalog/images/${String(imageId)}`,
      );

      if (!formatted.image) {
        formatted.image = formatted.images[0];
      }
    }

    return res.status(200).json({
      success: true,
      product: formatted,
    });
  } catch (error) {
    console.error("❌ Get product error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get product",
      error: error.message,
    });
  }
});

/* =========================================================
   GET GRIDFS IMAGE

   Example:

   /api/catalog/images/68d...
========================================================= */

router.get("/images/:id", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).send("Database not connected");
    }

    const { id } = req.params;

    /* =====================================================
       VALIDATE IMAGE ID
    ===================================================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid image ID");
    }

    const objectId = new mongoose.Types.ObjectId(id);

    /* =====================================================
       GRIDFS BUCKET
    ===================================================== */

    const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).send("GridFS unavailable");
    }

    /* =====================================================
       FIND FILE
    ===================================================== */

    const file = await db.collection("productImages.files").findOne({
      _id: objectId,
    });

    if (!file) {
      return res.status(404).send("Image not found");
    }

    /* =====================================================
       CONTENT TYPE
    ===================================================== */

    const contentType =
      file.metadata?.contentType || file.contentType || "image/jpeg";

    res.setHeader("Content-Type", contentType);

    res.setHeader("Cache-Control", "public, max-age=31536000");

    /* =====================================================
       STREAM IMAGE
    ===================================================== */

    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on("error", (error) => {
      console.error("❌ GridFS image error:", error);

      if (!res.headersSent) {
        res.status(404).send("Image not found");
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ Image route error:");
    console.error(error);

    if (!res.headersSent) {
      return res.status(500).send("Failed to load image");
    }
  }
});

/* =========================================================
   EXPORT
========================================================= */

export default router;
