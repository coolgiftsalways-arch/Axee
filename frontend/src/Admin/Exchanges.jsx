import React, { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  Check,
  Droplets,
  RefreshCw,
  Search,
  Shirt,
  X,
} from "lucide-react";

import "../AdminCss/admin-exchanges.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

// The admin token is attached automatically (see utils/adminFetch.js).
const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

/* =========================================================
   LABELS
========================================================= */

const STATUS_LABEL = {
  requested: "New request",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  received: "Received",
  inspection_passed: "Inspection passed",
  replacement_shipped: "Replacement shipped",
  completed: "Completed",
  rejected: "Rejected",
  inspection_failed: "Inspection failed",
  cancelled: "Cancelled by customer",
};

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "requested", label: "New" },
  { id: "approved", label: "Approved" },
  { id: "pickup_scheduled", label: "Pickup" },
  { id: "received", label: "To inspect" },
  { id: "inspection_passed", label: "To ship" },
  { id: "replacement_shipped", label: "Shipped" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "inspection_failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const REASON_LABEL = {
  size_too_small: "Too small",
  size_too_big: "Too big",
  fit: "Fit isn't right",
  colour: "Colour",
  not_as_expected: "Not as expected",
  changed_mind: "Changed mind",
  other: "Other",
};

/* What each action button does — shown to the admin so the next step is obvious. */
const ACTIONS = {
  approved: { label: "Approve", hint: "Stock is checked first. Customer is emailed.", tone: "primary" },
  pickup_scheduled: { label: "Pickup scheduled", hint: "Add the return pickup courier / AWB.", tone: "primary", fields: true },
  received: { label: "Mark item received", hint: "The item has reached the warehouse.", tone: "primary" },
  inspection_passed: { label: "Inspection passed", hint: "Unwashed and stain-free.", tone: "primary" },
  inspection_failed: { label: "Inspection failed", hint: "Washed or stained — item goes back to customer.", tone: "danger", reason: true },
  replacement_shipped: { label: "Replacement shipped", hint: "Add the replacement's AWB (required).", tone: "primary", fields: true },
  completed: { label: "Mark completed", hint: "Replacement delivered.", tone: "primary" },
  rejected: { label: "Reject", hint: "Customer sees the reason.", tone: "danger", reason: true },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

const daysSince = (value) =>
  value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)) : null;

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function StatusBadge({ status }) {
  return <span className={`axx-badge is-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

/* =========================================================
   DETAIL DRAWER
========================================================= */

function ExchangeDrawer({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [pending, setPending] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await request(`/api/exchanges/admin/${id}`);
      setData(result);
      setAdminNote(result.exchange?.adminNote || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choose = (status) => {
    setPending(status);
    setNote("");
    setReason("");
    setCourier("");
    setAwb("");
    setError("");
  };

  const confirm = async () => {
    try {
      setBusy(true);
      setError("");
      await request(`/api/exchanges/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: pending, note, rejectionReason: reason, courier, awb }),
      });
      setPending("");
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    try {
      await request(`/api/exchanges/admin/${id}/note`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote }),
      });
      setNoteSaved(true);
      window.setTimeout(() => setNoteSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const exchange = data?.exchange;
  const action = ACTIONS[pending];

  return (
    <div className="axx-drawer-wrap" role="dialog" aria-modal="true">
      <button type="button" className="axx-drawer-backdrop" onClick={onClose} aria-label="Close" />

      <aside className="axx-drawer">
        <header className="axx-drawer-head">
          <div>
            <small>Exchange</small>
            <h2>{exchange?.exchangeNumber || "…"}</h2>
          </div>
          <button type="button" className="axx-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {loading && !exchange ? (
          <p className="axx-muted">Loading…</p>
        ) : !exchange ? (
          <p className="axx-error">{error || "Not found."}</p>
        ) : (
          <div className="axx-drawer-body">
            <div className="axx-row-between">
              <StatusBadge status={exchange.status} />
              <span className="axx-muted">Requested {formatDateTime(exchange.createdAt)}</span>
            </div>

            {/* swap */}
            <section className="axx-swap">
              <div>
                <small>Customer returns</small>
                <strong>{exchange.item?.name}</strong>
                <span>Size {exchange.item?.size || "—"} · {money(exchange.item?.price)} · Qty {exchange.quantity}</span>
              </div>
              <ArrowRight size={18} />
              <div>
                <small>Send them</small>
                <strong>{exchange.replacement?.name}</strong>
                <span>
                  Size {exchange.replacement?.size || "—"} · {money(exchange.replacement?.price)} ·{" "}
                  {exchange.replacement?.type === "size" ? "Size swap" : "Different product"}
                </span>
                <em className={data.replacementStock?.available ? "is-ok" : "is-bad"}>
                  {data.replacementStock?.available ? "● In stock" : `● ${data.replacementStock?.message}`}
                </em>
              </div>
            </section>

            {/* facts */}
            <dl className="axx-facts">
              <div><dt>Reason</dt><dd>{REASON_LABEL[exchange.reason] || exchange.reason}{exchange.reasonNote ? ` — “${exchange.reasonNote}”` : ""}</dd></div>
              <div>
                <dt>Customer confirmed</dt>
                <dd className="axx-declare">
                  <span><Droplets size={14} /> Not washed <Check size={14} /></span>
                  <span><Shirt size={14} /> No stains <Check size={14} /></span>
                </dd>
              </div>
              <div><dt>Delivered</dt><dd>{formatDate(exchange.deliveredAt)} · requested on day {daysSince(exchange.deliveredAt) - daysSince(exchange.createdAt)} of 30</dd></div>
              <div><dt>Window ends</dt><dd>{formatDate(exchange.windowEndsAt)}</dd></div>
              <div><dt>Customer</dt><dd>{exchange.customer?.name}<br />{exchange.customer?.phone} · {exchange.customer?.email}</dd></div>
              <div>
                <dt>Pickup address</dt>
                <dd>
                  {[data.order?.shippingAddress?.address, data.order?.shippingAddress?.apartment, data.order?.shippingAddress?.city, data.order?.shippingAddress?.state, data.order?.shippingAddress?.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div><dt>Original order</dt><dd>{exchange.orderNumber} · {String(data.order?.paymentMethod || "").toUpperCase()} · {money(data.order?.total)}</dd></div>
              {exchange.pickup?.awb && <div><dt>Pickup AWB</dt><dd>{exchange.pickup.courier} {exchange.pickup.awb}</dd></div>}
              {exchange.replacementShipment?.awb && <div><dt>Replacement AWB</dt><dd>{exchange.replacementShipment.courier} {exchange.replacementShipment.awb}</dd></div>}
              {exchange.rejectionReason && <div><dt>Reason given</dt><dd className="axx-bad">{exchange.rejectionReason}</dd></div>}
            </dl>

            {/* actions */}
            {data.allowedNext?.length > 0 ? (
              <section className="axx-actions">
                <h3>Next step</h3>

                {!pending && (
                  <div className="axx-action-buttons">
                    {data.allowedNext.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className={`axx-btn ${ACTIONS[status]?.tone === "danger" ? "is-danger" : "is-primary"}`}
                        onClick={() => choose(status)}
                      >
                        {ACTIONS[status]?.label || status}
                      </button>
                    ))}
                  </div>
                )}

                {pending && (
                  <div className="axx-confirm">
                    <strong>{action?.label}</strong>
                    <span className="axx-muted">{action?.hint}</span>

                    {action?.reason && (
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={pending === "inspection_failed" ? "e.g. Item has been washed — fabric is faded and tag area shrunk." : "e.g. Order was delivered more than 30 days ago."}
                      />
                    )}

                    {action?.fields && (
                      <div className="axx-inline">
                        <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier (optional)" />
                        <input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder={pending === "replacement_shipped" ? "AWB / tracking number" : "AWB (optional)"} />
                      </div>
                    )}

                    {!action?.reason && (
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the timeline (optional)" />
                    )}

                    {error && <p className="axx-error">{error}</p>}

                    <div className="axx-action-buttons">
                      <button type="button" className={`axx-btn ${action?.tone === "danger" ? "is-danger" : "is-primary"}`} onClick={confirm} disabled={busy}>
                        {busy ? "Saving…" : `Confirm: ${action?.label}`}
                      </button>
                      <button type="button" className="axx-btn" onClick={() => setPending("")} disabled={busy}>
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <p className="axx-muted axx-final">This exchange is closed — no further steps.</p>
            )}

            {/* history */}
            <section>
              <h3>Timeline</h3>
              <ol className="axx-history">
                {[...(exchange.history || [])].reverse().map((entry, index) => (
                  <li key={`${entry.status}-${index}`}>
                    <StatusBadge status={entry.status} />
                    <span>{formatDateTime(entry.at)} · {entry.by}</span>
                    {entry.note && <p>{entry.note}</p>}
                  </li>
                ))}
              </ol>
            </section>

            {/* internal note */}
            <section>
              <h3>Internal note</h3>
              <textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Only visible to admins" />
              <button type="button" className="axx-btn" onClick={saveNote}>
                {noteSaved ? "Saved ✓" : "Save note"}
              </button>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

function Exchanges() {
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [exchanges, setExchanges] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (query) params.set("search", query);
      const data = await request(`/api/exchanges/admin?${params.toString()}`);
      setExchanges(data.exchanges || []);
      setCounts(data.counts || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <div className="admin-page axx-page">
      <div className="admin-page-header">
        <div>
          <h1>Exchanges</h1>
          <p>30-day exchange requests. Open one to approve, track the pickup, inspect and ship the replacement.</p>
        </div>

        <div className="axx-header-actions">
          <Link to="/exchange" target="_blank" className="admin-secondary-button">
            Customer page
          </Link>
          <button type="button" className="admin-primary-button" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="axx-stats">
        <div><span>New requests</span><strong>{counts.requested || 0}</strong></div>
        <div><span>To inspect</span><strong>{counts.received || 0}</strong></div>
        <div><span>Ready to ship</span><strong>{counts.inspection_passed || 0}</strong></div>
        <div><span>Completed</span><strong>{counts.completed || 0}</strong></div>
      </div>

      <div className="admin-card">
        <div className="axx-toolbar">
          <div className="axx-filters">
            {FILTERS.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={filter === entry.id ? "is-active" : ""}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
                {counts[entry.id] ? <span>{counts[entry.id]}</span> : null}
              </button>
            ))}
          </div>

          <label className="axx-search">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search EXC / order / name / phone" />
          </label>
        </div>

        {error && <p className="axx-error">{error}</p>}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>Customer</th>
                <th>Returning → Wants</th>
                <th>Reason</th>
                <th>Delivered</th>
                <th>Status</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="axx-empty">Loading…</td></tr>
              ) : exchanges.length === 0 ? (
                <tr><td colSpan={7} className="axx-empty">No exchanges here.</td></tr>
              ) : (
                exchanges.map((exchange) => (
                  <tr key={exchange._id} className="axx-row" onClick={() => setOpenId(exchange._id)}>
                    <td>
                      <strong>{exchange.exchangeNumber}</strong>
                      <div className="axx-muted">Order {exchange.orderNumber}</div>
                    </td>
                    <td>
                      {exchange.customer?.name}
                      <div className="axx-muted">{exchange.customer?.phone}</div>
                    </td>
                    <td>
                      {exchange.item?.name} <b>({exchange.item?.size || "—"})</b>
                      <div className="axx-muted">→ {exchange.replacement?.name} <b>({exchange.replacement?.size || "—"})</b> × {exchange.quantity}</div>
                    </td>
                    <td>{REASON_LABEL[exchange.reason] || exchange.reason}</td>
                    <td>
                      {formatDate(exchange.deliveredAt)}
                      <div className="axx-muted">Requested {formatDate(exchange.createdAt)}</div>
                    </td>
                    <td><StatusBadge status={exchange.status} /></td>
                    <td><button type="button" className="admin-action-button">Open</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <ExchangeDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

export default Exchanges;
