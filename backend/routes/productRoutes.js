import express from "express";

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
   GET ALL PRODUCTS

   /api/products
   /api/products?includeInactive=true
========================================================= */

router.get("/", getProducts);

/* =========================================================
   BEST SELLERS
========================================================= */

router.get("/best-sellers", getBestSellers);

/* =========================================================
   PRODUCT BY SLUG
========================================================= */

router.get("/slug/:slug", getProductBySlug);

/* =========================================================
   RELATED PRODUCTS
========================================================= */

router.get("/:id/related", getRelatedProducts);

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

router.get("/:id", getProductById);

/* =========================================================
   CREATE PRODUCT
========================================================= */

router.post("/", createProduct);

/* =========================================================
   UPDATE PRODUCT
========================================================= */

router.put("/:id", updateProduct);

/* =========================================================
   DELETE PRODUCT
========================================================= */

router.delete("/:id", deleteProduct);

export default router;
