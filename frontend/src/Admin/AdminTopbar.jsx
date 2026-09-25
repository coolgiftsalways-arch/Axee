import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  ChevronDown,
  Eye,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../AdminCss/admin-topbar.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   NOTIFICATION SETTINGS
========================================================= */

/*
  Because your current UI already says 3,
  first time this code runs it will treat
  latest 3 orders as unread.

  After that everything is automatic.
*/

const INITIAL_UNREAD_COUNT = 3;

const SEEN_STORAGE_KEY = "axiee-admin-seen-order-notifications";

/* =========================================================
   HELPERS
========================================================= */

const getOrderId = (order) => {
  return String(order?._id || order?.orderNumber || "");
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
   MONEY
========================================================= */

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

/* =========================================================
   DATE / TIME
========================================================= */

const formatNotificationTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

/* =========================================================
   STATUS
========================================================= */

const formatStatus = (status) => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   ADMIN TOPBAR
========================================================= */

const AdminTopbar = ({ toggleSidebar, darkMode, toggleTheme }) => {
  const navigate = useNavigate();

  const notificationRef = useRef(null);

  const [orders, setOrders] = useState([]);

  const [seenOrderIds, setSeenOrderIds] = useState([]);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notificationLoading, setNotificationLoading] = useState(true);

  /* =======================================================
     SAVE SEEN IDS
  ======================================================= */

  const saveSeenIds = useCallback((ids) => {
    const uniqueIds = [...new Set(ids)];

    setSeenOrderIds(uniqueIds);

    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(uniqueIds));
  }, []);

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not load notifications.");
      }

      const incomingOrders = Array.isArray(data?.orders) ? data.orders : [];

      /*
          NEWEST FIRST
        */

      const sortedOrders = [...incomingOrders].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      setOrders(sortedOrders);

      /* =============================================
           FIRST TIME SETUP

           Current latest 3 =
           unread.

           Everything older =
           already seen.
        ============================================= */

      const storedSeen = localStorage.getItem(SEEN_STORAGE_KEY);

      if (storedSeen === null) {
        const seenByDefault = sortedOrders
          .slice(INITIAL_UNREAD_COUNT)
          .map((order) => getOrderId(order))
          .filter(Boolean);

        saveSeenIds(seenByDefault);
      } else {
        try {
          const parsed = JSON.parse(storedSeen);

          if (Array.isArray(parsed)) {
            setSeenOrderIds(parsed);
          }
        } catch {
          setSeenOrderIds([]);
        }
      }
    } catch (error) {
      console.error("Notification orders error:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, [saveSeenIds]);

  /* =======================================================
     INITIAL LOAD + LIVE REFRESH
  ======================================================= */

  useEffect(() => {
    loadOrders();

    /*
      Check every 10 seconds.

      New order arrives:
      badge automatically +1.
    */

    const interval = window.setInterval(() => {
      loadOrders();
    }, 10000);

    const handleFocus = () => {
      loadOrders();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadOrders();
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
     UNREAD ORDERS
  ======================================================= */

  const unreadOrders = useMemo(() => {
    const seenSet = new Set(seenOrderIds.map(String));

    return orders.filter((order) => {
      const id = getOrderId(order);

      return id && !seenSet.has(id);
    });
  }, [orders, seenOrderIds]);

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unreadCount = unreadOrders.length;

  /* =======================================================
     MARK ONE READ
  ======================================================= */

  const markOrderRead = (order) => {
    const id = getOrderId(order);

    if (!id) {
      return;
    }

    saveSeenIds([...seenOrderIds, id]);
  };

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  const markAllRead = () => {
    const allIds = orders.map((order) => getOrderId(order)).filter(Boolean);

    saveSeenIds(allIds);
  };

  /* =======================================================
     OPEN ORDER

     Marks notification read
     and takes admin to Orders.
  ======================================================= */

  const openOrder = (order) => {
    markOrderRead(order);

    setNotificationOpen(false);

    navigate("/admin/orders", {
      state: {
        openOrderId: order._id,
      },
    });
  };

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <header className="admin-topbar">
      {/* =================================================
          LEFT
      ================================================= */}

      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-button"
          onClick={toggleSidebar}
        >
          <Menu size={22} />
        </button>

        <div className="admin-search">
          <Search size={18} />

          <input type="text" placeholder="Search here..." />
        </div>
      </div>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="admin-topbar-right">
        {/* THEME */}

        <button
          type="button"
          className="admin-icon-button"
          onClick={toggleTheme}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <div className="admin-notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className={`admin-icon-button admin-notification-button ${
              notificationOpen ? "admin-notification-active" : ""
            }`}
            onClick={() => setNotificationOpen((current) => !current)}
            title="Order notifications"
          >
            <Bell size={19} />

            {/* REAL LIVE COUNT */}

            {unreadCount > 0 && (
              <span className="admin-notification-dot">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* ===============================================
              DROPDOWN
          =============================================== */}

          {notificationOpen && (
            <div className="admin-notification-dropdown">
              {/* HEADER */}

              <div className="admin-notification-header">
                <div>
                  <strong>New Orders</strong>

                  <span>
                    {unreadCount} unread{" "}
                    {unreadCount === 1 ? "order" : "orders"}
                  </span>
                </div>

                <button
                  type="button"
                  className="admin-notification-close"
                  onClick={() => setNotificationOpen(false)}
                >
                  <X size={17} />
                </button>
              </div>

              {/* MARK ALL */}

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="admin-mark-all-read"
                  onClick={markAllRead}
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>
              )}

              {/* LIST */}

              <div className="admin-notification-list">
                {notificationLoading ? (
                  <div className="admin-notification-empty">
                    Loading new orders...
                  </div>
                ) : unreadOrders.length === 0 ? (
                  <div className="admin-notification-empty">
                    <div className="admin-notification-empty-icon">
                      <Bell size={20} />
                    </div>

                    <strong>You're all caught up</strong>

                    <span>New orders will appear here.</span>
                  </div>
                ) : (
                  unreadOrders.map((order) => (
                    <button
                      type="button"
                      key={getOrderId(order)}
                      className="admin-notification-order"
                      onClick={() => openOrder(order)}
                    >
                      {/* LEFT INDICATOR */}

                      <span className="admin-notification-unread-dot" />

                      {/* DETAILS */}

                      <div className="admin-notification-order-content">
                        <div className="admin-notification-order-top">
                          <strong>{getCustomerName(order)}</strong>

                          <span>{formatNotificationTime(order.createdAt)}</span>
                        </div>

                        <div className="admin-notification-order-number">
                          {order.orderNumber || order._id}
                        </div>

                        <div className="admin-notification-order-bottom">
                          <span>{formatStatus(order.orderStatus)}</span>

                          <strong>{formatMoney(order.total)}</strong>
                        </div>
                      </div>

                      {/* VIEW */}

                      <div className="admin-notification-view">
                        <Eye size={16} />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* FOOTER */}

              <button
                type="button"
                className="admin-notification-view-all"
                onClick={() => {
                  setNotificationOpen(false);

                  navigate("/admin/orders");
                }}
              >
                View All Orders
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-profile-info">
            <strong>Admin</strong>

            <span>Administrator</span>
          </div>

          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
