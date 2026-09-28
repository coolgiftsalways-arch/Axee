import dns from "node:dns";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./db.js";

/* =========================================================
   ROUTES
========================================================= */

import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";

/* =========================================================
   MODELS
========================================================= */

import Cart from "./models/Cart.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   DNS
========================================================= */

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (error) {
  console.log("DNS override skipped:", error.message);
}

/* =========================================================
   APP
========================================================= */

const app = express();

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "https://unboundclothing.in",
  "https://www.unboundclothing.in",
];

app.use(
  cors({
    origin(origin, callback) {
      /* ===============================================
         POSTMAN / SERVER REQUEST
      =============================================== */

      if (!origin) {
        return callback(null, true);
      }

      /* ===============================================
         LOCALHOST
      =============================================== */

      const localhostPattern = /^http:\/\/localhost:\d+$/;

      const localhostIpPattern = /^http:\/\/127\.0\.0\.1:\d+$/;

      if (localhostPattern.test(origin) || localhostIpPattern.test(origin)) {
        return callback(null, true);
      }

      /* ===============================================
         PRODUCTION
      =============================================== */

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
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
   HEALTH
========================================================= */

app.get(
  "/",

  (req, res) => {
    res.status(200).json({
      success: true,

      message: "AXIEE API is running",

      environment: process.env.NODE_ENV || "development",

      database:
        mongoose.connection.readyState === 1 ? "connected" : "not connected",
    });
  },
);

/* =========================================================
   DATABASE HEALTH
========================================================= */

app.get(
  "/api/health",

  (req, res) => {
    res.status(200).json({
      success: true,

      server: "running",

      mongodb:
        mongoose.connection.readyState === 1 ? "connected" : "not connected",
    });
  },
);

/* =========================================================
   ROUTES
========================================================= */

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/catalog", catalogRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/orders", orderRoutes);

/* =========================================================
   ADMIN LOGIN ROUTE
========================================================= */

app.use("/api/admin-auth", adminAuthRoutes);

/* =========================================================
   404

   KEEP AFTER ALL ROUTES
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

    message: error.message || "Internal server error",
  });
});

/* =========================================================
   FIX OLD CART INDEX
========================================================= */

async function fixCartIndexes() {
  try {
    /* ===============================================
       DATABASE CHECK
    =============================================== */

    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Cart index fix skipped - MongoDB not connected");

      return;
    }

    console.log("🔍 Checking cart indexes...");

    const collection = mongoose.connection.db.collection("carts");

    const indexes = await collection.indexes().catch(() => []);

    console.log(
      "📦 Current cart indexes:",
      indexes.map((index) => index.name),
    );

    /* ===============================================
       REMOVE OLD INDEX
    =============================================== */

    const oldUserIndex = indexes.find((index) => index.name === "userId_1");

    if (oldUserIndex) {
      console.log("🗑 Removing old userId_1 index...");

      await collection.dropIndex("userId_1");

      console.log("✅ Old userId_1 index removed");
    }

    /* ===============================================
       SYNC CURRENT CART INDEXES
    =============================================== */

    await Cart.syncIndexes();

    const updatedIndexes = await collection.indexes();

    console.log(
      "✅ Cart indexes:",
      updatedIndexes.map((index) => index.name),
    );
  } catch (error) {
    console.error("❌ Cart index fix error:");

    console.error(error);
  }
}

/* =========================================================
   PORT
========================================================= */

const PORT = process.env.PORT || 5000;

/* =========================================================
   START EXPRESS

   START FIRST SO HOSTINGER DOES NOT WAIT FOR MONGODB.
========================================================= */

const server = app.listen(
  PORT,

  () => {
    console.log("");

    console.log("================================");

    console.log(`✅ AXIEE Server running on port ${PORT}`);

    console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);

    console.log("✅ Health: /");

    console.log("✅ Products: /api/products");

    console.log("✅ Cart: /api/cart");

    console.log("✅ Catalog: /api/catalog");

    console.log("✅ Categories: /api/categories");

    console.log("✅ Orders: /api/orders");

    console.log("✅ Admin Login: /api/admin-auth/login");

    console.log("✅ Admin Verify: /api/admin-auth/verify");

    console.log("================================");

    console.log("");
  },
);

/* =========================================================
   CONNECT DATABASE
========================================================= */

async function initializeDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await connectDB();

    console.log("✅ MongoDB connected");

    await fixCartIndexes();
  } catch (error) {
    /*
      Do not stop Express.
      Hostinger can continue running
      while MongoDB reconnects.
    */

    console.error("❌ MongoDB startup error:");

    console.error(error);
  }
}

/* =========================================================
   INITIALIZE DATABASE
========================================================= */

initializeDatabase();

/* =========================================================
   MONGOOSE EVENTS
========================================================= */

mongoose.connection.on(
  "connected",

  () => {
    console.log("✅ Mongoose connection active");
  },
);

mongoose.connection.on(
  "error",

  (error) => {
    console.error("❌ Mongoose connection error:", error.message);
  },
);

mongoose.connection.on(
  "disconnected",

  () => {
    console.log("⚠️ MongoDB disconnected");
  },
);

/* =========================================================
   SHUTDOWN
========================================================= */

async function shutdown(signal) {
  console.log(`⚠️ ${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
      console.error("MongoDB shutdown error:", error);
    }

    process.exit(0);
  });
}

process.on(
  "SIGTERM",

  () => shutdown("SIGTERM"),
);

process.on(
  "SIGINT",

  () => shutdown("SIGINT"),
);
