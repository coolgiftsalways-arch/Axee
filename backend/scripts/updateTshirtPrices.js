import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

import dns from "node:dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);
dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URL missing.");
  process.exit(1);
}

/*
  true  = preview only
  false = actually update MongoDB
*/
const DRY_RUN = false;

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

/* =========================================================
   T-SHIRT DETECTION
========================================================= */

const isTshirt = (product) => {
  const name = normalize(product.name);
  const category = normalize(product.category);

  /*
    Exclude things we do NOT want to touch
  */
  if (
    category.includes("hoodie") ||
    category.includes("sweatshirt") ||
    category.includes("jacket") ||
    category.includes("shirt") && !category.includes("t-shirt") ||
    category.includes("co ord") ||
    category.includes("co-ord") ||
    name.includes("hoodie") ||
    name.includes("sweatshirt") ||
    name.includes("jacket") ||
    name.includes("co ord") ||
    name.includes("co-ord")
  ) {
    return false;
  }

  /*
    T-shirt categories / names
  */
  return (
    category.includes("t-shirt") ||
    category.includes("tshirt") ||
    category === "tees" ||
    category.includes("tees") ||
    name.includes("t-shirt") ||
    name.includes("t shirt") ||
    name.includes("tee")
  );
};

/* =========================================================
   PRICE OPTIONS

   Random-looking but stable distribution
========================================================= */

const PRICE_OPTIONS = [
  799,
  849,
  899,
  949,
  999,
];

/*
  Stable hash so the same product gets
  the same price every time the script runs.
*/
const stableHash = (text = "") => {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
};

const getTshirtPrice = (product) => {
  const key =
    `${product._id}-${product.name}`;

  const index =
    stableHash(key) % PRICE_OPTIONS.length;

  return PRICE_OPTIONS[index];
};

/* =========================================================
   OLD PRICE
========================================================= */

const getOldPrice = (price) => {
  if (price === 999) return 1299;
  if (price === 949) return 1199;
  if (price === 899) return 1199;
  if (price === 849) return 1099;

  return 999;
};

/* =========================================================
   RUN
========================================================= */

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log(`Dry run: ${DRY_RUN}`);

    const products =
      await Product.find({});

    console.log(
      `📦 Total MongoDB products: ${products.length}`,
    );

    const tshirts =
      products.filter(isTshirt);

    console.log(
      `👕 T-shirts detected: ${tshirts.length}`,
    );

    const priceCount = {
      799: 0,
      849: 0,
      899: 0,
      949: 0,
      999: 0,
    };

    let changed = 0;
    let alreadyCorrect = 0;

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "T-SHIRT PRICE CHECK",
    );

    console.log(
      "==============================================",
    );

    for (const product of tshirts) {
      const currentPrice =
        Number(product.price || 0);

      const newPrice =
        getTshirtPrice(product);

      const newOldPrice =
        getOldPrice(newPrice);

      priceCount[newPrice] += 1;

      const priceCorrect =
        currentPrice === newPrice;

      const oldPriceCorrect =
        Number(product.oldPrice || 0) ===
        newOldPrice;

      if (
        priceCorrect &&
        oldPriceCorrect
      ) {
        alreadyCorrect += 1;
        continue;
      }

      changed += 1;

      console.log("");
      console.log(`🔎 ${product.name}`);

      console.log(
        `   Category: ${product.category}`,
      );

      console.log(
        `   Price: ₹${currentPrice} → ₹${newPrice}`,
      );

      console.log(
        `   Old Price: ₹${product.oldPrice || 0} → ₹${newOldPrice}`,
      );

      console.log(
        `   Mongo ID: ${product._id}`,
      );

      if (!DRY_RUN) {
        product.price = newPrice;
        product.oldPrice = newOldPrice;

        await product.save();
      }
    }

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "PRICE DISTRIBUTION",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `₹799: ${priceCount[799]} products`,
    );

    console.log(
      `₹849: ${priceCount[849]} products`,
    );

    console.log(
      `₹899: ${priceCount[899]} products`,
    );

    console.log(
      `₹949: ${priceCount[949]} products`,
    );

    console.log(
      `₹999: ${priceCount[999]} products`,
    );

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "SUMMARY",
    );

    console.log(
      "==============================================",
    );

    console.log(
      "Target range: ₹799 - ₹999",
    );

    console.log(
      `T-shirts detected: ${tshirts.length}`,
    );

    console.log(
      `Already correct: ${alreadyCorrect}`,
    );

    console.log(
      `Products to change: ${changed}`,
    );

    console.log(
      "==============================================",
    );

    if (DRY_RUN) {
      console.log("");
      console.log(
        "⚠️ DRY RUN ONLY",
      );

      console.log(
        "MongoDB was NOT changed.",
      );

      console.log("");
      console.log(
        "If everything looks correct, change:",
      );

      console.log(
        "const DRY_RUN = true;",
      );

      console.log("to:");

      console.log(
        "const DRY_RUN = false;",
      );
    } else {
      console.log("");
      console.log(
        "✅ T-SHIRT PRICE UPDATE COMPLETE",
      );
    }
  } catch (error) {
    console.error(
      "❌ T-SHIRT UPDATE ERROR:",
      error,
    );
  } finally {
    if (
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.disconnect();
    }

    process.exit(0);
  }
};

run();