import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   LOAD ENV
========================================================= */

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const NEW_MONGODB_URL = process.env.NEW_MONGODB_URL;

const HOSTINGER_IMAGE_BASE =
  "https://unboundclothing.in/product-images";

const MANIFEST_PATH = path.join(
  __dirname,
  "../hostinger-product-images/image-manifest.json"
);

/* =========================================================
   GET GRIDFS ID FROM OLD IMAGE VALUE
========================================================= */

function extractGridFsId(value) {
  if (!value) return null;

  const str = String(value);

  // Already Hostinger URL
  if (str.startsWith(`${HOSTINGER_IMAGE_BASE}/`)) {
    return null;
  }

  // /api/catalog/images/OBJECT_ID
  let match = str.match(
    /\/api\/catalog\/images\/([a-fA-F0-9]{24})/
  );

  if (match) {
    return match[1];
  }

  // /api/images/OBJECT_ID
  match = str.match(
    /\/api\/images\/([a-fA-F0-9]{24})/
  );

  if (match) {
    return match[1];
  }

  // raw ObjectId string
  if (/^[a-fA-F0-9]{24}$/.test(str)) {
    return str;
  }

  return null;
}

/* =========================================================
   CONVERT VALUE TO HOSTINGER URL
========================================================= */

function convertImageToHostinger(value, manifest) {
  if (!value) return null;

  const str = String(value);

  // already correct
  if (str.startsWith(`${HOSTINGER_IMAGE_BASE}/`)) {
    return str;
  }

  // preserve normal external URLs
  if (
    str.startsWith("http://") ||
    str.startsWith("https://")
  ) {
    return str;
  }

  // preserve local upload paths if any still exist
  if (
    str.startsWith("/uploads/") ||
    str.startsWith("uploads/")
  ) {
    return str;
  }

  const id = extractGridFsId(str);

  if (!id) {
    return str;
  }

  const manifestItem = manifest[id];

  if (!manifestItem?.filename) {
    console.warn(`⚠️ Manifest missing for image ID: ${id}`);
    return str;
  }

  return `${HOSTINGER_IMAGE_BASE}/${manifestItem.filename}`;
}

/* =========================================================
   REMOVE DUPLICATES
========================================================= */

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

/* =========================================================
   MAIN
========================================================= */

async function run() {
  let connection;

  try {
    if (!NEW_MONGODB_URL) {
      throw new Error(
        "NEW_MONGODB_URL missing from backend/.env"
      );
    }

    if (!fs.existsSync(MANIFEST_PATH)) {
      throw new Error(
        `Manifest file not found:\n${MANIFEST_PATH}`
      );
    }

    const manifest = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf8")
    );

    console.log("");
    console.log("==============================================");
    console.log("   MOVE PRODUCT IMAGES TO HOSTINGER URLS");
    console.log("==============================================");
    console.log("");

    console.log(
      `📄 Manifest entries: ${Object.keys(manifest).length}`
    );

    console.log("");
    console.log("🔌 Connecting to NEW MongoDB...");

    connection = await mongoose
      .createConnection(NEW_MONGODB_URL)
      .asPromise();

    console.log("✅ NEW MongoDB connected");
    console.log(
      `📁 Database: ${connection.db.databaseName}`
    );

    const productsCollection =
      connection.db.collection("products");

    const totalProducts =
      await productsCollection.countDocuments();

    console.log("");
    console.log(`📦 Products found: ${totalProducts}`);
    console.log("");

    const cursor =
      productsCollection.find({});

    let scanned = 0;
    let updated = 0;
    let unchanged = 0;
    let noImages = 0;

    for await (const product of cursor) {
      scanned++;

      const collectedImages = [];

      /* =====================================================
         MODERN images[]
      ===================================================== */

      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img) {
            collectedImages.push(img);
          }
        }
      }

      /* =====================================================
         SINGLE IMAGE FIELDS
      ===================================================== */

      if (product.image) {
        collectedImages.push(product.image);
      }

      if (product.mainImage) {
        collectedImages.push(product.mainImage);
      }

      /* =====================================================
         LEGACY imageId
      ===================================================== */

      if (product.imageId) {
        collectedImages.push(
          String(product.imageId)
        );
      }

      /* =====================================================
         LEGACY imageIds[]
      ===================================================== */

      if (Array.isArray(product.imageIds)) {
        for (const imageId of product.imageIds) {
          if (imageId) {
            collectedImages.push(
              String(imageId)
            );
          }
        }
      }

      /* =====================================================
         LEGACY imageFiles[]
      ===================================================== */

      if (Array.isArray(product.imageFiles)) {
        const sortedImageFiles =
          [...product.imageFiles].sort(
            (a, b) =>
              Number(a?.order ?? 0) -
              Number(b?.order ?? 0)
          );

        for (const file of sortedImageFiles) {
          if (file?.fileId) {
            collectedImages.push(
              String(file.fileId)
            );
          } else if (file?.url) {
            collectedImages.push(
              file.url
            );
          }
        }
      }

      if (collectedImages.length === 0) {
        noImages++;

        console.log(
          `⏭️ [${scanned}/${totalProducts}] No images: ${
            product.name || product._id
          }`
        );

        continue;
      }

      /* =====================================================
         CONVERT ALL IMAGE REFERENCES
      ===================================================== */

      const convertedImages = unique(
        collectedImages.map((value) =>
          convertImageToHostinger(
            value,
            manifest
          )
        )
      );

      if (convertedImages.length === 0) {
        noImages++;
        continue;
      }

      /*
        Prefer Hostinger URLs first.
        Keep any legacy external/local URLs after them.
      */

      const hostingerImages =
        convertedImages.filter((url) =>
          String(url).startsWith(
            `${HOSTINGER_IMAGE_BASE}/`
          )
        );

      const otherImages =
        convertedImages.filter(
          (url) =>
            !String(url).startsWith(
              `${HOSTINGER_IMAGE_BASE}/`
            )
        );

      const finalImages = unique([
        ...hostingerImages,
        ...otherImages,
      ]);

      const firstImage =
        finalImages[0] || "";

      /* =====================================================
         CHECK WHETHER CHANGE IS REQUIRED
      ===================================================== */

      const oldImages =
        Array.isArray(product.images)
          ? product.images.map(String)
          : [];

      const oldImage =
        product.image
          ? String(product.image)
          : "";

      const oldMainImage =
        product.mainImage
          ? String(product.mainImage)
          : "";

      const sameImages =
        JSON.stringify(oldImages) ===
        JSON.stringify(finalImages);

      const sameImage =
        oldImage === firstImage;

      const sameMainImage =
        oldMainImage === firstImage;

      if (
        sameImages &&
        sameImage &&
        sameMainImage
      ) {
        unchanged++;

        console.log(
          `⏭️ [${scanned}/${totalProducts}] Already updated: ${
            product.name || product._id
          }`
        );

        continue;
      }

      /* =====================================================
         UPDATE PRODUCT
      ===================================================== */

      await productsCollection.updateOne(
        {
          _id: product._id,
        },
        {
          $set: {
            images: finalImages,
            image: firstImage,
            mainImage: firstImage,
          },
        }
      );

      updated++;

      console.log(
        `✅ [${scanned}/${totalProducts}] ${
          product.name || product._id
        } → ${finalImages.length} image(s)`
      );
    }

    console.log("");
    console.log("==============================================");
    console.log("               COMPLETE");
    console.log("==============================================");
    console.log(`Products scanned:   ${scanned}`);
    console.log(`Products updated:   ${updated}`);
    console.log(`Already unchanged:  ${unchanged}`);
    console.log(`No images found:    ${noImages}`);
    console.log("==============================================");
    console.log("");

    console.log(
      "✅ Product image URLs now point to Hostinger where possible."
    );

    console.log("");
    console.log(
      "⚠️ Do NOT delete productImages.files/chunks yet."
    );

    console.log(
      "First test the website, product pages, hover images and cart."
    );
  } catch (error) {
    console.error("");
    console.error("❌ IMAGE URL MIGRATION FAILED");
    console.error(error);
  } finally {
    if (connection) {
      await connection.close();
      console.log("");
      console.log("✅ MongoDB connection closed");
    }
  }
}

run();