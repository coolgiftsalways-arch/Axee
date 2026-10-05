import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

/* =========================================================
   MONGODB
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

/* =========================================================
   ORIGINAL EXTRACTED ZIP

   backend/
   └── imports/
       └── tracks-jackets/
           └── 50 tracks 30 jackets/
               ├── Jackets/
               └── Track pants/
========================================================= */

const SOURCE_ROOT = path.join(
  process.cwd(),
  "imports",
  "tracks-jackets",
  "50 tracks 30 jackets",
);

/* =========================================================
   HOSTINGER PREFIX

   Your Hostinger files currently appear as:

   product_images\Jackets\Product Name\image.png

   inside:

   /home/u529337649/product-images/
========================================================= */

const HOSTINGER_PREFIX = "product_images";

/* =========================================================
   SAFE MODE

   FIRST RUN = true
   SECOND RUN = false
========================================================= */

const DRY_RUN = false;

/* =========================================================
   IMAGE EXTENSIONS
========================================================= */

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

/* =========================================================
   HELPERS
========================================================= */

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isImage = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();

  return IMAGE_EXTENSIONS.has(ext);
};

const getImages = (folderPath) => {
  return fs
    .readdirSync(folderPath, {
      withFileTypes: true,
    })
    .filter(
      (entry) =>
        entry.isFile() &&
        isImage(entry.name),
    )
    .map((entry) => entry.name)
    .sort((a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
    );
};

/* =========================================================
   BUILD HOSTINGER URL

   IMPORTANT:

   We intentionally use BACKSLASH because your Hostinger
   File Manager shows entries like:

   product_images\Jackets\Product\image.png

   Browser-safe version becomes:

   /product-images/product_images%5CJackets%5CProduct%5Cimage.png
========================================================= */

const buildHostingerImageUrl = ({
  categoryFolder,
  productName,
  fileName,
}) => {
  const actualStoredName =
    `${HOSTINGER_PREFIX}\\${categoryFolder}\\${productName}\\${fileName}`;

  return `/product-images/${encodeURIComponent(
    actualStoredName,
  )}`;
};

/* =========================================================
   FIND PRODUCT
========================================================= */

const findMongoProduct = async ({
  productName,
  category,
}) => {
  /*
    First try exact name/category.
  */

  let product =
    await Product.findOne({
      name: productName,
      category,
    });

  /*
    Fallback to slug/category.
  */

  if (!product) {
    product =
      await Product.findOne({
        slug: slugify(productName),
        category,
      });
  }

  return product;
};

/* =========================================================
   PROCESS CATEGORY
========================================================= */

const processCategory = async ({
  sourceFolder,
  mongoCategory,
}) => {
  const categoryPath =
    path.join(
      SOURCE_ROOT,
      sourceFolder,
    );

  if (!fs.existsSync(categoryPath)) {
    throw new Error(
      `Source category missing: ${categoryPath}`,
    );
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

  console.log("");
  console.log(
    `========== ${mongoCategory} ==========`,
  );

  console.log(
    `📦 Product folders: ${productFolders.length}`,
  );

  const stats = {
    total: productFolders.length,
    matched: 0,
    updated: 0,
    mongoMissing: 0,
    noImages: 0,
  };

  for (const folder of productFolders) {
    const productName =
      folder.name.trim();

    const localProductFolder =
      path.join(
        categoryPath,
        folder.name,
      );

    const imageFiles =
      getImages(
        localProductFolder,
      );

    if (!imageFiles.length) {
      console.log(
        `⚠️ NO IMAGES: ${productName}`,
      );

      stats.noImages += 1;

      continue;
    }

    const product =
      await findMongoProduct({
        productName,
        category:
          mongoCategory,
      });

    if (!product) {
      console.log(
        `❌ PRODUCT NOT FOUND: ${productName}`,
      );

      stats.mongoMissing += 1;

      continue;
    }

    const imageUrls =
      imageFiles.map((fileName) =>
        buildHostingerImageUrl({
          categoryFolder:
            sourceFolder,

          productName,

          fileName,
        }),
      );

    stats.matched += 1;

    console.log(
      `✅ MATCHED: ${productName} | ${imageUrls.length} images`,
    );

    if (DRY_RUN) {
      console.log(
        "   DRY RUN:",
        imageUrls,
      );

      continue;
    }

    /* =====================================================
       UPDATE MONGODB
    ===================================================== */

    product.images =
      imageUrls;

    const plain =
      product.toObject();

    if (
      Object.prototype.hasOwnProperty.call(
        plain,
        "mainImage",
      )
    ) {
      product.mainImage =
        imageUrls[0] || "";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        plain,
        "image",
      )
    ) {
      product.image =
        imageUrls[0] || "";
    }

    await product.save();

    stats.updated += 1;

    console.log(
      "   💾 MongoDB updated",
    );
  }

  return stats;
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
      "UNBOUND HOSTINGER IMAGE PATH FIX",
    );

    console.log(
      "==============================================",
    );

    console.log(
      "Source:",
      SOURCE_ROOT,
    );

    console.log(
      "Dry run:",
      DRY_RUN,
    );

    if (
      !fs.existsSync(
        SOURCE_ROOT,
      )
    ) {
      throw new Error(
        `Source folder does not exist: ${SOURCE_ROOT}`,
      );
    }

    console.log("");
    console.log(
      "Connecting to MongoDB...",
    );

    await mongoose.connect(
      MONGO_URI,
    );

    console.log(
      "✅ MongoDB connected",
    );

    /* =====================================================
       JACKETS
    ===================================================== */

    const jackets =
      await processCategory({
        sourceFolder:
          "Jackets",

        mongoCategory:
          "JACKETS",
      });

    /* =====================================================
       TRACK PANTS
    ===================================================== */

    const trackPants =
      await processCategory({
        sourceFolder:
          "Track pants",

        mongoCategory:
          "TRACK PANTS",
      });

    /* =====================================================
       RESULTS
    ===================================================== */

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "RESULT",
    );

    console.log(
      "==============================================",
    );

    console.log(
      "JACKETS:",
      jackets,
    );

    console.log(
      "TRACK PANTS:",
      trackPants,
    );

    console.log("");

    console.log(
      "Matched products:",
      jackets.matched +
        trackPants.matched,
    );

    console.log(
      "MongoDB updated:",
      jackets.updated +
        trackPants.updated,
    );

    console.log(
      "Mongo missing:",
      jackets.mongoMissing +
        trackPants.mongoMissing,
    );

    console.log(
      "No images:",
      jackets.noImages +
        trackPants.noImages,
    );

    console.log("");

    if (DRY_RUN) {
      console.log(
        "⚠️ DRY RUN — MongoDB was NOT changed.",
      );

      console.log(
        "If matched products = 80, change:",
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
    } else {
      console.log(
        "✅ MongoDB paths updated successfully.",
      );
    }

    console.log(
      "==============================================",
    );
  } catch (error) {
    console.error(
      "❌ FAILED:",
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