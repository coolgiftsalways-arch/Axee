import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ShiprocketShipment from "../models/ShiprocketShipment.js";
import Exchange, {
  EXCHANGE_REASONS,
  EXCHANGE_STATUSES,
} from "../models/Exchange.js";

import { requireAdmin } from "../middleware/adminMiddleware.js";
import { sendExchangeEmail } from "../utils/exchangeEmail.js";

const router = express.Router();

/* =========================================================
   POLICY SETTINGS
========================================================= */

export const EXCHANGE_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/*
  Statuses that do NOT use up an item's exchange.
  - rejected:  we said no (e.g. outside policy) — customer may fix and retry
  - cancelled: customer withdrew the request
  Every other status (including inspection_failed and completed)
  counts as the one exchange allowed per unit.
*/
const RELEASED_STATUSES = ["rejected", "cancelled"];

const OPEN_STATUSES = [
  "requested",
  "approved",
  "pickup_scheduled",
  "received",
  "inspection_passed",
  "replacement_shipped",
];

/*
  Which status an admin may move an exchange to from each status.
  Anything else is refused, so the flow can never skip a step.
*/
const ADMIN_TRANSITIONS = {
  requested: ["approved", "rejected"],
  approved: ["pickup_scheduled", "received", "rejected"],
  pickup_scheduled: ["received", "rejected"],
  received: ["inspection_passed", "inspection_failed"],
  inspection_passed: ["replacement_shipped"],
  replacement_shipped: ["completed"],
  completed: [],
  rejected: [],
  inspection_failed: [],
  cancelled: [],
};

/* =========================================================
   HELPERS
========================================================= */

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const cleanText = (value, max = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

const lastTen = (value) => digitsOnly(value).slice(-10);

const sameSize = (a, b) =>
  String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase();

/*
  The customer proves the order is theirs with the phone number
  or email used at checkout.
*/
const contactMatchesOrder = (order, contact) => {
  const value = String(contact ?? "").trim();

  if (!value) return false;

  if (value.includes("@")) {
    return (
      value.toLowerCase() === String(order?.customer?.email || "").toLowerCase()
    );
  }

  const given = lastTen(value);

  return given.length === 10 && given === lastTen(order?.customer?.phone);
};

const findOrderByNumber = (orderNumber) => {
  const clean = cleanText(orderNumber, 60);

  if (!clean) return null;

  return Order.findOne({
    orderNumber: { $regex: `^${escapeRegex(clean)}$`, $options: "i" },
  });
};

/*
  When was the order delivered?
  1. order.deliveredAt (set when admin marks delivered)
  2. order marked delivered before deliveredAt existed → updatedAt
  3. Shiprocket says delivered → shipment updatedAt
*/
const getDeliveryInfo = async (order) => {
  if (order.orderStatus === "cancelled") {
    return { delivered: false, deliveredAt: null };
  }

  if (order.deliveredAt) {
    return { delivered: true, deliveredAt: new Date(order.deliveredAt) };
  }

  if (order.orderStatus === "delivered") {
    return { delivered: true, deliveredAt: new Date(order.updatedAt || order.createdAt) };
  }

  const shipment = await ShiprocketShipment.findOne({ orderId: order._id })
    .select("status updatedAt")
    .lean();

  if (shipment?.status === "delivered") {
    return { delivered: true, deliveredAt: new Date(shipment.updatedAt) };
  }

  return { delivered: false, deliveredAt: null };
};

const buildWindow = (deliveredAt) => {
  const windowEndsAt = new Date(deliveredAt.getTime() + EXCHANGE_WINDOW_DAYS * DAY_MS);

  const msLeft = windowEndsAt.getTime() - Date.now();

  return {
    windowEndsAt,
    open: msLeft > 0,
    daysLeft: Math.max(0, Math.ceil(msLeft / DAY_MS)),
  };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const loadProduct = async (productId) => {
  if (!isValidObjectId(productId)) return null;

  return Product.findById(productId).lean();
};

const productImage = (product) =>
  product?.images?.[0]?.url ||
  product?.images?.[0] ||
  product?.mainImage ||
  product?.image ||
  "";

/*
  Can this size of this product be sent out right now?
*/
const sizeAvailability = (product, size, quantity = 1) => {
  if (!product || product.isActive === false) {
    return { ok: false, message: "This product is no longer available." };
  }

  if (product.isOutOfStock) {
    return { ok: false, message: `${product.name} is out of stock.` };
  }

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  if (sizes.length === 0) {
    const stock = Number(product.totalStock || 0);

    return stock >= quantity
      ? { ok: true }
      : { ok: false, message: `${product.name} is out of stock.` };
  }

  const entry = sizes.find((item) => sameSize(item.size, size));

  if (!entry) {
    return { ok: false, message: `Size ${size || "—"} doesn't exist for ${product.name}.` };
  }

  if (entry.isOutOfStock || Number(entry.stock || 0) < quantity) {
    return { ok: false, message: `Size ${entry.size} of ${product.name} is out of stock.` };
  }

  return { ok: true, size: entry.size };
};

const sizeOptions = (product) => {
  if (!product || !Array.isArray(product.sizes)) return [];

  return product.sizes.map((entry) => ({
    size: entry.size,
    available:
      product.isActive !== false &&
      !product.isOutOfStock &&
      !entry.isOutOfStock &&
      Number(entry.stock || 0) > 0,
  }));
};

/*
  How many units of an order item are still exchangeable.
*/
const usedQuantityByItem = async (orderId) => {
  const exchanges = await Exchange.find({
    order: orderId,
    status: { $nin: RELEASED_STATUSES },
  })
    .select("itemIndex quantity")
    .lean();

  return exchanges.reduce((map, exchange) => {
    map[exchange.itemIndex] = (map[exchange.itemIndex] || 0) + exchange.quantity;
    return map;
  }, {});
};

const generateExchangeNumber = async () => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const number = `EXC-${Math.floor(100000 + Math.random() * 900000)}`;

    // eslint-disable-next-line no-await-in-loop
    const exists = await Exchange.exists({ exchangeNumber: number });

    if (!exists) return number;
  }

  return `EXC-${Date.now().toString().slice(-8)}`;
};

/* What the customer is allowed to see about their request. */
const publicExchange = (exchange) => ({
  exchangeNumber: exchange.exchangeNumber,
  orderNumber: exchange.orderNumber,
  status: exchange.status,
  item: exchange.item,
  quantity: exchange.quantity,
  reason: exchange.reason,
  reasonNote: exchange.reasonNote,
  replacement: exchange.replacement,
  rejectionReason: exchange.rejectionReason,
  pickup: exchange.pickup,
  replacementShipment: exchange.replacementShipment,
  windowEndsAt: exchange.windowEndsAt,
  createdAt: exchange.createdAt,
  updatedAt: exchange.updatedAt,
  history: (exchange.history || []).map(({ status, note, at }) => ({ status, note, at })),
});

const notify = (exchange, event) => {
  sendExchangeEmail(exchange, event).catch((error) => {
    console.error(`❌ EXCHANGE EMAIL (${event}) FAILED:`, error.message);
  });
};

/* =========================================================
   CUSTOMER — LOOK UP AN ORDER
   POST /api/exchanges/lookup
   { orderNumber, contact }
========================================================= */

router.post("/lookup", async (req, res) => {
  try {
    const { orderNumber, contact } = req.body || {};

    if (!cleanText(orderNumber) || !cleanText(contact)) {
      return fail(res, 400, "Enter your order number and the phone number or email used at checkout.");
    }

    const order = await findOrderByNumber(orderNumber);

    // Same message for "no such order" and "wrong contact" so order
    // numbers can't be guessed.
    if (!order || !contactMatchesOrder(order, contact)) {
      return fail(res, 404, "We couldn't find an order with those details. Check the order number and the phone or email you used at checkout.");
    }

    const { delivered, deliveredAt } = await getDeliveryInfo(order);

    const existing = await Exchange.find({ order: order._id })
      .sort({ createdAt: -1 })
      .lean();

    const base = {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      customerName: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" "),
      exchanges: existing.map(publicExchange),
    };

    if (!delivered) {
      return res.json({
        success: true,
        order: {
          ...base,
          delivered: false,
          windowOpen: false,
          notice:
            order.orderStatus === "cancelled"
              ? "This order was cancelled, so it can't be exchanged."
              : `Your order hasn't been delivered yet. Your ${EXCHANGE_WINDOW_DAYS}-day exchange window starts on the day it's delivered.`,
        },
        items: [],
      });
    }

    const window = buildWindow(deliveredAt);

    const used = await usedQuantityByItem(order._id);

    const items = await Promise.all(
      order.items.map(async (item, index) => {
        const product = await loadProduct(item.productId);

        const remaining = Math.max(0, Number(item.quantity || 1) - Number(used[index] || 0));

        let blockedReason = "";

        if (!window.open) {
          blockedReason = `The ${EXCHANGE_WINDOW_DAYS}-day exchange window ended on ${window.windowEndsAt.toDateString()}.`;
        } else if (remaining === 0) {
          blockedReason = "An exchange has already been requested for this item.";
        }

        return {
          index,
          productId: item.productId,
          name: item.name,
          image: item.image || productImage(product),
          size: item.size,
          color: item.color,
          price: item.price,
          quantity: item.quantity,
          exchangeableQuantity: window.open ? remaining : 0,
          eligible: Boolean(window.open && remaining > 0),
          blockedReason,
          productAvailable: Boolean(product && product.isActive !== false),
          sizeOptions: sizeOptions(product).filter((option) => !sameSize(option.size, item.size)),
        };
      }),
    );

    return res.json({
      success: true,
      order: {
        ...base,
        delivered: true,
        deliveredAt,
        windowEndsAt: window.windowEndsAt,
        windowOpen: window.open,
        daysLeft: window.daysLeft,
        notice: window.open
          ? ""
          : `The ${EXCHANGE_WINDOW_DAYS}-day exchange window for this order ended on ${window.windowEndsAt.toDateString()}.`,
      },
      items,
    });
  } catch (error) {
    console.error("❌ EXCHANGE LOOKUP ERROR:", error);
    return fail(res, 500, "Something went wrong. Please try again.");
  }
});

/* =========================================================
   CUSTOMER — PRODUCTS THEY CAN SWAP TO
   GET /api/exchanges/products?maxPrice=1499
   Only active, in-stock products priced at or below the
   item they're exchanging.
========================================================= */

router.get("/products", async (req, res) => {
  try {
    const maxPrice = Number(req.query.maxPrice || 0);

    if (!(maxPrice > 0)) {
      return fail(res, 400, "maxPrice is required.");
    }

    const products = await Product.find({
      isActive: { $ne: false },
      isOutOfStock: { $ne: true },
      price: { $lte: maxPrice },
    })
      .select("name price category images mainImage image sizes totalStock isActive isOutOfStock")
      .sort({ name: 1 })
      .limit(300)
      .lean();

    const list = products
      .map((product) => ({
        _id: String(product._id),
        name: product.name,
        price: product.price,
        category: product.category,
        image: productImage(product),
        sizes: sizeOptions(product),
        hasSizes: Array.isArray(product.sizes) && product.sizes.length > 0,
      }))
      .filter((product) =>
        product.hasSizes ? product.sizes.some((size) => size.available) : true,
      );

    return res.json({ success: true, products: list });
  } catch (error) {
    console.error("❌ EXCHANGE PRODUCTS ERROR:", error);
    return fail(res, 500, "Could not load products.");
  }
});

/* =========================================================
   CUSTOMER — CREATE REQUEST
   POST /api/exchanges
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      orderNumber,
      contact,
      itemIndex,
      quantity = 1,
      reason,
      reasonNote = "",
      replacement = {},
      declarations = {},
    } = req.body || {};

    /* ---------- order + ownership ---------- */

    const order = await findOrderByNumber(orderNumber);

    if (!order || !contactMatchesOrder(order, contact)) {
      return fail(res, 404, "We couldn't find an order with those details.");
    }

    const { delivered, deliveredAt } = await getDeliveryInfo(order);

    if (!delivered) {
      return fail(res, 400, `This order hasn't been delivered yet. You can request an exchange once it arrives.`);
    }

    const window = buildWindow(deliveredAt);

    if (!window.open) {
      return fail(res, 400, `The ${EXCHANGE_WINDOW_DAYS}-day exchange window for this order ended on ${window.windowEndsAt.toDateString()}.`);
    }

    /* ---------- item + quantity ---------- */

    const index = Number(itemIndex);

    const item = Number.isInteger(index) ? order.items[index] : null;

    if (!item) {
      return fail(res, 400, "Please choose the item you want to exchange.");
    }

    const qty = Math.floor(Number(quantity));

    const used = await usedQuantityByItem(order._id);

    const remaining = Math.max(0, Number(item.quantity || 1) - Number(used[index] || 0));

    if (remaining === 0) {
      return fail(res, 409, "An exchange has already been requested for this item.");
    }

    if (!Number.isInteger(qty) || qty < 1 || qty > remaining) {
      return fail(res, 400, `You can exchange up to ${remaining} of this item.`);
    }

    /* ---------- reason ---------- */

    if (!EXCHANGE_REASONS.includes(reason)) {
      return fail(res, 400, "Please tell us why you're exchanging it.");
    }

    if (reason === "other" && !cleanText(reasonNote)) {
      return fail(res, 400, "Please add a short note explaining the reason.");
    }

    /* ---------- the 2 conditions ---------- */

    if (declarations?.notWashed !== true || declarations?.noStains !== true) {
      return fail(res, 400, "Please confirm the item hasn't been washed and has no stains. Washed or stained items can't be exchanged.");
    }

    /* ---------- replacement ---------- */

    let replacementData;

    if (replacement?.type === "size") {
      const product = await loadProduct(item.productId);

      if (!product) {
        return fail(res, 400, "This product is no longer available in other sizes. Please choose a different product instead.");
      }

      if (sameSize(replacement.size, item.size)) {
        return fail(res, 400, "Please choose a different size from the one you have.");
      }

      const check = sizeAvailability(product, replacement.size, qty);

      if (!check.ok) {
        return fail(res, 409, check.message);
      }

      replacementData = {
        type: "size",
        productId: String(product._id),
        name: product.name,
        image: item.image || productImage(product),
        size: check.size || cleanText(replacement.size, 20),
        price: Number(item.price || 0),
      };
    } else if (replacement?.type === "product") {
      const product = await loadProduct(replacement.productId);

      if (!product) {
        return fail(res, 400, "Please choose the product you'd like instead.");
      }

      if (Number(product.price || 0) > Number(item.price || 0)) {
        return fail(res, 400, `You can swap for any piece priced up to ₹${Number(item.price).toLocaleString("en-IN")}.`);
      }

      const check = sizeAvailability(product, replacement.size, qty);

      if (!check.ok) {
        return fail(res, 409, check.message);
      }

      if (String(product._id) === String(item.productId) && sameSize(check.size || replacement.size, item.size)) {
        return fail(res, 400, "That's the same item and size you already have.");
      }

      replacementData = {
        type: "product",
        productId: String(product._id),
        name: product.name,
        image: productImage(product),
        size: check.size || cleanText(replacement.size, 20),
        price: Number(product.price || 0),
      };
    } else {
      return fail(res, 400, "Choose whether you want a different size or a different product.");
    }

    /* ---------- create ---------- */

    const now = new Date();

    const exchange = await Exchange.create({
      exchangeNumber: await generateExchangeNumber(),
      order: order._id,
      orderNumber: order.orderNumber,
      itemIndex: index,
      item: {
        productId: item.productId,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color,
        price: item.price,
      },
      quantity: qty,
      customer: {
        name: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" "),
        email: order.customer?.email,
        phone: order.customer?.phone,
      },
      reason,
      reasonNote: cleanText(reasonNote),
      replacement: replacementData,
      declarations: { notWashed: true, noStains: true, acceptedAt: now },
      deliveredAt,
      windowEndsAt: window.windowEndsAt,
      status: "requested",
      history: [{ status: "requested", by: "customer", at: now, note: "Exchange requested" }],
    });

    notify(exchange, "requested");

    return res.status(201).json({
      success: true,
      message: "Exchange requested.",
      exchange: publicExchange(exchange),
    });
  } catch (error) {
    console.error("❌ CREATE EXCHANGE ERROR:", error);
    return fail(res, 500, "We couldn't submit your request. Please try again.");
  }
});

/* =========================================================
   CUSTOMER — TRACK
   POST /api/exchanges/track { exchangeNumber, contact }
========================================================= */

const findOwnExchange = async (exchangeNumber, contact) => {
  const clean = cleanText(exchangeNumber, 30).toUpperCase();

  if (!clean) return null;

  const exchange = await Exchange.findOne({ exchangeNumber: clean });

  if (!exchange) return null;

  const matches = contactMatchesOrder(
    { customer: { email: exchange.customer?.email, phone: exchange.customer?.phone } },
    contact,
  );

  return matches ? exchange : null;
};

router.post("/track", async (req, res) => {
  try {
    const exchange = await findOwnExchange(req.body?.exchangeNumber, req.body?.contact);

    if (!exchange) {
      return fail(res, 404, "We couldn't find an exchange with those details.");
    }

    return res.json({ success: true, exchange: publicExchange(exchange) });
  } catch (error) {
    console.error("❌ TRACK EXCHANGE ERROR:", error);
    return fail(res, 500, "Something went wrong. Please try again.");
  }
});

/* =========================================================
   CUSTOMER — CANCEL (only before we approve it)
   POST /api/exchanges/cancel { exchangeNumber, contact }
========================================================= */

router.post("/cancel", async (req, res) => {
  try {
    const exchange = await findOwnExchange(req.body?.exchangeNumber, req.body?.contact);

    if (!exchange) {
      return fail(res, 404, "We couldn't find an exchange with those details.");
    }

    if (exchange.status !== "requested") {
      return fail(res, 409, "This exchange has already been approved, so it can't be cancelled online. Please contact us.");
    }

    exchange.status = "cancelled";
    exchange.history.push({ status: "cancelled", by: "customer", note: "Cancelled by customer" });

    await exchange.save();

    return res.json({ success: true, exchange: publicExchange(exchange) });
  } catch (error) {
    console.error("❌ CANCEL EXCHANGE ERROR:", error);
    return fail(res, 500, "Something went wrong. Please try again.");
  }
});

/* =========================================================
   ADMIN — LIST
   GET /api/exchanges/admin?status=requested&search=EXC-1
========================================================= */

router.get("/admin", requireAdmin, async (req, res) => {
  try {
    const status = cleanText(req.query.status, 40);
    const search = cleanText(req.query.search, 80);

    const filter = {};

    if (status === "open") {
      filter.status = { $in: OPEN_STATUSES };
    } else if (EXCHANGE_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { exchangeNumber: regex },
        { orderNumber: regex },
        { "customer.name": regex },
        { "customer.email": regex },
        { "customer.phone": regex },
        { "item.name": regex },
      ];
    }

    const [exchanges, grouped] = await Promise.all([
      Exchange.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
      Exchange.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const counts = Object.fromEntries(EXCHANGE_STATUSES.map((key) => [key, 0]));

    grouped.forEach((group) => {
      counts[group._id] = group.count;
    });

    counts.open = OPEN_STATUSES.reduce((total, key) => total + (counts[key] || 0), 0);
    counts.all = Object.values(counts).reduce((total, value) => total + value, 0) - counts.open;

    return res.json({ success: true, exchanges, counts });
  } catch (error) {
    console.error("❌ ADMIN EXCHANGES ERROR:", error);
    return fail(res, 500, "Could not load exchanges.");
  }
});

/* =========================================================
   ADMIN — DETAIL (with live stock of the replacement)
   GET /api/exchanges/admin/:id
========================================================= */

router.get("/admin/:id", requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid exchange ID.");
    }

    const exchange = await Exchange.findById(req.params.id).lean();

    if (!exchange) {
      return fail(res, 404, "Exchange not found.");
    }

    const [order, product] = await Promise.all([
      Order.findById(exchange.order)
        .select("orderNumber shippingAddress paymentMethod paymentStatus total createdAt deliveredAt orderStatus")
        .lean(),
      loadProduct(exchange.replacement?.productId),
    ]);

    const stock = sizeAvailability(product, exchange.replacement?.size, exchange.quantity);

    return res.json({
      success: true,
      exchange,
      order,
      replacementStock: { available: stock.ok, message: stock.ok ? "In stock" : stock.message },
      allowedNext: ADMIN_TRANSITIONS[exchange.status] || [],
    });
  } catch (error) {
    console.error("❌ ADMIN EXCHANGE DETAIL ERROR:", error);
    return fail(res, 500, "Could not load this exchange.");
  }
});

/* =========================================================
   ADMIN — MOVE TO NEXT STATUS
   PATCH /api/exchanges/admin/:id/status
   { status, note, rejectionReason, courier, awb }
========================================================= */

router.patch("/admin/:id/status", requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid exchange ID.");
    }

    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) {
      return fail(res, 404, "Exchange not found.");
    }

    const next = cleanText(req.body?.status, 40);
    const note = cleanText(req.body?.note);
    const allowed = ADMIN_TRANSITIONS[exchange.status] || [];

    if (!allowed.includes(next)) {
      return fail(res, 400, `Can't move an exchange from "${exchange.status}" to "${next}".`);
    }

    if (next === "rejected" || next === "inspection_failed") {
      const reason = cleanText(req.body?.rejectionReason);

      if (!reason) {
        return fail(res, 400, "Please write the reason — the customer will see it.");
      }

      exchange.rejectionReason = reason;
    }

    // Make sure we can actually send the replacement before saying yes,
    // and again before marking it shipped.
    if (next === "approved" || next === "replacement_shipped") {
      const product = await loadProduct(exchange.replacement?.productId);
      const stock = sizeAvailability(product, exchange.replacement?.size, exchange.quantity);

      if (!stock.ok) {
        return fail(res, 409, `${stock.message} Contact the customer to choose something else, or reject with a reason.`);
      }
    }

    if (next === "pickup_scheduled") {
      exchange.pickup = {
        courier: cleanText(req.body?.courier, 80),
        awb: cleanText(req.body?.awb, 80),
      };
    }

    if (next === "replacement_shipped") {
      const awb = cleanText(req.body?.awb, 80);

      if (!awb) {
        return fail(res, 400, "Add the tracking / AWB number of the replacement shipment.");
      }

      exchange.replacementShipment = {
        courier: cleanText(req.body?.courier, 80),
        awb,
      };
    }

    exchange.status = next;

    exchange.history.push({
      status: next,
      by: "admin",
      note: note || (next === "rejected" || next === "inspection_failed" ? exchange.rejectionReason : ""),
    });

    await exchange.save();

    notify(exchange, next);

    return res.json({
      success: true,
      message: "Exchange updated.",
      exchange,
      allowedNext: ADMIN_TRANSITIONS[exchange.status] || [],
    });
  } catch (error) {
    console.error("❌ ADMIN EXCHANGE STATUS ERROR:", error);
    return fail(res, 500, "Could not update this exchange.");
  }
});

/* =========================================================
   ADMIN — INTERNAL NOTE
   PATCH /api/exchanges/admin/:id/note { adminNote }
========================================================= */

router.patch("/admin/:id/note", requireAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid exchange ID.");
    }

    const exchange = await Exchange.findByIdAndUpdate(
      req.params.id,
      { adminNote: cleanText(req.body?.adminNote, 2000) },
      { new: true },
    );

    if (!exchange) {
      return fail(res, 404, "Exchange not found.");
    }

    return res.json({ success: true, exchange });
  } catch (error) {
    console.error("❌ ADMIN EXCHANGE NOTE ERROR:", error);
    return fail(res, 500, "Could not save the note.");
  }
});

export default router;
