import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import ShiprocketShipment from "../models/ShiprocketShipment.js";

import {
  getShiprocketToken,
  createShiprocketOrder,
  assignShiprocketAWB,
  generateShiprocketPickup,
  generateShiprocketLabel,
  trackShiprocketAWB,
} from "../services/shiprocketService.js";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const findOrder = async (id) => {
  if (mongoose.isValidObjectId(id)) {
    const byMongoId =
      await Order.findById(id);

    if (byMongoId) {
      return byMongoId;
    }
  }

  return Order.findOne({
    $or: [
      {
        orderNumber: id,
      },
      {
        orderId: id,
      },
    ],
  });
};

/* =========================================================
   CUSTOMER
========================================================= */

const getCustomerFromOrder = (order) => {
  const o =
    order?.toObject
      ? order.toObject()
      : order || {};

  const firstName =
    String(
      o?.customer?.firstName || "",
    ).trim();

  const lastName =
    String(
      o?.customer?.lastName || "",
    ).trim();

  const fullName =
    [firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  return {
    name:
      fullName ||
      "Customer",

    firstName:
      firstName ||
      fullName ||
      "Customer",

    lastName,

    email:
      String(
        o?.customer?.email || "",
      ).trim(),

    phone:
      String(
        o?.customer?.phone || "",
      ).trim(),

    address:
      String(
        o?.shippingAddress
          ?.address || "",
      ).trim(),

    address2:
      String(
        o?.shippingAddress
          ?.apartment || "",
      ).trim(),

    city:
      String(
        o?.shippingAddress
          ?.city || "",
      ).trim(),

    state:
      String(
        o?.shippingAddress
          ?.state || "",
      ).trim(),

    pincode:
      String(
        o?.shippingAddress
          ?.pincode || "",
      ).trim(),

    country:
      String(
        o?.shippingAddress
          ?.country ||
          "India",
      ).trim(),
  };
};

/* =========================================================
   ITEMS
========================================================= */

const getItemsFromOrder = (order) => {
  const o =
    order?.toObject
      ? order.toObject()
      : order || {};

  const rawItems =
    o.items ||
    o.orderItems ||
    o.products ||
    o.cartItems ||
    [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map(
    (item, index) => ({
      name: firstValue(
        item.name,
        item.productName,
        item.product?.name,
        `Product ${index + 1}`,
      ),

      sku: String(
        firstValue(
          item.sku,
          item.productId,
          item.product?._id,
          `SKU-${index + 1}`,
        ),
      ),

      quantity: Number(
        firstValue(
          item.quantity,
          item.qty,
          1,
        ),
      ),

      price: Number(
        firstValue(
          item.price,
          item.sellingPrice,
          item.product?.price,
          0,
        ),
      ),
    }),
  );
};

/* =========================================================
   BUILD SHIPROCKET DATA
========================================================= */

const makeShiprocketPayload = (order) => {
  const o =
    order?.toObject
      ? order.toObject()
      : order || {};

  const customer =
    getCustomerFromOrder(order);

  const items =
    getItemsFromOrder(order);

  if (!items.length) {
    throw new Error(
      "Order has no items.",
    );
  }

  if (!customer.phone) {
    throw new Error(
      "Customer phone is missing.",
    );
  }

  if (!customer.address) {
    throw new Error(
      "Customer address is missing.",
    );
  }

  if (!customer.city) {
    throw new Error(
      "Customer city is missing.",
    );
  }

  if (!customer.pincode) {
    throw new Error(
      "Customer pincode is missing.",
    );
  }

  return {
    order: {
      _id: o._id,

      orderNumber:
        o.orderNumber ||
        String(o._id),

      createdAt:
        o.createdAt,

      paymentMethod:
        o.paymentMethod ||
        "cod",

      /* ===============================================
         YOUR REAL ORDER SCHEMA FIELDS
      =============================================== */

      shippingCharge:
        Number(
          o.shipping || 0,
        ),

      discount:
        Number(
          o.discountAmount || 0,
        ),

      totalAmount:
        Number(
          o.total || 0,
        ),

      /* ===============================================
         PACKAGE DEFAULTS
      =============================================== */

      packageLength:
        Number(
          o.packageLength || 30,
        ),

      packageBreadth:
        Number(
          o.packageBreadth || 25,
        ),

      packageHeight:
        Number(
          o.packageHeight || 5,
        ),

      packageWeight:
        Number(
          o.packageWeight || 0.5,
        ),
    },

    customer,

    items,
  };
};

/* =========================================================
   GET / CREATE LOCAL SHIPMENT RECORD
========================================================= */

const getShipmentRecord =
  async (order) => {
    return ShiprocketShipment
      .findOneAndUpdate(
        {
          orderId:
            order._id,
        },
        {
          $setOnInsert: {
            orderId:
              order._id,

            orderNumber:
              String(
                firstValue(
                  order.orderNumber,
                  order.orderId,
                  order._id,
                ),
              ),

            status:
              "not_sent",
          },
        },
        {
          new: true,

          upsert: true,
        },
      );
  };

/* =========================================================
   EXTRACT CREATE RESPONSE
========================================================= */

const extractCreateIds = (
  result = {},
) => {
  return {
    shiprocketOrderId:
      String(
        firstValue(
          result.order_id,
          result.orderId,
          result.id,
        ),
      ),

    shipmentId:
      String(
        firstValue(
          result.shipment_id,
          result.shipmentId,
          result?.data
            ?.shipment_id,
        ),
      ),
  };
};

/* =========================================================
   EXTRACT AWB
========================================================= */

const extractAwb = (
  result = {},
) => {
  const data =
    result.response?.data ||
    result.data ||
    result;

  return {
    awb: String(
      firstValue(
        data.awb_code,
        data.awb,
        result.awb_code,
      ),
    ),

    courierId: String(
      firstValue(
        data.courier_company_id,
        data.courier_id,
        result.courier_company_id,
      ),
    ),

    courierName: String(
      firstValue(
        data.courier_name,
        data.courier_company_name,
        result.courier_name,
      ),
    ),
  };
};

/* =========================================================
   SAFE TEST

   IMPORTANT:
   THIS ONLY LOGS INTO SHIPROCKET.
   NO ORDER.
   NO AWB.
   NO PICKUP.
========================================================= */

router.get(
  "/test",

  async (req, res) => {
    try {
      await getShiprocketToken();

      return res.json({
        success: true,

        safeTest: true,

        message:
          "Shiprocket connected successfully",
      });
    } catch (error) {
      console.error(
        "SHIPROCKET TEST ERROR:",
        error.response?.data ||
          error.message,
      );

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Shiprocket connection failed",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",

  async (req, res) => {
    try {
      const orders =
        await Order.find({})
          .sort({
            createdAt: -1,
          })
          .limit(100)
          .lean();

      const orderIds =
        orders.map(
          (order) =>
            order._id,
        );

      const shipments =
        await ShiprocketShipment.find({
          orderId: {
            $in:
              orderIds,
          },
        }).lean();

      const shipmentMap =
        new Map(
          shipments.map(
            (shipment) => [
              String(
                shipment.orderId,
              ),

              shipment,
            ],
          ),
        );

      const rows =
        orders.map(
          (order) => ({
            order,

            shiprocket:
              shipmentMap.get(
                String(
                  order._id,
                ),
              ) || {
                status:
                  "not_sent",

                orderId:
                  order._id,

                orderNumber:
                  order.orderNumber ||
                  String(
                    order._id,
                  ),
              },
          }),
        );

      return res.json({
        success: true,

        count:
          rows.length,

        rows,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET DASHBOARD ERROR:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load shipping dashboard",

          error:
            error.message,
        });
    }
  },
);

/* =========================================================
   SEND ORDER TO SHIPROCKET
========================================================= */

router.post(
  "/order/:orderId/send",

  async (req, res) => {
    let shipment = null;

    try {
      const order =
        await findOrder(
          req.params.orderId,
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order not found",
          });
      }

      shipment =
        await getShipmentRecord(
          order,
        );

      /* =====================================================
         DUPLICATE PROTECTION
      ===================================================== */

      if (
        shipment
          .shiprocketOrderId ||
        shipment
          .shipmentId
      ) {
        return res
          .status(409)
          .json({
            success: false,

            alreadySent: true,

            message:
              "This order was already sent to Shiprocket.",

            shiprocket:
              shipment,
          });
      }

      const payload =
        makeShiprocketPayload(
          order,
        );

      const result =
        await createShiprocketOrder(
          payload,
        );

      const ids =
        extractCreateIds(
          result,
        );

      shipment.shiprocketOrderId =
        ids.shiprocketOrderId;

      shipment.shipmentId =
        ids.shipmentId;

      shipment.status =
        "order_created";

      shipment.lastError =
        "";

      shipment.rawCreateResponse =
        result;

      await shipment.save();

      return res.json({
        success: true,

        message:
          "Order sent to Shiprocket",

        shiprocket:
          shipment,

        response:
          result,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET SEND ERROR:",
        error.response?.data ||
          error.message,
      );

      if (shipment) {
        shipment.status =
          "failed";

        shipment.lastError =
          JSON.stringify(
            error.response?.data ||
              error.message,
          );

        await shipment
          .save()
          .catch(
            () => {},
          );
      }

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Failed to send order to Shiprocket",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

/* =========================================================
   ASSIGN AWB
========================================================= */

router.post(
  "/order/:orderId/assign-awb",

  async (req, res) => {
    try {
      const order =
        await findOrder(
          req.params.orderId,
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order not found",
          });
      }

      const shipment =
        await ShiprocketShipment
          .findOne({
            orderId:
              order._id,
          });

      if (
        !shipment ||
        !shipment.shipmentId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Send order to Shiprocket first.",
          });
      }

      if (shipment.awb) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "AWB already assigned.",

            shiprocket:
              shipment,
          });
      }

      const result =
        await assignShiprocketAWB(
          shipment.shipmentId,

          req.body
            ?.courierId ||
            null,
        );

      const awbData =
        extractAwb(
          result,
        );

      shipment.awb =
        awbData.awb;

      shipment.courierId =
        awbData.courierId;

      shipment.courierName =
        awbData.courierName;

      shipment.status =
        "awb_assigned";

      shipment.lastError =
        "";

      shipment.rawAwbResponse =
        result;

      await shipment.save();

      return res.json({
        success: true,

        message:
          "AWB assigned",

        shiprocket:
          shipment,

        response:
          result,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET AWB ERROR:",
        error.response?.data ||
          error.message,
      );

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Failed to assign AWB",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

/* =========================================================
   PICKUP
========================================================= */

router.post(
  "/order/:orderId/pickup",

  async (req, res) => {
    try {
      const order =
        await findOrder(
          req.params.orderId,
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order not found",
          });
      }

      const shipment =
        await ShiprocketShipment
          .findOne({
            orderId:
              order._id,
          });

      if (
        !shipment ||
        !shipment.shipmentId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Create Shiprocket order first.",
          });
      }

      if (!shipment.awb) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Assign AWB before scheduling pickup.",
          });
      }

      if (
        shipment
          .pickupScheduled
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Pickup is already scheduled.",

            shiprocket:
              shipment,
          });
      }

      const result =
        await generateShiprocketPickup(
          shipment.shipmentId,
        );

      shipment.pickupScheduled =
        true;

      shipment.pickupScheduledAt =
        new Date();

      shipment.status =
        "pickup_scheduled";

      shipment.rawPickupResponse =
        result;

      shipment.lastError =
        "";

      await shipment.save();

      return res.json({
        success: true,

        message:
          "Pickup scheduled",

        shiprocket:
          shipment,

        response:
          result,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET PICKUP ERROR:",
        error.response?.data ||
          error.message,
      );

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Pickup request failed",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

/* =========================================================
   TRACK
========================================================= */

router.get(
  "/order/:orderId/track",

  async (req, res) => {
    try {
      const order =
        await findOrder(
          req.params.orderId,
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order not found",
          });
      }

      const shipment =
        await ShiprocketShipment
          .findOne({
            orderId:
              order._id,
          });

      if (
        !shipment ||
        !shipment.awb
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "No AWB assigned yet.",
          });
      }

      const result =
        await trackShiprocketAWB(
          shipment.awb,
        );

      shipment.tracking =
        result;

      await shipment.save();

      return res.json({
        success: true,

        shiprocket:
          shipment,

        tracking:
          result,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET TRACK ERROR:",
        error.response?.data ||
          error.message,
      );

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Unable to track shipment",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

/* =========================================================
   GENERATE SHIPPING LABEL
========================================================= */

router.post(
  "/order/:orderId/label",

  async (req, res) => {
    try {
      const order =
        await findOrder(
          req.params.orderId,
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Order not found",
          });
      }

      const shipment =
        await ShiprocketShipment.findOne({
          orderId:
            order._id,
        });

      if (
        !shipment ||
        !shipment.shipmentId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Create Shiprocket order first.",
          });
      }

      if (!shipment.awb) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Assign AWB before generating label.",
          });
      }

      /*
        If we already generated one,
        simply return it.
      */

      if (shipment.labelUrl) {
        return res.json({
          success: true,

          alreadyGenerated:
            true,

          labelUrl:
            shipment.labelUrl,

          shiprocket:
            shipment,
        });
      }

      const result =
        await generateShiprocketLabel(
          shipment.shipmentId,
        );

      const labelUrl =
        result?.label_url ||
        result?.labelUrl ||
        result?.response?.label_url ||
        result?.data?.label_url ||
        "";

      if (!labelUrl) {
        return res
          .status(502)
          .json({
            success: false,

            message:
              "Shiprocket did not return a label URL.",

            response:
              result,
          });
      }

      shipment.labelUrl =
        labelUrl;

      shipment.rawLabelResponse =
        result;

      shipment.lastError =
        "";

      await shipment.save();

      return res.json({
        success: true,

        message:
          "Shipping label generated successfully.",

        labelUrl,

        shiprocket:
          shipment,
      });
    } catch (error) {
      console.error(
        "SHIPROCKET LABEL ERROR:",
        error.response?.data ||
          error.message,
      );

      return res
        .status(
          error.response?.status ||
            500,
        )
        .json({
          success: false,

          message:
            "Unable to generate shipping label.",

          error:
            error.response?.data ||
            error.message,
        });
    }
  },
);

export default router;