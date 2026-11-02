import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import fs from "fs";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

async function scanDatabase() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB Connected!\n");

    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();

    console.log("========== ALL COLLECTIONS ==========");

    const summary = [];

    for (const item of collections) {
      const name = item.name;
      const collection = db.collection(name);

      const count = await collection.countDocuments();

      console.log(`\nCollection: ${name}`);
      console.log(`Documents: ${count}`);

      summary.push({
        collection: name,
        totalDocuments: count,
      });

      // Skip GridFS binary chunks
      if (name.endsWith(".chunks") || name.includes(".files")) {
        continue;
      }

      // Inspect likely product collections
      if (/product|item|catalog|fashion|inventory/i.test(name)) {
        const samples = await collection.find({}).limit(3).toArray();

        console.log("Sample documents:");

        console.log(JSON.stringify(samples, null, 2));
      }
    }

    fs.writeFileSync(
      "mongodb_collection_summary.json",
      JSON.stringify(summary, null, 2),
    );

    console.log("\n========== SCAN COMPLETED ==========");
  } catch (error) {
    console.error("SCAN ERROR:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

scanDatabase();
