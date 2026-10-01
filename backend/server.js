import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
import paymentRoutes from "./routes/paymentRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

/* =========================================================
   MODELS
========================================================= */

import Cart from "./models/Cart.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   __dirname
========================================================= */

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

/* =========================================================
   FRONTEND BUILD
========================================================= */

const frontendDistPath = path.join(__dirname, "../frontend/dist");

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
   PERMANENT PRODUCT IMAGES
========================================================= */

const productImagesPath =
  process.env.PRODUCT_IMAGES_PATH || path.join(__dirname, "product-images");

console.log("📸 Product images path:", productImagesPath);

app.use(
  "/product-images",
  express.static(productImagesPath, {
    maxAge: "7d",

    immutable: false,
  }),
);

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "https://unboundclothing.in",

  "https://www.unboundclothing.in",
];

function isPrivateLocalOrigin(origin) {
  try {
    const url = new URL(origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }

    const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);

    if (match172) {
      const secondPart = Number(match172[1]);

      return secondPart >= 16 && secondPart <= 31;
    }

    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      /*
        Postman, curl,
        backend-to-backend etc.
      */

      if (!origin) {
        return callback(null, true);
      }

      /*
        Production domains
      */

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      /*
        Development:
        localhost,
        192.168.x.x,
        10.x.x.x,
        172.16-31.x.x
      */

      if (
        process.env.NODE_ENV !== "production" &&
        isPrivateLocalOrigin(origin)
      ) {
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
   BODY
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
  "/api/health",

  (_req, res) => {
    return res.status(200).json({
      success: true,

      message: "UNBOUND API is running",

      environment: process.env.NODE_ENV || "development",

      database:
        mongoose.connection.readyState === 1 ? "connected" : "not connected",
    });
  },
);

/* =========================================================
   CART DEBUG LOGGER
========================================================= */

/*
  When Add to Cart
  reaches backend you
  should see:

  🛒 CART API -> POST /api/cart/add

  inside backend terminal.
*/

app.use(
  "/api/cart",

  (req, _res, next) => {
    console.log(`🛒 CART API -> ${req.method} ${req.originalUrl}`);

    next();
  },
);

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/catalog", catalogRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/coupons", couponRoutes);

/* =========================================================
   ADMIN
========================================================= */

app.use("/api/admin-auth", adminAuthRoutes);

/* =========================================================
   PAYMENT
========================================================= */

app.use("/api/payments", paymentRoutes);

/* =========================================================
   API 404
========================================================= */

/*
  IMPORTANT:

  API 404 must come
  BEFORE React fallback.

  This makes frontend receive
  JSON instead of empty response.
*/

app.use(
  "/api",

  (req, res) => {
    return res.status(404).json({
      success: false,

      message: `API route not found: ${req.method} ${req.originalUrl}`,

      method: req.method,

      path: req.originalUrl,
    });
  },
);

/* =========================================================
   REACT BUILD
========================================================= */

app.use(express.static(frontendDistPath));

/* =========================================================
   REACT SPA
========================================================= */

/*
  Only GET requests
  should be sent to
  index.html.

  POST / PATCH / DELETE
  should never fall back
  to React.
*/

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  return res.sendFile(
    path.join(frontendDistPath, "index.html"),

    (error) => {
      if (error) {
        next(error);
      }
    },
  );
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, _req, res, next) => {
  console.error("❌ SERVER ERROR:");

  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    success: false,

    message: error.message || "Internal server error",
  });
});

/* =========================================================
   FIX CART INDEX
========================================================= */

async function fixCartIndexes() {
  try {
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

    const oldUserIndex = indexes.find((index) => index.name === "userId_1");

    if (oldUserIndex) {
      console.log("🗑 Removing old userId_1 index...");

      await collection.dropIndex("userId_1");

      console.log("✅ Old userId_1 index removed");
    }

    /*
      Synchronize indexes
      with Cart model.
    */

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
   START SERVER
========================================================= */

let server = null;

async function startServer() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    /*
      IMPORTANT:

      MongoDB connects
      BEFORE Express starts
      accepting requests.

      This prevents cart /
      checkout requests from
      running while DB is
      disconnected.
    */

    await connectDB();

    console.log("✅ MongoDB connected");

    /*
      Fix old cart indexes
      after connection.
    */

    await fixCartIndexes();

    /*
      Start Express
      only after DB is ready.
    */

    server = app.listen(
      PORT,

      "0.0.0.0",

      () => {
        console.log("");

        console.log("==============================================");

        console.log(`✅ UNBOUND Server running on port ${PORT}`);

        console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);

        console.log("");

        console.log(`🌐 Backend: http://localhost:${PORT}`);

        console.log(`❤️ API Health: http://localhost:${PORT}/api/health`);

        console.log("");

        console.log("✅ Products: /api/products");

        console.log("✅ Cart GET: GET /api/cart/:cartId");

        console.log("✅ Cart ADD: POST /api/cart/add");

        console.log("✅ Cart UPDATE: PATCH /api/cart/:cartId/item/:itemId");

        console.log("✅ Cart REMOVE: DELETE /api/cart/:cartId/item/:itemId");

        console.log("✅ Cart CLEAR: DELETE /api/cart/:cartId/clear");

        console.log("✅ Catalog: /api/catalog");

        console.log("✅ Categories: /api/categories");

        console.log("✅ Orders: /api/orders");

        console.log("✅ Coupons: /api/coupons");

        console.log("✅ Payments: /api/payments");

        console.log("");

        console.log(`📁 React build: ${frontendDistPath}`);

        console.log("==============================================");
      },
    );
  } catch (error) {
    console.error("❌ Server startup failed:");

    console.error(error);

    process.exit(1);
  }
}

startServer();

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

  const closeMongoAndExit = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
      console.error("MongoDB shutdown error:", error);
    }

    process.exit(0);
  };

  /*
    If Express server has
    not started yet.
  */

  if (!server) {
    await closeMongoAndExit();

    return;
  }

  server.close(closeMongoAndExit);
}

/* =========================================================
   PROCESS EVENTS
========================================================= */

process.on(
  "SIGTERM",

  () => shutdown("SIGTERM"),
);

process.on(
  "SIGINT",

  () => shutdown("SIGINT"),
);
