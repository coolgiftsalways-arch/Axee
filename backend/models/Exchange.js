import mongoose from "mongoose";

/* =========================================================
   EXCHANGE

   One document = one exchange request for one order item.

   Status flow
   ---------------------------------------------------------
   requested ──► approved ──► pickup_scheduled ──► received
       │             │                                │
       ▼             ▼                                ▼
   rejected      rejected                 inspection_passed ──► replacement_shipped ──► completed
   cancelled                              inspection_failed  (item sent back to customer)
========================================================= */

export const EXCHANGE_STATUSES = [
  "requested",
  "approved",
  "pickup_scheduled",
  "received",
  "inspection_passed",
  "replacement_shipped",
  "completed",
  "rejected",
  "inspection_failed",
  "cancelled",
];

export const EXCHANGE_REASONS = [
  "size_too_small",
  "size_too_big",
  "fit",
  "colour",
  "not_as_expected",
  "changed_mind",
  "other",
];

const productSnapshotSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const shipmentSchema = new mongoose.Schema(
  {
    courier: { type: String, default: "", trim: true },
    awb: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: EXCHANGE_STATUSES, required: true },
    note: { type: String, default: "", trim: true },
    by: { type: String, enum: ["customer", "admin", "system"], default: "system" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const exchangeSchema = new mongoose.Schema(
  {
    exchangeNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* ORIGINAL ORDER */

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    orderNumber: { type: String, required: true, index: true },

    // Position of the item inside order.items
    itemIndex: { type: Number, required: true, min: 0 },

    item: { type: productSnapshotSchema, required: true },

    quantity: { type: Number, required: true, min: 1, default: 1 },

    customer: {
      name: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true },
    },

    /* WHY */

    reason: { type: String, enum: EXCHANGE_REASONS, required: true },

    reasonNote: { type: String, default: "", trim: true, maxlength: 500 },

    /* WHAT THEY WANT INSTEAD */

    replacement: {
      type: {
        type: String,
        enum: ["size", "product"],
        required: true,
      },
      productId: { type: String, default: "" },
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      size: { type: String, default: "" },
      price: { type: Number, default: 0, min: 0 },
    },

    /* CUSTOMER DECLARATIONS */

    declarations: {
      notWashed: { type: Boolean, required: true },
      noStains: { type: Boolean, required: true },
      acceptedAt: { type: Date, default: Date.now },
    },

    /* WINDOW */

    deliveredAt: { type: Date, required: true },

    windowEndsAt: { type: Date, required: true },

    /* STATUS */

    status: {
      type: String,
      enum: EXCHANGE_STATUSES,
      default: "requested",
      index: true,
    },

    rejectionReason: { type: String, default: "", trim: true },

    adminNote: { type: String, default: "", trim: true },

    pickup: { type: shipmentSchema, default: () => ({}) },

    replacementShipment: { type: shipmentSchema, default: () => ({}) },

    history: { type: [historySchema], default: [] },
  },
  {
    timestamps: true,
  },
);

exchangeSchema.index({ order: 1, itemIndex: 1 });

const Exchange =
  mongoose.models.Exchange || mongoose.model("Exchange", exchangeSchema);

export default Exchange;
