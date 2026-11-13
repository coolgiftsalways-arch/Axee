import express from "express";
import crypto from "node:crypto";
import Razorpay from "razorpay";

const router = express.Router();

/* =========================================================
   CREATE RAZORPAY INSTANCE
========================================================= */

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/* =========================================================
   PUBLIC RAZORPAY KEY
   GET /api/payments/key
========================================================= */

router.get("/key", (req, res) => {
  const key = process.env.RAZORPAY_KEY_ID;

  if (!key) {
    return res.status(500).json({
      success: false,
      message:
        "Razorpay Key ID is not configured",
    });
  }

  return res.status(200).json({
    success: true,
    key,
  });
});

/* =========================================================
   CREATE RAZORPAY ORDER
   POST /api/payments/create-order
========================================================= */

router.post(
  "/create-order",
  async (req, res) => {
    try {
      const {
        amount,
        receipt,
        notes = {},
      } = req.body;

      const numericAmount =
        Number(amount);

      /* ===============================================
         VALIDATE AMOUNT
      =============================================== */

      if (
        !Number.isFinite(
          numericAmount,
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid payment amount is required",
        });
      }

      /* ===============================================
         DEBUG ENVIRONMENT
         DO NOT PRINT SECRET
      =============================================== */

      console.log(
        "💳 Razorpay create order request:",
        {
          amount:
            numericAmount,
          amountInPaise:
            Math.round(
              numericAmount * 100,
            ),
          keyId:
            process.env
              .RAZORPAY_KEY_ID,
          secretConfigured:
            Boolean(
              process.env
                .RAZORPAY_KEY_SECRET,
            ),
        },
      );

      /* ===============================================
         RAZORPAY INSTANCE
      =============================================== */

      const razorpay =
        getRazorpay();

      /* ===============================================
         CREATE ORDER
      =============================================== */

      const orderOptions = {
        amount:
          Math.round(
            numericAmount * 100,
          ),

        currency:
          "INR",

        receipt:
          String(
            receipt ||
              `axiee_${Date.now()}`,
          ).slice(0, 40),

        notes:
          notes &&
          typeof notes === "object"
            ? notes
            : {},
      };

      console.log(
        "📦 Razorpay order options:",
        orderOptions,
      );

      const razorpayOrder =
        await razorpay.orders.create(
          orderOptions,
        );

      console.log(
        "✅ Razorpay order created:",
        {
          id:
            razorpayOrder.id,
          amount:
            razorpayOrder.amount,
          currency:
            razorpayOrder.currency,
          status:
            razorpayOrder.status,
        },
      );

      return res.status(200).json({
        success: true,
        order:
          razorpayOrder,
      });
    } catch (error) {
      /* ===============================================
         FULL DEBUG ERROR
      =============================================== */

      console.error(
        "❌ RAZORPAY CREATE ORDER ERROR:",
        error,
      );

      console.error(
        "❌ Razorpay status code:",
        error?.statusCode,
      );

      console.error(
        "❌ Razorpay error object:",
        error?.error,
      );

      console.error(
        "❌ Razorpay description:",
        error?.error
          ?.description,
      );

      return res.status(
        error?.statusCode ||
          500,
      ).json({
        success: false,

        message:
          error?.error
            ?.description ||
          error?.message ||
          "Could not create Razorpay order",

        code:
          error?.error?.code ||
          null,

        field:
          error?.error?.field ||
          null,

        reason:
          error?.error?.reason ||
          null,
      });
    }
  },
);

/* =========================================================
   VERIFY RAZORPAY PAYMENT
   POST /api/payments/verify
========================================================= */

router.post(
  "/verify",
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      /* ===============================================
         VALIDATION
      =============================================== */

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment verification data is incomplete",
        });
      }

      if (
        !process.env
          .RAZORPAY_KEY_SECRET
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Razorpay secret is not configured",
        });
      }

      /* ===============================================
         CREATE SIGNATURE
      =============================================== */

      const body =
        `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET,
          )
          .update(body)
          .digest("hex");

      /* ===============================================
         SAFE SIGNATURE COMPARISON
      =============================================== */

      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "utf8",
        );

      const receivedBuffer =
        Buffer.from(
          String(
            razorpay_signature,
          ),
          "utf8",
        );

      if (
        expectedBuffer.length !==
        receivedBuffer.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Razorpay payment signature",
        });
      }

      const isValid =
        crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer,
        );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Razorpay payment signature",
        });
      }

      /* ===============================================
         SUCCESS
      =============================================== */

      console.log(
        "✅ Razorpay payment verified:",
        {
          razorpayOrderId:
            razorpay_order_id,

          razorpayPaymentId:
            razorpay_payment_id,
        },
      );

      return res.status(200).json({
        success: true,

        message:
          "Payment verified successfully",

        paymentId:
          razorpay_payment_id,

        razorpayOrderId:
          razorpay_order_id,
      });
    } catch (error) {
      console.error(
        "❌ Razorpay verification error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Payment verification failed",
      });
    }
  },
);

export default router;