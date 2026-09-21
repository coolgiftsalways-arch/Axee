import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/:cartId", getCart);

router.post("/add", addToCart);

router.patch(
  "/:cartId/item/:itemId",
  updateCartItem
);

router.delete(
  "/:cartId/item/:itemId",
  removeCartItem
);

router.delete(
  "/:cartId/clear",
  clearCart
);

export default router;