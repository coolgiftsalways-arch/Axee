import { MongoClient, GridFSBucket } from "mongodb";
import AdmZip from "adm-zip";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

// ======================================================
// MongoDB config
// ======================================================

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL;

const DB_NAME =
  process.env.MONGO_DB_NAME ||
  process.env.DB_NAME ||
  "aixee";

// ZIP should be inside backend folder
const ZIP_PATH = path.resolve(process.cwd(), "YesYes Pants.zip");

// ======================================================
// Validation
// ======================================================

if (!MONGO_URI) {
  console.error("❌ MongoDB URL is missing in your .env");
  console.error("");
  console.error("Your .env should contain:");
  console.error("MONGODB_URL=your_mongodb_connection_string");
  process.exit(1);
}

if (!fs.existsSync(ZIP_PATH)) {
  console.error("❌ ZIP file not found:");
  console.error(ZIP_PATH);
  console.error("");
  console.error("Put 'YesYes Pants.zip' inside:");
  console.error(process.cwd());
  process.exit(1);
}

console.log("✅ MongoDB environment variable found");
console.log(`📦 Database: ${DB_NAME}`);
console.log(`🗜️ ZIP: ${ZIP_PATH}`);

// ======================================================
// Mongo client
// ======================================================

const client = new MongoClient(MONGO_URI);

// ======================================================
// Helpers
// ======================================================

const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpeg" || ext === ".jpg") return "image/jpeg";

  return "application/octet-stream";
};

const isImage = (filename) => {
  const lowerName = filename.toLowerCase();

  return (
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp")
  );
};

const naturalSort = (a, b) => {
  return a.filename.localeCompare(b.filename, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

// ======================================================
// Upload image to GridFS
// ======================================================

async function uploadBuffer(
  bucket,
  buffer,
  filename,
  productName,
  order
) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        productName,
        order,
        contentType: getContentType(filename),
        uploadedAt: new Date(),
      },
    });

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id,
        filename,
      });
    });

    uploadStream.end(buffer);
  });
}

// ======================================================
// Main importer
// ======================================================

async function startImport() {
  try {
    console.log("");
    console.log("🔌 Connecting to MongoDB...");

    await client.connect();

    console.log("✅ MongoDB connected");

    const db = client.db(DB_NAME);

    const productsCollection = db.collection("products");

    const bucket = new GridFSBucket(db, {
      bucketName: "productImages",
    });

    console.log("");
    console.log("🗜️ Reading ZIP file...");

    const zip = new AdmZip(ZIP_PATH);

    const entries = zip.getEntries();

    const products = new Map();

    // ==================================================
    // Read products from ZIP
    // ==================================================

    for (const entry of entries) {
      // Ignore folders
      if (entry.isDirectory) {
        continue;
      }

      // Ignore Mac metadata
      if (
        entry.entryName.startsWith("__MACOSX/") ||
        entry.entryName.includes("/__MACOSX/")
      ) {
        continue;
      }

      // Ignore hidden files
      if (
        entry.entryName.includes("/._") ||
        entry.entryName.endsWith(".DS_Store")
      ) {
        continue;
      }

      // Only accept images
      if (!isImage(entry.entryName)) {
        continue;
      }

      /*
        Expected ZIP structure:

        YesYes Pants/
          Flower Rivet Denim Pants Brown/
            image1.jpg
            image2.jpg

          Fond Trek Pants Brown/
            image1.jpg
            image2.jpg
      */

      const parts = entry.entryName
        .split("/")
        .filter((part) => part.trim() !== "");

      if (parts.length < 3) {
        console.log(
          `⚠️ Skipping unexpected path: ${entry.entryName}`
        );
        continue;
      }

      // First folder = YesYes Pants
      // Second folder = Product Name
      const productName = parts[1].trim();

      const filename = parts[parts.length - 1].trim();

      if (!productName || !filename) {
        continue;
      }

      if (!products.has(productName)) {
        products.set(productName, []);
      }

      products.get(productName).push({
        entry,
        filename,
      });
    }

    console.log("");
    console.log("======================================");
    console.log(`📦 Found ${products.size} products`);
    console.log("======================================");
    console.log("");

    if (products.size === 0) {
      console.error("❌ No products found inside ZIP.");
      return;
    }

    let importedProducts = 0;
    let skippedProducts = 0;
    let totalUploadedImages = 0;

    // ==================================================
    // Import each product
    // ==================================================

    for (const [productName, unsortedImages] of products) {
      console.log("--------------------------------------");
      console.log(`👖 Product: ${productName}`);

      // Sort image names naturally
      const imageEntries = [...unsortedImages].sort(naturalSort);

      console.log(`🖼️ Images: ${imageEntries.length}`);

      // ================================================
      // Prevent duplicate products
      // ================================================

      const existingProduct = await productsCollection.findOne({
        name: {
          $regex: `^${escapeRegex(productName)}$`,
          $options: "i",
        },
      });

      if (existingProduct) {
        console.log(
          `⚠️ Product already exists. Skipping: ${productName}`
        );

        skippedProducts++;

        continue;
      }

      const uploadedImages = [];

      // ================================================
      // Upload images
      // ================================================

      for (let i = 0; i < imageEntries.length; i++) {
        const { entry, filename } = imageEntries[i];

        console.log(
          `   ⬆️ Uploading ${i + 1}/${imageEntries.length}: ${filename}`
        );

        const buffer = entry.getData();

        const uploaded = await uploadBuffer(
          bucket,
          buffer,
          filename,
          productName,
          i
        );

        const imageURL = `/api/images/${uploaded.id.toString()}`;

        uploadedImages.push({
          fileId: uploaded.id,
          filename: uploaded.filename,
          url: imageURL,
          order: i,
        });

        totalUploadedImages++;
      }

      // ================================================
      // Create product
      // ================================================

      const productDocument = {
        name: productName,

        category: "Pants",

        // First image becomes main image
        image:
          uploadedImages.length > 0
            ? uploadedImages[0].url
            : "",

        mainImage:
          uploadedImages.length > 0
            ? uploadedImages[0].url
            : "",

        // Simple URL list
        images: uploadedImages.map((img) => img.url),

        // Full image information
        imageFiles: uploadedImages,

        price: 699,
originalPrice: 699,

        stock: 0,

        description: "",

        sizes: [],

        colors: [],

        isActive: true,

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      const result =
        await productsCollection.insertOne(productDocument);

      console.log(`✅ Product imported`);
      console.log(`   MongoDB ID: ${result.insertedId}`);

      importedProducts++;
    }

    // ==================================================
    // Summary
    // ==================================================

    console.log("");
    console.log("======================================");
    console.log("🎉 IMPORT FINISHED");
    console.log("======================================");

    console.log(`📦 ZIP products found: ${products.size}`);
    console.log(`✅ Products imported: ${importedProducts}`);
    console.log(`⚠️ Products skipped: ${skippedProducts}`);
    console.log(`🖼️ Images uploaded: ${totalUploadedImages}`);

    console.log("");
    console.log(`📂 Database: ${DB_NAME}`);

    console.log("");
    console.log("MongoDB collections:");
    console.log("• products");
    console.log("• productImages.files");
    console.log("• productImages.chunks");

    console.log("");
    console.log("✅ Done.");
  } catch (error) {
    console.error("");
    console.error("❌ IMPORT ERROR");
    console.error("--------------------------------------");

    if (error?.code === 8000) {
      console.error("MongoDB username/password may be incorrect.");
    } else if (
      error?.message?.includes("ENOTFOUND") ||
      error?.message?.includes("querySrv")
    ) {
      console.error("MongoDB DNS/network connection problem.");
    } else {
      console.error(error);
    }
  } finally {
    try {
      await client.close();
      console.log("🔌 MongoDB connection closed");
    } catch {
      // Ignore close errors
    }
  }
}

// ======================================================
// Regex helper for duplicate check
// ======================================================

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ======================================================
// Start
// ======================================================

startImport();