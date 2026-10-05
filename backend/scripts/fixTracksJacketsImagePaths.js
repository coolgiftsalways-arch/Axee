import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

const HOSTINGER_IMAGES_DIR =
  process.env.PRODUCT_IMAGES_PATH ||
  path.join(
    process.cwd(),
    "hostinger-product-images",
  );

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getAllImageFiles = () => {
  if (!fs.existsSync(HOSTINGER_IMAGES_DIR)) {
    throw new Error(
      `Image folder not found: ${HOSTINGER_IMAGES_DIR}`,
    );
  }

  return fs
    .readdirSync(HOSTINGER_IMAGES_DIR, {
      withFileTypes: true,
    })
    .filter((entry) => {
      if (!entry.isFile()) return false;

      const ext = path
        .extname(entry.name)
        .toLowerCase();

      return IMAGE_EXTENSIONS.has(ext);
    })
    .map((entry) => entry.name);
};

const findMatchingImages = (
  productName,
  allFiles,
) => {
  const normalizedProduct =
    normalize(productName);

  const productWords =
    normalizedProduct
      .split(" ")
      .filter(
        (word) =>
          word.length >= 3,
      );

  const matches = allFiles
    .map((fileName) => {
      const normalizedFile =
        normalize(
          path.basename(
            fileName,
            path.extname(fileName),
          ),
        );

      let score = 0;

      for (const word of productWords) {
        if (
          normalizedFile.includes(word)
        ) {
          score += 1;
        }
      }

      return {
        fileName,
        score,
      };
    })
    .filter(
      (item) =>
        item.score >=
        Math.max(
          2,
          Math.floor(
            productWords.length * 0.4,
          ),
        ),
    )
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.fileName.localeCompare(
        b.fileName,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });

  if (!matches.length) {
    return [];
  }

  const bestScore =
    matches[0].score;

  return matches
    .filter(
      (item) =>
        item.score === bestScore,
    )
    .map(
      (item) =>
        `/product-images/${encodeURIComponent(
          item.fileName,
        )}`,
    );
};

const run = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error(
        "MongoDB URL missing from .env",
      );
    }

    console.log(
      `📁 Reading images from: ${HOSTINGER_IMAGES_DIR}`,
    );

    const allFiles =
      getAllImageFiles();

    console.log(
      `🖼️ Found ${allFiles.length} flat image files`,
    );

    console.log(
      "Connecting to MongoDB...",
    );

    await mongoose.connect(
      MONGO_URI,
    );

    console.log(
      "✅ MongoDB connected",
    );

    const products =
      await Product.find({
        category: {
          $in: [
            "JACKETS",
            "TRACK PANTS",
          ],
        },
      });

    console.log(
      `📦 Found ${products.length} jacket/track products`,
    );

    let updated = 0;
    let notFound = 0;

    for (const product of products) {
      const matches =
        findMatchingImages(
          product.name,
          allFiles,
        );

      if (!matches.length) {
        console.log(
          `❌ NO MATCH: ${product.name}`,
        );

        notFound += 1;
        continue;
      }

      product.images =
        matches;

      if (
        Object.prototype.hasOwnProperty.call(
          product.toObject(),
          "mainImage",
        )
      ) {
        product.mainImage =
          matches[0];
      }

      await product.save();

      console.log(
        `✅ UPDATED: ${product.name} → ${matches.length} image(s)`,
      );

      updated += 1;
    }

    console.log("");
    console.log(
      "========== DONE ==========",
    );
    console.log(
      `Updated: ${updated}`,
    );
    console.log(
      `No match: ${notFound}`,
    );
    console.log(
      "==========================",
    );
  } catch (error) {
    console.error(
      "❌ Failed:",
      error,
    );
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();