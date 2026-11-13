import React, { useEffect, useMemo, useState } from "react";

import { Edit3, Plus, Trash2, X } from "lucide-react";

import "../AdminCss/admin-pages.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : "")
).replace(/\/+$/, "");

/* =========================================================
   SAFE API RESPONSE PARSER

   Prevents:
   - Unexpected end of JSON input
   - Unexpected token '<'
   - Empty response bodies
   - HTML being parsed as JSON
========================================================= */

const parseApiResponse = async (response, label = "Coupon API") => {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(
        `${label} failed (${response.status} ${response.statusText || ""})`.trim(),
      );
    }

    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`❌ ${label} returned non-JSON:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      body: text.slice(0, 500),
    });

    throw new Error(
      `${label} returned an invalid response (${response.status}).`,
    );
  }
};

console.log("🌐 COUPON API:", API_URL || "same-domain");

const EMPTY_FORM = {
  code: "",

  description: "",

  discountType: "percentage",

  discountValue: "10",

  minOrderAmount: "3000",

  maxDiscountAmount: "0",

  expiryDate: "",

  firstOrderOnly: false,

  isActive: true,
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  }).format(date);
};

const inputDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const discountLabel = (coupon) =>
  coupon.discountType === "fixed"
    ? `${money(coupon.discountValue)} OFF`
    : `${Number(coupon.discountValue || 0)}% OFF`;

function Coupons() {
  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const activeCount = useMemo(
    () => coupons.filter((coupon) => coupon.isActive).length,

    [coupons],
  );

  /* =========================================================
     LOAD
  ========================================================= */

  const loadCoupons = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_URL}/api/coupons`,

        {
          cache: "no-store",

          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await parseApiResponse(response, "Coupon API");

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load coupons.");
      }

      setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
    } catch (err) {
      console.error("Load coupons error:", err);

      setError(err?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  /* =========================================================
     MODAL
  ========================================================= */

  const openAdd = () => {
    setEditingCoupon(null);

    setForm(EMPTY_FORM);

    setError("");

    setMessage("");

    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",

      description: coupon.description || "",

      discountType: coupon.discountType || "percentage",

      discountValue: String(coupon.discountValue ?? 10),

      minOrderAmount: String(coupon.minOrderAmount ?? 3000),

      maxDiscountAmount: String(coupon.maxDiscountAmount ?? 0),

      expiryDate: inputDate(coupon.expiryDate),

      firstOrderOnly: Boolean(coupon.firstOrderOnly),

      isActive: Boolean(coupon.isActive),
    });

    setError("");

    setMessage("");

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingCoupon(null);

    setForm(EMPTY_FORM);
  };

  /* =========================================================
     CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,

      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const saveCoupon = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      setError("");

      setMessage("");

      const payload = {
        code: String(form.code || "")
          .trim()
          .toUpperCase(),

        description: String(form.description || "").trim(),

        discountType: form.discountType,

        discountValue: Number(form.discountValue || 0),

        minOrderAmount: Number(form.minOrderAmount || 0),

        maxDiscountAmount: Number(form.maxDiscountAmount || 0),

        expiryDate: form.expiryDate,

        firstOrderOnly: Boolean(form.firstOrderOnly),

        isActive: Boolean(form.isActive),
      };

      if (!payload.code) {
        throw new Error("Coupon code is required.");
      }

      if (!payload.expiryDate) {
        throw new Error("Expiry date is required.");
      }

      if (payload.discountValue <= 0) {
        throw new Error("Discount value must be more than 0.");
      }

      if (
        payload.discountType === "percentage" &&
        payload.discountValue > 100
      ) {
        throw new Error("Percentage discount cannot be more than 100%.");
      }

      const url = editingCoupon
        ? `${API_URL}/api/coupons/${editingCoupon._id}`
        : `${API_URL}/api/coupons`;

      const response = await fetch(
        url,

        {
          method: editingCoupon ? "PUT" : "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      const data = await parseApiResponse(response, "Coupon API");

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save coupon.");
      }

      setMessage(
        editingCoupon
          ? "Coupon updated successfully."
          : "Coupon created successfully.",
      );

      setModalOpen(false);

      setEditingCoupon(null);

      setForm(EMPTY_FORM);

      await loadCoupons();
    } catch (err) {
      console.error("Save coupon error:", err);

      setError(err?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     ACTIVE / INACTIVE
  ========================================================= */

  const toggleStatus = async (coupon) => {
    try {
      setError("");

      setMessage("");

      const response = await fetch(
        `${API_URL}/api/coupons/${coupon._id}/status`,

        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            isActive: !coupon.isActive,
          }),
        },
      );

      const data = await parseApiResponse(response, "Coupon API");

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update coupon status.");
      }

      setCoupons((current) =>
        current.map((item) => (item._id === coupon._id ? data.coupon : item)),
      );

      setMessage(
        data.coupon.isActive
          ? `${data.coupon.code} is ACTIVE and will show at checkout.`
          : `${data.coupon.code} is INACTIVE and will not show at checkout.`,
      );
    } catch (err) {
      setError(err?.message || "Failed to update coupon status.");
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/coupons/${coupon._id}`,

        {
          method: "DELETE",

          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await parseApiResponse(response, "Coupon API");

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete coupon.");
      }

      setCoupons((current) =>
        current.filter((item) => item._id !== coupon._id),
      );

      setMessage(`${coupon.code} deleted.`);
    } catch (err) {
      setError(err?.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Coupons</h1>

          <p>
            Manage discount codes and offers. {activeCount} active coupon
            {activeCount === 1 ? "" : "s"} available at checkout.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAdd}
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      {message && <div style={successBox}>{message}</div>}

      {error && <div style={errorBox}>{error}</div>}

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>

                <th>Discount</th>

                <th>Minimum Order</th>

                <th>Expiry Date</th>

                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",

                      padding: 30,
                    }}
                  >
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",

                      padding: 30,
                    }}
                  >
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>
                      <strong>{coupon.code}</strong>

                      {coupon.firstOrderOnly && (
                        <small
                          style={{
                            display: "block",

                            marginTop: 4,
                          }}
                        >
                          First order only
                        </small>
                      )}
                    </td>

                    <td>{discountLabel(coupon)}</td>

                    <td>{money(coupon.minOrderAmount)}</td>

                    <td>{formatDate(coupon.expiryDate)}</td>

                    <td>
                      <button
                        type="button"
                        onClick={() => toggleStatus(coupon)}
                        style={statusButton(coupon.isActive)}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() => openEdit(coupon)}
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-action-button admin-delete-button"
                          onClick={() => deleteCoupon(coupon)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <form onSubmit={saveCoupon} style={modalStyle}>
            <div style={modalHeadStyle}>
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",

                    color: "#667085",
                  }}
                >
                  Example: 10% off above ₹3,000.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
              >
                <X size={18} />
              </button>
            </div>

            <div style={formGridStyle}>
              <Field label="Coupon Code">
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="WELCOME10"
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Discount Type">
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="percentage">Percentage (%)</option>

                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </Field>

              <Field
                label={
                  form.discountType === "percentage"
                    ? "Discount Percentage"
                    : "Discount Amount"
                }
              >
                <input
                  type="number"
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Minimum Order Amount">
                <input
                  type="number"
                  min="0"
                  name="minOrderAmount"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Max Discount (0 = no limit)">
                <input
                  type="number"
                  min="0"
                  name="maxDiscountAmount"
                  value={form.maxDiscountAmount}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Expiry Date">
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field
              label="Description"
              style={{
                marginTop: 16,
              }}
            >
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="10% off above ₹3,000"
                style={inputStyle}
              />
            </Field>

            <div
              style={{
                display: "flex",

                gap: 22,

                marginTop: 20,

                flexWrap: "wrap",
              }}
            >
              <label style={checkLabelStyle}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Active — show at checkout
              </label>

              <label style={checkLabelStyle}>
                <input
                  type="checkbox"
                  name="firstOrderOnly"
                  checked={form.firstOrderOnly}
                  onChange={handleChange}
                />
                First order only
              </label>
            </div>

            <div style={exampleBoxStyle}>
              <strong>Example</strong>

              <p
                style={{
                  margin: "8px 0 0",
                }}
              >
                ₹4,000 order + 10% coupon = ₹400 discount = ₹3,600 final total.
                Minimum ₹3,000 means the coupon cannot be applied below ₹3,000.
              </p>
            </div>

            <div
              style={{
                display: "flex",

                justifyContent: "flex-end",

                gap: 10,

                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={cancelStyle}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="admin-primary-button"
              >
                {saving
                  ? "Saving..."
                  : editingCoupon
                    ? "Save Changes"
                    : "Add Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label
      style={{
        display: "grid",

        gap: 7,

        ...style,
      }}
    >
      <span>{label}</span>

      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",

  height: 44,

  border: "1px solid #d0d5dd",

  borderRadius: 10,

  padding: "0 12px",

  background: "#fff",

  color: "#101828",

  outline: "none",

  boxSizing: "border-box",
};

const successBox = {
  marginBottom: 16,

  padding: "12px 14px",

  borderRadius: 10,

  background: "#ecfdf3",

  color: "#067647",

  fontWeight: 600,
};

const errorBox = {
  ...successBox,

  background: "#fff1f1",

  color: "#b42318",
};

const statusButton = (active) => ({
  border: 0,

  cursor: "pointer",

  padding: "7px 16px",

  borderRadius: 999,

  fontWeight: 700,

  background: active ? "#d9fbe8" : "#f2f4f7",

  color: active ? "#067647" : "#667085",
});

const overlayStyle = {
  position: "fixed",

  inset: 0,

  zIndex: 10000,

  display: "grid",

  placeItems: "center",

  padding: 20,

  background: "rgba(15,18,22,.65)",

  backdropFilter: "blur(6px)",
};

const modalStyle = {
  width: "min(720px, 100%)",

  maxHeight: "90vh",

  overflowY: "auto",

  borderRadius: 18,

  background: "#fff",

  boxShadow: "0 30px 80px rgba(0,0,0,.25)",

  padding: 26,
};

const modalHeadStyle = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: 20,

  marginBottom: 22,
};

const closeButtonStyle = {
  width: 40,

  height: 40,

  borderRadius: 10,

  border: "1px solid #e4e7ec",

  background: "#fff",

  cursor: "pointer",

  display: "grid",

  placeItems: "center",
};

const formGridStyle = {
  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: 16,
};

const checkLabelStyle = {
  display: "flex",

  alignItems: "center",

  gap: 9,

  cursor: "pointer",
};

const exampleBoxStyle = {
  marginTop: 26,

  padding: 16,

  borderRadius: 12,

  background: "#f8fafc",

  border: "1px solid #eaecf0",
};

const cancelStyle = {
  height: 44,

  padding: "0 20px",

  borderRadius: 10,

  border: "1px solid #d0d5dd",

  background: "#fff",

  fontWeight: 700,
};

export default Coupons;
