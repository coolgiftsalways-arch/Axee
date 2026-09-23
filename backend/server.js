import dns from "node:dns";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./db.js";

import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import Cart from "./models/Cart.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   DNS
========================================================= */

dns.setServers(["8.8.8.8", "8.8.4.4"]);

/* =========================================================
   APP
========================================================= */

const app = express();

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman/backend calls without Origin.
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost Vite ports such as 5173, 5174, 5178, etc.
      const localhostPattern = /^http:\/\/localhost:\d+$/;
      const localhostIpPattern = /^http:\/\/127\.0\.0\.1:\d+$/;

      if (
        localhostPattern.test(origin) ||
        localhostIpPattern.test(origin)
      ) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);

      return callback(
        new Error(`CORS blocked origin: ${origin}`),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AXIEE API is running",
  });
});

/* =========================================================
   ROUTES
========================================================= */

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/catalog", catalogRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/orders", orderRoutes);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error("❌ SERVER ERROR:");
  console.error(error);

  res.status(error.status || 500).json({
    success: false,
    message:
      error.message ||
      "Internal server error",
  });
});

/* =========================================================
   FIX OLD CART INDEX
========================================================= */

async function fixCartIndexes() {
  try {
    console.log(
      "🔍 Checking cart indexes...",
    );

    const collection =
      mongoose.connection.db.collection(
        "carts",
      );

    const indexes =
      await collection
        .indexes()
        .catch(() => []);

    console.log(
      "📦 Current cart indexes:",
      indexes.map(
        (index) => index.name,
      ),
    );

    const oldUserIndex =
      indexes.find(
        (index) =>
          index.name === "userId_1",
      );

    if (oldUserIndex) {
      console.log(
        "🗑 Removing old userId_1 index...",
      );

      await collection.dropIndex(
        "userId_1",
      );

      console.log(
        "✅ Old userId_1 index removed",
      );
    }

    await Cart.syncIndexes();

    const updatedIndexes =
      await collection.indexes();

    console.log(
      "✅ Cart indexes:",
      updatedIndexes.map(
        (index) => index.name,
      ),
    );
  } catch (error) {
    console.error(
      "❌ Cart index fix error:",
    );

    console.error(error);
  }
}

/* =========================================================
   PORT
========================================================= */

const PORT =
  process.env.PORT || 5000;

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    /* =========================
       CONNECT MONGODB
    ========================= */

    await connectDB();

    console.log(
      "✅ MongoDB connected",
    );

    /* =========================
       FIX CART INDEX
    ========================= */

    await fixCartIndexes();

    /* =========================
       START EXPRESS
    ========================= */

    app.listen(PORT, () => {
      console.log("");
      console.log(
        "================================",
      );

      console.log(
        `✅ AXIEE Server running on port ${PORT}`,
      );

      console.log(
        `✅ API: http://localhost:${PORT}`,
      );

      console.log(
        `✅ Products: http://localhost:${PORT}/api/products`,
      );

      console.log(
        `✅ Cart: http://localhost:${PORT}/api/cart`,
      );

      console.log(
        `✅ Catalog: http://localhost:${PORT}/api/catalog`,
      );

      console.log(
        `✅ Categories: http://localhost:${PORT}/api/categories`,
      );

      console.log(
        `✅ Orders: http://localhost:${PORT}/api/orders`,
      );

      console.log(
        "================================",
      );

      console.log("");
    });
  } catch (error) {
    console.error(
      "❌ Server startup error:",
    );

    console.error(error);

    process.exit(1);
  }
}

/* =========================================================
   START
========================================================= */

startServer();
