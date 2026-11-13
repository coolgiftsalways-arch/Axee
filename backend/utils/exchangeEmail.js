import { getTransporter } from "./orderEmail.js";

/* =========================================================
   EXCHANGE EMAILS
   One short email to the customer at every step, plus an
   alert to the store when a new request comes in.
========================================================= */

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const STORE_URL = (process.env.STORE_URL || "https://unboundclothing.in").replace(/\/$/, "");

const MESSAGES = {
  requested: {
    subject: "We've got your exchange request",
    title: "Request received",
    body: "Thanks! We'll review your request within 24–48 hours and email you as soon as it's approved. Please keep the item unwashed and stain-free until then.",
  },
  approved: {
    subject: "Your exchange is approved",
    title: "Approved",
    body: "Good news — your exchange is approved. We'll arrange a pickup and share the details with you. Please pack the item with any tags or packaging you still have.",
  },
  pickup_scheduled: {
    subject: "Pickup scheduled for your exchange",
    title: "Pickup scheduled",
    body: "A courier will collect the item from your delivery address. Please keep it packed and ready.",
  },
  received: {
    subject: "We've received your item",
    title: "Item received",
    body: "Your item has reached us. We're now checking that it's unwashed and stain-free — this usually takes 1–2 days.",
  },
  inspection_passed: {
    subject: "Your item passed inspection",
    title: "Inspection passed",
    body: "All good! We're packing your replacement now and will send tracking details as soon as it ships.",
  },
  replacement_shipped: {
    subject: "Your replacement is on the way",
    title: "Replacement shipped",
    body: "Your replacement has shipped. Use the tracking number below to follow it.",
  },
  completed: {
    subject: "Your exchange is complete",
    title: "Exchange complete",
    body: "Your exchange is complete. Enjoy the new piece!",
  },
  rejected: {
    subject: "About your exchange request",
    title: "Request not approved",
    body: "Unfortunately we couldn't approve this exchange.",
  },
  inspection_failed: {
    subject: "About your returned item",
    title: "Inspection not passed",
    body: "We checked the item and it doesn't meet the exchange conditions (unwashed and stain-free), so we can't exchange it. We'll send the item back to you.",
  },
};

const row = (label, value) =>
  value
    ? `<tr><td style="padding:6px 0;color:#8a8a8a;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;color:#f2efe7;font-size:14px">${escapeHtml(value)}</td></tr>`
    : "";

const customerHtml = (exchange, message) => {
  const { item, replacement } = exchange;

  const reasonBox =
    exchange.rejectionReason && ["rejected", "inspection_failed"].includes(exchange.status)
      ? `<p style="margin:16px 0 0;padding:14px;border:1px solid #5a2a24;background:#1c0f0d;color:#ffb3a8;font-size:14px">${escapeHtml(exchange.rejectionReason)}</p>`
      : "";

  const tracking =
    exchange.status === "replacement_shipped" && exchange.replacementShipment?.awb
      ? row("Tracking", `${exchange.replacementShipment.courier ? `${exchange.replacementShipment.courier} · ` : ""}${exchange.replacementShipment.awb}`)
      : "";

  return `
  <div style="background:#050505;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#0b0b0b;border:1px solid #2a3a00;border-radius:16px;padding:28px">
      <p style="margin:0 0 6px;color:#c7ff13;font-size:11px;letter-spacing:.24em;font-weight:700">UNBOUND · EXCHANGE ${escapeHtml(exchange.exchangeNumber)}</p>
      <h1 style="margin:0 0 14px;color:#f2efe7;font-size:24px">${escapeHtml(message.title)}</h1>
      <p style="margin:0;color:#b9b6ae;font-size:15px;line-height:1.6">${escapeHtml(message.body)}</p>
      ${reasonBox}
      <table style="width:100%;margin-top:22px;border-top:1px solid #1f1f1f;padding-top:10px">
        ${row("Order", exchange.orderNumber)}
        ${row("Returning", `${item.name}${item.size ? ` · Size ${item.size}` : ""} × ${exchange.quantity}`)}
        ${row("Getting", `${replacement.name}${replacement.size ? ` · Size ${replacement.size}` : ""} × ${exchange.quantity}`)}
        ${tracking}
      </table>
      <a href="${STORE_URL}/exchange?track=${encodeURIComponent(exchange.exchangeNumber)}" style="display:inline-block;margin-top:22px;padding:12px 20px;border-radius:999px;background:#c7ff13;color:#050505;font-weight:700;font-size:12px;letter-spacing:.14em;text-decoration:none">TRACK EXCHANGE</a>
    </div>
  </div>`;
};

const adminHtml = (exchange) => `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6">
    <h2 style="margin:0 0 10px">New exchange request · ${escapeHtml(exchange.exchangeNumber)}</h2>
    <p><b>Order:</b> ${escapeHtml(exchange.orderNumber)}<br/>
    <b>Customer:</b> ${escapeHtml(exchange.customer?.name)} · ${escapeHtml(exchange.customer?.phone)} · ${escapeHtml(exchange.customer?.email)}<br/>
    <b>Returning:</b> ${escapeHtml(exchange.item?.name)} (${escapeHtml(exchange.item?.size || "-")}) × ${exchange.quantity}<br/>
    <b>Wants:</b> ${escapeHtml(exchange.replacement?.name)} (${escapeHtml(exchange.replacement?.size || "-")})<br/>
    <b>Reason:</b> ${escapeHtml(exchange.reason)}${exchange.reasonNote ? ` — ${escapeHtml(exchange.reasonNote)}` : ""}<br/>
    <b>Customer confirmed:</b> not washed, no stains</p>
    <p>Review it in Admin → Exchanges.</p>
  </div>`;

export const sendExchangeEmail = async (exchange, event) => {
  const message = MESSAGES[event];

  if (!message) return;

  let mailer;

  try {
    mailer = getTransporter();
  } catch (error) {
    console.warn("⚠️ Exchange email skipped:", error.message);
    return;
  }

  const sender = process.env.SMTP_USER;
  const from = `"UNBOUND Clothing" <${sender}>`;
  const jobs = [];

  if (exchange.customer?.email) {
    jobs.push(
      mailer.sendMail({
        from,
        to: exchange.customer.email,
        replyTo: sender,
        subject: `${message.subject} • ${exchange.exchangeNumber}`,
        html: customerHtml(exchange, message),
      }),
    );
  }

  if (event === "requested") {
    jobs.push(
      mailer.sendMail({
        from,
        to: process.env.ADMIN_ORDER_EMAIL || sender,
        replyTo: exchange.customer?.email || sender,
        subject: `New exchange request • ${exchange.exchangeNumber} • ${exchange.orderNumber}`,
        html: adminHtml(exchange),
      }),
    );
  }

  const results = await Promise.allSettled(jobs);

  results
    .filter((result) => result.status === "rejected")
    .forEach((result) => console.error("❌ Exchange email failed:", result.reason?.message));
};

export default sendExchangeEmail;
