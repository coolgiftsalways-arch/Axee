import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
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
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : "")
).replace(/\/+$/, "");

/* =========================================================
   SAFE API RESPONSE PARSER

   Prevents:
   - Unexpected end of JSON input
   - Unexpected token '<'
   - HTML being parsed as JSON
========================================================= */

const parseApiResponse = async (response, label = "API") => {
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

console.log("🌐 CHECKOUT API:", API_URL || "same-domain");

/* =========================================================
   FORM
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
};

/* =========================================================
   PAYMENT OPTIONS

   ONLY:
   1. ONLINE PAYMENT
   2. CASH ON DELIVERY
========================================================= */

const paymentOptions = [
  {
    id: "upi",

    title: "Online Payment",

    subtitle: "Pay securely using UPI, cards or supported wallets.",

    icon: Smartphone,
  },

  {
    id: "cod",

    title: "Cash on Delivery",

    subtitle: "Pay the full amount when your order reaches you.",

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
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

/* =========================================================
   ITEM NAME
========================================================= */

const getItemName = (item) =>
  item?.product?.name ||
  item?.productId?.name ||
  item?.name ||
  "UNBOUND Product";

/* =========================================================
   ITEM PRICE
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
   ITEM QUANTITY
========================================================= */

const getItemQuantity = (item) => Math.max(1, Number(item?.quantity || 1));

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
   ITEM IMAGE
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
   CHECKOUT
========================================================= */

function Checkout() {
  const navigate = useNavigate();

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] = useState(initialForm);

  /* =======================================================
     PAYMENT

     DEFAULT = ONLINE PAYMENT
  ======================================================= */

  const [paymentMethod, setPaymentMethod] = useState("upi");

  /* =======================================================
     CART
  ======================================================= */

  const [cart, setCart] = useState({
    items: [],
  });

  const [loadingCart, setLoadingCart] = useState(true);

  const [cartError, setCartError] = useState("");

  /* =======================================================
     FORM ERRORS
  ======================================================= */

  const [formErrors, setFormErrors] = useState({});

  /* =======================================================
     ORDER
  ======================================================= */

  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderComplete, setOrderComplete] = useState(false);

  const [orderResult, setOrderResult] = useState(null);

  /* =======================================================
     COUPONS
  ======================================================= */

  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [couponCode, setCouponCode] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [couponLoading, setCouponLoading] = useState(false);

  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [couponMessage, setCouponMessage] = useState("");

  const [couponError, setCouponError] = useState("");

  /* =========================================================
     LOAD CART
  ========================================================= */

  useEffect(() => {
    const loadCart = async () => {
      const cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        setCart({
          items: [],
        });

        setLoadingCart(false);

        return;
      }

      try {
        setLoadingCart(true);

        setCartError("");

        const response = await fetch(`${API_URL}/api/cart/${cartId}`, {
          cache: "no-store",

          headers: {
            Accept: "application/json",
          },
        });

        const data = await parseApiResponse(response, "Checkout API");

        if (!response.ok) {
          throw new Error(data?.message || "Could not load your bag.");
        }

        setCart(
          data?.cart ||
            data || {
              items: [],
            },
        );
      } catch (error) {
        console.error("Checkout cart error:", error);

        setCartError(error?.message || "Could not load your bag.");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  /* =========================================================
     ITEMS
  ========================================================= */

  const items = useMemo(
    () => (Array.isArray(cart?.items) ? cart.items : []),

    [cart],
  );

  /* =========================================================
     SUBTOTAL
  ========================================================= */

  const subtotal = useMemo(
    () =>
      items.reduce(
        (totalValue, item) =>
          totalValue + getItemPrice(item) * getItemQuantity(item),

        0,
      ),

    [items],
  );

  /* =========================================================
     SHIPPING
  ========================================================= */

  const shipping = 0;

  /* =========================================================
     DISCOUNT
  ========================================================= */

  const discountAmount = Number(appliedCoupon?.discountAmount || 0);

  /* =========================================================
     TOTAL
  ========================================================= */

  const total = Math.max(
    0,

    subtotal + shipping - discountAmount,
  );

  /* =========================================================
     AVAILABLE COUPONS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadAvailableCoupons = async () => {
      if (subtotal <= 0) {
        setAvailableCoupons([]);

        return;
      }

      try {
        setCouponLoading(true);

        const response = await fetch(
          `${API_URL}/api/coupons/available?subtotal=${encodeURIComponent(
            subtotal,
          )}`,
          {
            cache: "no-store",

            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await parseApiResponse(response, "Checkout API");

        if (!response.ok) {
          throw new Error(data?.message || "Could not load coupons.");
        }

        if (!cancelled) {
          setAvailableCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
        }
      } catch (error) {
        console.warn("Coupon list error:", error);

        if (!cancelled) {
          setAvailableCoupons([]);
        }
      } finally {
        if (!cancelled) {
          setCouponLoading(false);
        }
      }
    };

    loadAvailableCoupons();

    const refreshCoupons = () => {
      if (document.visibilityState === "visible") {
        loadAvailableCoupons();
      }
    };

    window.addEventListener("focus", refreshCoupons);

    document.addEventListener("visibilitychange", refreshCoupons);

    return () => {
      cancelled = true;

      window.removeEventListener("focus", refreshCoupons);

      document.removeEventListener("visibilitychange", refreshCoupons);
    };
  }, [subtotal]);

  /* =========================================================
     REMOVE COUPON IF CART GOES BELOW MINIMUM
  ========================================================= */

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    const minimum = Number(appliedCoupon?.minOrderAmount || 0);

    if (subtotal < minimum) {
      setAppliedCoupon(null);

      setCouponMessage("");

      setCouponError(`Coupon removed. Minimum order is ${money(minimum)}.`);
    }
  }, [subtotal, appliedCoupon]);

  /* =========================================================
     APPLY COUPON
  ========================================================= */

  const applyCoupon = async (codeToApply = couponCode) => {
    const normalizedCode = String(codeToApply || "")
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      setCouponError("Enter a coupon code.");

      setCouponMessage("");

      return;
    }

    try {
      setApplyingCoupon(true);

      setCouponError("");

      setCouponMessage("");

      const response = await fetch(`${API_URL}/api/coupons/apply`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          code: normalizedCode,

          subtotal,

          email: form.email.trim(),

          phone: form.phone,
        }),
      });

      const data = await parseApiResponse(response, "Checkout API");

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Coupon could not be applied.");
      }

      setCouponCode(data.coupon.code);

      setAppliedCoupon(data.coupon);

      setCouponMessage(
        `${data.coupon.code} applied. You save ${money(
          data.coupon.discountAmount,
        )}.`,
      );

      setCouponError("");
    } catch (error) {
      setAppliedCoupon(null);

      setCouponMessage("");

      setCouponError(error?.message || "Coupon could not be applied.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  /* =========================================================
     REMOVE COUPON
  ========================================================= */

  const removeCoupon = () => {
    setAppliedCoupon(null);

    setCouponCode("");

    setCouponMessage("");

    setCouponError("");
  };

  /* =========================================================
     RESET CART
  ========================================================= */

  const resetCartAfterSuccessfulOrder = async () => {
    const cartId = localStorage.getItem("axiee-cart-id");

    const emptyCart = {
      items: [],
    };

    /* LOCAL */

    localStorage.removeItem("axiee-cart-id");

    setCart(emptyCart);

    /* NAVBAR */

    window.dispatchEvent(
      new CustomEvent("axiee-cart-updated", {
        detail: emptyCart,
      }),
    );

    window.dispatchEvent(new Event("axiee-cart-cleared"));

    /* BACKEND CART */

    if (cartId) {
      try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}/clear`, {
          method: "DELETE",

          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const data = await parseApiResponse(response, "Cart clear API").catch(
            () => ({}),
          );

          console.warn(
            "Backend cart clear failed:",
            data?.message || response.statusText,
          );
        }
      } catch (error) {
        console.warn("Backend cart clear error:", error);
      }
    }

    window.dispatchEvent(
      new CustomEvent("axiee-cart-updated", {
        detail: emptyCart,
      }),
    );
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

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

  /* =========================================================
     VALIDATION
  ========================================================= */

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

  /* =========================================================
     RAZORPAY ONLINE PAYMENT
  ========================================================= */

  const openRazorpayPayment = async ({ amount, internalOrder }) => {
    try {
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout could not be loaded. Please refresh and try again.",
        );
      }

      /* KEY */

      const keyResponse = await fetch(`${API_URL}/api/payments/key`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const keyData = await parseApiResponse(keyResponse, "Razorpay key API");

      if (!keyResponse.ok || !keyData?.key) {
        throw new Error(keyData?.message || "Razorpay Key ID is missing.");
      }

      /* CREATE RAZORPAY ORDER */

      const orderResponse = await fetch(
        `${API_URL}/api/payments/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            amount,

            receipt: internalOrder?.orderNumber || `UNBOUND-${Date.now()}`,

            notes: {
              internalOrderId: internalOrder?._id || "",

              orderNumber: internalOrder?.orderNumber || "",

              paymentMethod: "online",
            },
          }),
        },
      );

      const razorpayOrderData = await parseApiResponse(
        orderResponse,
        "Razorpay order API",
      );

      if (!orderResponse.ok || !razorpayOrderData?.order?.id) {
        throw new Error(
          razorpayOrderData?.message || "Could not create Razorpay order.",
        );
      }

      const razorpayOrder = razorpayOrderData.order;

      /* OPTIONS */

      const options = {
        key: keyData.key,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency || "INR",

        name: "UNBOUND",

        description: "UNBOUND Online Payment",

        order_id: razorpayOrder.id,

        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),

          email: form.email,

          contact: form.phone,
        },

        notes: {
          orderNumber: internalOrder?.orderNumber || "",

          internalOrderId: internalOrder?._id || "",
        },

        theme: {
          color: "#c7ff13",
        },

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(
              `${API_URL}/api/payments/verify`,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },

                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,

                  razorpay_payment_id: paymentResponse.razorpay_payment_id,

                  razorpay_signature: paymentResponse.razorpay_signature,

                  internalOrderId: internalOrder?._id || "",

                  orderNumber: internalOrder?.orderNumber || "",
                }),
              },
            );

            const verifyData = await parseApiResponse(
              verifyResponse,
              "Payment verify API",
            );

            if (!verifyResponse.ok || !verifyData?.success) {
              throw new Error(
                verifyData?.message || "Payment verification failed.",
              );
            }

            await resetCartAfterSuccessfulOrder();

            setOrderResult((current) => ({
              ...current,

              paymentStatus: "paid",

              razorpayPaymentId: paymentResponse.razorpay_payment_id,

              razorpayOrderId: paymentResponse.razorpay_order_id,
            }));

            setOrderComplete(true);

            setPlacingOrder(false);

            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "smooth",
            });
          } catch (error) {
            console.error("Razorpay verification error:", error);

            setCartError(error?.message || "Payment verification failed.");

            setPlacingOrder(false);
          }
        },

        modal: {
          escape: true,

          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        const message =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed. Please try again.";

        setCartError(message);

        setPlacingOrder(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Razorpay checkout error:", error);

      setCartError(error?.message || "Could not open Razorpay payment.");

      setPlacingOrder(false);
    }
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      document.querySelector(".ax-checkout-field.is-error")?.scrollIntoView({
        behavior: "smooth",

        block: "center",
      });

      return;
    }

    if (!items.length) {
      setCartError("Your bag is empty. Add a product before checkout.");

      return;
    }

    /*
        NO ORDER NOTE IS SENT.

        paymentMethod:
        upi = ONLINE PAYMENT
        cod = CASH ON DELIVERY
      */

    const checkoutPayload = {
      cartId: localStorage.getItem("axiee-cart-id"),

      customer: {
        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        email: form.email.trim(),

        phone: form.phone,
      },

      shippingAddress: {
        address: form.address.trim(),

        apartment: form.apartment.trim(),

        city: form.city.trim(),

        state: form.state,

        pincode: form.pincode,

        country: form.country,
      },

      paymentMethod,

      couponCode: appliedCoupon?.code || "",

      items,
    };

    try {
      setPlacingOrder(true);

      setCartError("");

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify(checkoutPayload),
      });

      const data = await parseApiResponse(response, "Checkout API");

      if (!response.ok) {
        throw new Error(data?.message || "Could not create your order.");
      }

      const createdOrder = data?.order;

      if (!createdOrder) {
        throw new Error("Order was not returned from the server.");
      }

      setOrderResult(createdOrder);

      /* ===================================================
           CASH ON DELIVERY

           paymentRequired = false

           Full amount paid on delivery.

           NO Razorpay.
           NO 10% advance.
        =================================================== */

      if (paymentMethod === "cod") {
        await resetCartAfterSuccessfulOrder();

        setOrderComplete(true);

        setPlacingOrder(false);

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });

        return;
      }

      /* ===================================================
           ONLINE PAYMENT
        =================================================== */

      const paymentAmount = Number(createdOrder?.total || total || 0);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Invalid payment amount.");
      }

      await openRazorpayPayment({
        amount: paymentAmount,

        internalOrder: createdOrder,
      });
    } catch (error) {
      console.error("Create order / payment error:", error);

      setCartError(error?.message || "Could not create your order.");

      setPlacingOrder(false);
    }
  };

  /* =========================================================
     SUCCESS PAGE
  ========================================================= */

  if (orderComplete) {
    return (
      <main className="ax-checkout-page ax-checkout-success-page">
        <div className="ax-checkout-orb ax-checkout-orb-one"></div>

        <div className="ax-checkout-orb ax-checkout-orb-two"></div>

        <section className="ax-checkout-success">
          <div className="ax-checkout-success-icon">
            <Check size={28} strokeWidth={1.7} />
          </div>

          <span className="ax-checkout-eyebrow">
            {orderResult?.orderNumber || "ORDER CONFIRMED"}
          </span>

          <h1>
            ORDER
            <br />
            CONFIRMED.
          </h1>

          <p>
            {orderResult?.paymentMethod === "cod"
              ? `Your Cash on Delivery order has been placed successfully. Pay ${money(
                  orderResult.total,
                )} when your order is delivered.`
              : "Your online payment has been received and your order has been confirmed."}
          </p>

          {orderResult && (
            <div className="ax-checkout-order-details">
              <p>
                ORDER NUMBER:
                <strong> {orderResult.orderNumber}</strong>
              </p>

              {Number(orderResult.discountAmount || 0) > 0 && (
                <p>
                  DISCOUNT
                  {orderResult.couponCode ? ` (${orderResult.couponCode})` : ""}
                  :<strong> -{money(orderResult.discountAmount)}</strong>
                </p>
              )}

              <p>
                TOTAL:
                <strong> {money(orderResult.total)}</strong>
              </p>

              <p>
                PAYMENT:
                <strong>
                  {" "}
                  {orderResult.paymentMethod === "cod"
                    ? "CASH ON DELIVERY"
                    : "ONLINE PAYMENT"}
                </strong>
              </p>

              {orderResult?.paymentStatus === "paid" && (
                <p>
                  PAYMENT STATUS:
                  <strong> PAID</strong>
                </p>
              )}

              {orderResult?.razorpayPaymentId && (
                <p>
                  PAYMENT ID:
                  <strong> {orderResult.razorpayPaymentId}</strong>
                </p>
              )}

              {orderResult?.paymentMethod === "cod" && (
                <p>
                  PAY ON DELIVERY:
                  <strong> {money(orderResult.total)}</strong>
                </p>
              )}
            </div>
          )}

          <button type="button" onClick={() => navigate("/best-sellers")}>
            CONTINUE SHOPPING
            <ArrowRight size={17} />
          </button>
        </section>
      </main>
    );
  }

  /* =========================================================
     CHECKOUT PAGE
  ========================================================= */

  return (
    <main className="ax-checkout-page">
      <div className="ax-checkout-orb ax-checkout-orb-one"></div>

      <div className="ax-checkout-orb ax-checkout-orb-two"></div>

      <section className="ax-checkout-shell">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="ax-checkout-heading">
          <button
            type="button"
            className="ax-checkout-back"
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft size={16} />
            BACK TO BAG
          </button>

          <div className="ax-checkout-title-wrap">
            <span className="ax-checkout-index">02 / CHECKOUT</span>
          </div>

          <div className="ax-checkout-secure">
            <LockKeyhole size={14} />
            SECURE CHECKOUT
          </div>
        </header>

        <div className="ax-checkout-grid">
          {/* =================================================
              LEFT
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
                    placeholder="Name"
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
                    placeholder="Last name"
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
                    placeholder="Enter email address"
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
                      placeholder="Mobile Number"
                      autoComplete="tel"
                    />
                  </div>

                  {formErrors.phone && <small>{formErrors.phone}</small>}
                </label>
              </div>
            </section>

            {/* ===============================================
                DELIVERY
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

                {/* LANDMARK */}

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
                      placeholder="City"
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

                  {/* PIN CODE */}

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
                      placeholder="PIN code"
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

                {/* ORDER NOTE REMOVED */}
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

              {/* =============================================
                  ONLY 2 PAYMENT OPTIONS
              ============================================= */}

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
                        <i></i>
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

              {/* ONLINE */}

              {paymentMethod === "upi" && (
                <div className="ax-checkout-online-note">
                  <LockKeyhole size={14} />
                  Secure online payment powered by Razorpay.
                </div>
              )}

              {/* COD */}

              {paymentMethod === "cod" && (
                <div className="ax-checkout-cod-rule">
                  <div className="ax-checkout-cod-rule-head">
                    <Truck size={16} />

                    <strong>CASH ON DELIVERY</strong>
                  </div>

                  <p>
                    Pay the complete order amount of <b>{money(total)}</b> when
                    your order is delivered.
                  </p>

                  <p>No online advance is required.</p>
                </div>
              )}
            </section>

            {/* ===============================================
                MOBILE BUTTON
            =============================================== */}

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
              RIGHT SUMMARY
          ================================================= */}

          <aside className="ax-checkout-summary">
            <div className="ax-checkout-summary-sticky">
              {/* =============================================
                  HEADER
              ============================================= */}

              <div className="ax-checkout-summary-head">
                <span>FINAL REVIEW</span>

                <PackageCheck size={18} strokeWidth={1.5} />
              </div>

              {/* =============================================
                  PRODUCTS
              ============================================= */}

              {loadingCart ? (
                <div className="ax-checkout-loading">
                  <i></i>
                  LOADING YOUR BAG
                </div>
              ) : items.length === 0 ? (
                <div className="ax-checkout-empty">
                  <p>Your bag is empty.</p>

                  <button
                    type="button"
                    onClick={() => navigate("/best-sellers")}
                  >
                    GO TO SHOP
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="ax-checkout-summary-items">
                  {items.map((item, index) => (
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
                        {getItemImage(item) ? (
                          <img
                            src={getItemImage(item)}
                            alt={getItemName(item)}
                          />
                        ) : (
                          <span>UNBOUND</span>
                        )}

                        <b>{getItemQuantity(item)}</b>
                      </div>

                      {/* INFO */}

                      <div className="ax-checkout-item-copy">
                        <h3>{getItemName(item)}</h3>

                        <p>
                          {item?.size ? `SIZE ${item.size}` : ""}

                          {item?.size && item?.color ? " / " : ""}

                          {item?.color ? String(item.color).toUpperCase() : ""}
                        </p>
                      </div>

                      {/* PRICE */}

                      <strong>
                        {money(getItemPrice(item) * getItemQuantity(item))}
                      </strong>
                    </article>
                  ))}
                </div>
              )}

              {/* =============================================
                  COUPON
              ============================================= */}

              <div
                style={{
                  padding: "22px 30px",

                  borderTop: "1px solid rgba(255,255,255,0.08)",

                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* TITLE */}

                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    gap: 12,

                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,

                      letterSpacing: "0.18em",

                      color: "#8b94a3",
                    }}
                  >
                    COUPON / OFFER
                  </span>

                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{
                        border: 0,

                        background: "transparent",

                        color: "#b9ff00",

                        cursor: "pointer",

                        fontSize: 10,

                        letterSpacing: "0.12em",
                      }}
                    >
                      REMOVE
                    </button>
                  )}
                </div>

                {/* ENTER CODE */}

                <div
                  style={{
                    display: "flex",

                    gap: 8,

                    marginBottom: 14,
                  }}
                >
                  <input
                    type="text"
                    value={couponCode}
                    disabled={Boolean(appliedCoupon)}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());

                      setCouponError("");

                      setCouponMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();

                        applyCoupon();
                      }
                    }}
                    placeholder="ENTER COUPON CODE"
                    style={{
                      flex: 1,

                      minWidth: 0,

                      height: 44,

                      padding: "0 14px",

                      border: "1px solid rgba(255,255,255,0.14)",

                      background: "rgba(255,255,255,0.025)",

                      color: "#fff",

                      outline: "none",

                      fontSize: 12,

                      letterSpacing: "0.08em",

                      textTransform: "uppercase",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => applyCoupon()}
                    disabled={applyingCoupon || Boolean(appliedCoupon)}
                    style={{
                      minWidth: 92,

                      height: 44,

                      border: 0,

                      background: appliedCoupon ? "#273000" : "#b9ff00",

                      color: appliedCoupon ? "#b9ff00" : "#050505",

                      cursor:
                        applyingCoupon || appliedCoupon ? "default" : "pointer",

                      fontSize: 11,

                      fontWeight: 800,

                      letterSpacing: "0.12em",
                    }}
                  >
                    {applyingCoupon
                      ? "CHECKING"
                      : appliedCoupon
                        ? "APPLIED"
                        : "APPLY"}
                  </button>
                </div>

                {/* SUCCESS */}

                {couponMessage && (
                  <div
                    style={{
                      marginBottom: 12,

                      color: "#b9ff00",

                      fontSize: 11,

                      lineHeight: 1.5,
                    }}
                  >
                    ✓ {couponMessage}
                  </div>
                )}

                {/* ERROR */}

                {couponError && (
                  <div
                    style={{
                      marginBottom: 12,

                      color: "#ff6b6b",

                      fontSize: 11,

                      lineHeight: 1.5,
                    }}
                  >
                    {couponError}
                  </div>
                )}

                {/* ===========================================
                    ACTIVE COUPONS
                =========================================== */}

                {couponLoading ? (
                  <div
                    style={{
                      fontSize: 10,

                      color: "#6f7885",
                    }}
                  >
                    LOADING ACTIVE OFFERS...
                  </div>
                ) : availableCoupons.length > 0 ? (
                  <div
                    style={{
                      display: "grid",

                      gap: 8,
                    }}
                  >
                    {availableCoupons.map((coupon) => {
                      const isApplied = appliedCoupon?.code === coupon.code;

                      const eligible = Boolean(coupon.eligible);

                      return (
                        <div
                          key={coupon._id || coupon.code}
                          style={{
                            display: "grid",

                            gridTemplateColumns: "1fr auto",

                            alignItems: "center",

                            gap: 12,

                            padding: "12px 14px",

                            border: isApplied
                              ? "1px solid rgba(185,255,0,0.7)"
                              : "1px solid rgba(255,255,255,0.08)",

                            background: isApplied
                              ? "rgba(185,255,0,0.05)"
                              : "rgba(255,255,255,0.015)",
                          }}
                        >
                          {/* INFO */}

                          <div>
                            <strong
                              style={{
                                display: "block",

                                color: "#fff",

                                fontSize: 12,

                                letterSpacing: "0.08em",
                              }}
                            >
                              {coupon.code}
                            </strong>

                            <span
                              style={{
                                display: "block",

                                marginTop: 4,

                                color: eligible ? "#8b94a3" : "#6f7885",

                                fontSize: 10,

                                lineHeight: 1.45,
                              }}
                            >
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}% OFF`
                                : `${money(coupon.discountValue)} OFF`}

                              {Number(coupon.minOrderAmount || 0) > 0
                                ? ` · MIN ${money(coupon.minOrderAmount)}`
                                : ""}

                              {coupon.firstOrderOnly
                                ? " · FIRST ORDER ONLY"
                                : ""}
                            </span>
                          </div>

                          {/* APPLY */}

                          <button
                            type="button"
                            disabled={!eligible || applyingCoupon || isApplied}
                            onClick={() => {
                              setCouponCode(coupon.code);

                              applyCoupon(coupon.code);
                            }}
                            style={{
                              border: "1px solid rgba(185,255,0,0.45)",

                              background: isApplied ? "#b9ff00" : "transparent",

                              color: isApplied
                                ? "#050505"
                                : eligible
                                  ? "#b9ff00"
                                  : "#555",

                              minWidth: 68,

                              height: 32,

                              cursor:
                                eligible && !isApplied ? "pointer" : "default",

                              fontSize: 9,

                              fontWeight: 800,

                              letterSpacing: "0.1em",
                            }}
                          >
                            {isApplied
                              ? "APPLIED"
                              : eligible
                                ? "APPLY"
                                : "LOCKED"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 10,

                      color: "#6f7885",
                    }}
                  >
                    NO ACTIVE COUPONS RIGHT NOW
                  </div>
                )}
              </div>

              {/* =============================================
                  TOTALS
              ============================================= */}

              <div className="ax-checkout-price-lines">
                {/* SUBTOTAL */}

                <div>
                  <span>SUBTOTAL</span>

                  <strong>{money(subtotal)}</strong>
                </div>

                {/* DISCOUNT */}

                {discountAmount > 0 && (
                  <div>
                    <span>
                      DISCOUNT{" "}
                      {appliedCoupon?.code ? `(${appliedCoupon.code})` : ""}
                    </span>

                    <strong
                      style={{
                        color: "#b9ff00",
                      }}
                    >
                      - {money(discountAmount)}
                    </strong>
                  </div>
                )}

                {/* SHIPPING */}

                <div>
                  <span>SHIPPING</span>

                  <strong className="ax-checkout-free">FREE</strong>
                </div>

                {/* TOTAL */}

                <div className="ax-checkout-total">
                  <span>TOTAL</span>

                  <div>
                    <small>INR</small>

                    <strong>{money(total)}</strong>
                  </div>
                </div>
              </div>

              {/* =============================================
                  ERROR
              ============================================= */}

              {cartError && (
                <div className="ax-checkout-cart-error">{cartError}</div>
              )}

              {/* =============================================
                  PLACE ORDER
              ============================================= */}

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

              {/* =============================================
                  TRUST
              ============================================= */}

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
