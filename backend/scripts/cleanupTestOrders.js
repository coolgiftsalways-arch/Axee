import mongoose from "mongoose";
import dotenv from "dotenv";

import Order from "../models/Order.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   SETTINGS

   Put the SAME email you used while testing checkout.
========================================================= */

const CUSTOMER_EMAIL = "YOUR_EMAIL_HERE@gmail.com".trim().toLowerCase();

/*
  SAFETY MODE

  true:
  Shows what will be deleted.
  Does NOT delete anything.

  false:
  Actually deletes the old orders.
*/

const DRY_RUN = true;

/*
  Number of newest orders to keep.

  You currently want to keep only
  your newest order containing
  the 4 tracks.
*/

const KEEP_NEWEST = 1;

/* =========================================================
   MONGODB CONNECTION
========================================================= */

const connectDB = async () => {
  const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("MONGODB_URL is missing from backend/.env");
  }

  await mongoose.connect(mongoUrl);

  console.log("");
  console.log("✅ MongoDB connected");
  console.log("");
};

/* =========================================================
   MONEY
========================================================= */

const money = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN");
};

/* =========================================================
   SHOW ONE ORDER
========================================================= */

const showOrder = (order, index) => {
  console.log("--------------------------------------------------");

  console.log(`ORDER ${index + 1}`);

  console.log("Order Number:", order.orderNumber);

  console.log("Mongo ID:", order._id.toString());

  console.log("Created:", formatDate(order.createdAt));

  console.log("Status:", order.orderStatus);

  console.log("Payment:", order.paymentMethod);

  console.log("Total:", money(order.total));

  console.log("Items:", order.items?.length || 0);

  console.log("");

  if (Array.isArray(order.items)) {
    order.items.forEach((item, itemIndex) => {
      console.log(`   ${itemIndex + 1}. ${item.name}`);

      console.log(`      Qty: ${item.quantity || 1}`);

      console.log(`      Size: ${item.size || "-"}`);

      console.log(`      Color: ${item.color || "-"}`);

      console.log(`      Price: ${money(item.price)}`);

      console.log(`      Line Total: ${money(item.lineTotal)}`);

      console.log("");
    });
  }
};

/* =========================================================
   CLEANUP
========================================================= */

const cleanupTestOrders = async () => {
  try {
    /* ===============================================
         CONNECT
      =============================================== */

    await connectDB();

    /* ===============================================
         EMAIL CHECK
      =============================================== */

    if (!CUSTOMER_EMAIL || CUSTOMER_EMAIL.includes("your_email_here")) {
      throw new Error("Please put your real testing email in CUSTOMER_EMAIL.");
    }

    console.log("Searching orders for:", CUSTOMER_EMAIL);

    console.log("");

    /* ===============================================
         FIND ALL ORDERS

         newest first
      =============================================== */

    const orders = await Order.find({
      "customer.email": CUSTOMER_EMAIL,
    }).sort({
      createdAt: -1,
    });

    /* ===============================================
         NO ORDERS
      =============================================== */

    if (orders.length === 0) {
      console.log("❌ No orders found for this email.");

      return;
    }

    console.log(`Found ${orders.length} orders.`);

    console.log("");

    console.log("==============================================");

    console.log("ALL ORDERS");

    console.log("==============================================");

    console.log("");

    /* ===============================================
         SHOW ALL ORDERS
      =============================================== */

    orders.forEach((order, index) => {
      showOrder(order, index);
    });

    /* ===============================================
         KEEP / DELETE SPLIT
      =============================================== */

    const ordersToKeep = orders.slice(0, KEEP_NEWEST);

    const ordersToDelete = orders.slice(KEEP_NEWEST);

    /* ===============================================
         KEEP
      =============================================== */

    console.log("");
    console.log("==============================================");

    console.log("✅ ORDERS THAT WILL BE KEPT");

    console.log("==============================================");

    console.log("");

    ordersToKeep.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber}`);

      console.log(`   Total: ${money(order.total)}`);

      console.log(`   Products: ${order.items?.length || 0}`);

      console.log(`   Created: ${formatDate(order.createdAt)}`);

      console.log("");

      order.items?.forEach((item) => {
        console.log(`   ✅ ${item.name} x${item.quantity || 1}`);
      });

      console.log("");
    });

    /* ===============================================
         DELETE LIST
      =============================================== */

    console.log("==============================================");

    console.log("❌ OLD ORDERS THAT WILL BE DELETED");

    console.log("==============================================");

    console.log("");

    if (ordersToDelete.length === 0) {
      console.log("Nothing to delete.");

      console.log("");

      console.log("Your customer already has only the newest order.");

      return;
    }

    ordersToDelete.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber}`);

      console.log(`   Total: ${money(order.total)}`);

      console.log(`   Products: ${order.items?.length || 0}`);

      console.log(`   Created: ${formatDate(order.createdAt)}`);

      console.log("");
    });

    /* ===============================================
         TOTALS
      =============================================== */

    console.log("==============================================");

    console.log("SUMMARY");

    console.log("==============================================");

    console.log("Current orders:", orders.length);

    console.log("Keeping:", ordersToKeep.length);

    console.log("Deleting:", ordersToDelete.length);

    console.log("");

    /* ===============================================
         DRY RUN

         NOTHING WILL BE DELETED
      =============================================== */

    if (DRY_RUN) {
      console.log("⚠️ DRY RUN MODE IS ON");

      console.log("");

      console.log("Nothing has been deleted.");

      console.log("");

      console.log("CHECK THE ORDER UNDER:");

      console.log("✅ ORDERS THAT WILL BE KEPT");

      console.log("");

      console.log("Make sure that is your NEWEST 4-track order.");

      console.log("");

      console.log("If correct, open this file and change:");

      console.log("");

      console.log("const DRY_RUN = true;");

      console.log("");

      console.log("to:");

      console.log("");

      console.log("const DRY_RUN = false;");

      console.log("");

      console.log("Then run the script again.");

      return;
    }

    /* ===============================================
         ACTUAL DELETE
      =============================================== */

    const deleteIds = ordersToDelete.map((order) => order._id);

    console.log("Deleting old test orders...");

    const result = await Order.deleteMany({
      _id: {
        $in: deleteIds,
      },
    });

    /* ===============================================
         RESULT
      =============================================== */

    console.log("");
    console.log("==============================================");

    console.log("✅ CLEANUP COMPLETE");

    console.log("==============================================");

    console.log("");

    console.log("Deleted:", result.deletedCount);

    console.log("Kept:", ordersToKeep.length);

    console.log("");

    /* ===============================================
         VERIFY DATABASE
      =============================================== */

    const remainingOrders = await Order.find({
      "customer.email": CUSTOMER_EMAIL,
    }).sort({
      createdAt: -1,
    });

    console.log("Orders remaining:", remainingOrders.length);

    console.log("");

    remainingOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber}`);

      console.log(`   Total: ${money(order.total)}`);

      console.log(`   Products: ${order.items?.length || 0}`);

      console.log("");

      order.items?.forEach((item) => {
        console.log(`   ✅ ${item.name} x${item.quantity || 1}`);
      });

      console.log("");
    });

    console.log("Now refresh Admin → Customers.");
  } catch (error) {
    console.error("");
    console.error("❌ Cleanup error:");

    console.error(error.message);
  } finally {
    /* ===============================================
         DISCONNECT
      =============================================== */

    try {
      await mongoose.disconnect();

      console.log("");
      console.log("MongoDB disconnected.");
    } catch (disconnectError) {
      console.error("Disconnect error:", disconnectError.message);
    }
  }
};

/* =========================================================
   RUN
========================================================= */

cleanupTestOrders();
