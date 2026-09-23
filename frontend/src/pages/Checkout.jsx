import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

const money = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
};

const getItemName = (item) =>
  item?.product?.name ||
  item?.productId?.name ||
  item?.name ||
  "UNBOUND Product";
const resolveImageUrl = (value) => {
  if (!value) return "";

  // Image object
  if (typeof value === "object") {
    // Normal URL object
    if (value.url) {
      return resolveImageUrl(value.url);
    }

    // GridFS file
    const fileId = value.fileId || value._id || value.id;

    if (fileId) {
      return `${API_URL}/api/catalog/images/${fileId}`;
    }

    return "";
  }

  const image = String(value).trim();

  if (!image) return "";

  // Already complete URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  // Old backend image route
  if (image.startsWith("/api/images/")) {
    return `${API_URL}${image.replace(
      "/api/images/",
      "/api/catalog/images/",
    )}`;
  }

  // Backend API image
  if (image.startsWith("/api/")) {
    return `${API_URL}${image}`;
  }

  // Backend uploads
  if (image.startsWith("/uploads/")) {
    return `${API_URL}${image}`;
  }

  // Relative backend uploads
  if (image.startsWith("uploads/")) {
    return `${API_URL}/${image}`;
  }

  return image;
};

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

const getItemPrice = (item) =>
  Number(
    item?.price ??
      item?.product?.salePrice ??
      item?.product?.price ??
      item?.productId?.salePrice ??
      item?.productId?.price ??
      0,
  );

const getItemQuantity = (item) => Number(item?.quantity || 1);

function Checkout() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [cart, setCart] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    const loadCart = async () => {
      const cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        setCart({ items: [] });
        setLoadingCart(false);
        return;
      }

      try {
        setLoadingCart(true);
        setCartError("");

        const response = await fetch(`${API_URL}/api/cart/${cartId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Could not load your bag.");
        }

        setCart(data?.cart || data || { items: [] });
      } catch (error) {
        console.error("Checkout cart error:", error);
        setCartError(error.message || "Could not load your bag.");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + getItemPrice(item) * getItemQuantity(item),
        0,
      ),
    [items],
  );

  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  // COD RULE:
  // Below ₹2,000  -> normal Cash on Delivery.
  // ₹2,000+       -> customer must pay 10% online in advance.
  // Remaining 90% -> collected as Cash on Delivery.
  const codAdvanceRequired = paymentMethod === "cod" && total >= 2000;
  const codAdvanceAmount = codAdvanceRequired ? Math.ceil(total * 0.1) : 0;
  const codBalanceAmount = codAdvanceRequired
    ? total - codAdvanceAmount
    : total;

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

  const validate = () => {
    const nextErrors = {};

    if (!form.firstName.trim())
      nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state) nextErrors.state = "Select your state.";

    if (!/^\d{6}$/.test(form.pincode)) {
      nextErrors.pincode = "Enter a valid 6-digit PIN code.";
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

 const handleSubmit = async (event) => {
  event.preventDefault();

  if (!validate()) {
    const firstError =
      document.querySelector(
        ".ax-checkout-field.is-error",
      );

    firstError?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return;
  }

  if (!items.length) {
    setCartError(
      "Your bag is empty. Add a product before checkout.",
    );

    return;
  }

  const checkoutPayload = {
    cartId:
      localStorage.getItem(
        "axiee-cart-id",
      ),

    customer: {
      firstName:
        form.firstName.trim(),

      lastName:
        form.lastName.trim(),

      email:
        form.email.trim(),

      phone:
        form.phone,
    },

    shippingAddress: {
      address:
        form.address.trim(),

      apartment:
        form.apartment.trim(),

      city:
        form.city.trim(),

      state:
        form.state,

      pincode:
        form.pincode,

      country:
        form.country,
    },

    notes:
      form.notes.trim(),

    paymentMethod,

    items,
  };

  try {
    setPlacingOrder(true);

    setCartError("");

    console.log(
      "Sending order:",
      checkoutPayload,
    );

    const response =
      await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            checkoutPayload,
          ),
        },
      );

    const data =
      await response.json();

    console.log(
      "Order response:",
      data,
    );

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Could not create your order.",
      );
    }

    setOrderResult(
      data?.order || null,
    );

    setOrderComplete(true);

    /*
      NORMAL COD BELOW ₹2000

      Payment is not required,
      therefore order is fully placed.
    */

    if (!data?.paymentRequired) {
      localStorage.removeItem(
        "axiee-cart-id",
      );

      setCart({
        items: [],
      });
    }

    /*
      UPI / CARD / 10% COD ADVANCE

      Do NOT clear cart yet.

      Razorpay will be connected next.
    */

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error,
    );

    setCartError(
      error.message ||
        "Could not create your order.",
    );
  } finally {
    setPlacingOrder(false);
  }
};

  if (orderComplete) {
  return (
    <main className="ax-checkout-page ax-checkout-success-page">
      <div className="ax-checkout-orb ax-checkout-orb-one"></div>

      <div className="ax-checkout-orb ax-checkout-orb-two"></div>

      <section className="ax-checkout-success">
        <div className="ax-checkout-success-icon">
          <Check
            size={28}
            strokeWidth={1.7}
          />
        </div>

        <span className="ax-checkout-eyebrow">
          {orderResult?.orderNumber ||
            "ORDER CREATED"}
        </span>

        <h1>
          ORDER SAVED
          <br />
          SUCCESSFULLY.
        </h1>

        <p>
          {orderResult?.orderStatus ===
          "pending_payment"
            ? "Your order has been saved. Complete the online payment to confirm your order."
            : "Your order has been placed successfully."}
        </p>

        {orderResult && (
          <div className="ax-checkout-order-details">
            <p>
              ORDER NUMBER:
              <strong>
                {" "}
                {orderResult.orderNumber}
              </strong>
            </p>

            <p>
              TOTAL:
              <strong>
                {" "}
                {money(
                  orderResult.total,
                )}
              </strong>
            </p>

            <p>
              PAYMENT:
              <strong>
                {" "}
                {String(
                  orderResult.paymentMethod,
                ).toUpperCase()}
              </strong>
            </p>

            {orderResult.codAdvanceRequired && (
              <>
                <p>
                  PAY NOW:
                  <strong>
                    {" "}
                    {money(
                      orderResult.advanceAmount,
                    )}
                  </strong>
                </p>

                <p>
                  PAY ON DELIVERY:
                  <strong>
                    {" "}
                    {money(
                      orderResult.balanceDueOnDelivery,
                    )}
                  </strong>
                </p>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            navigate("/shop")
          }
        >
          CONTINUE SHOPPING

          <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}

  return (
    <main className="ax-checkout-page">
      <div className="ax-checkout-orb ax-checkout-orb-one"></div>
      <div className="ax-checkout-orb ax-checkout-orb-two"></div>

      <section className="ax-checkout-shell">
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
          <form className="ax-checkout-form" onSubmit={handleSubmit} noValidate>
            <section className="ax-checkout-card">
              <div className="ax-checkout-card-head">
                <div>
                  <span>01</span>
                  <h2>CONTACT</h2>
                </div>

                <Smartphone size={21} strokeWidth={1.4} />
              </div>

              <div className="ax-checkout-fields ax-checkout-fields-two">
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

            <section className="ax-checkout-card">
              <div className="ax-checkout-card-head">
                <div>
                  <span>02</span>
                  <h2>DELIVERY ADDRESS</h2>
                </div>

                <MapPin size={21} strokeWidth={1.4} />
              </div>

              <div className="ax-checkout-fields">
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

              {paymentMethod !== "cod" && (
                <div className="ax-checkout-online-note">
                  <LockKeyhole size={14} />
                  Online payment will open securely after your backend/Razorpay
                  order API is connected.
                </div>
              )}

              {paymentMethod === "cod" && (
                <div
                  className={`ax-checkout-cod-rule ${
                    codAdvanceRequired ? "advance-required" : ""
                  }`}
                >
                  <div className="ax-checkout-cod-rule-head">
                    <Truck size={16} />
                    <strong>CASH ON DELIVERY RULE</strong>
                  </div>

                  {codAdvanceRequired ? (
                    <>
                      <p>
                        Your order is {money(total)}. Orders of ₹2,000 or more
                        require a <b>10% online advance</b> before the order is
                        confirmed.
                      </p>

                      <div className="ax-checkout-cod-split">
                        <div>
                          <span>PAY NOW (10%)</span>
                          <strong>{money(codAdvanceAmount)}</strong>
                        </div>

                        <div>
                          <span>PAY ON DELIVERY</span>
                          <strong>{money(codBalanceAmount)}</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>
                      Your order is below ₹2,000, so you can place it with
                      normal Cash on Delivery.
                    </p>
                  )}
                </div>
              )}
            </section>

            <button
              type="submit"
              className="ax-checkout-place-mobile"
              disabled={placingOrder || loadingCart}
            >
              {placingOrder
                ? "PROCESSING..."
                : codAdvanceRequired
                  ? `PAY 10% (${money(codAdvanceAmount)}) & CONFIRM`
                  : paymentMethod === "cod"
                    ? "PLACE COD ORDER"
                    : "CONTINUE TO PAYMENT"}
              {!placingOrder && <ArrowRight size={18} />}
            </button>
          </form>

          <aside className="ax-checkout-summary">
            <div className="ax-checkout-summary-sticky">
              <div className="ax-checkout-summary-head">
                <span>FINAL REVIEW</span>
                <PackageCheck size={18} strokeWidth={1.5} />
              </div>

              {loadingCart ? (
                <div className="ax-checkout-loading">
                  <i></i>
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
                  {items.map((item, index) => (
                    <article
                      className="ax-checkout-summary-item"
                      key={item?._id || item?.product?._id || index}
                    >
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

                      <div className="ax-checkout-item-copy">
                        <h3>{getItemName(item)}</h3>

                        <p>
                          {item?.size ? `SIZE ${item.size}` : ""}
                          {item?.size && item?.color ? " / " : ""}
                          {item?.color ? String(item.color).toUpperCase() : ""}
                        </p>
                      </div>

                      <strong>
                        {money(getItemPrice(item) * getItemQuantity(item))}
                      </strong>
                    </article>
                  ))}
                </div>
              )}

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
                  : codAdvanceRequired
                    ? `PAY 10% (${money(codAdvanceAmount)}) & CONFIRM`
                    : paymentMethod === "cod"
                      ? "PLACE COD ORDER"
                      : "CONTINUE TO PAYMENT"}

                {!placingOrder && <ArrowRight size={18} />}
              </button>

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
