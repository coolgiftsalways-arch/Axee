import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
<<<<<<< HEAD
import connectDB from "./db.js";
import productRoutes from "./routes/productRoutes.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
=======
import mongoose from "mongoose";
import cors from "cors";

import cartRoutes from "./routes/cartRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
>>>>>>> origin/nikita

dotenv.config();

const app = express();

<<<<<<< HEAD
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);
=======
app.use(cors());

app.use(express.json());
>>>>>>> origin/nikita

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AXIEE API is running",
  });
});

app.use("/api/products", productRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use("/api/cart", cartRoutes);
app.use("/api/catalog", catalogRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log("AXIEE Server running on port " + PORT);
  });
}

startServer().catch((error) => {
  console.error("Server startup error:");
  console.error(error);
});
