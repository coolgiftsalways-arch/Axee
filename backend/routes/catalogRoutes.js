import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

const router = express.Router();

// ===============================================
// GET PRODUCTS
// Example:
// /api/catalog/products
// /api/catalog/products?category=Pants
// ===============================================

router.get("/products", async (req, res) => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const { category } = req.query;

    const filter = {};

    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    const products = await db
      .collection("products")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
});

// ===============================================
// GET GRIDFS IMAGE
// Example:
// /api/catalog/images/68d...
// ===============================================

router.get("/images/:id", async (req, res) => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).send("Database not connected");
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid image ID");
    }

    const objectId = new ObjectId(id);

    const bucket = new GridFSBucket(db, {
      bucketName: "productImages",
    });

    const file = await db
      .collection("productImages.files")
      .findOne({
        _id: objectId,
      });

    if (!file) {
      return res.status(404).send("Image not found");
    }

    const contentType =
      file.metadata?.contentType || "image/jpeg";

    res.set("Content-Type", contentType);

    res.set("Cache-Control", "public, max-age=31536000");

    const downloadStream =
      bucket.openDownloadStream(objectId);

    downloadStream.on("error", (error) => {
      console.error("GridFS image error:", error);

      if (!res.headersSent) {
        res.status(404).send("Image not found");
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Image route error:", error);

    if (!res.headersSent) {
      res.status(500).send("Failed to load image");
    }
  }
});

export default router;