import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../AdminCss/dashboard.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
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

const formatStatus = (status) => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

/* =========================================================
   DASHBOARD
========================================================= */

const Dashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  /* =======================================================
     FETCH ORDERS
  ======================================================= */

  const fetchOrders = async () => {
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

    return Array.isArray(data?.orders) ? data.orders : [];
  };

  /* =======================================================
     FETCH PRODUCTS
  ======================================================= */

  const fetchProducts = async () => {
    const response = await fetch(`${API_BASE}/api/catalog/products`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Could not load products.");
    }

    return Array.isArray(data?.products) ? data.products : [];
  };

  /* =======================================================
     LOAD DASHBOARD

     IMPORTANT:
     Orders and products load separately.

     So if product API fails,
     orders will STILL appear.
  ======================================================= */

  const loadDashboard = useCallback(async (showMainLoader = false) => {
    try {
      if (showMainLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const results = await Promise.allSettled([
        fetchOrders(),
        fetchProducts(),
      ]);

      const ordersResult = results[0];

      const productsResult = results[1];

      /* ORDERS */

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value);
      } else {
        console.error("Dashboard orders error:", ordersResult.reason);

        setError(ordersResult.reason?.message || "Orders could not be loaded.");
      }

      /* PRODUCTS */

      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value);
      } else {
        console.error("Dashboard products error:", productsResult.reason);

        /*
            Do NOT stop orders from showing
            because products failed.
          */
      }

      setLastUpdated(new Date());
    } catch (loadError) {
      console.error("Dashboard error:", loadError);

      setError(loadError.message || "Dashboard could not be loaded.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    loadDashboard(true);

    /*
      Refresh every 10 seconds.
      Useful if admin dashboard is open
      while customers place orders.
    */

    const interval = window.setInterval(() => {
      loadDashboard(false);
    }, 10000);

    /*
      Refresh when you return to
      the browser/tab.
    */

    const handleFocus = () => {
      loadDashboard(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboard(false);
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDashboard]);

  /* =======================================================
     TOTAL ORDERS
  ======================================================= */

  const totalOrders = orders.length;

  /* =======================================================
     TOTAL PRODUCTS
  ======================================================= */

  const totalProducts = products.length;

  /* =======================================================
     CUSTOMERS

     Same email = same customer.
  ======================================================= */

  const totalCustomers = useMemo(() => {
    const uniqueCustomers = new Set();

    orders.forEach((order) => {
      const email = order?.customer?.email?.trim()?.toLowerCase();

      if (email) {
        uniqueCustomers.add(email);
      }
    });

    return uniqueCustomers.size;
  }, [orders]);

  /* =======================================================
     VALID ORDERS

     Cancelled orders do not count
     in revenue/product sales.
  ======================================================= */

  const validOrders = useMemo(() => {
    return orders.filter(
      (order) => String(order?.orderStatus || "").toLowerCase() !== "cancelled",
    );
  }, [orders]);

  /* =======================================================
     REVENUE
  ======================================================= */

  const totalRevenue = useMemo(() => {
    return validOrders.reduce(
      (total, order) => total + Number(order?.total || 0),
      0,
    );
  }, [validOrders]);

  /* =======================================================
     PRODUCTS SOLD
  ======================================================= */

  const productsSold = useMemo(() => {
    return validOrders.reduce((grandTotal, order) => {
      const orderQuantity = (order?.items || []).reduce(
        (itemTotal, item) => itemTotal + Number(item?.quantity || 0),
        0,
      );

      return grandTotal + orderQuantity;
    }, 0);
  }, [validOrders]);

  /* =======================================================
     AVERAGE ORDER
  ======================================================= */

  const averageOrder =
    validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  /* =======================================================
     RETURNING CUSTOMERS
  ======================================================= */

  const returningCustomerRate = useMemo(() => {
    const customerCount = {};

    validOrders.forEach((order) => {
      const email = order?.customer?.email?.trim()?.toLowerCase();

      if (!email) {
        return;
      }

      customerCount[email] = (customerCount[email] || 0) + 1;
    });

    const counts = Object.values(customerCount);

    if (counts.length === 0) {
      return 0;
    }

    const returning = counts.filter((count) => count > 1).length;

    return Math.round((returning / counts.length) * 100);
  }, [validOrders]);

  /* =======================================================
     SALES CHART
  ======================================================= */

  const salesData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentYear = new Date().getFullYear();

    return months.map((month, monthIndex) => {
      const sales = validOrders
        .filter((order) => {
          if (!order?.createdAt) {
            return false;
          }

          const date = new Date(order.createdAt);

          return (
            date.getFullYear() === currentYear && date.getMonth() === monthIndex
          );
        })
        .reduce((total, order) => total + Number(order?.total || 0), 0);

      return {
        month,
        sales,
      };
    });
  }, [validOrders]);

  /* =======================================================
     RECENT ORDERS
  ======================================================= */

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  /* =======================================================
     TOP PRODUCTS
  ======================================================= */

  const topProducts = useMemo(() => {
    const map = {};

    validOrders.forEach((order) => {
      (order?.items || []).forEach((item) => {
        const key = item?.productId || item?.name;

        if (!key) {
          return;
        }

        if (!map[key]) {
          map[key] = {
            id: key,

            name: item?.name || "Product",

            sold: 0,

            revenue: 0,
          };
        }

        const quantity = Number(item?.quantity || 0);

        const lineTotal = Number(
          item?.lineTotal ?? Number(item?.price || 0) * quantity,
        );

        map[key].sold += quantity;

        map[key].revenue += lineTotal;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [validOrders]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = [
    {
      title: "Total Orders",

      value: totalOrders.toLocaleString("en-IN"),

      icon: ShoppingBag,
    },

    {
      title: "Total Products",

      value: totalProducts.toLocaleString("en-IN"),

      icon: Package,
    },

    {
      title: "Total Customers",

      value: totalCustomers.toLocaleString("en-IN"),

      icon: Users,
    },

    {
      title: "Total Revenue",

      value: formatMoney(totalRevenue),

      icon: IndianRupee,
    },
  ];

  /* =======================================================
     DATE
  ======================================================= */

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="dashboard-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-heading-row">
        <div>
          <span className="dashboard-eyebrow">AXIEE ADMIN / OVERVIEW</span>

          <h1>Dashboard</h1>

          <p>Live overview of your AXIEE store.</p>

          {lastUpdated && (
            <p
              style={{
                marginTop: "5px",
                fontSize: "10px",
              }}
            >
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}

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
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="dashboard-date-button"
            onClick={() => loadDashboard(false)}
            disabled={refreshing}
          >
            <RefreshCw size={16} />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button type="button" className="dashboard-date-button">
            <CalendarDays size={17} />

            <span>{today}</span>
          </button>
        </div>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="dashboard-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="dashboard-stat-card" key={stat.title}>
              <div className="dashboard-stat-icon">
                <Icon size={23} />
              </div>

              <div className="dashboard-stat-content">
                <p>{stat.title}</p>

                <div className="dashboard-stat-value-row">
                  <h2>{loading ? "..." : stat.value}</h2>

                  <span>
                    <TrendingUp size={14} />
                    LIVE
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* =================================================
          MIDDLE
      ================================================= */}

      <div className="dashboard-middle-grid">
        {/* SALES */}

        <section className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-label">ANALYTICS</span>

              <h2>Sales Overview</h2>

              <p>Revenue during {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.32} />

                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" vertical={false} />

                <XAxis dataKey="month" tickLine={false} axisLine={false} />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                />

                <Tooltip
                  formatter={(value) => [formatMoney(value), "Revenue"]}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#111827"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RECENT ORDERS */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-label">ORDERS</span>

              <h2>Recent Orders</h2>

              <p>Latest customer orders</p>
            </div>

            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/admin/orders")}
            >
              View All
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="dashboard-recent-orders">
            {!loading && recentOrders.length === 0 && <p>No orders yet.</p>}

            {recentOrders.map((order) => {
              const customerName = [
                order?.customer?.firstName,

                order?.customer?.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  className="dashboard-order-row"
                  key={order._id || order.orderNumber}
                >
                  <div>
                    <strong>{order.orderNumber || order._id}</strong>

                    <span>{customerName || "Customer"}</span>
                  </div>

                  <div className="dashboard-order-date">
                    {formatDate(order.createdAt)}
                  </div>

                  <strong>{formatMoney(order.total)}</strong>

                  <span className={getStatusClass(order.orderStatus)}>
                    {formatStatus(order.orderStatus)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <div className="dashboard-bottom-grid">
        {/* TOP PRODUCTS */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-label">PRODUCTS</span>

              <h2>Top Products</h2>

              <p>Best performing products</p>
            </div>

            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/admin/products")}
            >
              View All
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="dashboard-product-list">
            {!loading && topProducts.length === 0 && (
              <p>No product sales yet.</p>
            )}

            {topProducts.map((product, index) => (
              <div className="dashboard-product-item" key={product.id}>
                <div className="dashboard-product-placeholder">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <strong>{product.name}</strong>

                  <span>{product.sold} sold</span>
                </div>

                <strong>{formatMoney(product.revenue)}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-label">PERFORMANCE</span>

              <h2>Store Performance</h2>

              <p>Current store data</p>
            </div>
          </div>

          <div className="dashboard-performance">
            <div>
              <span>Average Order</span>

              <strong>{formatMoney(averageOrder)}</strong>
            </div>

            <div>
              <span>Returning Customers</span>

              <strong>{returningCustomerRate}%</strong>
            </div>

            <div>
              <span>Products Sold</span>

              <strong>{productsSold.toLocaleString("en-IN")}</strong>
            </div>

            <div>
              <span>Active Products</span>

              <strong>{totalProducts.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
