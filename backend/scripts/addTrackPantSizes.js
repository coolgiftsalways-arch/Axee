import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL;
const DB_NAME = "aixee";

const client = new MongoClient(MONGO_URI);

async function updateSizes() {
  try {
    await client.connect();

    console.log("✅ MongoDB connected");

    const db = client.db(DB_NAME);

    const result = await db.collection("products").updateMany(
      {
        category: "Pants",
      },
      {
        $set: {
          sizes: ["S", "M", "L", "XL"],
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `✅ Updated ${result.modifiedCount} products`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

updateSizes();