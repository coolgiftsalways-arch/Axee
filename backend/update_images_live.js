
import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dns.setServers(["1.1.1.1", "8.8.8.8"]);



import Product from "./models/Product.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

// First run: false = preview only.
// Actual update: set APPLY_IMAGE_UPDATE=true
const APPLY_UPDATE =
  process.env.APPLY_IMAGE_UPDATE === "true";

const UPDATED_JSON = path.join(
  __dirname,
  "all_products_export_IMAGES_UPDATED.json"
);

const BACKUP_FILE = path.join(
  __dirname,
  `image_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
);

const REPORT_FILE = path.join(
  __dirname,
  "live_image_update_report.json"
);

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getProducts(data) {
  if (Array.isArray(data)) return data;

  for (const key of ["products", "data", "items"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  throw new Error("Product array not found in updated JSON.");
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function run() {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL missing from environment.");
    }

    if (!fs.existsSync(UPDATED_JSON)) {
      throw new Error(`Updated JSON not found: ${UPDATED_JSON}`);
    }

    console.log("\n====================================");
    console.log("UNBOUND LIVE IMAGE UPDATE");
    console.log("====================================");

    console.log(
      APPLY_UPDATE
        ? "MODE: LIVE UPDATE"
        : "MODE: DRY RUN — NO DATABASE CHANGES"
    );

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB connected.");

    // Read validated JSON
    const data = JSON.parse(
      fs.readFileSync(UPDATED_JSON, "utf8")
    );

    const exportedProducts = getProducts(data);

    const updates = [];
    const report = [];

    // --------------------------------------------------
    // VALIDATE PRODUCTS
    // --------------------------------------------------

    for (const item of exportedProducts) {
      const id = String(item._id || "");

      if (!mongoose.Types.ObjectId.isValid(id)) {
        continue;
      }

      const images = item.images;

      // Only process records with the new ID-based filenames.
      if (
        !Array.isArray(images) ||
        images.length === 0 ||
        !images.every((url) => {
          const filename = path.posix.basename(
            String(url).split("?")[0]
          );

          return filename.startsWith(`${id}_`);
        })
      ) {
        continue;
      }

      const name = String(item.name || "").trim();
      const category = String(item.category || "").trim();

      if (!name || !category) {
        report.push({
          id,
          name,
          status: "SKIPPED_MISSING_NAME_OR_CATEGORY"
        });
        continue;
      }

      const cleanImages = images.map((url) =>
        String(url).trim()
      );

      if (cleanImages.some((url) => !url.startsWith("/product-images/"))) {
        report.push({
          id,
          name,
          status: "SKIPPED_INVALID_IMAGE_PATH"
        });
        continue;
      }

      updates.push({
        id,
        name,
        category,
        images: cleanImages
      });
    }

    console.log("\nValidated update candidates:", updates.length);

    if (updates.length !== 659) {
      throw new Error(
        `Expected 659 candidates, found ${updates.length}. Stopping safely.`
      );
    }

    // --------------------------------------------------
    // READ CURRENT DATABASE RECORDS
    // --------------------------------------------------

    const ids = updates.map((item) =>
      new mongoose.Types.ObjectId(item.id)
    );

    const currentProducts = await Product.find(
      { _id: { $in: ids } },
      {
        name: 1,
        category: 1,
        images: 1,
        image: 1,
        mainImage: 1
      }
    ).lean();

    const currentById = new Map(
      currentProducts.map((item) => [
        String(item._id),
        item
      ])
    );

    const validUpdates = [];

    for (const item of updates) {
      const current = currentById.get(item.id);

      if (!current) {
        report.push({
          id: item.id,
          name: item.name,
          status: "NOT_FOUND_IN_LIVE_DATABASE"
        });
        continue;
      }

      // Verify live product name and category too.
      if (
        current.name.trim() !== item.name ||
        current.category.trim().toUpperCase() !==
          item.category.toUpperCase()
      ) {
        report.push({
          id: item.id,
          name: item.name,
          status: "LIVE_NAME_OR_CATEGORY_MISMATCH"
        });
        continue;
      }

      validUpdates.push({
        ...item,
        oldImages: current.images || [],
        oldImage: current.image || "",
        oldMainImage: current.mainImage || ""
      });
    }

    console.log("Live products found:", currentProducts.length);
    console.log("Live products validated:", validUpdates.length);

    // Stop if any product does not match.
    if (
      validUpdates.length !== 659 ||
      currentProducts.length !== 659
    ) {
      throw new Error(
        "Live validation failed. No image updates were performed."
      );
    }

    // --------------------------------------------------
    // CREATE BACKUP BEFORE ANY UPDATE
    // --------------------------------------------------

    const backup = validUpdates.map((item) => ({
      _id: item.id,
      name: item.name,
      category: item.category,
      images: item.oldImages,
      image: item.oldImage,
      mainImage: item.oldMainImage
    }));

    fs.writeFileSync(
      BACKUP_FILE,
      JSON.stringify(backup, null, 2),
      "utf8"
    );

    console.log("\nImage backup created:");
    console.log(BACKUP_FILE);

    // --------------------------------------------------
    // DRY RUN
    // --------------------------------------------------

    if (!APPLY_UPDATE) {
      console.log("\nDRY RUN COMPLETE.");
      console.log("Products ready for update:", validUpdates.length);
      console.log("No live database fields were changed.");

      fs.writeFileSync(
        REPORT_FILE,
        JSON.stringify({
          mode: "DRY_RUN",
          candidates: updates.length,
          validated: validUpdates.length,
          report,
          backup: BACKUP_FILE
        }, null, 2)
      );

      return;
    }

    // --------------------------------------------------
    // LIVE UPDATE
    // Only three image fields are changed.
    // --------------------------------------------------

    console.log("\nStarting live image update...");

    const operations = validUpdates.map((item) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(item.id),
          name: item.name,
          category: item.category
        },
        update: {
          $set: {
            images: item.images,
            image: item.images[0],
            mainImage: item.images[0]
          }
        }
      }
    }));

    const result = await Product.bulkWrite(
      operations,
      { ordered: false }
    );

    console.log("\n====================================");
    console.log("LIVE UPDATE SUMMARY");
    console.log("====================================");

    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);
    console.log("Backup:", BACKUP_FILE);

    report.push({
      status: "LIVE_UPDATE_COMPLETE",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(report, null, 2),
      "utf8"
    );

    console.log("Report:", REPORT_FILE);

  } catch (error) {
    console.error("\nUPDATE STOPPED:");
    console.error(error.message);

    process.exitCode = 1;

  } finally {
    await mongoose.disconnect().catch(() => {});
    console.log("\nMongoDB connection closed.");
  }
}

run();
