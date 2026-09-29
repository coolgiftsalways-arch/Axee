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

  /* ================================
     TRACK PANTS / OLD PANTS
  ================================ */

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

  /* ================================
     T-SHIRTS
  ================================ */

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
========================================================= */

const normalizeImagePath = (value) => {
  if (!value) {
    return "";
  }

  /* IMAGE OBJECT */

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

  /* OLD GRIDFS ROUTE */

  if (text.startsWith("/api/images/")) {
    text = text.replace("/api/images/", "/api/catalog/images/");
  }

  if (text.startsWith("api/images/")) {
    text = `/${text.replace("api/images/", "api/catalog/images/")}`;
  }

  /* FULL GRIDFS URL */

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
   REMOVE DUPLICATES
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
   STANDARD images[]
========================================================= */

const getStandardImages = (product) => {
  if (!Array.isArray(product?.images)) {
    return [];
  }

  return uniqueImages(product.images);
};

/* =========================================================
   LEGACY imageFiles
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
   GET GRIDFS ID FROM IMAGE
========================================================= */

const getGridFsIdFromImage = (value) => {
  const normalized = normalizeImagePath(value);

  const match = String(normalized || "").match(
    /\/api\/catalog\/images\/([a-f\d]{24})/i,
  );

  return match?.[1] || "";
};

/* =========================================================
   COLLECT ALL GRIDFS IDS
========================================================= */

const collectGridFsIdsForProduct = (product) => {
  const ids = new Set();

  const addValue = (value) => {
    const id = getGridFsIdFromImage(value);

    if (id) {
      ids.add(id);
    }
  };

  /* images[] */

  if (Array.isArray(product?.images)) {
    product.images.forEach(addValue);
  }

  /* main fields */

  addValue(product?.mainImage);

  addValue(product?.image);

  /* imageFiles */

  if (Array.isArray(product?.imageFiles)) {
    product.imageFiles.forEach((item) => {
      const fileId = item?.fileId || item?._id || item?.id;

      if (fileId && mongoose.Types.ObjectId.isValid(String(fileId))) {
        ids.add(String(fileId));
      } else {
        addValue(item?.url || item?.src || item?.path || "");
      }
    });
  }

  /* imageIds */

  if (Array.isArray(product?.imageIds)) {
    product.imageIds.forEach((id) => {
      if (id && mongoose.Types.ObjectId.isValid(String(id))) {
        ids.add(String(id));
      }
    });
  }

  /* imageId */

  if (
    product?.imageId &&
    mongoose.Types.ObjectId.isValid(String(product.imageId))
  ) {
    ids.add(String(product.imageId));
  }

  return [...ids];
};

/* =========================================================
   CHECK WHICH GRIDFS FILES REALLY EXIST
========================================================= */

const getExistingGridFsIds = async (db, products = []) => {
  const allIds = new Set();

  products.forEach((product) => {
    collectGridFsIdsForProduct(product).forEach((id) => {
      allIds.add(id);
    });
  });

  const objectIds = [...allIds]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    return new Set();
  }

  const files = await db
    .collection("productImages.files")
    .find(
      {
        _id: {
          $in: objectIds,
        },
      },
      {
        projection: {
          _id: 1,
        },
      },
    )
    .toArray();

  return new Set(files.map((file) => String(file._id)));
};

/* =========================================================
   REMOVE MISSING GRIDFS IMAGES
========================================================= */

const removeMissingGridFsImages = (images = [], existingGridFsIds = null) => {
  if (!(existingGridFsIds instanceof Set)) {
    return uniqueImages(images);
  }

  return uniqueImages(images).filter((image) => {
    const id = getGridFsIdFromImage(image);

    /*
       External URL,
       uploads path,
       public frontend path
       = keep it.
      */

    if (!id) {
      return true;
    }

    /*
       GridFS path:
       keep only if file exists.
      */

    return existingGridFsIds.has(id);
  });
};

/* =========================================================
   ⭐ GET BEST PRODUCT IMAGES
========================================================= */

const getProductImages = (product, existingGridFsIds = null) => {
  /* MODERN images[] */

  const standardImages = removeMissingGridFsImages(
    getStandardImages(product),
    existingGridFsIds,
  );

  /* LEGACY imageFiles */

  const legacyImageFiles = removeMissingGridFsImages(
    getLegacyImageFiles(product),
    existingGridFsIds,
  );

  /* LEGACY imageIds */

  const legacyImageIds = removeMissingGridFsImages(
    getLegacyImageIds(product),
    existingGridFsIds,
  );

  /* SINGLE imageId */

  const singleImageId = removeMissingGridFsImages(
    getSingleImageId(product),
    existingGridFsIds,
  );

  /* mainImage / image */

  const singleFields = removeMissingGridFsImages(
    getSingleImageFields(product),
    existingGridFsIds,
  );

  /* =======================================================
     1. VALID MODERN GRIDFS
  ======================================================= */

  if (standardImages.length > 0 && standardImages.some(isGridFsImage)) {
    return standardImages;
  }

  /* =======================================================
     2. VALID mainImage / image GRIDFS
  ======================================================= */

  const reliableSingle = singleFields.filter(isGridFsImage);

  if (reliableSingle.length > 0) {
    return uniqueImages([
      ...reliableSingle,
      ...standardImages,
      ...legacyImageFiles,
      ...legacyImageIds,
      ...singleImageId,
    ]);
  }

  /* =======================================================
     3. LEGACY imageFiles
  ======================================================= */

  if (legacyImageFiles.length > 0) {
    return legacyImageFiles;
  }

  /* =======================================================
     4. imageIds
  ======================================================= */

  if (legacyImageIds.length > 0) {
    return legacyImageIds;
  }

  /* =======================================================
     5. imageId
  ======================================================= */

  if (singleImageId.length > 0) {
    return singleImageId;
  }

  /* =======================================================
     6. EXTERNAL / UPLOAD images[]
  ======================================================= */

  if (standardImages.length > 0 && standardImages.some(isReliableImage)) {
    return standardImages;
  }

  /* =======================================================
     7. PUBLIC images[]
  ======================================================= */

  if (standardImages.length > 0) {
    return standardImages;
  }

  /* =======================================================
     8. SINGLE IMAGE FIELDS
  ======================================================= */

  if (singleFields.length > 0) {
    return singleFields;
  }

  return [];
};

/* =========================================================
   FORMAT PRODUCT
========================================================= */

const formatProduct = (product, existingGridFsIds = null) => {
  if (!product) {
    return null;
  }

  const images = getProductImages(product, existingGridFsIds);

  const fallbackMainFields = removeMissingGridFsImages(
    [product?.mainImage, product?.image],
    existingGridFsIds,
  );

  const mainImage = images[0] || fallbackMainFields[0] || "";

  return {
    ...product,

    _id: String(product._id),

    id: String(product._id),

    image: mainImage,

    mainImage: mainImage,

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

    /* CATEGORY */

    if (category) {
      const categoryFilter = buildCategoryFilter(category);

      if (categoryFilter) {
        filter.category = categoryFilter;
      }
    }

    /* SEARCH */

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

    /* QUERY */

    let query = db.collection("products").find(filter).sort({
      createdAt: -1,
      _id: -1,
    });

    const numericLimit = Number(limit);

    if (Number.isFinite(numericLimit) && numericLimit > 0) {
      query = query.limit(numericLimit);
    }

    const products = await query.toArray();

    /* ================================
         CHECK ACTUAL GRIDFS FILES
      ================================ */

    const existingGridFsIds = await getExistingGridFsIds(db, products);

    /* ================================
         FORMAT
      ================================ */

    const formattedProducts = products.map((product) =>
      formatProduct(product, existingGridFsIds),
    );

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    /* CURRENT PRODUCT */

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

    /* FILTER */

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

    /* QUERY */

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

    /* CHECK IMAGES */

    const existingGridFsIds = await getExistingGridFsIds(db, relatedProducts);

    return res.status(200).json({
      success: true,

      count: relatedProducts.length,

      products: relatedProducts.map((product) =>
        formatProduct(product, existingGridFsIds),
      ),
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

    /* CHECK GRIDFS */

    const existingGridFsIds = await getExistingGridFsIds(db, [product]);

    return res.status(200).json({
      success: true,

      product: formatProduct(product, existingGridFsIds),
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

    /* VALIDATE ID */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid image ID");
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).send("GridFS unavailable");
    }

    /* CHECK FILE EXISTS */

    const file = await db.collection("productImages.files").findOne({
      _id: objectId,
    });

    if (!file) {
      return res.status(404).send("Image not found");
    }

    /* CONTENT TYPE */

    const contentType =
      file?.metadata?.contentType || file?.contentType || "image/jpeg";

    res.setHeader("Content-Type", contentType);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    /* STREAM */

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
