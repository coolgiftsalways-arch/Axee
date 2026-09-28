import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
   PATH SETUP
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
Project:

Axee/
├── backend/
│   └── server.js
└── frontend/
    └── dist/

So from backend/server.js:
../frontend/dist
*/

const frontendDistPath = path.resolve(
  __dirname,
  "../frontend/dist"
);

/* =========================================================
   DNS
========================================================= */

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (error) {
  console.log(
    "DNS override skipped:",
    error.message
  );
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
      /*
        Requests from the frontend on the SAME domain
        do not need cross-origin CORS.

        This also allows:
        - Postman
        - server-to-server
        - requests without Origin
      */

      if (!origin) {
        return callback(null, true);
      }

      /* ===============================
         LOCAL DEVELOPMENT
      =============================== */

      const localhostPattern =
        /^http:\/\/localhost:\d+$/;

      const localhostIpPattern =
        /^http:\/\/127\.0\.0\.1:\d+$/;

      if (
        localhostPattern.test(origin) ||
        localhostIpPattern.test(origin)
      ) {
        return callback(null, true);
      }

      /* ===============================
         PRODUCTION DOMAIN
      =============================== */

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
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
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/* =========================================================
   API HEALTH CHECK
========================================================= */

/*
IMPORTANT:

Do not use "/" for backend health anymore.

"/" belongs to the React frontend.

Backend health is now:

/api/health
*/

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "AXIEE API is running",

      environment:
        process.env.NODE_ENV ||
        "development",

      server: "running",

      mongodb:
        mongoose.connection.readyState === 1
          ? "connected"
          : "not connected",
    });
  }
);

/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/catalog",
  catalogRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

/* =========================================================
   STATIC REACT FRONTEND
========================================================= */

/*
After:

cd frontend
npm run build

Vite creates:

frontend/dist
*/

app.use(
  express.static(frontendDistPath)
);

/* =========================================================
   API 404
========================================================= */

/*
If the URL starts with /api and no API route matched,
return JSON.

Example:

/api/something-that-does-not-exist
*/

app.use(
  "/api",
  (req, res) => {
    res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
);

/* =========================================================
   REACT ROUTER FALLBACK
========================================================= */

/*
Examples:

/
 /shop
 /cart
 /checkout
 /product/123
 /profile

All of those should return React index.html.

Using middleware instead of app.get("*")
also avoids wildcard-routing issues with Express 5.
*/

app.use(
  (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    res.sendFile(
      path.join(
        frontendDistPath,
        "index.html"
      ),
      (error) => {
        if (error) {
          console.error(
            "❌ Frontend file error:",
            error.message
          );

          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message:
                "Frontend build not found. Run npm run build.",
            });
          }
        }
      }
    );
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ SERVER ERROR:"
    );

    console.error(error);

    if (res.headersSent) {
      return next(error);
    }

    res
      .status(
        error.status || 500
      )
      .json({
        success: false,

        message:
          error.message ||
          "Internal server error",
      });
  }
);

/* =========================================================
   FIX OLD CART INDEX
========================================================= */

async function fixCartIndexes() {
  try {
    /*
      Only run when MongoDB
      is actually connected.
    */

    if (
      mongoose.connection.readyState !== 1
    ) {
      console.log(
        "⚠️ Cart index fix skipped - MongoDB not connected"
      );

      return;
    }

    console.log(
      "🔍 Checking cart indexes..."
    );

    const collection =
      mongoose.connection.db.collection(
        "carts"
      );

    const indexes =
      await collection
        .indexes()
        .catch(() => []);

    console.log(
      "📦 Current cart indexes:",
      indexes.map(
        (index) => index.name
      )
    );

    const oldUserIndex =
      indexes.find(
        (index) =>
          index.name === "userId_1"
      );

    if (oldUserIndex) {
      console.log(
        "🗑 Removing old userId_1 index..."
      );

      await collection.dropIndex(
        "userId_1"
      );

      console.log(
        "✅ Old userId_1 index removed"
      );
    }

    await Cart.syncIndexes();

    const updatedIndexes =
      await collection.indexes();

    console.log(
      "✅ Cart indexes:",
      updatedIndexes.map(
        (index) => index.name
      )
    );
  } catch (error) {
    console.error(
      "❌ Cart index fix error:"
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
   START EXPRESS FIRST
========================================================= */

/*
IMPORTANT FOR HOSTINGER:

app.listen() runs immediately.

We don't wait for MongoDB before starting Express.
*/

const server = app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "================================"
    );

    console.log(
      `✅ AXIEE Server running on port ${PORT}`
    );

    console.log(
      `✅ Environment: ${
        process.env.NODE_ENV ||
        "development"
      }`
    );

    console.log(
      `✅ Frontend: /`
    );

    console.log(
      `✅ API Health: /api/health`
    );

    console.log(
      `✅ Products: /api/products`
    );

    console.log(
      `✅ Cart: /api/cart`
    );

    console.log(
      `✅ Catalog: /api/catalog`
    );

    console.log(
      `✅ Categories: /api/categories`
    );

    console.log(
      `✅ Orders: /api/orders`
    );

    console.log(
      "================================"
    );

    console.log("");
  }
);

/* =========================================================
   CONNECT MONGODB AFTER SERVER STARTS
========================================================= */

async function initializeDatabase() {
  try {
    console.log(
      "🔌 Connecting to MongoDB..."
    );

    await connectDB();

    console.log(
      "✅ MongoDB connected"
    );

    await fixCartIndexes();
  } catch (error) {
    /*
      Do NOT process.exit(1).

      Keep Express running if MongoDB
      is temporarily slow/unavailable.
    */

    console.error(
      "❌ MongoDB startup error:"
    );

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
    console.log(
      "✅ Mongoose connection active"
    );
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "❌ Mongoose connection error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.log(
      "⚠️ MongoDB disconnected"
    );
  }
);

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

async function shutdown(signal) {
  console.log(
    `⚠️ ${signal} received. Shutting down...`
  );

  server.close(
    async () => {
      try {
        if (
          mongoose.connection.readyState !== 0
        ) {
          await mongoose.connection.close();
        }
      } catch (error) {
        console.error(
          "MongoDB shutdown error:",
          error
        );
      }

      process.exit(0);
    }
  );
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);