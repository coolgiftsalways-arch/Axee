import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

/* =========================================================
   CONFIG
========================================================= */

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB connection string missing.");
  process.exit(1);
}

/*
  FIRST RUN:
  true = preview only, MongoDB will NOT change.

  AFTER YOU CHECK THE RESULT:
  false = actually update MongoDB.
*/
const DRY_RUN = false;

/* =========================================================
   PRICE OPTIONS
========================================================= */

const PRICE_LISTS = {
  HALF_SLEEVE: [
    699,
    799,
    899,
    999,
  ],

  FULL_SLEEVE: [
    799,
    899,
    999,
    1099,
    1199,
  ],

  OVERSIZED: [
    1199,
    1299,
    1399,
    1499,
    1599,
    1699,
    1799,
  ],

  SWEATSHIRT: [
    1799,
    1899,
    1999,
    2099,
  ],

  HOODIE: [
    1499,
    1599,
    1699,
    1799,
    1899,
    1999,
    2099,
    2199,
    2299,
    2399,
    2499,
  ],

  ZIP_HOODIE: [
    1299,
    1399,
    1499,
    1599,
    1699,
    1799,
    1899,
  ],

  JACKET: [
    2000,
    2099,
    2199,
    2299,
    2399,
    2499,
  ],

  TRACK_PANTS: [
    1499,
    1599,
    1699,
    1799,
  ],

  SHORTS: [
    499,
    599,
    699,
    799,
  ],

  SHIRT: [
    899,
    999,
    1099,
    1199,
    1299,
    1399,
    1499,
  ],
};

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const stableHash = (value = "") => {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash =
      (hash * 31 +
        value.charCodeAt(i)) >>>
      0;
  }

  return hash;
};

const stableFrom = (
  list,
  product,
  salt = "",
) => {
  const key =
    `${product._id}-${product.name}-${salt}`;

  const index =
    stableHash(key) %
    list.length;

  return list[index];
};

/* =========================================================
   PRODUCT TYPE DETECTION
========================================================= */

const detectPricingType = (
  product,
) => {
  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  const text =
    `${name} ${category}`;

  /* =====================================================
     SKIP PANTS / JEANS / CO-ORD SETS
  ===================================================== */

  if (
    category.includes("co ord") ||
    category.includes("coord") ||
    category === "pants" ||
    category.includes("jeans")
  ) {
    return null;
  }

  /* =====================================================
     JACKETS
  ===================================================== */

  if (
    category.includes("jacket") ||
    category.includes("jackets")
  ) {
    return {
      type: "JACKET",
      prices: PRICE_LISTS.JACKET,
    };
  }

  /* =====================================================
     TRACK PANTS
  ===================================================== */

  if (
    category.includes("track pant") ||
    category.includes("trackpants")
  ) {
    return {
      type: "TRACK PANTS",
      prices: PRICE_LISTS.TRACK_PANTS,
    };
  }

  /* =====================================================
     SHORTS
  ===================================================== */

  if (
    category === "shorts" ||
    category.includes("shorts")
  ) {
    return {
      type: "SHORTS",
      prices: PRICE_LISTS.SHORTS,
    };
  }

  /* =====================================================
     SHIRTS
  ===================================================== */

  if (
    category === "shirt" ||
    category === "shirts"
  ) {
    return {
      type: "SHIRT",
      prices: PRICE_LISTS.SHIRT,
    };
  }

  /* =====================================================
     SWEATSHIRTS / SWEATERS

     IMPORTANT:
     This comes BEFORE hoodie/t-shirt logic.
  ===================================================== */

  if (
    category.includes("sweatshirt") ||
    category.includes("sweater") ||
    name.includes("sweatshirt") ||
    name.includes("sweater")
  ) {
    return {
      type: "SWEATSHIRT",
      prices: PRICE_LISTS.SWEATSHIRT,
    };
  }

  /* =====================================================
     HOODIES

     ZIP HOODIE FIRST
  ===================================================== */

  if (
    category.includes("hoodie") ||
    name.includes("hoodie")
  ) {
    const isZip =
      name.includes("zip hoodie") ||
      name.includes("zip-up hoodie") ||
      name.includes("zip up hoodie") ||
      name.includes("zip through hoodie") ||
      name.includes("zip-through hoodie") ||
      name.includes("zip thru hoodie") ||
      name.includes("zip-thru hoodie") ||
      name.includes("two-way zip") ||
      name.includes("full zip") ||
      name.includes("scuba zip");

    if (isZip) {
      return {
        type: "ZIP HOODIE",
        prices: PRICE_LISTS.ZIP_HOODIE,
      };
    }

    return {
      type: "HOODIE",
      prices: PRICE_LISTS.HOODIE,
    };
  }

  /* =====================================================
     T-SHIRT DETECTION
  ===================================================== */

  const isTshirtCategory =
    category.includes("t shirt") ||
    category.includes("tshirt") ||
    category.includes("tee");

  const looksLikeTshirt =
    text.includes("t shirt") ||
    text.includes("tshirt") ||
    text.includes("tee");

  if (
    isTshirtCategory ||
    looksLikeTshirt
  ) {
    /* OVERSIZED / BOXY */

    if (
      name.includes("oversized") ||
      name.includes("oversize") ||
      name.includes("boxy")
    ) {
      return {
        type: "OVERSIZED",
        prices: PRICE_LISTS.OVERSIZED,
      };
    }

    /* FULL / LONG SLEEVE */

    if (
      name.includes("full sleeve") ||
      name.includes("full-sleeve") ||
      name.includes("long sleeve") ||
      name.includes("long-sleeve") ||
      name.includes("long sleeved") ||
      name.includes("long-sleeved")
    ) {
      return {
        type: "FULL SLEEVE",
        prices: PRICE_LISTS.FULL_SLEEVE,
      };
    }

    /* DEFAULT T-SHIRT */

    return {
      type: "HALF SLEEVE",
      prices: PRICE_LISTS.HALF_SLEEVE,
    };
  }

  /* =====================================================
     FALLBACK: JACKETS
  ===================================================== */

  if (
    name.includes("jacket") ||
    name.includes("bomber") ||
    name.includes("puffer") ||
    name.includes("windcheater") ||
    name.includes("parka")
  ) {
    return {
      type: "JACKET",
      prices: PRICE_LISTS.JACKET,
    };
  }

  /* =====================================================
     FALLBACK: TRACK PANTS
  ===================================================== */

  if (
    name.includes("track pants") ||
    name.includes("track pant") ||
    name.includes("trackpants") ||
    name.includes("joggers") ||
    name.includes("jogger pants")
  ) {
    return {
      type: "TRACK PANTS",
      prices: PRICE_LISTS.TRACK_PANTS,
    };
  }

  /* =====================================================
     FALLBACK: SWEATSHIRT
  ===================================================== */

  if (
    name.includes("sweatshirt") ||
    name.includes("sweater")
  ) {
    return {
      type: "SWEATSHIRT",
      prices: PRICE_LISTS.SWEATSHIRT,
    };
  }

  /* =====================================================
     FALLBACK: SHIRT
  ===================================================== */

  if (
    name.includes(" shirt") ||
    name.endsWith("shirt") ||
    name.includes("overshirt")
  ) {
    return {
      type: "SHIRT",
      prices: PRICE_LISTS.SHIRT,
    };
  }

  return null;
};

/* =========================================================
   OLD PRICE
========================================================= */

const getOldPrice = (
  product,
  price,
) => {
  const additions = [
    300,
    400,
    500,
    600,
  ];

  const addition =
    stableFrom(
      additions,
      product,
      "old-price",
    );

  return (
    Number(price) +
    Number(addition)
  );
};

/* =========================================================
   RUN
========================================================= */

const run = async () => {
  try {
    console.log(
      "==============================================",
    );

    console.log(
      "UNBOUND PRODUCT PRICE UPDATE V3",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `Dry run: ${DRY_RUN}`,
    );

    console.log("");

    await mongoose.connect(
      MONGO_URI,
    );

    console.log(
      "✅ MongoDB connected",
    );

    const products =
      await Product.find({});

    console.log(
      `📦 Products found: ${products.length}`,
    );

    let matched = 0;
    let changed = 0;
    let unchanged = 0;
    let skipped = 0;

    const stats = {};

    for (
      const product
      of products
    ) {
      const pricing =
        detectPricingType(
          product,
        );

      if (!pricing) {
        console.log(
          `⚠️ SKIP: ${product.name} | ${product.category}`,
        );

        skipped += 1;

        continue;
      }

      matched += 1;

      stats[
        pricing.type
      ] =
        (
          stats[
            pricing.type
          ] || 0
        ) + 1;

      const newPrice =
        stableFrom(
          pricing.prices,
          product,
          "selling-price",
        );

      const newOldPrice =
        getOldPrice(
          product,
          newPrice,
        );

      const currentPrice =
        Number(
          product.price ||
            0,
        );

      const currentOldPrice =
        Number(
          product.oldPrice ||
            0,
        );

      if (
        currentPrice ===
          newPrice &&
        currentOldPrice ===
          newOldPrice
      ) {
        console.log(
          `➖ SAME: ${pricing.type} | ${product.name} | ₹${newPrice}`,
        );

        unchanged += 1;

        continue;
      }

      console.log(
        `${
          DRY_RUN
            ? "🔎"
            : "✅"
        } ${pricing.type} | ${product.name} | ₹${currentPrice} → ₹${newPrice} | old ₹${currentOldPrice} → ₹${newOldPrice}`,
      );

      if (!DRY_RUN) {
        product.price =
          newPrice;

        product.oldPrice =
          newOldPrice;

        await product.save();
      }

      changed += 1;
    }

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "PRICE TYPE COUNTS",
    );

    console.log(
      "==============================================",
    );

    Object.entries(
      stats,
    ).forEach(
      ([type, count]) => {
        console.log(
          `${type}: ${count}`,
        );
      },
    );

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      `Matched: ${matched}`,
    );

    console.log(
      `${
        DRY_RUN
          ? "Would change"
          : "Updated"
      }: ${changed}`,
    );

    console.log(
      `Already correct: ${unchanged}`,
    );

    console.log(
      `Skipped: ${skipped}`,
    );

    console.log(
      "==============================================",
    );

    if (DRY_RUN) {
      console.log("");
      console.log(
        "⚠️ DRY RUN ONLY.",
      );

      console.log(
        "MongoDB was NOT changed.",
      );

      console.log("");
      console.log(
        "Check classifications first.",
      );

      console.log(
        "If correct, change:",
      );

      console.log(
        "const DRY_RUN = true;",
      );

      console.log(
        "to:",
      );

      console.log(
        "const DRY_RUN = false;",
      );

      console.log(
        "and run again.",
      );
    } else {
      console.log("");
      console.log(
        "✅ MongoDB prices updated.",
      );
    }
  } catch (error) {
    console.error(
      "❌ Price update failed:",
      error,
    );
  } finally {
    if (
      mongoose.connection
        .readyState !== 0
    ) {
      await mongoose.disconnect();
    }

    process.exit(0);
  }
};

run();