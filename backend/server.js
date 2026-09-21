import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./db.js";

import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";

/* =========================================================
   DNS
========================================================= */

dns.setServers(["8.8.8.8", "8.8.4.4"]);

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   APP
========================================================= */

const app = express();

/* =========================================================
   CORS

   Allow your Vite frontend.
   Your current frontend is running on port 5178.
========================================================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",

      "http://localhost:5178",
      "http://127.0.0.1:5178",
    ],

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
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AXIEE API is running",
  });
});

/* =========================================================
   API ROUTES
========================================================= */

/* PRODUCTS */

app.use("/api/products", productRoutes);

/* CART */

app.use("/api/cart", cartRoutes);

/* CATALOG */

app.use("/api/catalog", catalogRoutes);

/* =========================================================
   404

   IMPORTANT:
   This MUST stay BELOW all API routes.
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
  console.error("SERVER ERROR:");
  console.error(error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

/* =========================================================
   PORT
========================================================= */

const PORT = process.env.PORT || 5000;

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ AXIEE Server running on port ${PORT}`);

      console.log(`✅ API: http://localhost:${PORT}`);

      console.log(`✅ Products: http://localhost:${PORT}/api/products`);

      console.log(`✅ Cart: http://localhost:${PORT}/api/cart`);

      console.log(`✅ Catalog: http://localhost:${PORT}/api/catalog`);
    });
  } catch (error) {
    console.error("❌ Server startup error:");

    console.error(error);

    process.exit(1);
  }
}

/* =========================================================
   START
========================================================= */

startServer();
