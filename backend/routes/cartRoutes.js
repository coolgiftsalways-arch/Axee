import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

/* =========================================================
   ADD TO CART

   POST /api/cart/add
========================================================= */

router.post("/add", addToCart);

/* =========================================================
   GET CART

   GET /api/cart/:cartId
========================================================= */

router.get("/:cartId", getCart);

/* =========================================================
   UPDATE CART ITEM

   PATCH /api/cart/:cartId/item/:itemId
========================================================= */

router.patch("/:cartId/item/:itemId", updateCartItem);

/* =========================================================
   REMOVE CART ITEM

   DELETE /api/cart/:cartId/item/:itemId
========================================================= */

router.delete("/:cartId/item/:itemId", removeCartItem);

/* =========================================================
   CLEAR CART

   DELETE /api/cart/:cartId/clear
========================================================= */

router.delete("/:cartId/clear", clearCart);

/* =========================================================
   EXPORT
========================================================= */

export default router;
