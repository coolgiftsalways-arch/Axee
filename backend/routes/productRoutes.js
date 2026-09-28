import express from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";

import {
  getProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  getBestSellers,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

/* =========================================================
   MULTER

   Images first go into temp folder.
   productController then uploads them to MongoDB GridFS.
========================================================= */

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, os.tmpdir());
  },

  filename(req, file, callback) {
    const extension = path.extname(file.originalname || "");

    const baseName = path
      .basename(file.originalname || "image", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    callback(null, `${baseName}-${unique}${extension}`);
  },
});

/* =========================================================
   UPLOAD
========================================================= */

const upload = multer({
  storage,

  limits: {
    /*
      Maximum one image:
      25 MB
    */

    fileSize: 25 * 1024 * 1024,

    /*
      Maximum product images:
      12
    */

    files: 12,
  },

  fileFilter(req, file, callback) {
    const mimeType = String(file.mimetype || "");

    if (!mimeType.startsWith("image/")) {
      return callback(new Error("Only image files are allowed."));
    }

    callback(null, true);
  },
});

/* =========================================================
   GET ROUTES

   IMPORTANT:
   Specific routes MUST come before /:id
========================================================= */

router.get("/", getProducts);

router.get("/best-sellers", getBestSellers);

router.get("/slug/:slug", getProductBySlug);

router.get("/:id/related", getRelatedProducts);

router.get("/:id", getProductById);

/* =========================================================
   ADD PRODUCT
========================================================= */

router.post(
  "/",

  upload.array("images", 12),

  createProduct,
);

/* =========================================================
   EDIT PRODUCT
========================================================= */

router.put(
  "/:id",

  upload.array("images", 12),

  updateProduct,
);

/* =========================================================
   DELETE PRODUCT
========================================================= */

router.delete("/:id", deleteProduct);

export default router;
