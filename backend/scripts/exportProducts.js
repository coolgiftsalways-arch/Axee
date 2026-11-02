import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import fs from "node:fs";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

async function exportProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB Connected!");

    const db = mongoose.connection.db;

    const products = await db.collection("products").find({}).toArray();

    console.log("Total Products:", products.length);

    const formattedProducts = products.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      category: p.category,
      brand: p.brand || "",
      price: p.price,
      originalPrice: p.originalPrice,
      sku: p.sku,
      slug: p.slug,
      image: p.image,
      mainImage: p.mainImage,
      images: p.images || [],
      imageFiles: p.imageFiles || [],
    }));

    fs.writeFileSync(
      "all_products_export.json",
      JSON.stringify(formattedProducts, null, 2),
    );

    console.log("Export completed!");
    console.log("File: all_products_export.json");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

exportProducts();
