import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import connectDB from "./db.js";

import productRoutes from "./routes/productRoutes.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   DATABASE
========================================================= */

connectDB();

/* =========================================================
   EXPRESS
========================================================= */

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],

    credentials: true,
  }),
);

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
   TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message: "AXIEE API is running",
  });
});

/* =========================================================
   PRODUCT ROUTES
========================================================= */

app.use("/api/products", productRoutes);

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
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AXIEE Server running on port ${PORT}`);
});
