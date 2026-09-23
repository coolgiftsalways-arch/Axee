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
   ESCAPE REGEX
========================================================= */

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================================================
   NORMALIZE IMAGE URL

   Supports:

   /api/images/abc
   /api/catalog/images/abc
   ObjectId
   full http URL
========================================================= */

const normalizeImageUrl = (value) => {
  if (!value) {
    return "";
  }

  const image = String(value);

  // Full external URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // Already correct
  if (image.startsWith("/api/catalog/images/")) {
    return image;
  }

  // Old importer format
  if (image.startsWith("/api/images/")) {
    const id = image.replace("/api/images/", "");

    return `/api/catalog/images/${id}`;
  }

  // If only Mongo ObjectId was supplied
  if (mongoose.Types.ObjectId.isValid(image)) {
    return `/api/catalog/images/${image}`;
  }

  return image;
};

/* =========================================================
   FORMAT PRODUCT

   IMPORTANT:
   Your ZIP importer stores:

   imageFiles: [
     {
       fileId,
       filename,
       url,
       order
     }
   ]

   So imageFiles is our FIRST preference.
========================================================= */

const formatProduct = (product) => {
  if (!product) {
    return null;
  }

  let images = [];

  /* =======================================================
     1. IMAGE FILES FROM GRIDFS IMPORTER
  ======================================================= */

  if (
    Array.isArray(product.imageFiles) &&
    product.imageFiles.length > 0
  ) {
    const sortedFiles = [...product.imageFiles].sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

    images = sortedFiles
      .map((file) => {
        const fileId =
          file?.fileId ||
          file?._id ||
          file?.id;

        if (fileId) {
          return `/api/catalog/images/${String(fileId)}`;
        }

        if (file?.url) {
          return normalizeImageUrl(file.url);
        }

        return "";
      })
      .filter(Boolean);
  }

  /* =======================================================
     2. IMAGE IDS
  ======================================================= */

  if (
    images.length === 0 &&
    Array.isArray(product.imageIds) &&
    product.imageIds.length > 0
  ) {
    images = product.imageIds
      .map((imageId) =>
        normalizeImageUrl(imageId)
      )
      .filter(Boolean);
  }

  /* =======================================================
     3. EXISTING IMAGES ARRAY
  ======================================================= */

  if (
    images.length === 0 &&
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    images = product.images
      .map(normalizeImageUrl)
      .filter(Boolean);
  }

  /* =======================================================
     4. SINGLE imageId
  ======================================================= */

  if (
    images.length === 0 &&
    product.imageId
  ) {
    images = [
      normalizeImageUrl(product.imageId),
    ];
  }

  /* =======================================================
     5. SINGLE IMAGE
  ======================================================= */

  if (
    images.length === 0 &&
    product.image
  ) {
    images = [
      normalizeImageUrl(product.image),
    ];
  }

  /* =======================================================
     6. MAIN IMAGE FALLBACK
  ======================================================= */

  if (
    images.length === 0 &&
    product.mainImage
  ) {
    images = [
      normalizeImageUrl(product.mainImage),
    ];
  }

  /* =======================================================
     FORMAT imageFiles TOO
  ======================================================= */

  const formattedImageFiles = Array.isArray(
    product.imageFiles
  )
    ? product.imageFiles.map((file) => ({
        ...file,

        fileId: file?.fileId
          ? String(file.fileId)
          : file?._id
            ? String(file._id)
            : file?.id
              ? String(file.id)
              : null,

        url:
          file?.fileId ||
          file?._id ||
          file?.id
            ? `/api/catalog/images/${String(
                file.fileId ||
                  file._id ||
                  file.id
              )}`
            : normalizeImageUrl(file?.url),
      }))
    : [];

  return {
    ...product,

    _id: String(product._id),

    id: String(product._id),

    image: images[0] || "",

    mainImage: images[0] || "",

    images,

    imageFiles: formattedImageFiles,

    price: Number(product.price || 0),

    originalPrice: Number(
      product.originalPrice || 0
    ),

    stock: Number(product.stock || 0),
  };
};

/* =========================================================
   GET PRODUCTS

   Examples:

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

    const filter = {};

    /* =====================================================
       CATEGORY
    ===================================================== */

    if (category) {
      const cleanCategory = String(
        category
      ).trim();

      /*
        Because your imported Track Pants
        were originally saved as:

        category: "Pants"

        This lets BOTH work:

        Pants
        Track Pants
        TRACK PANTS
      */

      if (
        cleanCategory.toLowerCase() ===
          "pants" ||
        cleanCategory.toLowerCase() ===
          "track pants"
      ) {
        filter.category = {
          $regex: "^(pants|track pants)$",
          $options: "i",
        };
      } else {
        filter.category = {
          $regex: `^${escapeRegex(
            cleanCategory
          )}$`,
          $options: "i",
        };
      }
    }

    /* =====================================================
       GET PRODUCTS
    ===================================================== */

    const products = await db
      .collection("products")
      .find(filter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .toArray();

    const formattedProducts =
      products.map(formatProduct);

    return res.status(200).json({
      success: true,

      count: formattedProducts.length,

      products: formattedProducts,
    });
  } catch (error) {
    console.error(
      "❌ Get products error:",
      error
    );

    return res.status(500).json({
      success: false,

      message: "Failed to get products",

      error: error.message,
    });
  }
});

/* =========================================================
   RELATED PRODUCTS

   GET
   /api/catalog/products/:id/related
========================================================= */

router.get(
  "/products/:id/related",
  async (req, res) => {
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

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const objectId =
        new mongoose.Types.ObjectId(id);

      /* ===================================================
         FIND CURRENT PRODUCT
      =================================================== */

      const product = await db
        .collection("products")
        .findOne({
          _id: objectId,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      /* ===================================================
         FIND SAME CATEGORY
      =================================================== */

      let categoryFilter;

      const category = String(
        product.category || ""
      ).trim();

      if (
        category.toLowerCase() === "pants" ||
        category.toLowerCase() ===
          "track pants"
      ) {
        categoryFilter = {
          $regex: "^(pants|track pants)$",
          $options: "i",
        };
      } else {
        categoryFilter = {
          $regex: `^${escapeRegex(category)}$`,
          $options: "i",
        };
      }

      const relatedProducts = await db
        .collection("products")
        .find({
          _id: {
            $ne: objectId,
          },

          category: categoryFilter,

          isActive: {
            $ne: false,
          },
        })
        .sort({
          createdAt: -1,
        })
        .limit(4)
        .toArray();

      return res.status(200).json({
        success: true,

        count: relatedProducts.length,

        products:
          relatedProducts.map(formatProduct),
      });
    } catch (error) {
      console.error(
        "❌ Related products error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to get related products",

        error: error.message,
      });
    }
  }
);

/* =========================================================
   GET SINGLE PRODUCT

   GET /api/catalog/products/:id
========================================================= */

router.get(
  "/products/:id",
  async (req, res) => {
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

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      /* ===================================================
         FIND PRODUCT
      =================================================== */

      const product = await db
        .collection("products")
        .findOne({
          _id: new mongoose.Types.ObjectId(
            id
          ),
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const formatted =
        formatProduct(product);

      return res.status(200).json({
        success: true,

        product: formatted,
      });
    } catch (error) {
      console.error(
        "❌ Get product error:",
        error
      );

      return res.status(500).json({
        success: false,

        message: "Failed to get product",

        error: error.message,
      });
    }
  }
);

/* =========================================================
   GET GRIDFS IMAGE

   GET /api/catalog/images/:id
========================================================= */

router.get(
  "/images/:id",
  async (req, res) => {
    try {
      const db = getDatabase();

      if (!db) {
        return res
          .status(500)
          .send("Database not connected");
      }

      const { id } = req.params;

      /* ===================================================
         VALIDATE IMAGE ID
      =================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res
          .status(400)
          .send("Invalid image ID");
      }

      const objectId =
        new mongoose.Types.ObjectId(id);

      /* ===================================================
         GRIDFS
      =================================================== */

      const bucket = getGridFSBucket();

      if (!bucket) {
        return res
          .status(500)
          .send("GridFS unavailable");
      }

      /* ===================================================
         FIND FILE
      =================================================== */

      const file = await db
        .collection("productImages.files")
        .findOne({
          _id: objectId,
        });

      if (!file) {
        return res
          .status(404)
          .send("Image not found");
      }

      /* ===================================================
         CONTENT TYPE
      =================================================== */

      const contentType =
        file.metadata?.contentType ||
        file.contentType ||
        "image/jpeg";

      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );

      /* ===================================================
         STREAM IMAGE
      =================================================== */

      const downloadStream =
        bucket.openDownloadStream(objectId);

      downloadStream.on(
        "error",
        (error) => {
          console.error(
            "❌ GridFS image error:",
            error
          );

          if (!res.headersSent) {
            res
              .status(404)
              .send("Image not found");
          } else {
            res.end();
          }
        }
      );

      downloadStream.pipe(res);
    } catch (error) {
      console.error(
        "❌ Image route error:",
        error
      );

      if (!res.headersSent) {
        return res
          .status(500)
          .send("Failed to load image");
      }
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

export default router;