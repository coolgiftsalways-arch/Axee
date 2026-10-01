import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  CheckCircle2,
  CircleDot,
  FileText,
  RefreshCw,
  Search,
  Send,
  TestTube2,
  Truck,
} from "lucide-react";

import "../AdminCss/adminShipping.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "";

const apiUrl = (path) =>
  `${API_BASE}${path}`;

/* =========================================================
   HELPERS
========================================================= */

const getOrderId = (row) =>
  row?.order?._id ||
  "";

const getOrderNumber = (row) =>
  row?.order?.orderNumber ||
  row?.order?.orderId ||
  row?.order?._id ||
  "—";

const getCustomerName = (row) => {
  const firstName =
    row?.order?.customer?.firstName ||
    "";

  const lastName =
    row?.order?.customer?.lastName ||
    "";

  const fullName =
    [firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  return fullName || "Customer";
};

const getPhone = (row) =>
  row?.order?.customer?.phone ||
  row?.order
    ?.deliveryDetails?.phone ||
  row?.order
    ?.shippingAddress?.phone ||
  row?.order?.phone ||
  "—";

const getAmount = (row) =>
  Number(
    row?.order?.total ??
      row?.order?.totalAmount ??
      row?.order?.grandTotal ??
      row?.order?.amount ??
      0,
  );

/* =========================================================
   STATUS LABELS
========================================================= */

const STATUS_LABELS = {
  not_sent:
    "Not Sent",

  order_created:
    "Order Created",

  awb_assigned:
    "AWB Assigned",

  pickup_scheduled:
    "Pickup Scheduled",

  in_transit:
    "In Transit",

  delivered:
    "Delivered",

  failed:
    "Failed",
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const current =
    status ||
    "not_sent";

  return (
    <span
      className={`shipping-status shipping-status-${current}`}
    >
      <CircleDot
        size={12}
      />

      {STATUS_LABELS[
        current
      ] || current}
    </span>
  );
}

/* =========================================================
   SHIPPING PAGE
========================================================= */

export default function Shipping() {
  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD SHIPPING DASHBOARD
  ======================================================= */

  const loadShipping =
    async () => {
      setLoading(true);

      setError("");

      try {
        const response =
          await fetch(
            apiUrl(
              "/api/shiprocket/dashboard",
            ),
            {
              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          data.success === false
        ) {
          throw new Error(
            data.message ||
              "Unable to load shipping dashboard",
          );
        }

        setRows(
          Array.isArray(
            data.rows,
          )
            ? data.rows
            : [],
        );
      } catch (err) {
        setError(
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     AUTO LOAD
  ======================================================= */

  useEffect(() => {
    loadShipping();
  }, []);

  /* =======================================================
     TEST SHIPROCKET CONNECTION
  ======================================================= */

  const testConnection =
    async () => {
      setBusy(
        "test",
      );

      setMessage("");

      setError("");

      try {
        const response =
          await fetch(
            apiUrl(
              "/api/shiprocket/test",
            ),
            {
              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              data.message ||
              "Shiprocket connection failed",
          );
        }

        setMessage(
          "Shiprocket connected successfully. No shipment was created.",
        );
      } catch (err) {
        setError(
          err.message,
        );
      } finally {
        setBusy("");
      }
    };

  /* =======================================================
     GENERIC POST ACTION
  ======================================================= */

  const runAction =
    async (
      row,
      action,
      successMessage,
    ) => {
      const orderId =
        getOrderId(row);

      if (!orderId) {
        setError(
          "Order ID is missing.",
        );

        return;
      }

      setBusy(
        `${orderId}-${action}`,
      );

      setMessage("");

      setError("");

      try {
        const response =
          await fetch(
            apiUrl(
              `/api/shiprocket/order/${orderId}/${action}`,
            ),
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {},
                ),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              (
                typeof data.error ===
                "string"
                  ? data.error
                  : JSON.stringify(
                      data.error ||
                        {},
                    )
              ),
          );
        }

        setMessage(
          successMessage,
        );

        await loadShipping();

        return data;
      } catch (err) {
        setError(
          err.message,
        );

        return null;
      } finally {
        setBusy("");
      }
    };

  /* =======================================================
     GENERATE LABEL
  ======================================================= */

  const generateLabel =
    async (row) => {
      const orderId =
        getOrderId(row);

      if (!orderId) {
        setError(
          "Order ID is missing.",
        );

        return;
      }

      setBusy(
        `${orderId}-label`,
      );

      setMessage("");

      setError("");

      try {
        const response =
          await fetch(
            apiUrl(
              `/api/shiprocket/order/${orderId}/label`,
            ),
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {},
                ),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              (
                typeof data.error ===
                "string"
                  ? data.error
                  : JSON.stringify(
                      data.error ||
                        {},
                    )
              ),
          );
        }

        setMessage(
          data.alreadyGenerated
            ? "Shipping label already exists."
            : "Shipping label generated successfully.",
        );

        if (data.labelUrl) {
          window.open(
            data.labelUrl,
            "_blank",
            "noopener,noreferrer",
          );
        }

        await loadShipping();
      } catch (err) {
        setError(
          err.message,
        );
      } finally {
        setBusy("");
      }
    };

  /* =======================================================
     OPEN EXISTING LABEL
  ======================================================= */

  const openExistingLabel =
    (row) => {
      const labelUrl =
        row?.shiprocket
          ?.labelUrl;

      if (!labelUrl) {
        setError(
          "Shipping label is not available.",
        );

        return;
      }

      window.open(
        labelUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  /* =======================================================
     TRACK
  ======================================================= */

  const trackOrder =
    async (row) => {
      const orderId =
        getOrderId(row);

      if (!orderId) {
        setError(
          "Order ID is missing.",
        );

        return;
      }

      setBusy(
        `${orderId}-track`,
      );

      setError("");

      setMessage("");

      try {
        const response =
          await fetch(
            apiUrl(
              `/api/shiprocket/order/${orderId}/track`,
            ),
            {
              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Tracking failed",
          );
        }

        setMessage(
          "Tracking updated successfully.",
        );

        await loadShipping();
      } catch (err) {
        setError(
          err.message,
        );
      } finally {
        setBusy("");
      }
    };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredRows =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return rows;
      }

      return rows.filter(
        (row) => {
          return [
            getOrderNumber(
              row,
            ),

            getCustomerName(
              row,
            ),

            getPhone(
              row,
            ),

            row?.shiprocket
              ?.awb,

            row?.shiprocket
              ?.courierName,

            row?.shiprocket
              ?.currentStatus,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(
                  value,
                )
                  .toLowerCase()
                  .includes(
                    q,
                  ),
            );
        },
      );
    }, [
      rows,
      search,
    ]);

  /* =======================================================
     ACTION BUTTON
  ======================================================= */

  const renderAction = (
    row,
  ) => {
    const status =
      row?.shiprocket
        ?.status ||
      "not_sent";

    const id =
      getOrderId(row);

    const hasAwb =
      Boolean(
        row?.shiprocket
          ?.awb,
      );

    const hasLabel =
      Boolean(
        row?.shiprocket
          ?.labelUrl,
      );

    /* =====================================================
       NOT SENT / FAILED
    ===================================================== */

    if (
      status ===
        "not_sent" ||
      status ===
        "failed"
    ) {
      return (
        <button
          type="button"
          className="shipping-action shipping-action-primary"
          disabled={
            Boolean(
              busy,
            )
          }
          onClick={() =>
            runAction(
              row,
              "send",
              "Order sent to Shiprocket.",
            )
          }
        >
          <Send
            size={15}
          />

          {busy ===
          `${id}-send`
            ? "Sending..."
            : "Send to Shiprocket"}
        </button>
      );
    }

    /* =====================================================
       ORDER CREATED
    ===================================================== */

    if (
      status ===
      "order_created"
    ) {
      return (
        <button
          type="button"
          className="shipping-action"
          disabled={
            Boolean(
              busy,
            )
          }
          onClick={() =>
            runAction(
              row,
              "assign-awb",
              "AWB assigned successfully.",
            )
          }
        >
          <Box
            size={15}
          />

          {busy ===
          `${id}-assign-awb`
            ? "Assigning..."
            : "Assign AWB"}
        </button>
      );
    }

    /* =====================================================
       AWB ASSIGNED
    ===================================================== */

    if (
      status ===
      "awb_assigned"
    ) {
      return (
        <div
          style={{
            display:
              "flex",

            gap:
              "8px",

            flexWrap:
              "wrap",
          }}
        >
          {hasLabel ? (
            <button
              type="button"
              className="shipping-action"
              disabled={
                Boolean(
                  busy,
                )
              }
              onClick={() =>
                openExistingLabel(
                  row,
                )
              }
            >
              <FileText
                size={15}
              />

              View Label
            </button>
          ) : (
            <button
              type="button"
              className="shipping-action"
              disabled={
                Boolean(
                  busy,
                )
              }
              onClick={() =>
                generateLabel(
                  row,
                )
              }
            >
              <FileText
                size={15}
              />

              {busy ===
              `${id}-label`
                ? "Generating..."
                : "Generate Label"}
            </button>
          )}

          <button
            type="button"
            className="shipping-action shipping-action-pickup"
            disabled={
              Boolean(
                busy,
              ) ||
              !hasAwb
            }
            onClick={() =>
              runAction(
                row,
                "pickup",
                "Pickup scheduled successfully.",
              )
            }
          >
            <Truck
              size={15}
            />

            {busy ===
            `${id}-pickup`
              ? "Scheduling..."
              : "Schedule Pickup"}
          </button>
        </div>
      );
    }

    /* =====================================================
       PICKUP / IN TRANSIT / DELIVERED
    ===================================================== */

    return (
      <div
        style={{
          display:
            "flex",

          gap:
            "8px",

          flexWrap:
            "wrap",
        }}
      >
        {hasLabel && (
          <button
            type="button"
            className="shipping-action"
            disabled={
              Boolean(
                busy,
              )
            }
            onClick={() =>
              openExistingLabel(
                row,
              )
            }
          >
            <FileText
              size={15}
            />

            Label
          </button>
        )}

        <button
          type="button"
          className="shipping-action"
          onClick={() =>
            trackOrder(
              row,
            )
          }
          disabled={
            Boolean(
              busy,
            ) ||
            !hasAwb
          }
        >
          <RefreshCw
            size={15}
          />

          {busy ===
          `${id}-track`
            ? "Tracking..."
            : "Track"}
        </button>
      </div>
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="shipping-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="shipping-header">

        <div>
          <span className="shipping-eyebrow">
            UNBOUND LOGISTICS
          </span>

          <h1>
            Shipping
          </h1>

          <p>
            Manage Shiprocket orders,
            AWBs, labels, pickups and tracking.
          </p>
        </div>

        <div className="shipping-header-actions">

          <button
            type="button"
            className="shipping-test-button"
            onClick={
              testConnection
            }
            disabled={
              busy ===
              "test"
            }
          >
            <TestTube2
              size={17}
            />

            {busy ===
            "test"
              ? "Testing..."
              : "Test Connection"}
          </button>

          <button
            type="button"
            className="shipping-refresh-button"
            onClick={
              loadShipping
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={17}
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {message && (
        <div className="shipping-success">
          <CheckCircle2
            size={17}
          />

          {message}
        </div>
      )}

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="shipping-error">
          {error}
        </div>
      )}

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="shipping-search">

        <Search
          size={18}
        />

        <input
          type="text"
          placeholder="Search order, customer, AWB or courier..."
          value={search}
          onChange={(
            event,
          ) =>
            setSearch(
              event.target
                .value,
            )
          }
        />

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="shipping-table-wrapper">

        <table className="shipping-table">

          <thead>
            <tr>

              <th>
                ORDER
              </th>

              <th>
                CUSTOMER
              </th>

              <th>
                AMOUNT
              </th>

              <th>
                SHIPROCKET
              </th>

              <th>
                AWB / COURIER
              </th>

              <th>
                ACTION
              </th>

            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="shipping-empty"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length ===
              0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="shipping-empty"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredRows.map(
                (row) => (
                  <tr
                    key={
                      getOrderId(
                        row,
                      )
                    }
                  >

                    {/* ORDER */}

                    <td>
                      <strong>
                        {getOrderNumber(
                          row,
                        )}
                      </strong>
                    </td>

                    {/* CUSTOMER */}

                    <td>
                      <strong>
                        {getCustomerName(
                          row,
                        )}
                      </strong>

                      <small>
                        {getPhone(
                          row,
                        )}
                      </small>
                    </td>

                    {/* AMOUNT */}

                    <td>
                      ₹
                      {getAmount(
                        row,
                      ).toLocaleString(
                        "en-IN",
                      )}
                    </td>

                    {/* SHIPROCKET STATUS */}

                    <td>
                      <StatusBadge
                        status={
                          row
                            ?.shiprocket
                            ?.status
                        }
                      />

                      {row
                        ?.shiprocket
                        ?.currentStatus && (
                        <small
                          style={{
                            display:
                              "block",

                            marginTop:
                              "5px",
                          }}
                        >
                          {
                            row
                              .shiprocket
                              .currentStatus
                          }
                        </small>
                      )}
                    </td>

                    {/* AWB / COURIER */}

                    <td>
                      <strong>
                        {row
                          ?.shiprocket
                          ?.awb ||
                          "—"}
                      </strong>

                      <small>
                        {row
                          ?.shiprocket
                          ?.courierName ||
                          "No courier yet"}
                      </small>
                    </td>

                    {/* ACTION */}

                    <td>
                      {renderAction(
                        row,
                      )}
                    </td>

                  </tr>
                ),
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}