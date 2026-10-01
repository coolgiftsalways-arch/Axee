import axios from "axios";

/* =========================================================
   SHIPROCKET BASE URL
========================================================= */

const SHIPROCKET_BASE_URL =
  "https://apiv2.shiprocket.in/v1/external";

/* =========================================================
   TOKEN CACHE
========================================================= */

let cachedToken = null;
let tokenCreatedAt = 0;

/* =========================================================
   GET SHIPROCKET TOKEN
========================================================= */

export const getShiprocketToken = async () => {
  const email =
    process.env.SHIPROCKET_EMAIL;

  const password =
    process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing",
    );
  }

  /*
    Shiprocket token is valid for about 10 days.
    Refresh locally after 9 days.
  */

  const nineDays =
    9 * 24 * 60 * 60 * 1000;

  if (
    cachedToken &&
    Date.now() - tokenCreatedAt < nineDays
  ) {
    return cachedToken;
  }

  const response =
    await axios.post(
      `${SHIPROCKET_BASE_URL}/auth/login`,
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );

  const token =
    response.data?.token;

  if (!token) {
    throw new Error(
      "Shiprocket token not received",
    );
  }

  cachedToken = token;
  tokenCreatedAt =
    Date.now();

  return token;
};

/* =========================================================
   AUTH HEADERS
========================================================= */

const getHeaders = async () => {
  const token =
    await getShiprocketToken();

  return {
    Authorization:
      `Bearer ${token}`,

    "Content-Type":
      "application/json",
  };
};

/* =========================================================
   CREATE SHIPROCKET ORDER
========================================================= */

export const createShiprocketOrder =
  async ({
    order,
    customer,
    items,
  }) => {
    const headers =
      await getHeaders();

    /* =====================================================
       ITEMS
    ===================================================== */

    const orderItems =
      items.map(
        (item, index) => ({
          name:
            item.name ||
            `Product ${index + 1}`,

          sku:
            item.sku ||
            item.productId ||
            `SKU-${index + 1}`,

          units:
            Number(
              item.quantity ||
                1,
            ),

          selling_price:
            Number(
              item.price ||
                0,
            ),

          discount:
            0,

          tax:
            0,

          hsn:
            "",
        }),
      );

    /* =====================================================
       PAYLOAD
    ===================================================== */

    const payload = {
      /* =================================================
         ORDER
      ================================================= */

      order_id:
        String(
          order.orderNumber ||
            order._id,
        ),

      order_date:
        new Date(
          order.createdAt ||
            Date.now(),
        )
          .toISOString()
          .slice(0, 19)
          .replace(
            "T",
            " ",
          ),

      pickup_location:
  process.env
    .SHIPROCKET_PICKUP_LOCATION ||
  "home",

channel_id:
  Number(
    process.env
      .SHIPROCKET_CHANNEL_ID,
  ),

comment:
  "UNBOUND website order",

      /* =================================================
         CUSTOMER
      ================================================= */

      billing_customer_name:
        customer.firstName ||
        customer.name ||
        "Customer",

      billing_last_name:
        customer.lastName ||
        "",

      billing_address:
        customer.address ||
        "",

      billing_address_2:
        customer.address2 ||
        "",

      billing_city:
        customer.city ||
        "",

      billing_pincode:
        String(
          customer.pincode ||
            "",
        ),

      billing_state:
        customer.state ||
        "",

      billing_country:
        customer.country ||
        "India",

      billing_email:
        customer.email ||
        "",

      billing_phone:
        String(
          customer.phone ||
            "",
        ),

      shipping_is_billing:
        true,

      /* =================================================
         ITEMS
      ================================================= */

      order_items:
        orderItems,

      /* =================================================
         PAYMENT
      ================================================= */

      payment_method:
        String(
          order.paymentMethod ||
            "",
        )
          .toLowerCase()
          .includes(
            "cod",
          )
          ? "COD"
          : "Prepaid",

      /* =================================================
         PRICE
      ================================================= */

      shipping_charges:
        Number(
          order.shippingCharge ||
            0,
        ),

      giftwrap_charges:
        0,

      transaction_charges:
        0,

      total_discount:
        Number(
          order.discount ||
            0,
        ),

      sub_total:
        Number(
          order.totalAmount ||
            order.total ||
            0,
        ),

      /* =================================================
         PARCEL DIMENSIONS
      ================================================= */

      length:
        Number(
          order.packageLength ||
            30,
        ),

      breadth:
        Number(
          order.packageBreadth ||
            25,
        ),

      height:
        Number(
          order.packageHeight ||
            5,
        ),

      weight:
        Number(
          order.packageWeight ||
            0.5,
        ),
    };

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    const response =
      await axios.post(
        `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
        payload,
        {
          headers,
        },
      );

    return response.data;
  };

/* =========================================================
   ASSIGN AWB
========================================================= */

export const assignShiprocketAWB =
  async (
    shipmentId,
    courierId = null,
  ) => {
    const headers =
      await getHeaders();

    const payload = {
      shipment_id:
        Number(
          shipmentId,
        ),
    };

    if (courierId) {
      payload.courier_id =
        Number(
          courierId,
        );
    }

    const response =
      await axios.post(
        `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
        payload,
        {
          headers,
        },
      );

    return response.data;
  };

/* =========================================================
   GENERATE SHIPPING LABEL
========================================================= */

export const generateShiprocketLabel =
  async (
    shipmentId,
  ) => {
    const headers =
      await getHeaders();

    const response =
      await axios.post(
        `${SHIPROCKET_BASE_URL}/courier/generate/label`,
        {
          shipment_id: [
            Number(
              shipmentId,
            ),
          ],
        },
        {
          headers,
        },
      );

    return response.data;
  };

/* =========================================================
   GENERATE PICKUP
========================================================= */

export const generateShiprocketPickup =
  async (
    shipmentId,
  ) => {
    const headers =
      await getHeaders();

    const response =
      await axios.post(
        `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
        {
          shipment_id: [
            Number(
              shipmentId,
            ),
          ],
        },
        {
          headers,
        },
      );

    return response.data;
  };

/* =========================================================
   TRACK BY AWB
========================================================= */

export const trackShiprocketAWB =
  async (
    awbCode,
  ) => {
    const headers =
      await getHeaders();

    const response =
      await axios.get(
        `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(
          awbCode,
        )}`,
        {
          headers,
        },
      );

    return response.data;
  };