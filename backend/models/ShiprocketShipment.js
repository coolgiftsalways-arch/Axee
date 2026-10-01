import mongoose from "mongoose";

const shiprocketShipmentSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         LOCAL ORDER
      ===================================================== */

      orderId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref:
          "Order",

        required:
          true,

        unique:
          true,

        index:
          true,
      },

      orderNumber: {
        type:
          String,

        default:
          "",

        index:
          true,
      },

      /* =====================================================
         LOCAL SHIPPING STATUS
      ===================================================== */

      status: {
        type:
          String,

        enum: [
          "not_sent",
          "order_created",
          "awb_assigned",
          "pickup_scheduled",
          "in_transit",
          "delivered",
          "failed",
        ],

        default:
          "not_sent",

        index:
          true,
      },

      /* =====================================================
         SHIPROCKET IDS
      ===================================================== */

      shiprocketOrderId: {
        type:
          String,

        default:
          "",
      },

      shipmentId: {
        type:
          String,

        default:
          "",
      },

      /* =====================================================
         AWB / COURIER
      ===================================================== */

      awb: {
        type:
          String,

        default:
          "",

        index:
          true,
      },

      courierId: {
        type:
          String,

        default:
          "",
      },

      courierName: {
        type:
          String,

        default:
          "",
      },

      /* =====================================================
         PICKUP
      ===================================================== */

      pickupScheduled: {
        type:
          Boolean,

        default:
          false,
      },

      pickupScheduledAt: {
        type:
          Date,

        default:
          null,
      },

      /* =====================================================
         SHIPPING LABEL
      ===================================================== */

      labelUrl: {
        type:
          String,

        default:
          "",
      },

      rawLabelResponse: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },

      /* =====================================================
         TRACKING
      ===================================================== */

      tracking: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },

      /* =====================================================
         SHIPROCKET WEBHOOK STATUS
      ===================================================== */

      currentStatus: {
        type:
          String,

        default:
          "",
      },

      currentStatusId: {
        type:
          Number,

        default:
          null,
      },

      shipmentStatus: {
        type:
          String,

        default:
          "",
      },

      shipmentStatusId: {
        type:
          Number,

        default:
          null,
      },

      lastWebhookAt: {
        type:
          Date,

        default:
          null,
      },

      lastWebhookPayload: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },

      /* =====================================================
         ERRORS
      ===================================================== */

      lastError: {
        type:
          String,

        default:
          "",
      },

      /* =====================================================
         RAW SHIPROCKET RESPONSES
      ===================================================== */

      rawCreateResponse: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },

      rawAwbResponse: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },

      rawPickupResponse: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default:
          null,
      },
    },
    {
      timestamps:
        true,
    },
  );

/* =========================================================
   MODEL
========================================================= */

const ShiprocketShipment =
  mongoose.models
    .ShiprocketShipment ||
  mongoose.model(
    "ShiprocketShipment",
    shiprocketShipmentSchema,
  );

export default ShiprocketShipment;