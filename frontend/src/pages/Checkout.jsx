import React, { useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  IndianRupee,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Smartphone,
  Truck,
  WalletCards,
} from "lucide-react";

import "../styles/checkout.css";

/* =========================================================
   API
========================================================= */

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  notes: "",
};

/* =========================================================
   PAYMENT OPTIONS
========================================================= */

const paymentOptions = [
  {
    id: "upi",

    title: "UPI / Online Payment",

    subtitle: "Pay securely with UPI, cards or supported wallets.",

    icon: Smartphone,
  },

  {
    id: "card",

    title: "Credit / Debit Card",

    subtitle: "Visa, Mastercard, RuPay and more.",

    icon: CreditCard,
  },

  {
    id: "cod",

    title: "Cash on Delivery",

    subtitle: "Pay when your order reaches you.",

    icon: IndianRupee,
  },
];

/* =========================================================
   INDIAN STATES
========================================================= */

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

/* =========================================================
   MONEY
========================================================= */

const money = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
};

/* =========================================================
   PRODUCT NAME
========================================================= */

const getItemName = (item) =>
  item?.product?.name ||
  item?.productId?.name ||
  item?.name ||
  "UNBOUND Product";

/* =========================================================
   IMAGE URL
========================================================= */

const resolveImageUrl = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    if (value.url) {
      return resolveImageUrl(value.url);
    }

    const fileId = value.fileId || value._id || value.id;

    if (fileId) {
      return `${API_URL}/api/catalog/images/${fileId}`;
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
    return `${API_URL}/api/catalog/images/${image}`;
  }

  if (image.startsWith("/api/images/")) {
    return `${API_URL}${image.replace("/api/images/", "/api/catalog/images/")}`;
  }

  if (image.startsWith("/api/")) {
    return `${API_URL}${image}`;
  }

  if (image.startsWith("/uploads/")) {
    return `${API_URL}${image}`;
  }

  if (image.startsWith("uploads/")) {
    return `${API_URL}/${image}`;
  }

  return image;
};

/* =========================================================
   PRODUCT IMAGE
========================================================= */

const getItemImage = (item) => {
  const product = item?.product || item?.productId || {};

  const image =
    product?.imageFiles?.[0] ||
    product?.images?.[0] ||
    product?.mainImage ||
    product?.image ||
    item?.imageFiles?.[0] ||
    item?.images?.[0] ||
    item?.image;

  return resolveImageUrl(image);
};

/* =========================================================
   PRICE
========================================================= */

const getItemPrice = (item) =>
  Number(
    item?.price ??
      item?.product?.salePrice ??
      item?.product?.price ??
      item?.productId?.salePrice ??
      item?.productId?.price ??
      0,
  );

/* =========================================================
   QUANTITY
========================================================= */

const getItemQuantity = (item) => {
  const quantity = Number(item?.quantity || 1);

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
};

/* =========================================================
   CHECKOUT
========================================================= */

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(initialForm);

  const [paymentMethod, setPaymentMethod] = useState("upi");

  const [cart, setCart] = useState(null);

  // "buyNow" = user came directly from a product's BUY NOW button.
  // "cart" = normal bag -> checkout flow.
  const [checkoutMode, setCheckoutMode] = useState("cart");

  const [loadingCart, setLoadingCart] = useState(true);

  const [cartError, setCartError] = useState("");

  const [formErrors, setFormErrors] = useState({});

  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderComplete, setOrderComplete] = useState(false);

  const [orderResult, setOrderResult] = useState(null);

  /* =======================================================
     DOUBLE CLICK LOCK
  ======================================================= */

  const submitLockRef = useRef(false);

  /* =======================================================
     LOAD CHECKOUT ITEMS

     BUY NOW:
       ProductDetails stores one product in:
       localStorage["axiee-buy-now"]

       Checkout must use ONLY that product.

     NORMAL CHECKOUT:
       If there is no Buy Now product, load the normal cart
       from the backend using axiee-cart-id.
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadCheckoutItems = async () => {
      try {
        setLoadingCart(true);
        setCartError("");

        /* ===============================================
           1. CHECK BUY NOW FIRST
        =============================================== */

        const stateBuyNowItem =
          location.state?.checkoutMode === "buyNow"
            ? location.state?.buyNowItem
            : null;

        let buyNowItem = stateBuyNowItem || null;

        if (!buyNowItem) {
          const buyNowRaw = localStorage.getItem("axiee-buy-now");

          if (buyNowRaw) {
            try {
              buyNowItem = JSON.parse(buyNowRaw);
            } catch (parseError) {
              console.error("Invalid Buy Now item:", parseError);
              localStorage.removeItem("axiee-buy-now");
            }
          }
        }

        if (
          buyNowItem &&
          typeof buyNowItem === "object" &&
          (buyNowItem.productId || buyNowItem.id || buyNowItem._id)
        ) {
          /*
            Keep the fallback current in case the customer refreshes
            while already on checkout.
          */
          localStorage.setItem("axiee-buy-now", JSON.stringify(buyNowItem));

          if (!cancelled) {
            setCheckoutMode("buyNow");

            setCart({
              cartId: null,
              items: [buyNowItem],
            });
          }

          return;
        }

        // Invalid saved data should not block normal cart checkout.
        localStorage.removeItem("axiee-buy-now");

        /* ===============================================
           2. NORMAL CART CHECKOUT
        =============================================== */

        if (!cancelled) {
          setCheckoutMode("cart");
        }

        const cartId = localStorage.getItem("axiee-cart-id");

        if (!cartId) {
          if (!cancelled) {
            setCart({
              items: [],
            });
          }

          return;
        }

        const response = await fetch(`${API_URL}/api/cart/${cartId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Could not load your bag.");
        }

        if (!cancelled) {
          setCart(
            data?.cart ||
              data || {
                items: [],
              },
          );
        }
      } catch (error) {
        console.error("Checkout cart error:", error);

        if (!cancelled) {
          setCartError(error.message || "Could not load your bag.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCart(false);
        }
      }
    };

    loadCheckoutItems();

    return () => {
      cancelled = true;
    };
  }, [location.state]);

  /* =======================================================
     ITEMS
  ======================================================= */

  const items = useMemo(() => cart?.items || [], [cart]);

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + getItemPrice(item) * getItemQuantity(item),

        0,
      ),

    [items],
  );

  /* =======================================================
     TOTAL
  ======================================================= */

  const shipping = 0;

  const total = subtotal + shipping;

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((current) => ({
      ...current,

      [name]: nextValue,
    }));

    setFormErrors((current) => ({
      ...current,

      [name]: "",
    }));
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = () => {
    const nextErrors = {};

    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!form.state) {
      nextErrors.state = "Select your state.";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      nextErrors.pincode = "Enter a valid 6-digit PIN code.";
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    /* VALIDATE */

    if (!validate()) {
      const firstError = document.querySelector(".ax-checkout-field.is-error");

      firstError?.scrollIntoView({
        behavior: "smooth",

        block: "center",
      });

      return;
    }

    /* EMPTY BAG */

    if (!items.length) {
      setCartError("Your bag is empty. Add a product before checkout.");

      return;
    }

    /* STOP DOUBLE ORDER */

    if (submitLockRef.current || placingOrder) {
      console.log("Duplicate checkout click blocked.");

      return;
    }

    submitLockRef.current = true;

    setPlacingOrder(true);

    setCartError("");

    /* ===============================================
           PAYLOAD
      =============================================== */

    const checkoutPayload = {
      // Buy Now can be checked out independently from the user's saved bag.
      // For normal checkout we keep sending the actual cart id.
      cartId:
        checkoutMode === "buyNow"
          ? null
          : localStorage.getItem("axiee-cart-id"),

      customer: {
        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        email: form.email.trim().toLowerCase(),

        phone: form.phone.trim(),
      },

      shippingAddress: {
        address: form.address.trim(),

        apartment: form.apartment.trim(),

        city: form.city.trim(),

        state: form.state,

        pincode: form.pincode,

        country: form.country,
      },

      notes: form.notes.trim(),

      paymentMethod,

      items,
    };

    try {
      console.log("Sending order:", checkoutPayload);

      /* =============================================
             CREATE ORDER
        ============================================= */

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(checkoutPayload),
      });

      const data = await response.json();

      console.log("Order response:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Could not create your order.");
      }

      /* =============================================
             ORDER SUCCESS
        ============================================= */

      const completedOrder = data?.order || null;

      /* =============================================
         BUY NOW SUCCESS

         Only remove the temporary Buy Now item.
         Do NOT clear the user's normal shopping bag.
      ============================================= */

      if (checkoutMode === "buyNow") {
        localStorage.removeItem("axiee-buy-now");
      } else {
        /* =============================================
           NORMAL CART SUCCESS

           Clear backend cart and remove local cart id.
        ============================================= */

        const cartId = localStorage.getItem("axiee-cart-id");

        if (cartId) {
          try {
            const clearResponse = await fetch(
              `${API_URL}/api/cart/${cartId}/clear`,
              {
                method: "DELETE",

                headers: {
                  Accept: "application/json",
                },
              },
            );

            if (!clearResponse.ok) {
              let clearData = null;

              try {
                clearData = await clearResponse.json();
              } catch {
                clearData = null;
              }

              console.error(
                "Backend cart clear failed:",
                clearData?.message || clearResponse.status,
              );
            }
          } catch (clearError) {
            console.error("Backend cart clear error:", clearError);
          }
        }

        localStorage.removeItem("axiee-cart-id");

        window.dispatchEvent(
          new CustomEvent("axiee-cart-updated", {
            detail: {
              items: [],
            },
          }),
        );
      }

      /* =============================================
         CLEAR CURRENT CHECKOUT DISPLAY
      ============================================= */

      setCart({
        items: [],
      });

      /* =============================================
         SUCCESS PAGE
      ============================================= */

      setOrderResult(completedOrder);

      setOrderComplete(true);

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Create order error:", error);

      setCartError(error.message || "Could not create your order.");

      submitLockRef.current = false;
    } finally {
      setPlacingOrder(false);
    }
  };

  /* =======================================================
     SUCCESS PAGE
  ======================================================= */

  if (orderComplete) {
    return (
      <main className="ax-checkout-page ax-checkout-success-page">
        <div className="ax-checkout-orb ax-checkout-orb-one" />

        <div className="ax-checkout-orb ax-checkout-orb-two" />

        <section className="ax-checkout-success">
          <div className="ax-checkout-success-icon">
            <Check size={28} strokeWidth={1.7} />
          </div>

          <span className="ax-checkout-eyebrow">
            {orderResult?.orderNumber || "ORDER CREATED"}
          </span>

          <h1>
            ORDER SAVED
            <br />
            SUCCESSFULLY.
          </h1>

          <p>
            {orderResult?.orderStatus === "pending_payment"
              ? "Your order has been saved. Complete the online payment to confirm your order."
              : "Your order has been placed successfully."}
          </p>

          {orderResult && (
            <div className="ax-checkout-order-details">
              <p>
                ORDER NUMBER:
                <strong> {orderResult.orderNumber}</strong>
              </p>

              <p>
                TOTAL:
                <strong> {money(orderResult.total)}</strong>
              </p>

              <p>
                PAYMENT:
                <strong>
                  {" "}
                  {String(orderResult.paymentMethod || "").toUpperCase()}
                </strong>
              </p>

              {String(orderResult.paymentMethod || "").toLowerCase() ===
                "cod" && (
                <p>
                  PAY ON DELIVERY:
                  <strong> {money(orderResult.total)}</strong>
                </p>
              )}
            </div>
          )}

          <button type="button" onClick={() => navigate("/shop")}>
            CONTINUE SHOPPING
            <ArrowRight size={17} />
          </button>
        </section>
      </main>
    );
  }

  /* =======================================================
     CHECKOUT PAGE
  ======================================================= */

  return (
    <main className="ax-checkout-page">
      <div className="ax-checkout-orb ax-checkout-orb-one" />

      <div className="ax-checkout-orb ax-checkout-orb-two" />

      <section className="ax-checkout-shell">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="ax-checkout-heading">
          <button
            type="button"
            className="ax-checkout-back"
            onClick={() => {
              if (checkoutMode === "buyNow") {
                // We are leaving the Buy Now checkout without ordering.
                // Remove the temporary item so it cannot affect a later
                // normal cart checkout.
                localStorage.removeItem("axiee-buy-now");
                navigate(-1);
                return;
              }

              navigate("/cart");
            }}
          >
            <ArrowLeft size={16} />
            {checkoutMode === "buyNow" ? "BACK TO PRODUCT" : "BACK TO BAG"}
          </button>

          <div className="ax-checkout-title-wrap">
            <span className="ax-checkout-index">02 / CHECKOUT</span>
          </div>

          <div className="ax-checkout-secure">
            <LockKeyhole size={14} />
            SECURE CHECKOUT
          </div>
        </header>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="ax-checkout-grid">
          {/* =================================================
              FORM
          ================================================= */}

          <form className="ax-checkout-form" onSubmit={handleSubmit} noValidate>
            {/* ===============================================
                CONTACT
            =============================================== */}

            <section className="ax-checkout-card">
              <div className="ax-checkout-card-head">
                <div>
                  <span>01</span>

                  <h2>CONTACT</h2>
                </div>

                <Smartphone size={21} strokeWidth={1.4} />
              </div>

              <div className="ax-checkout-fields ax-checkout-fields-two">
                {/* FIRST NAME */}

                <label
                  className={`ax-checkout-field ${
                    formErrors.firstName ? "is-error" : ""
                  }`}
                >
                  <span>FIRST NAME *</span>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Ahmed"
                    autoComplete="given-name"
                  />

                  {formErrors.firstName && (
                    <small>{formErrors.firstName}</small>
                  )}
                </label>

                {/* LAST NAME */}

                <label
                  className={`ax-checkout-field ${
                    formErrors.lastName ? "is-error" : ""
                  }`}
                >
                  <span>LAST NAME *</span>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Khan"
                    autoComplete="family-name"
                  />

                  {formErrors.lastName && <small>{formErrors.lastName}</small>}
                </label>

                {/* EMAIL */}

                <label
                  className={`ax-checkout-field ${
                    formErrors.email ? "is-error" : ""
                  }`}
                >
                  <span>EMAIL *</span>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                  {formErrors.email && <small>{formErrors.email}</small>}
                </label>

                {/* PHONE */}

                <label
                  className={`ax-checkout-field ${
                    formErrors.phone ? "is-error" : ""
                  }`}
                >
                  <span>MOBILE NUMBER *</span>

                  <div className="ax-checkout-phone">
                    <b>+91</b>

                    <input
                      type="tel"
                      inputMode="numeric"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      autoComplete="tel"
                    />
                  </div>

                  {formErrors.phone && <small>{formErrors.phone}</small>}
                </label>
              </div>
            </section>

            {/* ===============================================
                DELIVERY ADDRESS
            =============================================== */}

            <section className="ax-checkout-card">
              <div className="ax-checkout-card-head">
                <div>
                  <span>02</span>

                  <h2>DELIVERY ADDRESS</h2>
                </div>

                <MapPin size={21} strokeWidth={1.4} />
              </div>

              <div className="ax-checkout-fields">
                {/* ADDRESS */}

                <label
                  className={`ax-checkout-field ${
                    formErrors.address ? "is-error" : ""
                  }`}
                >
                  <span>ADDRESS *</span>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House / Flat no., building, street"
                    autoComplete="street-address"
                  />

                  {formErrors.address && <small>{formErrors.address}</small>}
                </label>

                {/* APARTMENT */}

                <label className="ax-checkout-field">
                  <span>APARTMENT / LANDMARK</span>

                  <input
                    type="text"
                    name="apartment"
                    value={form.apartment}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>

                {/* CITY / STATE / PIN / COUNTRY */}

                <div className="ax-checkout-fields ax-checkout-fields-two ax-checkout-nested-fields">
                  {/* CITY */}

                  <label
                    className={`ax-checkout-field ${
                      formErrors.city ? "is-error" : ""
                    }`}
                  >
                    <span>CITY *</span>

                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      autoComplete="address-level2"
                    />

                    {formErrors.city && <small>{formErrors.city}</small>}
                  </label>

                  {/* STATE */}

                  <label
                    className={`ax-checkout-field ax-checkout-select ${
                      formErrors.state ? "is-error" : ""
                    }`}
                  >
                    <span>STATE *</span>

                    <div>
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        autoComplete="address-level1"
                      >
                        <option value="">Select state</option>

                        {indianStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>

                      <ChevronDown size={16} />
                    </div>

                    {formErrors.state && <small>{formErrors.state}</small>}
                  </label>

                  {/* PINCODE */}

                  <label
                    className={`ax-checkout-field ${
                      formErrors.pincode ? "is-error" : ""
                    }`}
                  >
                    <span>PIN CODE *</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      autoComplete="postal-code"
                    />

                    {formErrors.pincode && <small>{formErrors.pincode}</small>}
                  </label>

                  {/* COUNTRY */}

                  <label className="ax-checkout-field">
                    <span>COUNTRY</span>

                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      readOnly
                    />
                  </label>
                </div>

                {/* NOTES */}

                <label className="ax-checkout-field">
                  <span>ORDER NOTE</span>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Delivery instructions, landmark or anything we should know..."
                    rows="4"
                  />
                </label>
              </div>
            </section>

            {/* ===============================================
                PAYMENT
            =============================================== */}

            <section className="ax-checkout-card">
              <div className="ax-checkout-card-head">
                <div>
                  <span>03</span>

                  <h2>PAYMENT</h2>
                </div>

                <WalletCards size={21} strokeWidth={1.4} />
              </div>

              <div className="ax-checkout-payment-list">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;

                  const active = paymentMethod === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`ax-checkout-payment-option ${
                        active ? "active" : ""
                      }`}
                      onClick={() => setPaymentMethod(option.id)}
                    >
                      <span className="ax-checkout-payment-radio">
                        <i />
                      </span>

                      <span className="ax-checkout-payment-icon">
                        <Icon size={20} strokeWidth={1.5} />
                      </span>

                      <span className="ax-checkout-payment-copy">
                        <strong>{option.title}</strong>

                        <small>{option.subtitle}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ONLINE PAYMENT */}

              {paymentMethod !== "cod" && (
                <div className="ax-checkout-online-note">
                  <LockKeyhole size={14} />
                  Online payment will open securely after your backend/Razorpay
                  payment API is connected.
                </div>
              )}

              {/* CASH ON DELIVERY */}

              {paymentMethod === "cod" && (
                <div className="ax-checkout-cod-rule">
                  <div className="ax-checkout-cod-rule-head">
                    <Truck size={16} />

                    <strong>CASH ON DELIVERY</strong>
                  </div>

                  <p>
                    Pay the full order amount of <b>{money(total)}</b> when your
                    order is delivered. No advance payment is required.
                  </p>
                </div>
              )}
            </section>

            {/* MOBILE BUTTON */}

            <button
              type="submit"
              className="ax-checkout-place-mobile"
              disabled={placingOrder || loadingCart || !items.length}
            >
              {placingOrder
                ? "PROCESSING..."
                : paymentMethod === "cod"
                  ? "PLACE COD ORDER"
                  : "CONTINUE TO PAYMENT"}

              {!placingOrder && <ArrowRight size={18} />}
            </button>
          </form>

          {/* =================================================
              FINAL REVIEW
          ================================================= */}

          <aside className="ax-checkout-summary">
            <div className="ax-checkout-summary-sticky">
              {/* HEADER */}

              <div className="ax-checkout-summary-head">
                <span>FINAL REVIEW</span>

                <PackageCheck size={18} strokeWidth={1.5} />
              </div>

              {/* CART */}

              {loadingCart ? (
                <div className="ax-checkout-loading">
                  <i />
                  LOADING YOUR BAG
                </div>
              ) : cartError ? (
                <div className="ax-checkout-cart-error">{cartError}</div>
              ) : items.length === 0 ? (
                <div className="ax-checkout-empty">
                  <p>Your bag is empty.</p>

                  <button type="button" onClick={() => navigate("/shop")}>
                    GO TO SHOP
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="ax-checkout-summary-items">
                  {items.map((item, index) => {
                    const image = getItemImage(item);

                    const quantity = getItemQuantity(item);

                    const price = getItemPrice(item);

                    return (
                      <article
                        className="ax-checkout-summary-item"
                        key={
                          item?._id ||
                          item?.product?._id ||
                          item?.productId?._id ||
                          index
                        }
                      >
                        {/* IMAGE */}

                        <div className="ax-checkout-item-image">
                          {image ? (
                            <img
                              src={image}
                              alt={getItemName(item)}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>UNBOUND</span>
                          )}

                          <b>{quantity}</b>
                        </div>

                        {/* PRODUCT INFORMATION */}

                        <div className="ax-checkout-item-copy">
                          <h3>{getItemName(item)}</h3>

                          <p>
                            {item?.size ? `SIZE ${item.size}` : ""}

                            {item?.size && item?.color ? " / " : ""}

                            {item?.color
                              ? String(item.color).toUpperCase()
                              : ""}
                          </p>
                        </div>

                        {/* PRICE */}

                        <strong>{money(price * quantity)}</strong>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* PRICE SUMMARY */}

              <div className="ax-checkout-price-lines">
                <div>
                  <span>SUBTOTAL</span>

                  <strong>{money(subtotal)}</strong>
                </div>

                <div>
                  <span>SHIPPING</span>

                  <strong className="ax-checkout-free">FREE</strong>
                </div>

                <div className="ax-checkout-total">
                  <span>TOTAL</span>

                  <div>
                    <small>INR</small>

                    <strong>{money(total)}</strong>
                  </div>
                </div>
              </div>

              {/* DESKTOP SUBMIT */}

              <button
                type="button"
                className="ax-checkout-place"
                disabled={placingOrder || loadingCart || !items.length}
                onClick={() => {
                  const formElement =
                    document.querySelector(".ax-checkout-form");

                  formElement?.requestSubmit();
                }}
              >
                {placingOrder
                  ? "PROCESSING..."
                  : paymentMethod === "cod"
                    ? "PLACE COD ORDER"
                    : "CONTINUE TO PAYMENT"}

                {!placingOrder && <ArrowRight size={18} />}
              </button>

              {/* TRUST */}

              <div className="ax-checkout-trust">
                <span>
                  <LockKeyhole size={13} />
                  SECURE
                </span>

                <span>
                  <Truck size={13} />
                  INDIA DELIVERY
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Checkout;
