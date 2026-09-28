import nodemailer from "nodemailer";

/* =========================================================
   UNBOUND ORDER EMAIL SERVICE
========================================================= */

/* =========================================================
   MONEY
========================================================= */

const money = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

/* =========================================================
   SAFE HTML
========================================================= */

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

/* =========================================================
   PAYMENT LABEL
========================================================= */

const paymentLabel = (method) => {
  const value = String(method || "").toLowerCase();

  if (value === "cod") {
    return "Cash on Delivery";
  }

  if (value === "upi") {
    return "UPI / Online Payment";
  }

  if (value === "card") {
    return "Credit / Debit Card";
  }

  return String(method || "Payment").toUpperCase();
};

/* =========================================================
   DATE + TIME
========================================================= */

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* =========================================================
   CUSTOMER NAME
========================================================= */

const getCustomerName = (order) => {
  const name = [order?.customer?.firstName, order?.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Customer";
};

/* =========================================================
   DELIVERY ADDRESS
========================================================= */

const buildAddress = (order) => {
  const address = order?.shippingAddress || {};

  return [
    address.address,
    address.apartment,
    address.city,
    address.state,
    address.pincode,
    address.country || "India",
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");
};

/* =========================================================
   SMTP
========================================================= */

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;

  const port = Number(process.env.SMTP_PORT || 465);

  const user = process.env.SMTP_USER;

  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Check SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in backend .env",
    );
  }

  transporter = nodemailer.createTransport({
    host,

    port,

    secure: port === 465,

    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

/* =========================================================
   PRODUCT ROWS
========================================================= */

const buildItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td style="padding:15px 0;color:#777;">
          No product details available.
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const quantity = Number(item?.quantity || 1);

      const lineTotal = item?.lineTotal ?? Number(item?.price || 0) * quantity;

      const details = [
        item?.size ? `Size: ${escapeHtml(item.size)}` : "",

        item?.color ? `Colour: ${escapeHtml(item.color)}` : "",

        `Qty: ${quantity}`,
      ]
        .filter(Boolean)
        .join(" • ");

      return `
        <tr>
          <td
            style="
              padding:14px 0;
              border-bottom:1px solid #ececec;
              vertical-align:top;
            "
          >
            <div
              style="
                font-size:14px;
                font-weight:700;
                color:#111111;
              "
            >
              ${escapeHtml(item?.name || "UNBOUND Product")}
            </div>

            <div
              style="
                margin-top:5px;
                font-size:12px;
                color:#777777;
              "
            >
              ${details}
            </div>
          </td>

          <td
            style="
              padding:14px 0;
              border-bottom:1px solid #ececec;
              text-align:right;
              vertical-align:top;
              font-size:14px;
              font-weight:700;
              white-space:nowrap;
            "
          >
            ${money(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");
};

/* =========================================================
   CUSTOMER EMAIL
========================================================= */

const customerEmailHtml = (order) => {
  const customerName = escapeHtml(getCustomerName(order));

  const orderNumber = escapeHtml(order?.orderNumber || order?._id || "-");

  const isCod = String(order?.paymentMethod || "").toLowerCase() === "cod";

  const websiteUrl = String(
    process.env.FRONTEND_URL || "https://unboundclothing.in",
  ).replace(/\/$/, "");

  const paymentMessage = isCod
    ? `
        Please keep
        <strong>
          ${money(order?.total)}
        </strong>
        ready at the time of delivery.
        No advance payment is required.
      `
    : `
        Your payment of
        <strong>
          ${money(order?.total)}
        </strong>
        has been received successfully.
      `;

  return `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial,Helvetica,sans-serif;
    color:#111111;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
      background:#f4f4f4;
      padding:30px 12px;
    "
  >

    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            max-width:640px;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->

          <tr>
            <td
              style="
                padding:32px;
                background:#050505;
                color:#ffffff;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:30px;
                  font-weight:900;
                  letter-spacing:5px;
                "
              >
                UNBOUND
              </div>

              <div
                style="
                  margin-top:8px;
                  font-size:11px;
                  color:#aaaaaa;
                  letter-spacing:2px;
                "
              >
                ORDER CONFIRMATION
              </div>

            </td>
          </tr>

          <!-- BODY -->

          <tr>
            <td
              style="
                padding:32px;
              "
            >

              <h2
                style="
                  margin:0 0 12px;
                  font-size:23px;
                "
              >
                Thank you for shopping with UNBOUND 🖤
              </h2>

              <p
                style="
                  margin:0;
                  color:#555555;
                  line-height:1.7;
                "
              >
                Hi ${customerName},
                <br /><br />

                Your order has been placed successfully.
                We’re getting everything ready for you.
              </p>

              <!-- ORDER ID -->

              <div
                style="
                  margin-top:24px;
                  padding:18px;
                  background:#f7f7f7;
                  border-radius:12px;
                "
              >

                <div
                  style="
                    font-size:11px;
                    color:#777777;
                    letter-spacing:1px;
                  "
                >
                  ORDER ID
                </div>

                <div
                  style="
                    margin-top:6px;
                    font-size:20px;
                    font-weight:900;
                  "
                >
                  ${orderNumber}
                </div>

              </div>

              <!-- PRODUCTS -->

              <div
                style="
                  margin-top:28px;
                  font-size:12px;
                  font-weight:800;
                  letter-spacing:1px;
                "
              >
                YOUR ORDER
              </div>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >
                ${buildItemsHtml(order?.items || [])}
              </table>

              <!-- SUMMARY -->

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  margin-top:25px;
                "
              >

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Order Total
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:800;
                    "
                  >
                    ${money(order?.total)}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Payment Method
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(paymentLabel(order?.paymentMethod))}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Order Date
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(formatDateTime(order?.createdAt))}
                  </td>

                </tr>

              </table>

              <!-- ADDRESS -->

              <div
                style="
                  margin-top:25px;
                  padding:18px;
                  border:1px solid #e8e8e8;
                  border-radius:12px;
                "
              >

                <div
                  style="
                    margin-bottom:8px;
                    font-size:12px;
                    font-weight:800;
                  "
                >
                  DELIVERY ADDRESS
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#555555;
                    line-height:1.7;
                  "
                >
                  ${buildAddress(order)}
                </div>

              </div>

              <!-- PAYMENT MESSAGE -->

              <div
                style="
                  margin-top:20px;
                  padding:18px;
                  background:#111111;
                  color:#ffffff;
                  border-radius:12px;
                  line-height:1.7;
                "
              >
                ${paymentMessage}
              </div>

              <!-- THANK YOU -->

              <p
                style="
                  margin:28px 0 0;
                  color:#555555;
                  line-height:1.8;
                "
              >
                Thank you for choosing UNBOUND and being part of our journey.

                <br />

                <strong>
                  Stay bold. Stay UNBOUND. 🖤
                </strong>
              </p>

              <!-- BUTTON -->

              <div
                style="
                  margin-top:28px;
                  text-align:center;
                "
              >

                <a
                  href="${escapeHtml(websiteUrl)}"
                  style="
                    display:inline-block;
                    padding:14px 22px;
                    background:#111111;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-size:13px;
                    font-weight:700;
                  "
                >
                  SHOP UNBOUND
                </a>

              </div>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td
              style="
                padding:22px;
                background:#fafafa;
                text-align:center;
                font-size:11px;
                color:#888888;
                line-height:1.7;
              "
            >
              UNBOUND Clothing

              <br />

              ${escapeHtml(process.env.SMTP_USER || "admin@unboundclothing.in")}
            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;
};

/* =========================================================
   ADMIN EMAIL
========================================================= */

const adminEmailHtml = (order) => {
  const orderNumber = escapeHtml(order?.orderNumber || order?._id || "-");

  const customerName = escapeHtml(getCustomerName(order));

  return `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial,Helvetica,sans-serif;
    color:#111111;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
      background:#f4f4f4;
      padding:30px 12px;
    "
  >

    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            max-width:680px;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->

          <tr>

            <td
              style="
                padding:28px 30px;
                background:#050505;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:23px;
                  font-weight:900;
                  letter-spacing:3px;
                "
              >
                NEW UNBOUND ORDER
              </div>

              <div
                style="
                  margin-top:8px;
                  color:#aaaaaa;
                  font-size:12px;
                "
              >
                ${orderNumber}
              </div>

            </td>

          </tr>

          <!-- BODY -->

          <tr>

            <td
              style="
                padding:30px;
              "
            >

              <!-- CUSTOMER -->

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Customer
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${customerName}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Email
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(order?.customer?.email || "-")}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Phone
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(order?.customer?.phone || "-")}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Payment
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(paymentLabel(order?.paymentMethod))}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Amount
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:900;
                    "
                  >
                    ${money(order?.total)}
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:7px 0;
                      color:#666666;
                    "
                  >
                    Date / Time
                  </td>

                  <td
                    style="
                      padding:7px 0;
                      text-align:right;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(formatDateTime(order?.createdAt))}
                  </td>

                </tr>

              </table>

              <!-- PRODUCTS -->

              <div
                style="
                  margin-top:28px;
                  font-size:12px;
                  font-weight:800;
                  letter-spacing:1px;
                "
              >
                ORDERED PRODUCTS
              </div>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >
                ${buildItemsHtml(order?.items || [])}
              </table>

              <!-- ADDRESS -->

              <div
                style="
                  margin-top:25px;
                  padding:18px;
                  background:#f7f7f7;
                  border-radius:12px;
                "
              >

                <div
                  style="
                    margin-bottom:8px;
                    font-size:12px;
                    font-weight:800;
                  "
                >
                  DELIVERY ADDRESS
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#555555;
                    line-height:1.7;
                  "
                >
                  ${buildAddress(order)}
                </div>

              </div>

              ${
                order?.notes
                  ? `
                    <div
                      style="
                        margin-top:18px;
                        padding:18px;
                        border:1px solid #eeeeee;
                        border-radius:12px;
                      "
                    >
                      <strong>
                        Order Note
                      </strong>

                      <br /><br />

                      <span
                        style="
                          color:#555555;
                          line-height:1.6;
                        "
                      >
                        ${escapeHtml(order.notes)}
                      </span>

                    </div>
                  `
                  : ""
              }

            </td>

          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;
};

/* =========================================================
   SEND ORDER EMAILS
========================================================= */

export const sendOrderEmails = async (order) => {
  console.log("");
  console.log("================================");

  console.log("📧 STARTING ORDER EMAIL");

  console.log("Order:", order?.orderNumber || order?._id);

  console.log("Payment:", order?.paymentMethod);

  console.log("Customer:", order?.customer?.email);

  console.log("================================");

  /* =======================================================
     MAILER
  ======================================================= */

  const mailer = getTransporter();

  const sender = process.env.SMTP_USER;

  const adminEmail = process.env.ADMIN_ORDER_EMAIL || sender;

  const customerEmail = order?.customer?.email;

  const orderNumber = order?.orderNumber || order?._id || "Order";

  /* =======================================================
     VALIDATE CUSTOMER EMAIL
  ======================================================= */

  if (!customerEmail) {
    throw new Error("Customer email is missing from the order.");
  }

  const from = `"UNBOUND Clothing" <${sender}>`;

  console.log("📨 Admin email:", adminEmail);

  console.log("📨 Customer email:", customerEmail);

  /* =======================================================
     SEND BOTH EMAILS
  ======================================================= */

  const [adminResult, customerResult] = await Promise.allSettled([
    /* ADMIN */

    mailer.sendMail({
      from,

      to: adminEmail,

      replyTo: customerEmail,

      subject: `New UNBOUND Order • ${orderNumber} • ${money(order?.total)}`,

      html: adminEmailHtml(order),
    }),

    /* CUSTOMER */

    mailer.sendMail({
      from,

      to: customerEmail,

      replyTo: sender,

      subject: `Thank You for Shopping with UNBOUND • ${orderNumber}`,

      html: customerEmailHtml(order),
    }),
  ]);

  /* =======================================================
     RESULTS
  ======================================================= */

  console.log("");

  console.log("📧 EMAIL RESULTS");

  console.log("Admin:", adminResult.status);

  console.log("Customer:", customerResult.status);

  /* =======================================================
     ADMIN RESULT
  ======================================================= */

  if (adminResult.status === "fulfilled") {
    console.log("✅ ADMIN ORDER EMAIL SENT");

    console.log("Message ID:", adminResult.value.messageId);

    console.log("Accepted:", adminResult.value.accepted);

    console.log("Rejected:", adminResult.value.rejected);
  } else {
    console.error("❌ ADMIN ORDER EMAIL FAILED:", adminResult.reason);
  }

  /* =======================================================
     CUSTOMER RESULT
  ======================================================= */

  if (customerResult.status === "fulfilled") {
    console.log("✅ CUSTOMER ORDER EMAIL SENT");

    console.log("Message ID:", customerResult.value.messageId);

    console.log("Accepted:", customerResult.value.accepted);

    console.log("Rejected:", customerResult.value.rejected);
  } else {
    console.error("❌ CUSTOMER ORDER EMAIL FAILED:", customerResult.reason);
  }

  console.log("================================");

  console.log("");

  /* =======================================================
     IF BOTH FAILED
  ======================================================= */

  if (
    adminResult.status === "rejected" &&
    customerResult.status === "rejected"
  ) {
    throw new Error("Both order emails failed to send.");
  }

  /* =======================================================
     RETURN RESULT
  ======================================================= */

  return {
    adminSent: adminResult.status === "fulfilled",

    customerSent: customerResult.status === "fulfilled",
  };
};
