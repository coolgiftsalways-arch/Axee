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
   GRIDFS IMAGE URL
========================================================= */

const imageUrl = (id) => {
  if (!id) {
    return "";
  }

  return `/api/catalog/images/${String(id)}`;
};

/* =========================================================
   CATEGORY FILTER
========================================================= */

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildCategoryFilter = (category) => {
  if (!category) {
    return null;
  }

  const cleanCategory = String(category).trim();
  const lowerCategory = cleanCategory.toLowerCase();

  /* =======================================================
     TRACK PANTS / OLD PANTS SUPPORT
  ======================================================= */

  if (
    lowerCategory === "pants" ||
    lowerCategory === "track pants" ||
    lowerCategory === "track pant" ||
    lowerCategory === "trackpants"
  ) {
    return {
      $regex: "^(pants|pant|track pants|track pant|trackpants)$",
      $options: "i",
    };
  }

  /* =======================================================
     T-SHIRTS SUPPORT
  ======================================================= */

  if (
    lowerCategory === "t-shirts" ||
    lowerCategory === "t-shirt" ||
    lowerCategory === "tshirts" ||
    lowerCategory === "tshirt"
  ) {
    return {
      $regex: "^(t-shirts|t-shirt|tshirts|tshirt)$",
      $options: "i",
    };
  }

  const safeCategory = escapeRegex(cleanCategory);

  return {
    $regex: `^${safeCategory}$`,
    $options: "i",
  };
};

/* =========================================================
   NORMALIZE IMAGE PATH

   OLD:
   /api/images/ID

   NEW:
   /api/catalog/images/ID

   FULL URL:
   http://localhost:5000/api/catalog/images/ID

   STORED / RETURNED:
   /api/catalog/images/ID
========================================================= */

const normalizeImagePath = (value) => {
  if (!value) {
    return "";
  }

  /* =======================================================
     IMAGE OBJECT
  ======================================================= */

  if (typeof value === "object") {
    const fileId = value?.fileId || value?._id || value?.id;

    if (fileId) {
      return imageUrl(fileId);
    }

    value = value?.url || value?.src || value?.path || "";
  }

  let text = String(value).trim().replace(/\\/g, "/");

  if (!text) {
    return "";
  }

  /* =======================================================
     OLD GRIDFS ROUTE
  ======================================================= */

  if (text.startsWith("/api/images/")) {
    text = text.replace("/api/images/", "/api/catalog/images/");
  }

  if (text.startsWith("api/images/")) {
    text = `/${text.replace("api/images/", "api/catalog/images/")}`;
  }

  /* =======================================================
     FULL GRIDFS URL

     Example:

     http://localhost:5000/api/catalog/images/abc123

     becomes:

     /api/catalog/images/abc123
  ======================================================= */

  const gridMatch = text.match(/\/api\/catalog\/images\/([a-f\d]{24})/i);

  if (gridMatch?.[1]) {
    return imageUrl(gridMatch[1]);
  }

  return text;
};

/* =========================================================
   IS GRIDFS IMAGE
========================================================= */

const isGridFsImage = (value) => {
  return /\/api\/catalog\/images\/[a-f\d]{24}/i.test(String(value || ""));
};

/* =========================================================
   IS RELIABLE IMAGE

   These image types are usually safe to use immediately.
========================================================= */

const isReliableImage = (value) => {
  const text = String(value || "").trim();

  if (!text) {
    return false;
  }

  return (
    isGridFsImage(text) ||
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:") ||
    text.startsWith("blob:") ||
    text.startsWith("/uploads/") ||
    text.startsWith("uploads/")
  );
};

/* =========================================================
   REMOVE DUPLICATE IMAGES
========================================================= */

const uniqueImages = (images = []) => {
  const seen = new Set();

  return images
    .map(normalizeImagePath)
    .filter(Boolean)
    .filter((image) => {
      const key = image.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
};

/* =========================================================
   STANDARD images ARRAY

   This is the NEW system.

   images[0] = MAIN
========================================================= */

const getStandardImages = (product) => {
  if (!Array.isArray(product?.images)) {
    return [];
  }

  return uniqueImages(product.images);
};

/* =========================================================
   LEGACY imageFiles

   This is important for your OLD MongoDB products.

   imageFiles: [
     {
       fileId: ObjectId(...),
       order: 0
     }
   ]
========================================================= */

const getLegacyImageFiles = (product) => {
  if (!Array.isArray(product?.imageFiles) || product.imageFiles.length === 0) {
    return [];
  }

  const sorted = [...product.imageFiles].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
  );

  const images = [];

  sorted.forEach((item) => {
    const fileId = item?.fileId || item?._id || item?.id;

    if (fileId) {
      images.push(imageUrl(fileId));
      return;
    }

    const itemUrl = normalizeImagePath(
      item?.url || item?.src || item?.path || "",
    );

    if (itemUrl) {
      images.push(itemUrl);
    }
  });

  return uniqueImages(images);
};

/* =========================================================
   LEGACY imageIds
========================================================= */

const getLegacyImageIds = (product) => {
  if (!Array.isArray(product?.imageIds) || product.imageIds.length === 0) {
    return [];
  }

  return uniqueImages(
    product.imageIds.filter(Boolean).map((id) => imageUrl(id)),
  );
};

/* =========================================================
   SINGLE LEGACY imageId
========================================================= */

const getSingleImageId = (product) => {
  if (!product?.imageId) {
    return [];
  }

  return [imageUrl(product.imageId)];
};

/* =========================================================
   MAIN / IMAGE FIELDS
========================================================= */

const getSingleImageFields = (product) => {
  return uniqueImages([product?.mainImage, product?.image]);
};

/* =========================================================
   ⭐ GET BEST PRODUCT IMAGES

   IMPORTANT LOGIC:

   NEW ADMIN PRODUCT:
   images[0] is GridFS
   => use images[].

   OLD PRODUCT:
   images[] may contain old/broken path,
   but imageFiles contains real GridFS files
   => use imageFiles.

   AFTER YOU EDIT AN OLD PRODUCT:
   Admin saves its selected images into images[] as GridFS URLs
   => images[] becomes the new source automatically.
========================================================= */

const getProductImages = (product) => {
  const standardImages = getStandardImages(product);

  const legacyImageFiles = getLegacyImageFiles(product);

  const legacyImageIds = getLegacyImageIds(product);

  const singleImageId = getSingleImageId(product);

  const singleFields = getSingleImageFields(product);

  /* =======================================================
     1. NEW ADMIN / GRIDFS images ARRAY

     If images[] already contains real GridFS images,
     its exact order must win.

     This makes "MAKE MAIN" work.
  ======================================================= */

  if (standardImages.length > 0 && standardImages.some(isGridFsImage)) {
    return standardImages;
  }

  /* =======================================================
     2. mainImage / image IS GRIDFS

     Useful if a product was partly migrated.
  ======================================================= */

  const reliableSingle = singleFields.filter(isGridFsImage);

  if (reliableSingle.length > 0) {
    return uniqueImages([
      ...reliableSingle,
      ...standardImages,
      ...legacyImageFiles,
      ...legacyImageIds,
    ]);
  }

  /* =======================================================
     3. OLD PRODUCT imageFiles

     This fixes the many broken product images you're seeing.
  ======================================================= */

  if (legacyImageFiles.length > 0) {
    return legacyImageFiles;
  }

  /* =======================================================
     4. OLD imageIds
  ======================================================= */

  if (legacyImageIds.length > 0) {
    return legacyImageIds;
  }

  /* =======================================================
     5. SINGLE imageId
  ======================================================= */

  if (singleImageId.length > 0) {
    return singleImageId;
  }

  /* =======================================================
     6. MODERN EXTERNAL / UPLOAD images
  ======================================================= */

  if (standardImages.length > 0 && standardImages.some(isReliableImage)) {
    return standardImages;
  }

  /* =======================================================
     7. ANY images ARRAY

     Example:
     /products/tshirt-1.jpg
  ======================================================= */

  if (standardImages.length > 0) {
    return standardImages;
  }

  /* =======================================================
     8. SINGLE image / mainImage
  ======================================================= */

  if (singleFields.length > 0) {
    return singleFields;
  }

  return [];
};

/* =========================================================
   FORMAT PRODUCT

   Whatever getProductImages returns at [0]
   becomes main everywhere.
========================================================= */

const formatProduct = (product) => {
  if (!product) {
    return null;
  }

  const images = getProductImages(product);

  const mainImage =
    images[0] ||
    normalizeImagePath(product?.mainImage) ||
    normalizeImagePath(product?.image) ||
    "";

  return {
    ...product,

    _id: String(product._id),

    id: String(product._id),

    image: mainImage,

    mainImage,

    images,
  };
};

/* =========================================================
   GET ALL PRODUCTS

   GET /api/catalog/products
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

    const { category, search, limit } = req.query;

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

    /* =====================================================
       SEARCH
    ===================================================== */

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          sku: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          category: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    /* =====================================================
       QUERY
    ===================================================== */

    let query = db.collection("products").find(filter).sort({
      createdAt: -1,
      _id: -1,
    });

    const numericLimit = Number(limit);

    if (Number.isFinite(numericLimit) && numericLimit > 0) {
      query = query.limit(numericLimit);
    }

    const products = await query.toArray();

    const formattedProducts = products.map(formatProduct);

    return res.status(200).json({
      success: true,

      count: formattedProducts.length,

      products: formattedProducts,
    });
  } catch (error) {
    console.error("❌ GET CATALOG PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get products",

      error: error.message,
    });
  }
});

/* =========================================================
   RELATED PRODUCTS

   IMPORTANT:
   Keep this route before /products/:id.
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    /* ===================================================
         CURRENT PRODUCT
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
         RELATED FILTER
      =================================================== */

    const filter = {
      _id: {
        $ne: objectId,
      },

      isActive: {
        $ne: false,
      },
    };

    const categoryFilter = buildCategoryFilter(currentProduct.category);

    if (categoryFilter) {
      filter.category = categoryFilter;
    }

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
    console.error("❌ RELATED PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get related products",

      error: error.message,
    });
  }
});

/* =========================================================
   GET ONE PRODUCT

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

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
    console.error("❌ GET SINGLE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get product",

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
         CHECK IMAGE EXISTS
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
      file?.metadata?.contentType || file?.contentType || "image/jpeg";

    res.setHeader("Content-Type", contentType);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    /* ===================================================
         STREAM
      =================================================== */

    const stream = bucket.openDownloadStream(objectId);

    stream.on("error", (error) => {
      console.error("❌ GRIDFS STREAM ERROR:", error);

      if (!res.headersSent) {
        res.status(404).send("Image not found");
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("❌ GRIDFS IMAGE ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).send("Failed to load image");
    }
  }
});

export default router;
