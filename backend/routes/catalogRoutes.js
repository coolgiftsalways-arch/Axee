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
   GRIDFS
========================================================= */

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
   IMAGE URL
========================================================= */

const imageUrl = (id) => {
  if (!id) return "";

  return `/api/catalog/images/${String(id)}`;
};

/* =========================================================
   CATEGORY FILTER

   Supports:
   Pants
   TRACK PANTS
========================================================= */

const buildCategoryFilter = (category) => {
  if (!category) {
    return null;
  }

  const cleanCategory = String(category).trim();

  const lowerCategory = cleanCategory.toLowerCase();

  if (lowerCategory === "pants" || lowerCategory === "track pants") {
    return {
      $regex: "^(pants|track pants)$",
      $options: "i",
    };
  }

  const safeCategory = cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return {
    $regex: `^${safeCategory}$`,
    $options: "i",
  };
};

/* =========================================================
   GET ALL PRODUCT IMAGES
========================================================= */

const getProductImages = (product) => {
  const images = [];

  /* =======================================================
     imageFiles

     Example:

     imageFiles: [
       {
         fileId: ObjectId(...),
         url: "/api/images/..."
       }
     ]
  ======================================================= */

  if (Array.isArray(product?.imageFiles)) {
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

  /* =======================================================
     imageIds FALLBACK
  ======================================================= */

  if (images.length === 0 && Array.isArray(product?.imageIds)) {
    product.imageIds.forEach((id) => {
      if (id) {
        images.push(imageUrl(id));
      }
    });
  }

  /* =======================================================
     EXISTING images ARRAY FALLBACK
  ======================================================= */

  if (images.length === 0 && Array.isArray(product?.images)) {
    product.images.forEach((item) => {
      if (!item) return;

      const value = String(item);

      /*
        OLD:
        /api/images/ID

        NEW:
        /api/catalog/images/ID
      */

      if (value.startsWith("/api/images/")) {
        images.push(value.replace("/api/images/", "/api/catalog/images/"));
      } else {
        images.push(value);
      }
    });
  }

  /* =======================================================
     SINGLE imageId
  ======================================================= */

  if (images.length === 0 && product?.imageId) {
    images.push(imageUrl(product.imageId));
  }

  /* =======================================================
     SINGLE image
  ======================================================= */

  if (images.length === 0 && product?.image) {
    const value = String(product.image);

    if (value.startsWith("/api/images/")) {
      images.push(value.replace("/api/images/", "/api/catalog/images/"));
    } else {
      images.push(value);
    }
  }

  /* =======================================================
     REMOVE DUPLICATES
  ======================================================= */

  return [...new Set(images.filter(Boolean))];
};

/* =========================================================
   FORMAT PRODUCT
========================================================= */

const formatProduct = (product) => {
  if (!product) {
    return null;
  }

  const images = getProductImages(product);

  return {
    ...product,

    _id: String(product._id),

    id: String(product._id),

    image: images[0] || product.image || "",

    mainImage: images[0] || product.mainImage || product.image || "",

    images,
  };
};

/* =========================================================
   GET ALL PRODUCTS

   GET /api/catalog/products

   GET /api/catalog/products?category=Pants

   GET /api/catalog/products?category=TRACK%20PANTS
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

    const filter = {
      isActive: {
        $ne: false,
      },
    };

    /* =====================================================
       CATEGORY
    ===================================================== */

    if (category) {
      const categoryFilter = buildCategoryFilter(category);

      if (categoryFilter) {
        filter.category = categoryFilter;
      }
    }

    const products = await db
      .collection("products")
      .find(filter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .toArray();

    const formattedProducts = products.map(formatProduct);

    return res.status(200).json({
      success: true,

      count: formattedProducts.length,

      products: formattedProducts,
    });
  } catch (error) {
    console.error("❌ Get catalog products error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get products",

      error: error.message,
    });
  }
});

/* =========================================================
   GET ONE PRODUCT

   THIS WAS MISSING IN YOUR OLD FILE

   GET /api/catalog/products/:id
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

    /* ===================================================
         VALIDATE ID
      =================================================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    /* ===================================================
         FIND PRODUCT
      =================================================== */

    const product = await db.collection("products").findOne({
      _id: objectId,

      isActive: {
        $ne: false,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,

      product: formatProduct(product),
    });
  } catch (error) {
    console.error("❌ Get single product error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get product",

      error: error.message,
    });
  }
});

/* =========================================================
   GET RELATED PRODUCTS

   GET /api/catalog/products/:id/related
========================================================= */

router.get("/products/:id/related", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const { id } = req.params;

    /* ===================================================
         VALIDATE ID
      =================================================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    /* ===================================================
         GET CURRENT PRODUCT
      =================================================== */

    const currentProduct = await db.collection("products").findOne({
      _id: objectId,

      isActive: {
        $ne: false,
      },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* ===================================================
         CATEGORY MATCH
      =================================================== */

    const categoryFilter = buildCategoryFilter(currentProduct.category);

    const filter = {
      _id: {
        $ne: objectId,
      },

      isActive: {
        $ne: false,
      },
    };

    if (categoryFilter) {
      filter.category = categoryFilter;
    }

    /* ===================================================
         FIND RELATED
      =================================================== */

    const relatedProducts = await db
      .collection("products")
      .find(filter)
      .sort({
        featured: -1,
        soldCount: -1,
        createdAt: -1,
      })
      .limit(4)
      .toArray();

    return res.status(200).json({
      success: true,

      count: relatedProducts.length,

      products: relatedProducts.map(formatProduct),
    });
  } catch (error) {
    console.error("❌ Get related products error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get related products",

      error: error.message,
    });
  }
});

/* =========================================================
   GRIDFS IMAGE

   GET /api/catalog/images/:id
========================================================= */

router.get("/images/:id", async (req, res) => {
  try {
    const db = getDatabase();

    if (!db) {
      return res.status(500).send("Database not connected");
    }

    const { id } = req.params;

    /* ===================================================
         VALIDATE IMAGE ID
      =================================================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid image ID");
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).send("GridFS unavailable");
    }

    /* ===================================================
         CHECK FILE EXISTS
      =================================================== */

    const file = await db.collection("productImages.files").findOne({
      _id: objectId,
    });

    if (!file) {
      return res.status(404).send("Image not found");
    }

    /* ===================================================
         CONTENT TYPE
      =================================================== */

    const contentType =
      file.metadata?.contentType || file.contentType || "image/jpeg";

    res.setHeader("Content-Type", contentType);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    /* ===================================================
         STREAM IMAGE
      =================================================== */

    const stream = bucket.openDownloadStream(objectId);

    stream.on("error", (error) => {
      console.error("❌ GridFS stream error:", error);

      if (!res.headersSent) {
        res.status(404).send("Image not found");
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("❌ GridFS image error:", error);

    if (!res.headersSent) {
      return res.status(500).send("Failed to load image");
    }
  }
});

export default router;
