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
   GET ALL PRODUCT IMAGES
========================================================= */

const getProductImages = (product) => {
  const images = [];

  /*
    Your MongoDB currently has:

    imageFiles: [
      {
        fileId: ObjectId(...),
        url: "/api/images/..."
      }
    ]

    We use fileId because your real route is:
    /api/catalog/images/:id
  */

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

  /* imageIds fallback */

  if (images.length === 0 && Array.isArray(product.imageIds)) {
    product.imageIds.forEach((id) => {
      if (id) {
        images.push(imageUrl(id));
      }
    });
  }

  /* existing images fallback */

  if (images.length === 0 && Array.isArray(product.images)) {
    product.images.forEach((item) => {
      if (!item) return;

      const value = String(item);

      /*
        Convert old:
        /api/images/ID

        to:
        /api/catalog/images/ID
      */

      if (value.startsWith("/api/images/")) {
        images.push(value.replace("/api/images/", "/api/catalog/images/"));
      } else {
        images.push(value);
      }
    });
  }

  /* single imageId */

  if (images.length === 0 && product.imageId) {
    images.push(imageUrl(product.imageId));
  }

  /* single image */

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

    mainImage: images[0] || product.mainImage || product.image || "",

    images,
  };
};

/* =========================================================
   GET ALL PRODUCTS

   /api/catalog/products

   /api/catalog/products?category=Pants
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
      const cleanCategory = String(
        category
      ).trim();

      /*
        Your MongoDB has:
        category: "Pants"

        But this also allows:
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
        const safeCategory = cleanCategory.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );

        filter.category = {
          $regex: `^${safeCategory}$`,
          $options: "i",
        };
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

   /api/catalog/products/:id
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

    return res.status(200).json({
      success: true,
      product: formatProduct(product),
    });
  } catch (error) {
    console.error("❌ Get catalog product error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to get product",

        error: error.message,
      });
    }
  }
);

/* =========================================================
   GRIDFS IMAGE

   /api/catalog/images/:id
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

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res
          .status(400)
          .send("Invalid image ID");
      }

    const objectId = new mongoose.Types.ObjectId(id);

      const bucket = getGridFSBucket();

    if (!bucket) {
      return res.status(500).send("GridFS unavailable");
    }

      const file = await db
        .collection("productImages.files")
        .findOne({
          _id: objectId,
        });

    if (!file) {
      return res.status(404).send("Image not found");
    }

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
    return res
      .status(500)
      .send("Failed to load image");
  }
}
});

export default router;