import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import "../AdminCss/admin-pages.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   FETCH JSON
========================================================= */

const fetchJson = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
};

/* =========================================================
   MONEY
========================================================= */

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (value) => {
  if (!value) return "-";

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

/* =========================================================
   TIME
========================================================= */

const formatTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   STATUS
========================================================= */

const formatStatus = (value) => {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getOrderStatusClass = (status) => {
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
   PAYMENT
========================================================= */

const formatPaymentMethod = (method) => {
  const value = String(method || "").toLowerCase();

  if (value === "cod") {
    return "Cash on Delivery";
  }

  if (value === "upi") {
    return "UPI";
  }

  if (value === "card") {
    return "Card";
  }

  return formatStatus(method);
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
   NORMALIZE NAME
========================================================= */

const normalizeName = (order) => {
  return getCustomerName(order).trim().replace(/\s+/g, " ").toLowerCase();
};

/* =========================================================
   CUSTOMER CODE
========================================================= */

const createCustomerCode = (value) => {
  const text = String(value || "customer");

  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }

  return `AXC${String(hash).padStart(5, "0")}`;
};

/* =========================================================
   ITEM COUNT
========================================================= */

const getOrderItemCount = (order) => {
  if (!order || !Array.isArray(order.items)) {
    return 0;
  }

  return order.items.reduce(
    (total, item) => total + Number(item?.quantity || 1),
    0,
  );
};

/* =========================================================
   IMAGE
========================================================= */

const resolveImage = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    if (value.url) {
      return resolveImage(value.url);
    }

    if (value.src) {
      return resolveImage(value.src);
    }

    if (value.path) {
      return resolveImage(value.path);
    }

    const fileId = value.fileId || value._id || value.id;

    if (fileId) {
      return `${API_BASE}/api/catalog/images/${fileId}`;
    }

    return "";
  }

  const image = String(value).trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  if (/^[a-fA-F0-9]{24}$/.test(image)) {
    return `${API_BASE}/api/catalog/images/${image}`;
  }

  if (image.startsWith("/api/images/")) {
    return `${API_BASE}${image.replace(
      "/api/images/",
      "/api/catalog/images/",
    )}`;
  }

  if (image.startsWith("/api/")) {
    return `${API_BASE}${image}`;
  }

  if (image.startsWith("/uploads/")) {
    return `${API_BASE}${image}`;
  }

  if (image.startsWith("uploads/")) {
    return `${API_BASE}/${image}`;
  }

  return image;
};

/* =========================================================
   PRODUCT IMAGE
========================================================= */

const getProductImage = (product) => {
  if (!product) {
    return "";
  }

  if (Array.isArray(product.imageFiles) && product.imageFiles.length) {
    const result = resolveImage(product.imageFiles[0]);

    if (result) {
      return result;
    }
  }

  if (Array.isArray(product.imageIds) && product.imageIds.length) {
    const result = resolveImage(product.imageIds[0]);

    if (result) {
      return result;
    }
  }

  if (Array.isArray(product.images) && product.images.length) {
    const result = resolveImage(product.images[0]);

    if (result) {
      return result;
    }
  }

  if (product.image) {
    return resolveImage(product.image);
  }

  return "";
};

/* =========================================================
   ORDER ITEM IMAGE
========================================================= */

const getOrderItemImage = (item, products) => {
  if (!item) {
    return "";
  }

  const directImage = resolveImage(item.image);

  if (directImage) {
    return directImage;
  }

  const thumbnail = resolveImage(item.thumbnail);

  if (thumbnail) {
    return thumbnail;
  }

  const productId = String(item.productId || "");

  const itemName = String(item.name || "")
    .trim()
    .toLowerCase();

  const matchedProduct = products.find((product) => {
    const id = String(product?._id || product?.id || "");

    if (productId && id === productId) {
      return true;
    }

    const productName = String(product?.name || "")
      .trim()
      .toLowerCase();

    return itemName && productName === itemName;
  });

  return getProductImage(matchedProduct);
};

/* =========================================================
   ADDRESS
========================================================= */

const getFullAddress = (address) => {
  if (!address) {
    return "-";
  }

  return [
    address.address,
    address.house,
    address.apartment,
    address.locality,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

/* =========================================================
   IMAGE COMPONENT
========================================================= */

const OrderProductImage = ({ src, name }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  return (
    <div className="admin-customer-order-product-image">
      {src && !imageError ? (
        <img
          src={src}
          alt={name || "Ordered product"}
          loading="lazy"
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : (
        <Package size={19} />
      )}
    </div>
  );
};

/* =========================================================
   CUSTOMERS
========================================================= */

const Customers = () => {
  const [orders, setOrders] = useState([]);

  const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadCustomers = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const results = await Promise.allSettled([
        fetchJson(`${API_BASE}/api/orders`),

        fetchJson(`${API_BASE}/api/catalog/products`),
      ]);

      /* ORDERS */

      if (results[0].status === "fulfilled") {
        setOrders(
          Array.isArray(results[0].value?.orders)
            ? results[0].value.orders
            : [],
        );
      } else {
        console.error("Orders error:", results[0].reason);

        setError(results[0].reason?.message || "Could not load customers.");
      }

      /* PRODUCTS */

      if (results[1].status === "fulfilled") {
        setProducts(
          Array.isArray(results[1].value?.products)
            ? results[1].value.products
            : [],
        );
      } else {
        console.error("Products error:", results[1].reason);
      }
    } catch (loadError) {
      console.error("Customers error:", loadError);

      setError(loadError.message || "Could not load customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    loadCustomers(true);

    const interval = window.setInterval(() => {
      loadCustomers(false);
    }, 10000);

    const handleFocus = () => {
      loadCustomers(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCustomers(false);
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadCustomers]);

  /* =======================================================
     BUILD CUSTOMERS

     IMPORTANT FIX

     CUSTOMER IDENTITY =
     NAME + EMAIL + PHONE

     Examples:

     Ahmed + email + phone
     = Ahmed customer

     omb + same email + phone
     = DIFFERENT customer

     md + same email + phone
     = DIFFERENT customer

     Ahmed orders again
     with same details
     = SAME Ahmed row.

     Latest order replaces
     old order in that row.
  ======================================================= */

  const customers = useMemo(() => {
    const customerMap = new Map();

    /*
        OLD → NEW

        This allows later
        matching orders to update
        currentOrder.
      */

    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    );

    sortedOrders.forEach((order) => {
      /* NAME */

      const normalizedName = normalizeName(order);

      /* EMAIL */

      const email = String(order?.customer?.email || "")
        .trim()
        .toLowerCase();

      /* PHONE */

      const phone = String(order?.customer?.phone || "")
        .replace(/\D/g, "")
        .trim();

      /*
            IMPORTANT

            NAME + EMAIL + PHONE

            This solves your
            current testing issue.
          */

      const keyParts = [normalizedName, email, phone].filter(Boolean);

      let key = keyParts.join("|");

      /*
            Fallback only if
            customer information
            is completely empty.
          */

      if (!key) {
        key = String(order?._id || "");
      }

      if (!key) {
        return;
      }

      /* =====================================
             NEW UNIQUE CUSTOMER
          ===================================== */

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,

          customerCode: createCustomerCode(key),

          name: getCustomerName(order),

          email: order?.customer?.email || "",

          phone: order?.customer?.phone || "",

          status: "Active",

          lastOrderAt: order.createdAt || null,

          address: order.shippingAddress || {},

          currentOrder: order,

          itemCount: getOrderItemCount(order),

          currentTotal: Number(order.total || 0),
        });

        return;
      }

      /* =====================================
             SAME CUSTOMER

             Update latest order only.
          ===================================== */

      const customer = customerMap.get(key);

      /*
            Keep same customer name.
          */

      if (order?.customer?.email) {
        customer.email = order.customer.email;
      }

      if (order?.customer?.phone) {
        customer.phone = order.customer.phone;
      }

      if (order.shippingAddress) {
        customer.address = order.shippingAddress;
      }

      /* LATEST ORDER */

      customer.currentOrder = order;

      customer.lastOrderAt = order.createdAt || customer.lastOrderAt;

      customer.itemCount = getOrderItemCount(order);

      customer.currentTotal = Number(order.total || 0);
    });

    /*
        SHOW EVERY UNIQUE CUSTOMER.

        Newest order/customer first.

        NO slice().
        NO limit 2.
      */

    return Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastOrderAt || 0) - new Date(a.lastOrderAt || 0),
    );
  }, [orders]);

  /* =======================================================
     SELECTED CUSTOMER
  ======================================================= */

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }

    return (
      customers.find((customer) => customer.id === selectedCustomerId) || null
    );
  }, [customers, selectedCustomerId]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      const productNames = (customer.currentOrder?.items || [])
        .map((item) => item.name)
        .join(" ");

      const searchText = [
        customer.name,
        customer.email,
        customer.phone,
        customer.customerCode,
        customer.address?.city,
        customer.address?.state,
        customer.address?.pincode,
        productNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(value);
    });
  }, [customers, searchTerm]);

  /* =======================================================
     CURRENT ITEMS
  ======================================================= */

  const totalCurrentItems = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + Number(customer.itemCount || 0),
      0,
    );
  }, [customers]);

  /* =======================================================
     CURRENT ORDER VALUE
  ======================================================= */

  const totalCurrentOrderValue = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + Number(customer.currentTotal || 0),
      0,
    );
  }, [customers]);

  /* =======================================================
     OPEN
  ======================================================= */

  const openCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
  };

  /* =======================================================
     CLOSE
  ======================================================= */

  const closeCustomer = () => {
    setSelectedCustomerId(null);
  };

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeCustomer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =======================================================
     DRAWER BODY CLASS
  ======================================================= */

  useEffect(() => {
    if (selectedCustomer) {
      document.body.classList.add("admin-drawer-open");
    } else {
      document.body.classList.remove("admin-drawer-open");
    }

    return () => {
      document.body.classList.remove("admin-drawer-open");
    };
  }, [selectedCustomer]);

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
          <h1>Customers</h1>

          <p>See every customer and their latest order.</p>

          {error && (
            <p
              style={{
                color: "#c94040",

                marginTop: "7px",
              }}
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() => loadCustomers(false)}
          disabled={refreshing}
        >
          <RefreshCw size={17} />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

          gap: "14px",

          marginBottom: "18px",
        }}
      >
        {/* CUSTOMERS */}

        <div className="admin-card">
          <span
            style={{
              color: "#858c97",

              fontSize: "11px",
            }}
          >
            Unique Customers
          </span>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            {customers.length}
          </h2>

          <small
            style={{
              color: "#959ba5",
            }}
          >
            All customer profiles
          </small>
        </div>

        {/* ITEMS */}

        <div className="admin-card">
          <span
            style={{
              color: "#858c97",

              fontSize: "11px",
            }}
          >
            Current Items
          </span>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            {totalCurrentItems}
          </h2>

          <small
            style={{
              color: "#959ba5",
            }}
          >
            Latest order per customer
          </small>
        </div>

        {/* VALUE */}

        <div className="admin-card">
          <span
            style={{
              color: "#858c97",

              fontSize: "11px",
            }}
          >
            Current Order Value
          </span>

          <h2
            style={{
              margin: "8px 0 0",
            }}
          >
            {formatMoney(totalCurrentOrderValue)}
          </h2>

          <small
            style={{
              color: "#959ba5",
            }}
          >
            Latest orders only
          </small>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="admin-card">
        {/* SEARCH */}

        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search customer, product, email or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <span
            style={{
              color: "#8b929c",

              fontSize: "11px",
            }}
          >
            {filteredCustomers.length} customer
            {filteredCustomers.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>

                <th>Latest Product</th>

                <th>Email</th>

                <th>Phone</th>

                <th>Items Ordered</th>

                <th>Current Total</th>

                <th>Latest Order</th>

                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {loading && (
                <tr>
                  <td colSpan={9} className="admin-empty-table">
                    Loading customers...
                  </td>
                </tr>
              )}

              {/* CUSTOMERS */}

              {!loading &&
                filteredCustomers.map((customer) => {
                  const order = customer.currentOrder;

                  const firstItem = order?.items?.[0] || null;

                  const firstItemImage = firstItem
                    ? getOrderItemImage(firstItem, products)
                    : "";

                  const productsCount = Array.isArray(order?.items)
                    ? order.items.length
                    : 0;

                  return (
                    <tr key={customer.id}>
                      {/* CUSTOMER */}

                      <td>
                        <div className="admin-customer-name">
                          <div className="admin-customer-avatar">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{customer.name}</strong>

                            <small
                              style={{
                                display: "block",

                                color: "#959ba5",

                                marginTop: "3px",
                              }}
                            >
                              {customer.customerCode}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* PRODUCT */}

                      <td>
                        {firstItem ? (
                          <div className="admin-latest-product">
                            <OrderProductImage
                              src={firstItemImage}
                              name={firstItem.name}
                            />

                            <div className="admin-latest-product-info">
                              <strong>{firstItem.name || "Product"}</strong>

                              <span>Qty: {firstItem.quantity || 1}</span>

                              {productsCount > 1 && (
                                <small>+{productsCount - 1} more</small>
                              )}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* EMAIL */}

                      <td>{customer.email || "-"}</td>

                      {/* PHONE */}

                      <td>{customer.phone || "-"}</td>

                      {/* ITEM COUNT */}

                      <td>
                        <strong>
                          {customer.itemCount}{" "}
                          {customer.itemCount === 1 ? "Item" : "Items"}
                        </strong>
                      </td>

                      {/* TOTAL */}

                      <td>
                        <strong>{formatMoney(customer.currentTotal)}</strong>
                      </td>

                      {/* DATE */}

                      <td>{formatDate(customer.lastOrderAt)}</td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={getOrderStatusClass(order?.orderStatus)}
                        >
                          {formatStatus(order?.orderStatus)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            title="View latest order"
                            onClick={() => openCustomer(customer)}
                          >
                            <Eye size={16} />
                          </button>

                          {customer.email && (
                            <a
                              href={`mailto:${customer.email}`}
                              className="admin-action-button"
                              title="Email customer"
                            >
                              <Mail size={16} />
                            </a>
                          )}

                          {customer.phone && (
                            <a
                              href={`tel:${customer.phone}`}
                              className="admin-action-button"
                              title="Call customer"
                            >
                              <Phone size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-empty-table">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          OVERLAY
      ================================================= */}

      <button
        type="button"
        aria-label="Close customer"
        className={`admin-customer-drawer-overlay ${
          selectedCustomer ? "admin-customer-drawer-overlay-show" : ""
        }`}
        onClick={closeCustomer}
      />

      {/* =================================================
          DRAWER
      ================================================= */}

      <aside
        className={`admin-customer-drawer ${
          selectedCustomer ? "admin-customer-drawer-open" : ""
        }`}
      >
        {selectedCustomer && (
          <>
            {/* HEADER */}

            <div className="admin-customer-drawer-header">
              <div>
                <span className="admin-customer-drawer-label">
                  CUSTOMER DETAILS
                </span>

                <h2>Customer Profile</h2>
              </div>

              <button
                type="button"
                className="admin-customer-drawer-close"
                onClick={closeCustomer}
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="admin-customer-drawer-body">
              {/* PROFILE */}

              <section className="admin-customer-profile-card">
                <div className="admin-customer-profile-avatar">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>

                <div className="admin-customer-profile-main">
                  <h3>{selectedCustomer.name}</h3>

                  <p>{selectedCustomer.customerCode}</p>

                  <span className="admin-status admin-status-active">
                    Active
                  </span>
                </div>
              </section>

              {/* STATS */}

              <section className="admin-customer-stat-grid">
                <div className="admin-customer-stat-box">
                  <ShoppingBag size={19} />

                  <span>Items Ordered</span>

                  <strong>{selectedCustomer.itemCount}</strong>
                </div>

                <div className="admin-customer-stat-box">
                  <CreditCard size={19} />

                  <span>Current Order Total</span>

                  <strong>{formatMoney(selectedCustomer.currentTotal)}</strong>
                </div>
              </section>

              {/* CUSTOMER INFORMATION */}

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading">
                  <UserRound size={18} />

                  <h3>Customer Information</h3>
                </div>

                <div className="admin-customer-info-grid">
                  <div className="admin-customer-info-item">
                    <span>Full Name</span>

                    <strong>{selectedCustomer.name}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Customer ID</span>

                    <strong>{selectedCustomer.customerCode}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Email</span>

                    <strong>{selectedCustomer.email || "-"}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Phone</span>

                    <strong>{selectedCustomer.phone || "-"}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Latest Order</span>

                    <strong>{formatDate(selectedCustomer.lastOrderAt)}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Order Time</span>

                    <strong>{formatTime(selectedCustomer.lastOrderAt)}</strong>
                  </div>
                </div>

                <div className="admin-customer-contact-buttons">
                  {selectedCustomer.phone && (
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="admin-customer-contact-button"
                    >
                      <Phone size={16} />
                      Call Customer
                    </a>
                  )}

                  {selectedCustomer.email && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="admin-customer-contact-button"
                    >
                      <Mail size={16} />
                      Send Email
                    </a>
                  )}
                </div>
              </section>

              {/* ADDRESS */}

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading">
                  <MapPin size={18} />

                  <h3>Delivery Address</h3>
                </div>

                <div className="admin-customer-address-card">
                  <strong>{getFullAddress(selectedCustomer.address)}</strong>
                </div>

                <div className="admin-customer-info-grid admin-customer-address-grid">
                  <div className="admin-customer-info-item">
                    <span>City</span>

                    <strong>{selectedCustomer.address?.city || "-"}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>State</span>

                    <strong>{selectedCustomer.address?.state || "-"}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>PIN Code</span>

                    <strong>{selectedCustomer.address?.pincode || "-"}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Country</span>

                    <strong>
                      {selectedCustomer.address?.country || "India"}
                    </strong>
                  </div>
                </div>
              </section>

              {/* CURRENT ORDER */}

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading admin-customer-orders-heading">
                  <div>
                    <Package size={18} />

                    <h3>Current Order</h3>
                  </div>

                  <span>
                    {selectedCustomer.itemCount}{" "}
                    {selectedCustomer.itemCount === 1 ? "item" : "items"}
                  </span>
                </div>

                {selectedCustomer.currentOrder ? (
                  <div className="admin-customer-order-list">
                    <article className="admin-customer-order-card">
                      {/* ORDER HEADER */}

                      <div className="admin-customer-order-top">
                        <div>
                          <span>ORDER ID</span>

                          <strong>
                            {selectedCustomer.currentOrder.orderNumber ||
                              selectedCustomer.currentOrder._id}
                          </strong>
                        </div>

                        <span
                          className={getOrderStatusClass(
                            selectedCustomer.currentOrder.orderStatus,
                          )}
                        >
                          {formatStatus(
                            selectedCustomer.currentOrder.orderStatus,
                          )}
                        </span>
                      </div>

                      {/* DATE / TIME */}

                      <div className="admin-customer-order-datetime">
                        <div>
                          <CalendarDays size={15} />

                          <span>
                            {formatDate(
                              selectedCustomer.currentOrder.createdAt,
                            )}
                          </span>
                        </div>

                        <div>
                          <Clock3 size={15} />

                          <span>
                            {formatTime(
                              selectedCustomer.currentOrder.createdAt,
                            )}
                          </span>
                        </div>
                      </div>

                      {/* PRODUCTS */}

                      <div className="admin-customer-order-products">
                        {(selectedCustomer.currentOrder.items || []).map(
                          (item, index) => {
                            const productImage = getOrderItemImage(
                              item,
                              products,
                            );

                            return (
                              <div
                                className="admin-customer-order-product"
                                key={`${selectedCustomer.currentOrder._id}-${
                                  item.productId || item.name
                                }-${index}`}
                              >
                                <OrderProductImage
                                  src={productImage}
                                  name={item.name}
                                />

                                <div className="admin-customer-order-product-main">
                                  <strong>{item.name || "Product"}</strong>

                                  {item.category && (
                                    <span>{item.category}</span>
                                  )}

                                  <div className="admin-customer-order-variants">
                                    {item.size && (
                                      <span>
                                        Size: <strong>{item.size}</strong>
                                      </span>
                                    )}

                                    {item.color && (
                                      <span>
                                        Color: <strong>{item.color}</strong>
                                      </span>
                                    )}

                                    <span>
                                      Qty: <strong>{item.quantity || 1}</strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="admin-customer-order-product-price">
                                  <span>{formatMoney(item.price)} each</span>

                                  <strong>
                                    {formatMoney(
                                      item.lineTotal ??
                                        Number(item.price || 0) *
                                          Number(item.quantity || 1),
                                    )}
                                  </strong>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>

                      {/* PAYMENT */}

                      <div className="admin-customer-order-meta-grid">
                        <div>
                          <span>Payment Method</span>

                          <strong>
                            {formatPaymentMethod(
                              selectedCustomer.currentOrder.paymentMethod,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Payment Status</span>

                          <strong
                            className={
                              String(
                                selectedCustomer.currentOrder.paymentStatus ||
                                  "",
                              ).toLowerCase() === "paid"
                                ? "admin-order-paid-text"
                                : ""
                            }
                          >
                            {formatStatus(
                              selectedCustomer.currentOrder.paymentStatus,
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* DELIVERY ADDRESS */}

                      <div className="admin-customer-order-address">
                        <MapPin size={16} />

                        <div>
                          <span>Delivery Address</span>

                          <strong>
                            {getFullAddress(
                              selectedCustomer.currentOrder.shippingAddress,
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* TOTAL */}

                      <div className="admin-customer-order-total">
                        <span>Order Total</span>

                        <strong>
                          {formatMoney(selectedCustomer.currentOrder.total)}
                        </strong>
                      </div>
                    </article>
                  </div>
                ) : (
                  <div className="admin-empty-table">No current order.</div>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default Customers;
