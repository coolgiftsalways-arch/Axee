import fs from "fs";
import path from "path";
import crypto from "crypto";
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
  console.error("❌ MongoDB connection string missing in .env");
  process.exit(1);
}

/* =========================================================
   ORIGINAL ZIP EXTRACTED FOLDER

   Original structure:

   50 tracks 30 jackets/
      Jackets/
         Product Name/
            image...
      Track pants/
         Product Name/
            image...
========================================================= */

const SOURCE_ROOT = path.join(
  process.cwd(),
  "imports",
  "tracks-jackets",
  "50 tracks 30 jackets",
);

/* =========================================================
   LOCAL COPY OF HOSTINGER'S FLAT product-images

   IMPORTANT:
   This folder should contain the same flat image files that
   are already uploaded to Hostinger.
========================================================= */

const FLAT_IMAGE_FOLDER = path.join(
  process.cwd(),
  "imports",
  "current-flat-images",
);

/* =========================================================
   SETTINGS
========================================================= */

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

/*
  Keep true for first run.
  It will CHECK everything but will NOT modify MongoDB.
*/

const DRY_RUN = false;

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

/* =========================================================
   IMAGE CHECK
========================================================= */

const isImage = (fileName) => {
  const extension = path
    .extname(fileName)
    .toLowerCase();

  return IMAGE_EXTENSIONS.has(extension);
};

/* =========================================================
   FILE HASH

   Same image = same SHA256 hash
========================================================= */

const getFileHash = (filePath) => {
  const buffer =
    fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};

/* =========================================================
   GET PRODUCT IMAGES
========================================================= */

const getProductImages = (folderPath) => {
  return fs
    .readdirSync(folderPath, {
      withFileTypes: true,
    })
    .filter(
      (entry) =>
        entry.isFile() &&
        isImage(entry.name),
    )
    .map(
      (entry) =>
        entry.name,
    )
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
   BUILD HASH MAP OF FLAT HOSTINGER IMAGES

   hash => filename
========================================================= */

const buildFlatImageHashMap = () => {
  if (!fs.existsSync(FLAT_IMAGE_FOLDER)) {
    throw new Error(
      `Flat image folder not found: ${FLAT_IMAGE_FOLDER}`,
    );
  }

  const imageFiles = [];

  const scanFolder = (folderPath) => {
    const entries = fs.readdirSync(folderPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(
        folderPath,
        entry.name,
      );

      if (entry.isDirectory()) {
        scanFolder(fullPath);
        continue;
      }

      if (
        entry.isFile() &&
        isImage(entry.name)
      ) {
        imageFiles.push({
          name: entry.name,
          fullPath,
        });
      }
    }
  };

  scanFolder(FLAT_IMAGE_FOLDER);

  console.log(
    `🖼️ Flat images found: ${imageFiles.length}`,
  );

  const hashMap = new Map();

  for (const file of imageFiles) {
    try {
      const hash = getFileHash(
        file.fullPath,
      );

      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }

      hashMap.get(hash).push(
        file.name,
      );
    } catch (error) {
      console.log(
        `⚠️ Could not hash: ${file.fullPath}`,
      );
    }
  }

  return hashMap;
};

/* =========================================================
   FIND PRODUCT IN MONGODB
========================================================= */

const findProduct = async ({
  productName,
  category,
}) => {
  const slug =
    slugify(productName);

  /*
    First use exact name + category.
  */

  let product =
    await Product.findOne({
      name:
        productName,

      category,
    });

  /*
    Fallback to slug + category.
  */

  if (!product) {
    product =
      await Product.findOne({
        slug,
        category,
      });
  }

  return product;
};

/* =========================================================
   PROCESS ONE CATEGORY
========================================================= */

const processCategory = async ({
  folderName,
  category,
}) => {
  const categoryPath =
    path.join(
      SOURCE_ROOT,
      folderName,
    );

  if (
    !fs.existsSync(
      categoryPath,
    )
  ) {
    throw new Error(
      `Category folder not found: ${categoryPath}`,
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
    `========== ${category} ==========`,
  );

  console.log(
    `📦 Product folders: ${productFolders.length}`,
  );

  const result = {
    total:
      productFolders.length,

    matched:
      0,

    updated:
      0,

    mongoMissing:
      0,

    imageMissing:
      0,

    partial:
      0,
  };

  for (
    const folder
    of productFolders
  ) {
    const productName =
      folder.name.trim();

    const productFolderPath =
      path.join(
        categoryPath,
        folder.name,
      );

    const originalImages =
      getProductImages(
        productFolderPath,
      );

    if (
      originalImages.length === 0
    ) {
      console.log(
        `⚠️ NO SOURCE IMAGES: ${productName}`,
      );

      result.imageMissing++;

      continue;
    }

    const mongoProduct =
      await findProduct({
        productName,
        category,
      });

    if (!mongoProduct) {
      console.log(
        `❌ MONGO PRODUCT NOT FOUND: ${productName}`,
      );

      result.mongoMissing++;

      continue;
    }

    const matchedFlatFiles =
      [];

    const unmatchedOriginal =
      [];

    for (
      const originalImage
      of originalImages
    ) {
      const originalPath =
        path.join(
          productFolderPath,
          originalImage,
        );

      const hash =
        getFileHash(
          originalPath,
        );

      const candidates =
        flatHashMap.get(
          hash,
        );

      if (
        !candidates ||
        candidates.length === 0
      ) {
        unmatchedOriginal.push(
          originalImage,
        );

        continue;
      }

      /*
        Same binary image found in flat folder.
        First filename is enough.
      */

      matchedFlatFiles.push(
        candidates[0],
      );
    }

    /*
      Remove duplicate filenames if same image appeared twice.
    */

    const uniqueFlatFiles =
      [
        ...new Set(
          matchedFlatFiles,
        ),
      ];

    if (
      uniqueFlatFiles.length === 0
    ) {
      console.log(
        `❌ NO FLAT IMAGE MATCH: ${productName}`,
      );

      result.imageMissing++;

      continue;
    }

    if (
      unmatchedOriginal.length >
      0
    ) {
      console.log(
        `⚠️ PARTIAL: ${productName} | ${uniqueFlatFiles.length}/${originalImages.length}`,
      );

      result.partial++;
    } else {
      console.log(
        `✅ MATCHED: ${productName} | ${uniqueFlatFiles.length} images`,
      );
    }

    /*
      Convert physical flat filenames to public URLs.

      Example:
      Screenshot 2026.jpg

      becomes:

      /product-images/Screenshot%202026.jpg
    */

    const imageUrls =
      uniqueFlatFiles.map(
        (fileName) =>
          `/product-images/${encodeURIComponent(
            fileName,
          )}`,
      );

    result.matched++;

    /* =====================================================
       DRY RUN
    ===================================================== */

    if (DRY_RUN) {
      console.log(
        "   DRY RUN:",
        imageUrls,
      );

      continue;
    }

    /* =====================================================
       UPDATE PRODUCT
    ===================================================== */

    mongoProduct.images =
      imageUrls;

    const object =
      mongoProduct.toObject();

    if (
      Object.prototype.hasOwnProperty.call(
        object,
        "mainImage",
      )
    ) {
      mongoProduct.mainImage =
        imageUrls[0];
    }

    if (
      Object.prototype.hasOwnProperty.call(
        object,
        "image",
      )
    ) {
      mongoProduct.image =
        imageUrls[0];
    }

    await mongoProduct.save();

    result.updated++;

    console.log(
      `   💾 MongoDB updated`,
    );
  }

  return result;
};

/* =========================================================
   GLOBAL HASH MAP
========================================================= */

let flatHashMap;

/* =========================================================
   RUN
========================================================= */

const run = async () => {
  try {
    console.log(
      "==========================================",
    );

    console.log(
      "TRACK PANTS + JACKETS IMAGE PATH FIX",
    );

    console.log(
      "==========================================",
    );

    console.log(
      "Source:",
      SOURCE_ROOT,
    );

    console.log(
      "Flat images:",
      FLAT_IMAGE_FOLDER,
    );

    console.log(
      "Dry run:",
      DRY_RUN,
    );

    console.log("");

    /* =====================================================
       CHECK SOURCE
    ===================================================== */

    if (
      !fs.existsSync(
        SOURCE_ROOT,
      )
    ) {
      throw new Error(
        `Original extracted ZIP folder not found: ${SOURCE_ROOT}`,
      );
    }

    /* =====================================================
       BUILD HOSTINGER IMAGE HASH INDEX
    ===================================================== */

    console.log(
      "Building flat image hash index...",
    );

    flatHashMap =
      buildFlatImageHashMap();

    console.log(
      `🔐 Unique image hashes: ${flatHashMap.size}`,
    );

    /* =====================================================
       CONNECT
    ===================================================== */

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
        folderName:
          "Jackets",

        category:
          "JACKETS",
      });

    /* =====================================================
       TRACK PANTS
    ===================================================== */

    const tracks =
      await processCategory({
        folderName:
          "Track pants",

        category:
          "TRACK PANTS",
      });

    /* =====================================================
       RESULTS
    ===================================================== */

    console.log("");
    console.log(
      "==========================================",
    );

    console.log(
      "RESULT",
    );

    console.log(
      "==========================================",
    );

    console.log(
      "JACKETS:",
      jackets,
    );

    console.log(
      "TRACK PANTS:",
      tracks,
    );

    console.log("");

    console.log(
      "Matched products:",
      jackets.matched +
        tracks.matched,
    );

    console.log(
      "MongoDB updated:",
      jackets.updated +
        tracks.updated,
    );

    console.log(
      "Mongo missing:",
      jackets.mongoMissing +
        tracks.mongoMissing,
    );

    console.log(
      "Image missing:",
      jackets.imageMissing +
        tracks.imageMissing,
    );

    console.log(
      "Partial image matches:",
      jackets.partial +
        tracks.partial,
    );

    console.log("");

    if (DRY_RUN) {
      console.log(
        "⚠️ DRY RUN ONLY — MongoDB was NOT changed.",
      );

      console.log(
        "If Matched products = 80, change:",
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
        "and run this script again.",
      );
    } else {
      console.log(
        "✅ MongoDB image paths updated.",
      );
    }

    console.log(
      "==========================================",
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