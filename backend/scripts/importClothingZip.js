import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import mongoose from "mongoose";
import dotenv from "dotenv";
import mime from "mime-types";
import { GridFSBucket } from "mongodb";
import { fileURLToPath } from "url";

dotenv.config();

/* =========================================================
   PATHS
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZIP_PATH = path.join(
  __dirname,
  "../uploads/Clothing.zip"
);



/* =========================================================
   SETTINGS
========================================================= */

const SKIP_WORDS = [
  "track pant",
  "track pants",
  "trackpant",
  "trackpants",
];

/*
  true  = only scan/show what will happen
  false = actually upload to MongoDB
*/
const DRY_RUN = false;

/*
  Set to true if you want duplicate product names skipped.
*/
const SKIP_DUPLICATES = true;

/* =========================================================
   HELPERS
========================================================= */

function cleanText(text = "") {
  return String(text)
    .replace(/\\/g, "/")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text = "") {
  return cleanText(text)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function shouldSkip(text = "") {
  const value = text.toLowerCase();

  return SKIP_WORDS.some((word) =>
    value.includes(word)
  );
}

function isImage(filename = "") {
  const extension = path
    .extname(filename)
    .toLowerCase();

  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
    ".gif",
  ].includes(extension);
}

function removeExtension(filename = "") {
  return filename.replace(/\.[^/.]+$/, "");
}

/* =========================================================
   IGNORE COMMON NON-PRODUCT IMAGE NAMES
========================================================= */

function isIgnoredFile(filename = "") {
  const name = filename.toLowerCase();

  return (
    name.includes("__macosx") ||
    name.includes(".ds_store") ||
    name.includes("thumbs.db")
  );
}

/* =========================================================
   GET CATEGORY + PRODUCT NAME FROM PATH
========================================================= */

/*
Example:

Clothing/T-Shirts/Black Oversized Tee/1.jpg

becomes:

category    = T-Shirts
productName = Black Oversized Tee

If structure is:

Clothing/T-Shirts/Black Oversized Tee.jpg

then:

category    = T-Shirts
productName = Black Oversized Tee
*/

function analyzePath(zipPath) {
  const normalized = zipPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  let parts = normalized
    .split("/")
    .filter(Boolean);

  /*
    Remove root "Clothing" folder if it exists
  */
  if (
    parts.length &&
    parts[0].toLowerCase() === "clothing"
  ) {
    parts = parts.slice(1);
  }

  const filename = parts[parts.length - 1];

  const folders = parts.slice(0, -1);

  let category = "Clothing";
  let productName = removeExtension(filename);

  /*
    Structure:
    category/product/image.jpg
  */
  if (folders.length >= 2) {
    category = folders[0];

    productName =
      folders[folders.length - 1];
  }

  /*
    Structure:
    category/image.jpg
  */
  else if (folders.length === 1) {
    category = folders[0];

    productName =
      removeExtension(filename)
        .replace(/\s*\(\d+\)$/i, "")
        .replace(/\s+\d+$/i, "");
  }

  return {
    category: titleCase(category),
    productName: titleCase(productName),
  };
}

/* =========================================================
   GROUP IMAGES INTO PRODUCTS
========================================================= */

async function scanZip() {
  console.log("");
  console.log("==============================");
  console.log("SCANNING CLOTHING ZIP");
  console.log("==============================");

  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(
      `ZIP not found:\n${ZIP_PATH}`
    );
  }

  const directory =
    await unzipper.Open.file(ZIP_PATH);

  console.log(
    `ZIP entries found: ${directory.files.length}`
  );

  const products = new Map();

  let imageCount = 0;
  let trackPantSkipped = 0;

  for (const entry of directory.files) {
    if (entry.type !== "File") {
      continue;
    }

    const entryPath = entry.path;

    if (isIgnoredFile(entryPath)) {
      continue;
    }

    if (!isImage(entryPath)) {
      continue;
    }

    imageCount++;

    /*
      Skip Track Pants completely
    */
    if (shouldSkip(entryPath)) {
      trackPantSkipped++;

      console.log(
        `👖 SKIP TRACK PANTS: ${entryPath}`
      );

      continue;
    }

    const {
      category,
      productName,
    } = analyzePath(entryPath);

    /*
      Unique grouping key
    */
    const key =
      `${category}|||${productName}`.toLowerCase();

    if (!products.has(key)) {
      products.set(key, {
        name: productName,
        category,
        entries: [],
      });
    }

    products.get(key).entries.push(entry);
  }

  console.log("");
  console.log("==============================");
  console.log("SCAN RESULT");
  console.log("==============================");

  console.log(
    `Images found: ${imageCount}`
  );

  console.log(
    `Track Pant images skipped: ${trackPantSkipped}`
  );

  console.log(
    `Products detected: ${products.size}`
  );

  console.log("");

  for (const product of products.values()) {
    console.log(
      `✅ ${product.category} → ${product.name} → ${product.entries.length} images`
    );
  }

  return [...products.values()];
}

/* =========================================================
   FIND EXISTING MONGODB COLLECTION
========================================================= */

async function findProductCollection(db) {
  const collections =
    await db.listCollections().toArray();

  const names = collections.map(
    (collection) => collection.name
  );

  console.log("");
  console.log(
    "MongoDB collections:",
    names
  );

  /*
    Prefer your existing AXEE collections
  */

  if (names.includes("catalogs")) {
    return "catalogs";
  }

  if (names.includes("catalog")) {
    return "catalog";
  }

  if (names.includes("products")) {
    return "products";
  }

  console.log(
    '⚠️ Existing catalog/product collection not found. Using "products".'
  );

  return "products";
}

/* =========================================================
   FIND EXISTING GRIDFS BUCKET
========================================================= */

async function findGridFSBucket(db) {
  const collections =
    await db.listCollections().toArray();

  const names = collections.map(
    (collection) => collection.name
  );

  /*
    GridFS automatically creates:
      bucket.files
      bucket.chunks
  */

  const buckets = names
    .filter((name) =>
      name.endsWith(".files")
    )
    .map((name) =>
      name.replace(/\.files$/, "")
    );

  console.log(
    "GridFS buckets found:",
    buckets
  );

  /*
    Prefer catalog/image-related bucket
  */

  const preferred =
    buckets.find((bucket) =>
      bucket
        .toLowerCase()
        .includes("catalog")
    ) ||
    buckets.find((bucket) =>
      bucket
        .toLowerCase()
        .includes("image")
    );

  if (preferred) {
    console.log(
      `✅ Using existing GridFS bucket: ${preferred}`
    );

    return preferred;
  }

  /*
    Fallback
  */

  const fallback = "catalogImages";

  console.log(
    `⚠️ Using new GridFS bucket: ${fallback}`
  );

  return fallback;
}

/* =========================================================
   UPLOAD IMAGE TO GRIDFS
========================================================= */

async function uploadImage(
  bucket,
  entry,
  productName
) {
  return new Promise(
    async (resolve, reject) => {
      try {
        const originalName =
          path.basename(entry.path);

        const contentType =
          mime.lookup(originalName) ||
          "application/octet-stream";

        const filename =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${originalName}`;

        const uploadStream =
          bucket.openUploadStream(
            filename,
            {
              contentType,

              metadata: {
                productName,
                originalName,
                source: "Clothing.zip",
              },
            }
          );

        uploadStream.on(
          "error",
          reject
        );

        uploadStream.on(
          "finish",
          () => {
            resolve({
              fileId:
                uploadStream.id.toString(),

              filename,

              originalName,

              contentType,
            });
          }
        );

        const buffer =
          await entry.buffer();

        uploadStream.end(buffer);
      } catch (error) {
        reject(error);
      }
    }
  );
}

/* =========================================================
   CATEGORY DEFAULTS
========================================================= */

function getDefaults(category = "") {
  const value =
    category.toLowerCase();

  if (
    value.includes("t-shirt") ||
    value.includes("tshirt") ||
    value.includes("tee")
  ) {
    return {
      price: 1499,
      stock: 20,
      sizes: ["S", "M", "L", "XL"],
    };
  }

  if (value.includes("shirt")) {
    return {
      price: 1999,
      stock: 20,
      sizes: ["S", "M", "L", "XL"],
    };
  }

  if (value.includes("hoodie")) {
    return {
      price: 2499,
      stock: 15,
      sizes: ["S", "M", "L", "XL"],
    };
  }

  if (
    value.includes("jean") ||
    value.includes("denim") ||
    value.includes("cargo")
  ) {
    return {
      price: 2499,
      stock: 15,
      sizes: [
        "28",
        "30",
        "32",
        "34",
        "36",
      ],
    };
  }

  if (value.includes("jacket")) {
    return {
      price: 2999,
      stock: 15,
      sizes: ["S", "M", "L", "XL"],
    };
  }

  if (
    value.includes("co-ord") ||
    value.includes("coord")
  ) {
    return {
      price: 2999,
      stock: 15,
      sizes: ["S", "M", "L", "XL"],
    };
  }

  return {
    price: 1999,
    stock: 20,
    sizes: ["S", "M", "L", "XL"],
  };
}

/* =========================================================
   IMPORT
========================================================= */

async function importClothing() {
  try {
    console.log("");
    console.log("==============================");
    console.log("AXEE CLOTHING IMPORTER");
    console.log("==============================");

    /*
      STEP 1
      Scan ZIP first
    */

    const products =
      await scanZip();

    if (!products.length) {
      throw new Error(
        "No clothing products detected inside ZIP."
      );
    }

    if (DRY_RUN) {
      console.log("");
      console.log(
        "🧪 DRY_RUN enabled. Nothing uploaded."
      );

      return;
    }

    /*
      STEP 2
      MongoDB connection
    */

    if (!process.env.MONGODB_URL) {
      throw new Error(
        "MONGODB_URL missing from backend/.env"
      );
    }

    console.log("");
    console.log(
      "Connecting to MongoDB..."
    );

    await mongoose.connect(
      process.env.MONGODB_URL
    );

    console.log(
      "✅ MongoDB connected"
    );

    const db =
      mongoose.connection.db;

    /*
      STEP 3
      Detect current product collection
    */

    const collectionName =
      await findProductCollection(db);

    const productCollection =
      db.collection(collectionName);

    console.log(
      `✅ Product collection: ${collectionName}`
    );

    /*
      STEP 4
      Detect current GridFS bucket
    */

    const bucketName =
      await findGridFSBucket(db);

    const bucket =
      new GridFSBucket(db, {
        bucketName,
      });

    /*
      STEP 5
      Import every product
    */

    let inserted = 0;
    let duplicates = 0;
    let failed = 0;
    let uploadedImages = 0;

    console.log("");
    console.log("==============================");
    console.log("STARTING IMPORT");
    console.log("==============================");

    for (const product of products) {
      try {
        console.log("");
        console.log(
          `📦 ${product.name}`
        );

        console.log(
          `Category: ${product.category}`
        );

        /*
          Don't ever import Track Pants
        */

        if (
          shouldSkip(product.name) ||
          shouldSkip(product.category)
        ) {
          console.log(
            "👖 Track Pants skipped."
          );

          continue;
        }

        /*
          Duplicate protection
        */

        if (SKIP_DUPLICATES) {
          const existing =
            await productCollection.findOne({
              name: {
                $regex:
                  `^${escapeRegex(
                    product.name
                  )}$`,
                $options: "i",
              },
            });

          if (existing) {
            duplicates++;

            console.log(
              "⏭️ Already exists. Skipping."
            );

            continue;
          }
        }

        /*
          Upload images
        */

        const images = [];

        for (
          let index = 0;
          index <
          product.entries.length;
          index++
        ) {
          const entry =
            product.entries[index];

          console.log(
            `   Uploading image ${
              index + 1
            }/${product.entries.length}`
          );

          const uploaded =
            await uploadImage(
              bucket,
              entry,
              product.name
            );

          images.push(uploaded);

          uploadedImages++;
        }

        /*
          Defaults
        */

        const defaults =
          getDefaults(
            product.category
          );

        /*
          Product document
        */

        const document = {
          name: product.name,

          slug: product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),

          category:
            product.category,

          brand: "UNBOUND",

          price: defaults.price,

          salePrice:
            defaults.price,

          stock:
            defaults.stock,

          sizes:
            defaults.sizes,

          colors: [],

          description:
            `${product.name} from the UNBOUND clothing collection.`,

          /*
            Keep rich image data
          */

          images,

          /*
            Also useful if your frontend only
            expects image IDs.
          */

          imageIds: images.map(
            (image) => image.fileId
          ),

          active: true,

          featured: false,

          source: "clothing-zip",

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        await productCollection.insertOne(
          document
        );

        inserted++;

        console.log(
          `✅ Added ${product.name}`
        );

        console.log(
          `   ${images.length} images uploaded`
        );
      } catch (error) {
        failed++;

        console.error(
          `❌ Failed: ${product.name}`
        );

        console.error(
          error.message
        );
      }
    }

    /*
      RESULT
    */

    console.log("");
    console.log("==============================");
    console.log("IMPORT COMPLETE");
    console.log("==============================");

    console.log(
      `✅ Products added: ${inserted}`
    );

    console.log(
      `⏭️ Duplicates skipped: ${duplicates}`
    );

    console.log(
      `🖼️ Images uploaded: ${uploadedImages}`
    );

    console.log(
      `❌ Failed: ${failed}`
    );

    console.log(
      "👖 Track Pants were NOT imported."
    );

    console.log("==============================");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error(
      "❌ IMPORT FAILED"
    );

    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

/* =========================================================
   REGEX ESCAPE
========================================================= */

function escapeRegex(value = "") {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* =========================================================
   START
========================================================= */

importClothing();
