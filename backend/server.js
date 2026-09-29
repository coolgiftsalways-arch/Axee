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

/* =========================================================
   MODELS
========================================================= */

import Cart from "./models/Cart.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   __dirname FOR ES MODULE
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   FRONTEND DIST PATH

   backend/server.js
   frontend/dist
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
   CORS
========================================================= */

const allowedOrigins = [
  "https://unboundclothing.in",
  "https://www.unboundclothing.in",
];

/* =========================================================
   LOCAL NETWORK CHECK

   Allows:
   localhost
   127.0.0.1
   192.168.x.x
   10.x.x.x
   172.16.x.x - 172.31.x.x
========================================================= */

function isPrivateLocalOrigin(origin) {
  try {
    const url = new URL(origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname;

    /* LOCALHOST */

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    /* 192.168.x.x */

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }

    /* 10.x.x.x */

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }

    /* 172.16.x.x - 172.31.x.x */

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

/* =========================================================
   CORS MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin(origin, callback) {
      /* Server/Postman/cURL */

      if (!origin) {
        return callback(null, true);
      }

      /* Production */

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      /* Local development */

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
   API HEALTH

   IMPORTANT:
   Backend health is now /api/health

   "/" is reserved for React frontend.
========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,

    message: "UNBOUND API is running",

    environment: process.env.NODE_ENV || "development",

    database:
      mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/catalog", catalogRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/orders", orderRoutes);

/* =========================================================
   ADMIN AUTH
========================================================= */

app.use("/api/admin-auth", adminAuthRoutes);

/* =========================================================
   RAZORPAY PAYMENT
========================================================= */

app.use("/api/payments", paymentRoutes);

/* =========================================================
   API 404

   IMPORTANT:
   Only /api requests should return JSON 404.

   Do NOT use:
   app.use((req,res) => 404...)

   because that blocks React.
========================================================= */

app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =========================================================
   SERVE REACT/VITE BUILD

   frontend/dist
========================================================= */

app.use(express.static(frontendDistPath));

/* =========================================================
   REACT SPA FALLBACK

   Examples:
   /
   /shop
   /cart
   /checkout
   /product/123
   /admin

   All should return React index.html.

   Using middleware instead of app.get("*")
   because Express 5 wildcard syntax can cause problems.
========================================================= */

app.use((req, res, next) => {
  /* Only React GET requests */

  if (req.method !== "GET") {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) {
      next(error);
    }
  });
});

/* =========================================================
   ERROR HANDLER

   MUST BE AFTER ROUTES + FRONTEND
========================================================= */

app.use((error, req, res, next) => {
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
   FIX OLD CART INDEX
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

    /* ===============================================
       REMOVE OLD userId INDEX
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

   Hostinger can provide process.env.PORT.

   Local fallback = 5000.
========================================================= */

const PORT = process.env.PORT || 5000;

/* =========================================================
   START EXPRESS

   One server serves BOTH:
   - React frontend
   - Node/Express API
========================================================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("");

  console.log("==============================================");

  console.log(`✅ UNBOUND Server running on port ${PORT}`);

  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);

  console.log("");

  console.log(`🌐 Frontend: http://localhost:${PORT}`);

  console.log(`❤️ API Health: http://localhost:${PORT}/api/health`);

  console.log("");

  console.log("✅ Products: /api/products");

  console.log("✅ Cart: /api/cart");

  console.log("✅ Catalog: /api/catalog");

  console.log("✅ Categories: /api/categories");

  console.log("✅ Orders: /api/orders");

  console.log("✅ Payments: /api/payments");

  console.log("✅ Admin Login: /api/admin-auth/login");

  console.log("✅ Admin Verify: /api/admin-auth/verify");

  console.log("");

  console.log(`📁 React build: ${frontendDistPath}`);

  console.log("==============================================");

  console.log("");
});

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

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connection active");
});

mongoose.connection.on("error", (error) => {
  console.error("❌ Mongoose connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

/* =========================================================
   GRACEFUL SHUTDOWN
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

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));
