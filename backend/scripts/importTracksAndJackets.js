import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const ROOT = path.join(
  process.cwd(),
  "imports",
  "tracks-jackets",
  "50 tracks 30 jackets",
);

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getImageFiles = (folderPath) => {
  return fs
    .readdirSync(folderPath, {
      withFileTypes: true,
    })
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      const extension = path
        .extname(entry.name)
        .toLowerCase();

      return IMAGE_EXTENSIONS.includes(
        extension,
      );
    })
    .map((entry) => entry.name)
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
};

const randomRating = () =>
  Number(
    (
      4 +
      Math.random()
    ).toFixed(1),
  );

const randomReviews = () =>
  Math.floor(
    Math.random() * 151,
  ) + 50;

const defaultSizes = [
  {
    size: "S",
    stock: 10,
  },
  {
    size: "M",
    stock: 10,
  },
  {
    size: "L",
    stock: 10,
  },
  {
    size: "XL",
    stock: 10,
  },
];

const buildProduct = ({
  productName,
  category,
  imageFiles,
}) => {
  const slug = slugify(
    productName,
  );

  const categoryFolder =
    category === "JACKETS"
      ? "Jackets"
      : "Track pants";

  const imageUrls =
    imageFiles.map((fileName) => {
      return `/product-images/${encodeURIComponent(
        categoryFolder,
      )}/${encodeURIComponent(
        productName,
      )}/${encodeURIComponent(
        fileName,
      )}`;
    });

  return {
    name: productName,

    slug,

    category,

    price:
      category === "JACKETS"
        ? 2499
        : 1499,

    oldPrice:
      category === "JACKETS"
        ? 2999
        : 1999,

    description:
      category === "JACKETS"
        ? `${productName} by UNBOUND. Premium men's jacket with a modern streetwear-inspired fit.`
        : `${productName} by UNBOUND. Comfortable men's track pants designed for everyday streetwear.`,

    images: imageUrls,

    sizes: defaultSizes,

    colors: [],

    rating:
      randomRating(),

    reviewCount:
      randomReviews(),
  };
};

const importCategory = async ({
  folderName,
  category,
}) => {
  const categoryPath =
    path.join(
      ROOT,
      folderName,
    );

  if (
    !fs.existsSync(
      categoryPath,
    )
  ) {
    console.log(
      `❌ Folder missing: ${categoryPath}`,
    );

    return {
      added: 0,
      updated: 0,
      skipped: 0,
    };
  }

  const productFolders =
    fs
      .readdirSync(
        categoryPath,
        {
          withFileTypes: true,
        },
      )
      .filter(
        (entry) =>
          entry.isDirectory(),
      );

  let added = 0;
  let updated = 0;
  let skipped = 0;

  console.log("");
  console.log(
    `========== ${category} ==========`,
  );

  for (
    const folder
    of productFolders
  ) {
    const productName =
      folder.name.trim();

    const productPath =
      path.join(
        categoryPath,
        folder.name,
      );

    const imageFiles =
      getImageFiles(
        productPath,
      );

    if (
      imageFiles.length === 0
    ) {
      console.log(
        `⚠️ SKIP - no images: ${productName}`,
      );

      skipped += 1;

      continue;
    }

    const productData =
      buildProduct({
        productName,
        category,
        imageFiles,
      });

    const existing =
      await Product.findOne({
        slug:
          productData.slug,
      });

    if (existing) {
      existing.name =
        productData.name;

      existing.category =
        productData.category;

      existing.images =
        productData.images;

      existing.description =
        productData.description;

      if (
        !existing.price
      ) {
        existing.price =
          productData.price;
      }

      if (
        !existing.oldPrice
      ) {
        existing.oldPrice =
          productData.oldPrice;
      }

      if (
        !Array.isArray(
          existing.sizes,
        ) ||
        existing.sizes.length === 0
      ) {
        existing.sizes =
          productData.sizes;
      }

      if (
        !existing.rating
      ) {
        existing.rating =
          productData.rating;
      }

      if (
        !existing.reviewCount
      ) {
        existing.reviewCount =
          productData.reviewCount;
      }

      await existing.save();

      console.log(
        `🔄 UPDATED: ${productName} (${imageFiles.length} images)`,
      );

      updated += 1;

      continue;
    }

    await Product.create(
      productData,
    );

    console.log(
      `✅ ADDED: ${productName} (${imageFiles.length} images)`,
    );

    added += 1;
  }

  return {
    added,
    updated,
    skipped,
  };
};

const run = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI or MONGODB_URI is missing in .env",
      );
    }

    console.log(
      "Connecting to MongoDB...",
    );

    await mongoose.connect(
      mongoUri,
    );

    console.log(
      "✅ MongoDB connected",
    );

    console.log(
      `📁 Import root: ${ROOT}`,
    );

    const jacketResult =
      await importCategory({
        folderName:
          "Jackets",

        category:
          "JACKETS",
      });

    const trackResult =
      await importCategory({
        folderName:
          "Track pants",

        category:
          "TRACK PANTS",
      });

    console.log("");
    console.log(
      "========== IMPORT COMPLETE ==========",
    );

    console.log(
      "JACKETS:",
      jacketResult,
    );

    console.log(
      "TRACK PANTS:",
      trackResult,
    );

    console.log(
      "=====================================",
    );
  } catch (error) {
    console.error(
      "❌ Import failed:",
      error,
    );
  } finally {
    await mongoose.disconnect();

    process.exit(0);
  }
};

run();