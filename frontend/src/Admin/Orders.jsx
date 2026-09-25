import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Download,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import "../AdminCss/admin-pages.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   FILTERS
========================================================= */

const filters = [
  {
    label: "All Orders",
    value: "all",
  },

  {
    label: "Pending Payment",
    value: "pending_payment",
  },

  {
    label: "Placed",
    value: "placed",
  },

  {
    label: "Confirmed",
    value: "confirmed",
  },

  {
    label: "Processing",
    value: "processing",
  },

  {
    label: "Shipped",
    value: "shipped",
  },

  {
    label: "Delivered",
    value: "delivered",
  },

  {
    label: "Cancelled",
    value: "cancelled",
  },
];

/* =========================================================
   STATUS OPTIONS
========================================================= */

const statusOptions = [
  "pending_payment",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatStatus = (status) => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "pending_payment" || value === "placed") {
    return "admin-status admin-status-pending";
  }

  if (value === "confirmed" || value === "processing") {
    return "admin-status admin-status-processing";
  }

  if (value === "shipped") {
    return "admin-status admin-status-shipped";
  }

  if (value === "delivered") {
    return "admin-status admin-status-delivered";
  }

  if (value === "cancelled") {
    return "admin-status admin-status-cancelled";
  }

  return "admin-status admin-status-pending";
};

const getCustomerName = (order) => {
  const name = [order?.customer?.firstName, order?.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Customer";
};

const getPaymentText = (order) => {
  const method = String(order?.paymentMethod || "").toUpperCase();

  const status = String(order?.paymentStatus || "");

  if (status === "paid") {
    return `${method} / Paid`;
  }

  if (status === "partially_paid") {
    return `${method} / Partial`;
  }

  if (status === "failed") {
    return `${method} / Failed`;
  }

  if (status === "refunded") {
    return `${method} / Refunded`;
  }

  return `${method} / Pending`;
};

/* =========================================================
   ORDERS
========================================================= */

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [activeFilter, setActiveFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = useCallback(async (showMainLoader = false) => {
    try {
      if (showMainLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not load orders.");
      }

      const incomingOrders = Array.isArray(data?.orders) ? data.orders : [];

      setOrders(incomingOrders);

      /*
            Keep currently-open
            order fresh.
          */

      setSelectedOrder((current) => {
        if (!current) {
          return current;
        }

        return (
          incomingOrders.find(
            (order) => String(order._id) === String(current._id),
          ) || current
        );
      });
    } catch (loadError) {
      console.error("Orders load error:", loadError);

      setError(loadError.message || "Could not load orders.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  /* =======================================================
     AUTO LOAD
  ======================================================= */

  useEffect(() => {
    loadOrders(true);

    const interval = window.setInterval(() => {
      loadOrders(false);
    }, 10000);

    const handleFocus = () => {
      loadOrders(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadOrders(false);
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadOrders]);

  /* =======================================================
     OPEN ORDER FROM NOTIFICATION BELL

     Works with:
     navigate("/admin/orders", {
       state: { openOrderId: id }
     })
  ======================================================= */

  useEffect(() => {
    const orderId = location.state?.openOrderId;

    if (!orderId || !orders.length) {
      return;
    }

    const order = orders.find((item) => String(item._id) === String(orderId));

    if (order) {
      setSelectedOrder(order);

      // Clear the navigation state after opening the order once.
      // This prevents the modal from reopening after auto-refresh/focus.
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location.state?.openOrderId, orders, navigate, location.pathname]);

  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    /* STATUS */

    if (activeFilter !== "all") {
      result = result.filter(
        (order) =>
          String(order?.orderStatus || "").toLowerCase() === activeFilter,
      );
    }

    /* SEARCH */

    const cleanSearch = search.trim().toLowerCase();

    if (cleanSearch) {
      result = result.filter((order) => {
        const text = [
          order?.orderNumber,
          order?._id,

          order?.customer?.firstName,

          order?.customer?.lastName,

          order?.customer?.email,

          order?.customer?.phone,

          order?.shippingAddress?.city,

          order?.shippingAddress?.state,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(cleanSearch);
      });
    }

    return result.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }, [orders, activeFilter, search]);

  /* =======================================================
     ORDER ANALYTICS
  ======================================================= */

  const orderAnalytics = useMemo(() => {
    /*
        Cancelled orders are not
        counted as sales.
      */

    const validOrders = orders.filter(
      (order) => String(order?.orderStatus || "").toLowerCase() !== "cancelled",
    );

    /* ===============================================
         LAST 7 DAYS
      =============================================== */

    const now = new Date();

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(now.getDate() - 7);

    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyOrders = validOrders.filter((order) => {
      const date = new Date(order.createdAt);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date >= sevenDaysAgo && date <= now;
    });

    /* ===============================================
         WEEKLY SALES
      =============================================== */

    const weeklySales = weeklyOrders.reduce(
      (total, order) => total + Number(order.total || 0),
      0,
    );

    /* ===============================================
         AVERAGE ORDER VALUE
      =============================================== */

    const totalSales = validOrders.reduce(
      (total, order) => total + Number(order.total || 0),
      0,
    );

    const averageOrderValue = validOrders.length
      ? totalSales / validOrders.length
      : 0;

    /* ===============================================
         CITY SALES
      =============================================== */

    const cityMap = new Map();

    validOrders.forEach((order) => {
      const rawCity = String(order?.shippingAddress?.city || "").trim();

      if (!rawCity) {
        return;
      }

      const cityKey = rawCity.toLowerCase();

      const displayCity = rawCity.replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );

      /*
            Count quantity sold,
            not only number of orders.
          */

      const itemsSold = Array.isArray(order.items)
        ? order.items.reduce(
            (total, item) => total + Number(item.quantity || 1),
            0,
          )
        : 0;

      const current = cityMap.get(cityKey) || {
        city: displayCity,

        items: 0,

        orders: 0,

        sales: 0,
      };

      current.items += itemsSold;

      current.orders += 1;

      current.sales += Number(order.total || 0);

      cityMap.set(cityKey, current);
    });

    const topCities = Array.from(cityMap.values())
      .sort((a, b) => {
        if (b.items !== a.items) {
          return b.items - a.items;
        }

        return b.sales - a.sales;
      })
      .slice(0, 5);

    return {
      weeklySales,

      weeklyOrders: weeklyOrders.length,

      averageOrderValue,

      totalSales,

      topCities,
    };
  }, [orders]);

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (!orderId) {
        return;
      }

      setUpdatingStatus(true);

      setError("");

      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderStatus: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Status could not be updated.");
      }

      /* TABLE */

      setOrders((current) =>
        current.map((order) =>
          String(order._id) === String(orderId) ? data.order : order,
        ),
      );

      /* MODAL */

      setSelectedOrder((current) =>
        current && String(current._id) === String(orderId)
          ? data.order
          : current,
      );
    } catch (updateError) {
      console.error("Update order error:", updateError);

      setError(updateError.message || "Could not update order.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const exportOrders = () => {
    if (filteredOrders.length === 0) {
      alert("There are no orders to export.");

      return;
    }

    const rows = [
      [
        "Order Number",
        "Customer",
        "Email",
        "Phone",
        "City",
        "State",
        "Date",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Amount",
      ],

      ...filteredOrders.map((order) => [
        order.orderNumber || order._id,

        getCustomerName(order),

        order?.customer?.email || "",

        order?.customer?.phone || "",

        order?.shippingAddress?.city || "",

        order?.shippingAddress?.state || "",

        formatDate(order.createdAt),

        String(order.paymentMethod || "").toUpperCase(),

        formatStatus(order.paymentStatus),

        formatStatus(order.orderStatus),

        Number(order.total || 0),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "").replace(/"/g, '""');

            return `"${text}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `axiee-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     STYLES FOR NEW ANALYTICS BAR
  ======================================================= */

  const analyticsBarStyle = {
    display: "grid",

    gridTemplateColumns:
      "minmax(190px, 1fr) minmax(190px, 1fr) minmax(280px, 1.4fr)",

    gap: "8px",

    flex: "1",

    minWidth: "500px",
  };

  const statStyle = {
    minHeight: "62px",

    padding: "9px 12px",

    border: "1px solid #e5e8ec",

    borderRadius: "8px",

    background: "#fafbfc",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "2px",
  };

  const labelStyle = {
    fontSize: "8px",

    fontWeight: "700",

    color: "#8a919d",

    letterSpacing: "0.06em",

    textTransform: "uppercase",
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="admin-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>

          <p>Manage and track all real customer orders.</p>

          {error && (
            <p
              style={{
                color: "#d92d20",

                marginTop: "8px",
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",

            gap: "10px",

            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => loadOrders(false)}
            disabled={refreshing}
          >
            <RefreshCw size={17} />

            {refreshing ? "Refreshing" : "Refresh"}
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={exportOrders}
          >
            <Download size={17} />
            Export
          </button>
        </div>
      </div>

      {/* =================================================
          CARD
      ================================================= */}

      <div className="admin-card">
        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div
          className="admin-toolbar"
          style={{
            display: "flex",

            alignItems: "flex-start",

            gap: "12px",

            flexWrap: "wrap",
          }}
        >
          {/* ===============================================
              SEARCH
          =============================================== */}

          <div
            className="admin-search-box"
            style={{
              flex: "0 1 330px",

              minWidth: "240px",
            }}
          >
            <Search size={17} />

            <input
              type="text"
              placeholder="Search order, customer, email, phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* ===============================================
              ANALYTICS IN MIDDLE
          =============================================== */}

          <div className="admin-order-analytics" style={analyticsBarStyle}>
            {/* WEEKLY SALES */}

            <div style={statStyle}>
              <span style={labelStyle}>Weekly Sales</span>

              <strong
                style={{
                  fontSize: "15px",

                  color: "#171b21",
                }}
              >
                {formatMoney(orderAnalytics.weeklySales)}
              </strong>

              <small
                style={{
                  color: "#969da7",

                  fontSize: "8px",
                }}
              >
                {orderAnalytics.weeklyOrders} orders in last 7 days
              </small>
            </div>

            {/* AVG ORDER */}

            <div style={statStyle}>
              <span style={labelStyle}>Avg Order Value</span>

              <strong
                style={{
                  fontSize: "15px",

                  color: "#171b21",
                }}
              >
                {formatMoney(Math.round(orderAnalytics.averageOrderValue))}
              </strong>

              <small
                style={{
                  color: "#969da7",

                  fontSize: "8px",
                }}
              >
                average per non-cancelled order
              </small>
            </div>

            {/* TOP CITIES */}

            <div
              style={{
                ...statStyle,

                justifyContent: "flex-start",
              }}
            >
              <span style={labelStyle}>Top 5 Cities</span>

              <div
                style={{
                  display: "grid",

                  gap: "2px",

                  marginTop: "3px",
                }}
              >
                {orderAnalytics.topCities.length === 0 ? (
                  <small
                    style={{
                      color: "#969da7",

                      fontSize: "8px",
                    }}
                  >
                    No city data
                  </small>
                ) : (
                  orderAnalytics.topCities.map((city, index) => (
                    <div
                      key={city.city}
                      style={{
                        display: "grid",

                        gridTemplateColumns: "14px minmax(0,1fr) auto",

                        alignItems: "center",

                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "#9ca3ad",

                          fontSize: "8px",
                        }}
                      >
                        {index + 1}.
                      </span>

                      <strong
                        style={{
                          overflow: "hidden",

                          whiteSpace: "nowrap",

                          textOverflow: "ellipsis",

                          color: "#272c33",

                          fontSize: "8px",
                        }}
                      >
                        {city.city}
                      </strong>

                      <span
                        style={{
                          color: "#8c939e",

                          fontSize: "8px",
                        }}
                      >
                        {city.items} items
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ===============================================
              CLEAR FILTER
          =============================================== */}

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => {
              setSearch("");

              setActiveFilter("all");
            }}
          >
            <SlidersHorizontal size={17} />
            Clear Filters
          </button>
        </div>

        {/* =================================================
            FILTER TABS
        ================================================= */}

        <div className="admin-filter-tabs">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={
                activeFilter === filter.value ? "admin-filter-active" : ""
              }
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* =================================================
            LOADING / TABLE
        ================================================= */}

        {loading ? (
          <div
            style={{
              padding: "50px 20px",

              textAlign: "center",

              color: "#7b8290",
            }}
          >
            Loading orders...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>

                  <th>Customer</th>

                  <th>Date</th>

                  <th>Payment</th>

                  <th>Amount</th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",

                        padding: "50px 20px",

                        color: "#7b8290",
                      }}
                    >
                      No orders found.
                    </td>
                  </tr>
                )}

                {filteredOrders.map((order) => (
                  <tr key={order._id || order.orderNumber}>
                    {/* ORDER */}

                    <td>
                      <strong>{order.orderNumber || order._id}</strong>
                    </td>

                    {/* CUSTOMER */}

                    <td>
                      <div
                        style={{
                          display: "flex",

                          flexDirection: "column",

                          gap: "3px",
                        }}
                      >
                        <strong>{getCustomerName(order)}</strong>

                        <span
                          style={{
                            fontSize: "10px",

                            color: "#8a919d",
                          }}
                        >
                          {order?.customer?.phone || ""}
                        </span>
                      </div>
                    </td>

                    {/* DATE */}

                    <td>
                      <div
                        style={{
                          display: "flex",

                          flexDirection: "column",

                          gap: "3px",
                        }}
                      >
                        <span>{formatDate(order.createdAt)}</span>

                        <span
                          style={{
                            fontSize: "10px",

                            color: "#8a919d",
                          }}
                        >
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* PAYMENT */}

                    <td>{getPaymentText(order)}</td>

                    {/* AMOUNT */}

                    <td>
                      <strong>{formatMoney(order.total)}</strong>
                    </td>

                    {/* STATUS */}

                    <td>
                      <span className={getStatusClass(order.orderStatus)}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </td>

                    {/* VIEW */}

                    <td>
                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() => setSelectedOrder(order)}
                        title="View order"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          ORDER DETAILS MODAL
      ================================================= */}

      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{
            position: "fixed",

            inset: 0,

            zIndex: 99999,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            padding: "20px",

            background: "rgba(0,0,0,0.55)",

            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(900px, 100%)",

              maxHeight: "90vh",

              overflowY: "auto",

              background: "#ffffff",

              borderRadius: "14px",

              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            }}
          >
            {/* ===========================================
                MODAL HEADER
            =========================================== */}

            <div
              style={{
                display: "flex",

                alignItems: "flex-start",

                justifyContent: "space-between",

                gap: "20px",

                padding: "22px",

                borderBottom: "1px solid #eceef1",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#8a919d",

                    fontSize: "10px",

                    letterSpacing: "0.12em",
                  }}
                >
                  ORDER DETAILS
                </span>

                <h2
                  style={{
                    margin: "6px 0 4px",
                  }}
                >
                  {selectedOrder.orderNumber || selectedOrder._id}
                </h2>

                <p
                  style={{
                    margin: 0,

                    color: "#7b8290",
                  }}
                >
                  {formatDate(selectedOrder.createdAt)} •{" "}
                  {formatTime(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: "38px",

                  height: "38px",

                  display: "grid",

                  placeItems: "center",

                  border: "1px solid #e5e7eb",

                  borderRadius: "8px",

                  background: "white",

                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* ===========================================
                MODAL CONTENT
            =========================================== */}

            <div
              style={{
                padding: "22px",

                display: "grid",

                gap: "20px",
              }}
            >
              {/* =========================================
                  STATUS
              ========================================= */}

              <section
                style={{
                  padding: "18px",

                  border: "1px solid #e6e8eb",

                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    gap: "15px",

                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>Order Status</strong>

                    <p
                      style={{
                        margin: "5px 0 0",

                        color: "#7b8290",

                        fontSize: "12px",
                      }}
                    >
                      Change the current order status.
                    </p>
                  </div>

                  <select
                    value={selectedOrder.orderStatus || "placed"}
                    disabled={updatingStatus}
                    onChange={(event) =>
                      updateOrderStatus(selectedOrder._id, event.target.value)
                    }
                    style={{
                      minWidth: "180px",

                      height: "40px",

                      border: "1px solid #dfe3e8",

                      borderRadius: "8px",

                      padding: "0 12px",

                      background: "white",
                    }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* =========================================
                  CUSTOMER
              ========================================= */}

              <section
                style={{
                  padding: "18px",

                  border: "1px solid #e6e8eb",

                  borderRadius: "10px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px",
                  }}
                >
                  Customer
                </h3>

                <div
                  style={{
                    display: "grid",

                    gap: "10px",
                  }}
                >
                  <strong>{getCustomerName(selectedOrder)}</strong>

                  <span
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: "8px",
                    }}
                  >
                    <Mail size={15} />

                    {selectedOrder?.customer?.email || "-"}
                  </span>

                  <span
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: "8px",
                    }}
                  >
                    <Phone size={15} />

                    {selectedOrder?.customer?.phone || "-"}
                  </span>
                </div>
              </section>

              {/* =========================================
                  ADDRESS
              ========================================= */}

              <section
                style={{
                  padding: "18px",

                  border: "1px solid #e6e8eb",

                  borderRadius: "10px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px",

                    display: "flex",

                    alignItems: "center",

                    gap: "8px",
                  }}
                >
                  <MapPin size={18} />
                  Delivery Address
                </h3>

                <p
                  style={{
                    margin: 0,

                    lineHeight: 1.7,
                  }}
                >
                  {selectedOrder?.shippingAddress?.address}
                  {selectedOrder?.shippingAddress?.apartment
                    ? `, ${selectedOrder.shippingAddress.apartment}`
                    : ""}
                  <br />
                  {selectedOrder?.shippingAddress?.city},{" "}
                  {selectedOrder?.shippingAddress?.state}{" "}
                  {selectedOrder?.shippingAddress?.pincode}
                  <br />
                  {selectedOrder?.shippingAddress?.country || "India"}
                </p>
              </section>

              {/* =========================================
                  PRODUCTS
              ========================================= */}

              <section
                style={{
                  padding: "18px",

                  border: "1px solid #e6e8eb",

                  borderRadius: "10px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px",

                    display: "flex",

                    alignItems: "center",

                    gap: "8px",
                  }}
                >
                  <Package size={18} />
                  Ordered Products
                </h3>

                <div
                  style={{
                    display: "grid",

                    gap: "12px",
                  }}
                >
                  {(selectedOrder.items || []).map((item, index) => (
                    <div
                      key={`${item.productId}-${item.size}-${index}`}
                      style={{
                        display: "grid",

                        gridTemplateColumns: "1fr auto",

                        gap: "15px",

                        padding: "12px 0",

                        borderBottom: "1px solid #eceef1",
                      }}
                    >
                      <div>
                        <strong>{item.name}</strong>

                        <div
                          style={{
                            marginTop: "5px",

                            color: "#7b8290",

                            fontSize: "12px",
                          }}
                        >
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` • Colour: ${item.color}`}
                          {" • "}
                          Qty: {item.quantity}
                        </div>
                      </div>

                      <strong>
                        {formatMoney(
                          item.lineTotal ??
                            Number(item.price || 0) *
                              Number(item.quantity || 1),
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>

              {/* =========================================
                  PAYMENT
              ========================================= */}

              <section
                style={{
                  padding: "18px",

                  border: "1px solid #e6e8eb",

                  borderRadius: "10px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px",
                  }}
                >
                  Payment Summary
                </h3>

                <div
                  style={{
                    display: "grid",

                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      justifyContent: "space-between",
                    }}
                  >
                    <span>Subtotal</span>

                    <strong>{formatMoney(selectedOrder.subtotal)}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",

                      justifyContent: "space-between",
                    }}
                  >
                    <span>Shipping</span>

                    <strong>{formatMoney(selectedOrder.shipping)}</strong>
                  </div>

                  {selectedOrder.codAdvanceRequired && (
                    <>
                      <div
                        style={{
                          display: "flex",

                          justifyContent: "space-between",
                        }}
                      >
                        <span>Advance Required</span>

                        <strong>
                          {formatMoney(selectedOrder.advanceAmount)}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",

                          justifyContent: "space-between",
                        }}
                      >
                        <span>Balance on Delivery</span>

                        <strong>
                          {formatMoney(selectedOrder.balanceDueOnDelivery)}
                        </strong>
                      </div>
                    </>
                  )}

                  <div
                    style={{
                      display: "flex",

                      justifyContent: "space-between",

                      marginTop: "5px",

                      paddingTop: "12px",

                      borderTop: "1px solid #eceef1",

                      fontSize: "17px",
                    }}
                  >
                    <strong>Total</strong>

                    <strong>{formatMoney(selectedOrder.total)}</strong>
                  </div>

                  <div
                    style={{
                      marginTop: "5px",

                      color: "#7b8290",

                      fontSize: "12px",
                    }}
                  >
                    Payment: {getPaymentText(selectedOrder)}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
