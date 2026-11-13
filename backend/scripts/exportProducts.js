
import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportProducts() {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error("MongoDB connection URI not found in backend/.env");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoUri);

    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    const products = await db
      .collection("products")
      .find({})
      .toArray();

    const outputPath = path.join(
      __dirname,
      "..",
      "all_products_export.json"
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(products, null, 2),
      "utf8"
    );

    console.log("--------------------------------");
    console.log("PRODUCT EXPORT COMPLETED!");
    console.log("Total Products:", products.length);
    console.log("Saved at:", outputPath);
    console.log("--------------------------------");

  } catch (error) {
    console.error("EXPORT FAILED:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

exportProducts();
