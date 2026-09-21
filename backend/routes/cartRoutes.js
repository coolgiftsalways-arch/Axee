import express from "express";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", addToCart);

router.get("/:userId", getCart);

router.put("/:userId/item/:itemId", updateCartItem);

router.delete("/:userId/item/:itemId", removeCartItem);

router.delete("/:userId", clearCart);

export default router;