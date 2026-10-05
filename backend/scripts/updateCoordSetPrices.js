import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_DB_URI;

const DRY_RUN = false;

const getCoordPrice = (name = "") => {
  const text = String(name).toLowerCase();

  if (
    text.includes("jacket") &&
    text.includes("jeans") &&
    text.includes("short")
  ) {
    return { price: 4799, oldPrice: 5499 };
  }

  if (
    text.includes("denim jacket") &&
    text.includes("jeans")
  ) {
    return { price: 4199, oldPrice: 4799 };
  }

  if (
    text.includes("jacket") &&
    text.includes("jeans")
  ) {
    return { price: 3999, oldPrice: 4599 };
  }

  if (
    text.includes("jacket") &&
    (
      text.includes("trouser") ||
      text.includes("pant") ||
      text.includes("jogger")
    )
  ) {
    return { price: 3699, oldPrice: 4299 };
  }

  if (
    text.includes("denim") &&
    text.includes("co-ord")
  ) {
    return { price: 3899, oldPrice: 4499 };
  }

  if (
    text.includes("hoodie") &&
    (
      text.includes("pant") ||
      text.includes("jogger") ||
      text.includes("trouser") ||
      text.includes("track")
    )
  ) {
    return { price: 3199, oldPrice: 3699 };
  }

  if (
    text.includes("sweatshirt") &&
    (
      text.includes("pant") ||
      text.includes("jogger") ||
      text.includes("trouser") ||
      text.includes("track")
    )
  ) {
    return { price: 2999, oldPrice: 3499 };
  }

  if (
    text.includes("tracksuit") ||
    text.includes("track top")
  ) {
    return { price: 2999, oldPrice: 3499 };
  }

  if (
    text.includes("overshirt") &&
    (
      text.includes("trouser") ||
      text.includes("pant")
    )
  ) {
    return { price: 2499, oldPrice: 2999 };
  }

  if (
    text.includes("shirt") &&
    text.includes("short")
  ) {
    return { price: 1799, oldPrice: 2199 };
  }

  if (
    (
      text.includes("t-shirt") ||
      text.includes("tshirt") ||
      text.includes("tee")
    ) &&
    text.includes("short")
  ) {
    return { price: 1599, oldPrice: 1999 };
  }

  if (
    text.includes("jogger") ||
    text.includes("trouser") ||
    text.includes("pants")
  ) {
    return { price: 2499, oldPrice: 2999 };
  }

  if (text.includes("jacket")) {
    return { price: 3499, oldPrice: 3999 };
  }

  if (text.includes("sweatshirt")) {
    return { price: 2799, oldPrice: 3299 };
  }

  if (text.includes("hoodie")) {
    return { price: 2999, oldPrice: 3499 };
  }

  return { price: 2299, oldPrice: 2799 };
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log(`Dry run: ${DRY_RUN}`);

    const products =
      await Product.find({
        category: "CO ORD SETS",
      });

    console.log(
      `Products found: ${products.length}`,
    );

    let updated = 0;

    for (const product of products) {
      const pricing =
        getCoordPrice(product.name);

      console.log("");
      console.log(
        `🔎 ${product.name}`,
      );

      console.log(
        `   ₹${product.price} → ₹${pricing.price}`,
      );

      console.log(
        `   Old ₹${product.oldPrice} → ₹${pricing.oldPrice}`,
      );

      if (!DRY_RUN) {
        product.price =
          pricing.price;

        product.oldPrice =
          pricing.oldPrice;

        await product.save();
      }

      updated += 1;
    }

    console.log("");
    console.log("==============================");
    console.log(`Products: ${products.length}`);

    console.log(
      `${
        DRY_RUN
          ? "Would update"
          : "Updated"
      }: ${updated}`,
    );

    console.log("==============================");

    if (DRY_RUN) {
      console.log(
        "⚠️ MongoDB NOT changed.",
      );
    } else {
      console.log(
        "✅ Co-ord prices updated.",
      );
    }
  } catch (error) {
    console.error(
      "❌ Error:",
      error,
    );
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();