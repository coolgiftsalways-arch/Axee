import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

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
  false = update MongoDB
*/
const DRY_RUN = false;

const TRACK_MIN = 1000;
const TRACK_MAX = 1400;

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const includesAny = (text, words = []) =>
  words.some((word) => text.includes(word));

const isTrackPant = (product) => {
  const name = normalize(product.name);
  const category = normalize(product.category);

  /*
    Don't touch co-ord sets
  */
  if (
    category.includes("co ord") ||
    category.includes("co-ord") ||
    category.includes("coord")
  ) {
    return false;
  }

  return (
    category.includes("track pant") ||
    category.includes("trackpants") ||
    name.includes("track pant") ||
    name.includes("trackpant") ||
    name.includes("sweatpants") ||
    name.includes("sweat pants") ||
    name.includes("jogger")
  );
};

const getTrackPantPrice = (product) => {
  const text = normalize(
    `${product.name || ""} ${product.description || ""}`,
  );

  if (
    includesAny(text, [
      "embroidered",
      "premium",
      "applique",
      "patchwork",
      "rhinestone",
      "heavyweight",
      "detail",
    ])
  ) {
    return 1399;
  }

  if (
    includesAny(text, [
      "baggy",
      "loose",
      "relaxed",
      "printed",
      "wide leg",
      "wide-leg",
      "cargo",
    ])
  ) {
    return 1299;
  }

  if (
    includesAny(text, [
      "straight",
      "regular",
      "classic",
      "basic",
    ])
  ) {
    return 1199;
  }

  return 1099;
};

const getOldPrice = (price) => {
  if (price === 1399) return 1799;
  if (price === 1299) return 1699;
  if (price === 1199) return 1599;

  return 1499;
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log(`Dry run: ${DRY_RUN}`);

    const products = await Product.find({});

    console.log(`📦 Total MongoDB products: ${products.length}`);

    const trackPants = products.filter(isTrackPant);

    console.log(`👖 Track pants detected: ${trackPants.length}`);

    const tierCount = {
      1099: 0,
      1199: 0,
      1299: 0,
      1399: 0,
    };

    let changed = 0;
    let alreadyCorrect = 0;

    console.log("");
    console.log("==============================================");
    console.log("TRACK PANTS PRICE CHECK");
    console.log("==============================================");

    for (const product of trackPants) {
      const currentPrice = Number(product.price || 0);

      const newPrice = getTrackPantPrice(product);
      const newOldPrice = getOldPrice(newPrice);

      tierCount[newPrice] += 1;

      const priceCorrect = currentPrice === newPrice;

      const oldPriceCorrect =
        Number(product.oldPrice || 0) === newOldPrice;

      if (priceCorrect && oldPriceCorrect) {
        alreadyCorrect += 1;
        continue;
      }

      changed += 1;

      console.log("");
      console.log(`🔎 ${product.name}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Price: ₹${currentPrice} → ₹${newPrice}`);
      console.log(
        `   Old Price: ₹${product.oldPrice || 0} → ₹${newOldPrice}`,
      );
      console.log(`   Mongo ID: ${product._id}`);

      if (!DRY_RUN) {
        product.price = newPrice;
        product.oldPrice = newOldPrice;

        await product.save();
      }
    }

    console.log("");
    console.log("==============================================");
    console.log("PRICE DISTRIBUTION");
    console.log("==============================================");

    console.log(`₹1099: ${tierCount[1099]} products`);
    console.log(`₹1199: ${tierCount[1199]} products`);
    console.log(`₹1299: ${tierCount[1299]} products`);
    console.log(`₹1399: ${tierCount[1399]} products`);

    console.log("");
    console.log("==============================================");
    console.log("SUMMARY");
    console.log("==============================================");

    console.log(`Target range: ₹${TRACK_MIN} - ₹${TRACK_MAX}`);
    console.log(`Track pants detected: ${trackPants.length}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Products to change: ${changed}`);

    console.log("==============================================");

    if (DRY_RUN) {
      console.log("");
      console.log("⚠️ DRY RUN ONLY");
      console.log("MongoDB was NOT changed.");
      console.log("");
      console.log("If everything looks correct, change:");
      console.log("const DRY_RUN = true;");
      console.log("to:");
      console.log("const DRY_RUN = false;");
    } else {
      console.log("");
      console.log("✅ TRACK PANTS PRICE UPDATE COMPLETE");
    }
  } catch (error) {
    console.error("❌ TRACK PANTS UPDATE ERROR:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    process.exit(0);
  }
};

run();