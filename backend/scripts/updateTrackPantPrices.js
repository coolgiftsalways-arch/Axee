import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

import Product from "../models/Product.js";

/* =========================================================
   ENV
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

/* =========================================================
   WHICH PRICE GROUP TO RUN

   Change only this:

   "JEANS"
   "TRACKPANTS"
   "ALL"
========================================================= */

const UPDATE_MODE = "JEANS";

/* =========================================================
   TRACK PANTS PRICE OVERRIDES
========================================================= */

const TRACKPANT_PRICE_OVERRIDES = {
  "C-Logo Straight Sweatpants Black": 1499,
  "C-Logo Straight Sweatpants Grey": 1499,

  "Fond Trek Pants Black": 1399,
  "Fond Trek Pants Brown": 1399,
  "Fond Trek Pants Grey": 1399,

  "Side Stripe Work Pants Charcoal": 1599,

  "Baggy Cargo Pant": 1699,
  "Baggy Camo Pant": 1699,

  "Archive Pant": 1499,
  "Corduroy Carpenter Pant": 1799,
  "Courtyard Pant": 1499,
  "Everyday Blue": 1499,
  "Industry Double Knee Pant": 1899,
  "Pinstripe Pant": 1599,
  "Sandbox": 1499,
};

/* =========================================================
   JEANS PRICE OVERRIDES
========================================================= */

const JEANS_PRICE_OVERRIDES = {
  "Baggy Denim Pant": 1699,

  "Comfy Denim Carpenter Pants Black": 1499,
  "Comfy Denim Carpenter Pants Light Indigo": 1799,
  "Comfy Denim Carpenter Pants Multi": 1599,

  "Flower Rivet Denim Pants Brown": 1499,

  "Reclaimed Denim Pant": 1699,
  "Released Hem Baggy Denim Pant": 1799,
  "Tapered Knee Denim Pant": 1699,

  "Washed Stacked Flare Strap Detail Cargo Jeans": 1499,
  "Zebra Applique Baggy Fit Jeans": 1899,

  "Adjustable Waist Contrast Stitch Barrel Leg Jeans": 1799,

  "Baggy Rigid Patchwork Waistband Detail Jeans In Black": 1499,

  "Baggy Rigid Patchwork Waistband Detail Jeans In Black [black]":
    1899,

  "Baggy Rigid Washed Grey Cross Applique Jeans": 1499,

  "Chain Printed Trompe L'oeil Baggy Jeans": 1499,

  "Comfy Denim": 1499,

  "Cow Applique Relaxed Fit Jeans": 1999,
  "Leopard Cross Applique Baggy Jeans": 1899,
  "Patchwork Baggy Fit Jeans": 1899,

  "Raw Edge Applique Tinted Super Baggy Jeans": 1499,

  "Star Patchwork Relaxed Fit Jeans": 1899,
};

/* =========================================================
   GET ACTIVE PRICE LIST
========================================================= */

const getPriceOverrides = () => {
  const mode = String(UPDATE_MODE)
    .trim()
    .toUpperCase();

  if (mode === "TRACKPANTS") {
    return TRACKPANT_PRICE_OVERRIDES;
  }

  if (mode === "JEANS") {
    return JEANS_PRICE_OVERRIDES;
  }

  if (mode === "ALL") {
    return {
      ...TRACKPANT_PRICE_OVERRIDES,
      ...JEANS_PRICE_OVERRIDES,
    };
  }

  throw new Error(
    `Invalid UPDATE_MODE: ${UPDATE_MODE}. Use JEANS, TRACKPANTS or ALL`
  );
};

/* =========================================================
   NORMALIZE
========================================================= */

const normalize = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

/* =========================================================
   ESCAPE REGEX
========================================================= */

function escapeRegex(value = "") {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* =========================================================
   GET PRICE FOR PRODUCT
========================================================= */

const getPriceForProduct = (
  productName,
  priceOverrides
) => {
  const normalizedProductName =
    normalize(productName);

  for (const [name, price] of Object.entries(
    priceOverrides
  )) {
    if (
      normalize(name) ===
      normalizedProductName
    ) {
      return Number(price);
    }
  }

  return null;
};

/* =========================================================
   MAIN
========================================================= */

const run = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB URL is missing from backend/.env"
      );
    }

    const PRICE_OVERRIDES =
      getPriceOverrides();

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      `PRICE UPDATE MODE: ${UPDATE_MODE}`
    );
    console.log(
      "=============================================="
    );
    console.log("");

    /* =====================================================
       CONNECT
    ===================================================== */

    await mongoose.connect(
      mongoUri
    );

    console.log(
      "✅ MongoDB connected"
    );

    console.log("");

    /* =====================================================
       PRODUCT NAMES
    ===================================================== */

    const productNames =
      Object.keys(
        PRICE_OVERRIDES
      );

    const exactNameRegexes =
      productNames.map(
        (name) =>
          new RegExp(
            `^${escapeRegex(
              name
            )}$`,
            "i"
          )
      );

    /* =====================================================
       FIND ONLY EXACT PRODUCTS
    ===================================================== */

    const products =
      await Product.find({
        name: {
          $in:
            exactNameRegexes,
        },
      })
        .select(
          "_id name category price oldPrice slug"
        )
        .lean();

    console.log(
      `📦 Products found: ${products.length}`
    );

    console.log("");

    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    const foundNames =
      new Set();

    /* =====================================================
       UPDATE
    ===================================================== */

    for (
      const product
      of products
    ) {
      try {
        foundNames.add(
          normalize(
            product.name
          )
        );

        const newPrice =
          getPriceForProduct(
            product.name,
            PRICE_OVERRIDES
          );

        if (
          newPrice === null
        ) {
          console.log(
            `⚠️ No configured price: ${product.name}`
          );

          continue;
        }

        const oldPrice =
          Number(
            product.price ||
              0
          );

        if (
          oldPrice ===
          newPrice
        ) {
          unchanged++;

          console.log(
            `ℹ️ ${product.name}`
          );

          console.log(
            `   Already correct: ₹${newPrice}`
          );

          console.log("");

          continue;
        }

        await Product.updateOne(
          {
            _id:
              product._id,
          },
          {
            $set: {
              price:
                newPrice,
            },
          },
          {
            runValidators:
              false,
          }
        );

        updated++;

        console.log(
          `✅ ${product.name}`
        );

        console.log(
          `   Category: ${
            product.category ||
            "NO CATEGORY"
          }`
        );

        console.log(
          `   ₹${oldPrice} → ₹${newPrice}`
        );

        console.log("");
      } catch (error) {
        failed++;

        console.error(
          `❌ ${product.name}`
        );

        console.error(
          `   ${error.message}`
        );

        console.log("");
      }
    }

    /* =====================================================
       MISSING PRODUCTS
    ===================================================== */

    console.log("");
    console.log(
      "MISSING PRODUCTS"
    );

    console.log(
      "----------------------------------------------"
    );

    let missing = 0;

    for (
      const name
      of productNames
    ) {
      if (
        !foundNames.has(
          normalize(name)
        )
      ) {
        missing++;

        console.log(
          `⚠️ Not found in MongoDB: ${name}`
        );
      }
    }

    if (
      missing === 0
    ) {
      console.log(
        "✅ All configured products found"
      );
    }

    /* =====================================================
       REPORT
    ===================================================== */

    console.log("");
    console.log(
      "=================================================="
    );

    console.log(
      `     ${UPDATE_MODE} PRICE UPDATE COMPLETE`
    );

    console.log(
      "=================================================="
    );

    console.log(
      `Configured products: ${productNames.length}`
    );

    console.log(
      `MongoDB products found: ${products.length}`
    );

    console.log(
      `✅ Updated: ${updated}`
    );

    console.log(
      `ℹ️ Already correct: ${unchanged}`
    );

    console.log(
      `⚠️ Missing: ${missing}`
    );

    console.log(
      `❌ Failed: ${failed}`
    );

    console.log(
      "=================================================="
    );

    /* =====================================================
       FINAL PRICE LIST
    ===================================================== */

    console.log("");
    console.log(
      "FINAL PRICE LIST"
    );

    console.log(
      "----------------------------------------------"
    );

    for (
      const [name, price]
      of Object.entries(
        PRICE_OVERRIDES
      )
    ) {
      console.log(
        `${name}: ₹${price}`
      );
    }

    console.log("");

    /* =====================================================
       DISCONNECT
    ===================================================== */

    await mongoose.disconnect();

    console.log(
      "✅ MongoDB disconnected"
    );

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error(
      "❌ PRICE UPDATE FAILED:"
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
};

/* =========================================================
   RUN
========================================================= */

run();