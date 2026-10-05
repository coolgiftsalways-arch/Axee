import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

/* =========================================================
   CONFIG
========================================================= */

const MANIFEST_PATH = path.resolve(
  "clothing2-import-manifest.json"
);

const SOURCE_TAG = "clothing-2-import";

/* =========================================================
   HELPERS
========================================================= */

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeUniqueSlug(baseSlug, index) {
  if (!index) return baseSlug;

  return `${baseSlug}-${index}`;
}

/* =========================================================
   MAIN
========================================================= */

async function run() {
  console.log("\n======================================");
  console.log(" CLOTHING 2 → MONGODB IMPORT");
  console.log("======================================\n");

  /* =======================================================
     CHECK ENV
  ======================================================= */

  if (!process.env.MONGODB_URL) {
    console.error("❌ MONGODB_URL missing in .env");
    process.exit(1);
  }

  /* =======================================================
     CHECK MANIFEST
  ======================================================= */

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(
      "❌ Manifest not found:",
      MANIFEST_PATH
    );

    process.exit(1);
  }

  const manifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf8")
  );

  const productsToImport =
    Array.isArray(manifest?.products)
      ? manifest.products
      : [];

  console.log(
    `Products in manifest: ${productsToImport.length}`
  );

  if (productsToImport.length === 0) {
    console.error("❌ No products found in manifest");
    process.exit(1);
  }

  /* =======================================================
     CONNECT MONGODB
  ======================================================= */

  await mongoose.connect(
    process.env.MONGODB_URL
  );

  console.log("✅ MongoDB connected");

  console.log(
    "Database:",
    mongoose.connection.db.databaseName
  );

  const products =
    mongoose.connection.db.collection(
      "products"
    );

  /* =======================================================
     COUNTERS
  ======================================================= */

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  /* =======================================================
     IMPORT PRODUCTS
  ======================================================= */

  for (const item of productsToImport) {
    try {
      const productName =
        String(item?.name || "").trim();

      if (!productName) {
        console.log(
          "⚠ SKIP product with no name"
        );

        skipped++;
        continue;
      }

      /* ===================================================
         SKIP IF THIS NEW BATCH PRODUCT ALREADY EXISTS
      =================================================== */

      const existing =
        await products.findOne({
          name: {
            $regex: `^${escapeRegex(
              productName
            )}$`,
            $options: "i",
          },

          source: SOURCE_TAG,
        });

      if (existing) {
        console.log(
          `⏭ SKIP already imported: ${productName}`
        );

        skipped++;
        continue;
      }

      /* ===================================================
         UNIQUE SLUG
      =================================================== */

      const baseSlug =
        String(item?.slug || "")
          .trim()
          .toLowerCase();

      let slug =
        baseSlug ||
        productName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      let slugIndex = 0;

      while (
        await products.findOne({
          slug,
        })
      ) {
        slugIndex++;

        slug = makeUniqueSlug(
          baseSlug ||
            productName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, ""),
          slugIndex
        );
      }

      /* ===================================================
         IMAGES
      =================================================== */

      const images =
        Array.isArray(item?.images)
          ? item.images.filter(Boolean)
          : [];

      const mainImage =
        item?.mainImage ||
        item?.image ||
        images[0] ||
        "";

      /* ===================================================
         CREATE PRODUCT
      =================================================== */

      const now = new Date();

      const document = {
        name: productName,

        slug,

        category:
          String(item?.category || "")
            .trim()
            .toUpperCase(),

        price: 0,

        oldPrice: 0,

        description: "",

        shortDescription: "",

        images,

        image: mainImage,

        mainImage,

        colors: [],

        sizes: [
          {
            size: "S",
            stock: 0,
          },
          {
            size: "M",
            stock: 0,
          },
          {
            size: "L",
            stock: 0,
          },
          {
            size: "XL",
            stock: 0,
          },
        ],

        fit: "",

        material: "",

        style: "",

        gender: "UNISEX",

        totalStock: 0,

        featured: false,

        bestSeller: false,

        rating: 0,

        reviewCount: 0,

        soldCount: 0,

        keywords: [
          String(item?.category || "")
            .toLowerCase()
            .trim(),

          "unbound",
        ].filter(Boolean),

        source: SOURCE_TAG,

        originalCategory:
          item?.originalCategory || "",

        isActive: false,

        createdAt: now,

        updatedAt: now,
      };

      /* ===================================================
         INSERT
      =================================================== */

      await products.insertOne(
        document
      );

      console.log(
        `✅ IMPORTED: ${productName} → ${document.category}`
      );

      inserted++;
    } catch (error) {
      console.error(
        `❌ FAILED: ${item?.name || "Unknown product"}`
      );

      console.error(
        error?.message || error
      );

      failed++;
    }
  }

  /* =======================================================
     FINAL COUNTS
  ======================================================= */

  const totalNow =
    await products.countDocuments({});

  const newBatchTotal =
    await products.countDocuments({
      source: SOURCE_TAG,
    });

  console.log("\n======================================");

  console.log(`Inserted: ${inserted}`);

  console.log(`Skipped: ${skipped}`);

  console.log(`Failed: ${failed}`);

  console.log(
    `New batch total: ${newBatchTotal}`
  );

  console.log(
    `MongoDB total now: ${totalNow}`
  );

  console.log("======================================\n");

  await mongoose.disconnect();

  console.log(
    "✅ MongoDB disconnected"
  );
}

/* =========================================================
   RUN
========================================================= */

run().catch(async (error) => {
  console.error(
    "❌ IMPORT ERROR:",
    error
  );

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});