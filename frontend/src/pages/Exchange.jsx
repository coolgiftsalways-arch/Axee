import React, { useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  PackageCheck,
  RefreshCw,
  Search,
  Shirt,
  X,
} from "lucide-react";

import { API_BASE, apiUrl } from "../config/api";

import { EXCHANGE_DAYS } from "../components/ExchangePolicy";

import "../styles/exchange.css";

/* =========================================================
   LABELS
========================================================= */

const REASONS = [
  { id: "size_too_small", label: "Too small" },
  { id: "size_too_big", label: "Too big" },
  { id: "fit", label: "Fit isn't right" },
  { id: "colour", label: "Colour isn't for me" },
  { id: "not_as_expected", label: "Not as expected" },
  { id: "changed_mind", label: "Changed my mind" },
  { id: "other", label: "Other" },
];

const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.id, r.label]));

export const STATUS_INFO = {
  requested: { label: "Request received", text: "We're reviewing your request (usually within 24–48 hours)." },
  approved: { label: "Approved", text: "Your exchange is approved. We'll arrange a pickup." },
  pickup_scheduled: { label: "Pickup scheduled", text: "A courier will collect the item from your address." },
  received: { label: "Item received", text: "We've got your item and are checking it." },
  inspection_passed: { label: "Inspection passed", text: "All good — your replacement is being packed." },
  replacement_shipped: { label: "Replacement shipped", text: "Your replacement is on the way." },
  completed: { label: "Completed", text: "Your exchange is complete. Enjoy!" },
  rejected: { label: "Not approved", text: "We couldn't approve this exchange." },
  inspection_failed: { label: "Inspection not passed", text: "The item didn't meet the conditions and will be sent back to you." },
  cancelled: { label: "Cancelled", text: "You cancelled this request." },
};

const TIMELINE = [
  "requested",
  "approved",
  "pickup_scheduled",
  "received",
  "inspection_passed",
  "replacement_shipped",
  "completed",
];

const STEPS = ["Find order", "Choose item", "Details", "Confirm"];

/* =========================================================
   HELPERS
========================================================= */

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

const resolveImage = (value) => {
  const src = String(value || "").trim();

  if (!src) return "";

  if (/^(https?:|data:|blob:)/i.test(src)) return src;

  const path = src.startsWith("/api/images/") ? src.replace("/api/images/", "/api/catalog/images/") : src;

  return path.startsWith("/api/") ? `${API_BASE}${path}` : path;
};

const postJson = async (path, body) => {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
};

/* =========================================================
   SMALL PIECES
========================================================= */

function ItemThumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const url = resolveImage(src);

  return (
    <span className="xp-thumb">
      {url && !failed ? (
        <img src={url} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <Shirt size={22} strokeWidth={1.2} aria-hidden="true" />
      )}
    </span>
  );
}

function StatusChip({ status }) {
  return <span className={`xp-chip is-${status}`}>{STATUS_INFO[status]?.label || status}</span>;
}

function Alert({ children, tone = "error" }) {
  if (!children) return null;

  return (
    <p className={`xp-alert is-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

function PolicyCard() {
  return (
    <aside className="xp-policy">
      <span className="xp-kicker">
        <RefreshCw size={12} strokeWidth={1.8} aria-hidden="true" />
        {EXCHANGE_DAYS}-DAY EXCHANGE
      </span>

      <h3>Before you start</h3>

      <ul className="xp-policy-list is-ok">
        <li><Check size={14} aria-hidden="true" /> Tag removed — fine</li>
        <li><Check size={14} aria-hidden="true" /> Tried on or worn — fine</li>
        <li><Check size={14} aria-hidden="true" /> Within {EXCHANGE_DAYS} days of delivery</li>
      </ul>

      <ul className="xp-policy-list is-no">
        <li><X size={14} aria-hidden="true" /> Washed — can't be exchanged</li>
        <li><X size={14} aria-hidden="true" /> Stained or marked — can't be exchanged</li>
      </ul>

      <p>
        Swap for another size of the same piece, or any other piece priced up
        to what you paid. Pickup is free.
      </p>
    </aside>
  );
}

function Timeline({ exchange }) {
  const failed = ["rejected", "inspection_failed", "cancelled"].includes(exchange.status);

  const reachedIndex = (() => {
    if (!failed) return TIMELINE.indexOf(exchange.status);

    // Show how far it got before it stopped.
    const lastGood = [...(exchange.history || [])]
      .reverse()
      .find((entry) => TIMELINE.includes(entry.status));

    return lastGood ? TIMELINE.indexOf(lastGood.status) : 0;
  })();

  const historyAt = (status) => exchange.history?.find((entry) => entry.status === status)?.at;

  return (
    <ol className="xp-timeline">
      {TIMELINE.map((status, index) => {
        const done = index <= reachedIndex;
        const current = !failed && index === reachedIndex;

        return (
          <li key={status} className={`${done ? "is-done" : ""} ${current ? "is-current" : ""}`}>
            <span className="xp-timeline-dot" aria-hidden="true">
              {done ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            <div>
              <strong>{STATUS_INFO[status].label}</strong>
              {done && historyAt(status) ? <small>{formatDate(historyAt(status))}</small> : null}
              {current ? <span>{STATUS_INFO[status].text}</span> : null}
            </div>
          </li>
        );
      })}

      {failed && (
        <li className="is-stopped is-current">
          <span className="xp-timeline-dot" aria-hidden="true">
            <X size={12} strokeWidth={3} />
          </span>
          <div>
            <strong>{STATUS_INFO[exchange.status].label}</strong>
            <span>{exchange.rejectionReason || STATUS_INFO[exchange.status].text}</span>
          </div>
        </li>
      )}
    </ol>
  );
}

/* =========================================================
   TRACK PANEL
========================================================= */

function TrackPanel({ initialNumber = "", initialContact = "" }) {
  const [exchangeNumber, setExchangeNumber] = useState(initialNumber);
  const [contact, setContact] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exchange, setExchange] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const track = async (event) => {
    event?.preventDefault();
    setError("");

    if (!exchangeNumber.trim() || !contact.trim()) {
      setError("Enter your exchange number and the phone number or email used at checkout.");
      return;
    }

    try {
      setLoading(true);
      const data = await postJson("/api/exchanges/track", { exchangeNumber, contact });
      setExchange(data.exchange);
    } catch (err) {
      setExchange(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Opened from "Track this exchange" — load it straight away.
  useEffect(() => {
    if (initialNumber && initialContact) {
      track();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = async () => {
    if (!window.confirm("Cancel this exchange request?")) return;

    try {
      setCancelling(true);
      const data = await postJson("/api/exchanges/cancel", { exchangeNumber, contact });
      setExchange(data.exchange);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="xp-grid">
      <section className="xp-panel">
        <h2>Track an exchange</h2>
        <p className="xp-muted">Your exchange number (e.g. EXC-482913) is in the confirmation email we sent you.</p>

        <form className="xp-form" onSubmit={track}>
          <label>
            <span>Exchange number</span>
            <input value={exchangeNumber} onChange={(e) => setExchangeNumber(e.target.value.toUpperCase())} placeholder="EXC-000000" autoComplete="off" />
          </label>

          <label>
            <span>Phone or email used at checkout</span>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98XXXXXXXX or you@email.com" autoComplete="email" />
          </label>

          <Alert>{error}</Alert>

          <button type="submit" className="xp-btn is-primary" disabled={loading}>
            {loading ? "Checking…" : "Track exchange"}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </form>

        {exchange && (
          <div className="xp-track-result">
            <div className="xp-track-head">
              <div>
                <small>{exchange.exchangeNumber} · Order {exchange.orderNumber}</small>
                <strong>{STATUS_INFO[exchange.status]?.label}</strong>
              </div>
              <StatusChip status={exchange.status} />
            </div>

            <div className="xp-swap">
              <div>
                <small>Returning</small>
                <strong>{exchange.item?.name}</strong>
                <span>Size {exchange.item?.size || "—"} · Qty {exchange.quantity}</span>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
              <div>
                <small>Getting</small>
                <strong>{exchange.replacement?.name}</strong>
                <span>Size {exchange.replacement?.size || "—"} · Qty {exchange.quantity}</span>
              </div>
            </div>

            <Timeline exchange={exchange} />

            {exchange.status === "replacement_shipped" && exchange.replacementShipment?.awb && (
              <p className="xp-note">
                Tracking: <b>{exchange.replacementShipment.courier ? `${exchange.replacementShipment.courier} · ` : ""}{exchange.replacementShipment.awb}</b>
              </p>
            )}

            {exchange.status === "requested" && (
              <button type="button" className="xp-btn is-ghost" onClick={cancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel this request"}
              </button>
            )}
          </div>
        )}
      </section>

      <PolicyCard />
    </div>
  );
}

/* =========================================================
   REQUEST WIZARD
========================================================= */

function RequestWizard({ onTrack }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* step 1 */
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  /* step 2–3 */
  const [itemIndex, setItemIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [swapType, setSwapType] = useState("");
  const [newSize, setNewSize] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [product, setProduct] = useState(null);
  const [productSize, setProductSize] = useState("");
  const [notWashed, setNotWashed] = useState(false);
  const [noStains, setNoStains] = useState(false);

  /* result */
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const item = itemIndex === null ? null : items.find((entry) => entry.index === itemIndex);

  const hasOtherSizes = Boolean(item?.sizeOptions?.some((option) => option.available));

  /* load products for "different product" */
  useEffect(() => {
    if (swapType !== "product" || !item) return undefined;

    let active = true;

    (async () => {
      try {
        setProductsLoading(true);
        const response = await fetch(apiUrl(`/api/exchanges/products?maxPrice=${encodeURIComponent(item.price)}`));
        const data = await response.json();

        if (active) setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setProductsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [swapType, item]);

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();

    return products
      .filter((entry) => !(entry._id === item?.productId && !entry.hasSizes))
      .filter((entry) => !query || entry.name.toLowerCase().includes(query) || String(entry.category || "").toLowerCase().includes(query));
  }, [products, productQuery, item]);

  const resetDetails = () => {
    setQuantity(1);
    setReason("");
    setReasonNote("");
    setSwapType("");
    setNewSize("");
    setProduct(null);
    setProductSize("");
    setProductQuery("");
    setNotWashed(false);
    setNoStains(false);
  };

  /* ---------- step 1: lookup ---------- */

  const lookup = async (event) => {
    event?.preventDefault();
    setError("");

    if (!orderNumber.trim() || !contact.trim()) {
      setError("Enter your order number and the phone number or email used at checkout.");
      return;
    }

    try {
      setLoading(true);
      const data = await postJson("/api/exchanges/lookup", { orderNumber, contact });
      setOrder(data.order);
      setItems(data.items || []);
      setItemIndex(null);
      resetDetails();
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- step 3 validation ---------- */

  const detailsProblem = (() => {
    if (!reason) return "Tell us why you're exchanging it.";
    if (reason === "other" && !reasonNote.trim()) return "Add a short note about the reason.";
    if (!swapType) return "Choose what you'd like instead.";
    if (swapType === "size" && !newSize) return "Pick your new size.";
    if (swapType === "product" && !product) return "Pick the product you'd like instead.";
    if (swapType === "product" && product?.hasSizes && !productSize) return "Pick a size for the new product.";
    if (!notWashed || !noStains) return "Please confirm both conditions — washed or stained items can't be exchanged.";
    return "";
  })();

  const replacementSummary =
    swapType === "size"
      ? { name: item?.name, size: newSize, image: item?.image, price: item?.price }
      : { name: product?.name, size: productSize, image: product?.image, price: product?.price };

  /* ---------- submit ---------- */

  const submit = async () => {
    setError("");

    try {
      setLoading(true);
      const data = await postJson("/api/exchanges", {
        orderNumber: order.orderNumber,
        contact,
        itemIndex,
        quantity,
        reason,
        reasonNote,
        replacement:
          swapType === "size"
            ? { type: "size", size: newSize }
            : { type: "product", productId: product._id, size: productSize },
        declarations: { notWashed, noStains },
      });

      setCreated(data.exchange);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(created.exchangeNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  /* ---------- render ---------- */

  if (step === 4 && created) {
    return (
      <section className="xp-panel xp-success">
        <span className="xp-success-icon" aria-hidden="true">
          <CheckCircle2 size={34} strokeWidth={1.4} />
        </span>

        <small className="xp-kicker">REQUEST SUBMITTED</small>

        <h2>Your exchange number</h2>

        <button type="button" className="xp-number" onClick={copyNumber}>
          {created.exchangeNumber}
          <Copy size={16} aria-hidden="true" />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>

        <p className="xp-muted">We've emailed this to you. Keep it to track your exchange.</p>

        <div className="xp-swap">
          <div>
            <small>Returning</small>
            <strong>{created.item?.name}</strong>
            <span>Size {created.item?.size || "—"} · Qty {created.quantity}</span>
          </div>
          <ArrowRight size={18} aria-hidden="true" />
          <div>
            <small>Getting</small>
            <strong>{created.replacement?.name}</strong>
            <span>Size {created.replacement?.size || "—"} · Qty {created.quantity}</span>
          </div>
        </div>

        <ol className="xp-next">
          <li><Clock size={16} aria-hidden="true" /><div><strong>We review it</strong><span>Usually within 24–48 hours. You'll get an email.</span></div></li>
          <li><PackageCheck size={16} aria-hidden="true" /><div><strong>Free pickup</strong><span>A courier collects the item from your address. Keep it unwashed and stain-free.</span></div></li>
          <li><RefreshCw size={16} aria-hidden="true" /><div><strong>We send your replacement</strong><span>As soon as the item passes a quick check.</span></div></li>
        </ol>

        <div className="xp-actions">
          <button type="button" className="xp-btn is-primary" onClick={() => onTrack(created.exchangeNumber, contact)}>
            Track this exchange
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          <Link to="/" className="xp-btn is-ghost">Back to store</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="xp-grid">
      <section className="xp-panel">
        {/* stepper */}
        <ol className="xp-stepper" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label} className={`${index < step ? "is-done" : ""} ${index === step ? "is-current" : ""}`}>
              <span>{index < step ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        {/* ---------------- STEP 1 ---------------- */}
        {step === 0 && (
          <>
            <h2>Find your order</h2>
            <p className="xp-muted">Use the order number from your confirmation email and the phone number or email you used at checkout.</p>

            <form className="xp-form" onSubmit={lookup}>
              <label>
                <span>Order number</span>
                <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. UNB-10234" autoComplete="off" />
              </label>

              <label>
                <span>Phone or email used at checkout</span>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98XXXXXXXX or you@email.com" autoComplete="email" />
              </label>

              <Alert>{error}</Alert>

              <button type="submit" className="xp-btn is-primary" disabled={loading}>
                {loading ? "Finding your order…" : "Find my order"}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </form>
          </>
        )}

        {/* ---------------- STEP 2 ---------------- */}
        {step === 1 && order && (
          <>
            <button type="button" className="xp-back" onClick={() => { setStep(0); setError(""); }}>
              <ArrowLeft size={14} aria-hidden="true" /> Change order
            </button>

            <h2>Order {order.orderNumber}</h2>

            {order.delivered && order.windowOpen ? (
              <p className="xp-window is-open">
                <Clock size={15} aria-hidden="true" />
                Delivered {formatDate(order.deliveredAt)} · <b>{order.daysLeft} {order.daysLeft === 1 ? "day" : "days"} left</b> to exchange (until {formatDate(order.windowEndsAt)})
              </p>
            ) : (
              <p className="xp-window is-closed">
                <Clock size={15} aria-hidden="true" />
                {order.notice}
              </p>
            )}

            {items.length > 0 && <h3 className="xp-sub">Which item would you like to exchange?</h3>}

            <div className="xp-items">
              {items.map((entry) => (
                <div key={entry.index} className={`xp-item ${entry.eligible ? "" : "is-disabled"}`}>
                  <ItemThumb src={entry.image} alt={entry.name} />

                  <div className="xp-item-info">
                    <strong>{entry.name}</strong>
                    <span>
                      {entry.size ? `Size ${entry.size}` : "One size"}
                      {entry.color ? ` · ${entry.color}` : ""} · {money(entry.price)} · Qty {entry.quantity}
                    </span>
                    {!entry.eligible && <em>{entry.blockedReason}</em>}
                  </div>

                  <button
                    type="button"
                    className="xp-btn is-primary is-small"
                    disabled={!entry.eligible}
                    onClick={() => {
                      setItemIndex(entry.index);
                      resetDetails();
                      setError("");
                      setStep(2);
                    }}
                  >
                    Exchange this
                  </button>
                </div>
              ))}
            </div>

            {order.exchanges?.length > 0 && (
              <div className="xp-existing">
                <h3 className="xp-sub">Exchanges on this order</h3>

                {order.exchanges.map((exchange) => (
                  <button
                    type="button"
                    key={exchange.exchangeNumber}
                    className="xp-existing-row"
                    onClick={() => onTrack(exchange.exchangeNumber, contact)}
                  >
                    <span>
                      <b>{exchange.exchangeNumber}</b> · {exchange.item?.name} ({exchange.item?.size || "—"}) → {exchange.replacement?.name} ({exchange.replacement?.size || "—"})
                    </span>
                    <StatusChip status={exchange.status} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------------- STEP 3 ---------------- */}
        {step === 2 && item && (
          <>
            <button type="button" className="xp-back" onClick={() => { setStep(1); setError(""); }}>
              <ArrowLeft size={14} aria-hidden="true" /> Choose a different item
            </button>

            <div className="xp-item is-selected">
              <ItemThumb src={item.image} alt={item.name} />
              <div className="xp-item-info">
                <small>Exchanging</small>
                <strong>{item.name}</strong>
                <span>{item.size ? `Size ${item.size}` : "One size"} · {money(item.price)}</span>
              </div>
            </div>

            {item.exchangeableQuantity > 1 && (
              <div className="xp-field">
                <h3 className="xp-sub">How many?</h3>
                <div className="xp-qty">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(item.exchangeableQuantity, q + 1))} aria-label="More">+</button>
                </div>
              </div>
            )}

            {/* reason */}
            <div className="xp-field">
              <h3 className="xp-sub">1. Why are you exchanging it?</h3>
              <div className="xp-chips">
                {REASONS.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className={`xp-choice ${reason === entry.id ? "is-active" : ""}`}
                    onClick={() => setReason(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>

              {(reason === "other" || reasonNote) && (
                <textarea
                  className="xp-textarea"
                  rows={3}
                  maxLength={500}
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder={reason === "other" ? "Tell us a little more (required)" : "Anything else we should know? (optional)"}
                />
              )}
            </div>

            {/* replacement */}
            <div className="xp-field">
              <h3 className="xp-sub">2. What would you like instead?</h3>

              <div className="xp-options">
                <button
                  type="button"
                  className={`xp-option ${swapType === "size" ? "is-active" : ""}`}
                  disabled={!hasOtherSizes}
                  onClick={() => { setSwapType("size"); setProduct(null); setProductSize(""); }}
                >
                  <strong>Another size</strong>
                  <span>{hasOtherSizes ? "Same piece, different size" : "No other sizes in stock right now"}</span>
                </button>

                <button
                  type="button"
                  className={`xp-option ${swapType === "product" ? "is-active" : ""}`}
                  onClick={() => { setSwapType("product"); setNewSize(""); }}
                >
                  <strong>A different piece</strong>
                  <span>Anything priced up to {money(item.price)}</span>
                </button>
              </div>

              {swapType === "size" && (
                <div className="xp-sizes">
                  {item.sizeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.size}
                      disabled={!option.available}
                      className={`xp-size ${newSize === option.size ? "is-active" : ""}`}
                      onClick={() => setNewSize(option.size)}
                      title={option.available ? "" : "Out of stock"}
                    >
                      {option.size}
                    </button>
                  ))}
                </div>
              )}

              {swapType === "product" && (
                <div className="xp-picker">
                  <label className="xp-search">
                    <Search size={15} aria-hidden="true" />
                    <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search tees, hoodies, jeans…" />
                  </label>

                  {productsLoading ? (
                    <p className="xp-muted">Loading pieces…</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="xp-muted">No matching pieces in stock up to {money(item.price)}.</p>
                  ) : (
                    <div className="xp-products">
                      {filteredProducts.map((entry) => (
                        <button
                          type="button"
                          key={entry._id}
                          className={`xp-product ${product?._id === entry._id ? "is-active" : ""}`}
                          onClick={() => { setProduct(entry); setProductSize(""); }}
                        >
                          <ItemThumb src={entry.image} alt={entry.name} />
                          <strong>{entry.name}</strong>
                          <span>{money(entry.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {product?.hasSizes && (
                    <>
                      <p className="xp-label">Size for {product.name}</p>
                      <div className="xp-sizes">
                        {product.sizes.map((option) => {
                          const sameAsCurrent =
                            product._id === item.productId &&
                            String(option.size).toUpperCase() === String(item.size).toUpperCase();

                          return (
                            <button
                              type="button"
                              key={option.size}
                              disabled={!option.available || sameAsCurrent}
                              className={`xp-size ${productSize === option.size ? "is-active" : ""}`}
                              onClick={() => setProductSize(option.size)}
                              title={sameAsCurrent ? "That's the size you have" : option.available ? "" : "Out of stock"}
                            >
                              {option.size}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* conditions */}
            <div className="xp-field">
              <h3 className="xp-sub">3. Confirm the 2 conditions</h3>
              <p className="xp-muted">Tag off and worn is completely fine. We only can't accept items that are washed or stained.</p>

              <label className={`xp-check ${notWashed ? "is-checked" : ""}`}>
                <input type="checkbox" checked={notWashed} onChange={(e) => setNotWashed(e.target.checked)} />
                <span className="xp-check-box" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                <Droplets size={18} strokeWidth={1.4} aria-hidden="true" />
                <span><b>It hasn't been washed</b><small>Not even once — washing changes the fit and fabric.</small></span>
              </label>

              <label className={`xp-check ${noStains ? "is-checked" : ""}`}>
                <input type="checkbox" checked={noStains} onChange={(e) => setNoStains(e.target.checked)} />
                <span className="xp-check-box" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                <Shirt size={18} strokeWidth={1.4} aria-hidden="true" />
                <span><b>It has no stains or marks</b><small>No food, drink, makeup, deodorant or ink marks.</small></span>
              </label>

              <p className="xp-muted is-small">We check every item when it reaches us. If it's washed or stained, we'll send it back instead of exchanging it.</p>
            </div>

            <Alert tone="info">{detailsProblem && reason ? detailsProblem : ""}</Alert>

            <button
              type="button"
              className="xp-btn is-primary"
              disabled={Boolean(detailsProblem)}
              onClick={() => { setError(""); setStep(3); }}
            >
              Review exchange
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </>
        )}

        {/* ---------------- STEP 4 ---------------- */}
        {step === 3 && item && (
          <>
            <button type="button" className="xp-back" onClick={() => { setStep(2); setError(""); }}>
              <ArrowLeft size={14} aria-hidden="true" /> Edit details
            </button>

            <h2>Review your exchange</h2>

            <div className="xp-review">
              <div className="xp-review-card">
                <small>You send back</small>
                <ItemThumb src={item.image} alt={item.name} />
                <strong>{item.name}</strong>
                <span>Size {item.size || "—"} · Qty {quantity}</span>
              </div>

              <span className="xp-review-arrow" aria-hidden="true"><RefreshCw size={18} /></span>

              <div className="xp-review-card is-new">
                <small>You get</small>
                <ItemThumb src={replacementSummary.image} alt={replacementSummary.name} />
                <strong>{replacementSummary.name}</strong>
                <span>Size {replacementSummary.size || "—"} · Qty {quantity}</span>
              </div>
            </div>

            <dl className="xp-summary">
              <div><dt>Reason</dt><dd>{REASON_LABEL[reason]}{reasonNote ? ` — ${reasonNote}` : ""}</dd></div>
              <div><dt>You pay</dt><dd>₹0 — pickup and delivery are free</dd></div>
              {swapType === "product" && Number(product?.price) < Number(item.price) && (
                <div><dt>Note</dt><dd>The new piece costs less ({money(product.price)}). The difference isn't refunded.</dd></div>
              )}
              <div><dt>Condition</dt><dd>Unwashed and stain-free (confirmed)</dd></div>
            </dl>

            <Alert>{error}</Alert>

            <button type="button" className="xp-btn is-primary" onClick={submit} disabled={loading}>
              {loading ? "Submitting…" : "Submit exchange request"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </>
        )}
      </section>

      <PolicyCard />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

function Exchange() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTrack = searchParams.get("track") || "";

  const [tab, setTab] = useState(initialTrack ? "track" : "start");
  const [trackPrefill, setTrackPrefill] = useState({ number: initialTrack, contact: "" });
  const [trackKey, setTrackKey] = useState(0);

  const openTrack = (number, contact) => {
    setTrackPrefill({ number, contact });
    setTrackKey((key) => key + 1);
    setTab("track");
    setSearchParams({ track: number });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="xp-page">
      <header className="xp-hero">
        <span className="xp-kicker">
          <RefreshCw size={12} strokeWidth={1.8} aria-hidden="true" />
          UNBOUND EXCHANGES
        </span>
        <h1>
          Not the one? <em>Swap it.</em>
        </h1>
        <p>
          Exchange any piece within {EXCHANGE_DAYS} days of delivery — tag off and worn is fine,
          as long as it's unwashed and stain-free.
        </p>

        <div className="xp-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "start"} className={tab === "start" ? "is-active" : ""} onClick={() => { setTab("start"); setSearchParams({}); }}>
            Start an exchange
          </button>
          <button type="button" role="tab" aria-selected={tab === "track"} className={tab === "track" ? "is-active" : ""} onClick={() => setTab("track")}>
            Track an exchange
          </button>
        </div>
      </header>

      {tab === "start" ? (
        <RequestWizard onTrack={openTrack} />
      ) : (
        <TrackPanel key={trackKey} initialNumber={trackPrefill.number} initialContact={trackPrefill.contact} />
      )}
    </main>
  );
}

export default Exchange;
