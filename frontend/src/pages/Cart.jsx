import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/cart";

// TEMP USER
// Later we will replace this with the logged-in user's MongoDB ID.
const USER_ID = localStorage.getItem("userId") || "test-user-1";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [error, setError] = useState("");

  // ==============================
  // GET CART
  // ==============================
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/${USER_ID}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load cart");
      }

      setCart(data.cart);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const items = cart?.items || [];

  // ==============================
  // UPDATE QUANTITY
  // ==============================
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    try {
      setUpdatingItem(itemId);

      const response = await fetch(
        `${API_URL}/${USER_ID}/item/${itemId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update quantity");
      }

      setCart(data.cart);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  // ==============================
  // REMOVE ITEM
  // ==============================
  const removeItem = async (itemId) => {
    try {
      setUpdatingItem(itemId);

      const response = await fetch(
        `${API_URL}/${USER_ID}/item/${itemId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove item");
      }

      setCart(data.cart);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  // ==============================
  // CLEAR CART
  // ==============================
  const clearCart = async () => {
    if (items.length === 0) return;

    const confirmClear = window.confirm(
      "Are you sure you want to clear your cart?"
    );

    if (!confirmClear) return;

    try {
      const response = await fetch(`${API_URL}/${USER_ID}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to clear cart");
      }

      setCart(data.cart);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ==============================
  // TOTALS
  // ==============================
  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.price) * Number(item.quantity);
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.quantity);
    }, 0);
  }, [items]);

  const shipping = subtotal >= 2999 || subtotal === 0 ? 0 : 149;

  const total = subtotal + shipping;

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <div className="ax-cart-loader">
        <div className="loader-circle"></div>
        <p>LOADING CART</p>

        <style>{cartCSS}</style>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return (
      <div className="cart-error-page">
        <X size={34} />

        <h2>Unable to load cart</h2>

        <p>{error}</p>

        <button onClick={fetchCart}>TRY AGAIN</button>

        <style>{cartCSS}</style>
      </div>
    );
  }

  return (
    <>
      <main className="cart-page">

        {/* ===================================
            TOP DECORATION
        =================================== */}

        <div className="cart-glow cart-glow-left"></div>
        <div className="cart-glow cart-glow-right"></div>

        <div className="cart-container">

          {/* ===================================
              HEADER
          =================================== */}

          <div className="cart-heading">

            <div>
              <p className="cart-eyebrow">
                YOUR SELECTION / {String(totalQuantity).padStart(2, "0")}
              </p>

              <h1>
                YOUR
                <span>CART</span>
              </h1>
            </div>

            <Link to="/shop" className="continue-shopping">
              <ArrowLeft size={16} />
              CONTINUE SHOPPING
            </Link>

          </div>

          {/* ===================================
              EMPTY CART
          =================================== */}

          {items.length === 0 ? (

            <div className="empty-cart">

              <div className="empty-icon">
                <ShoppingBag size={42} strokeWidth={1.2} />
                <span>0</span>
              </div>

              <p className="empty-small">NOTHING HERE YET</p>

              <h2>
                YOUR CART IS
                <br />
                <span>EMPTY.</span>
              </h2>

              <p className="empty-description">
                Your next favourite piece is waiting.
                <br />
                Explore the latest AXIEE collection.
              </p>

              <Link to="/shop" className="shop-button">
                <span>EXPLORE COLLECTION</span>

                <div>
                  <ArrowRight size={19} />
                </div>
              </Link>

            </div>

          ) : (

            <div className="cart-layout">

              {/* ===================================
                  LEFT - CART PRODUCTS
              =================================== */}

              <section className="cart-products">

                <div className="products-header">

                  <span>PRODUCT</span>
                  <span>QUANTITY</span>
                  <span>TOTAL</span>

                </div>

                {items.map((item, index) => {

                  const itemTotal =
                    Number(item.price) * Number(item.quantity);

                  return (
                    <article
                      className="cart-product"
                      key={item._id}
                    >

                      {/* IMAGE */}

                      <div className="product-image-wrapper">

                        <div className="item-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="product-image"
                          />
                        ) : (
                          <div className="image-placeholder">
                            AXIEE
                          </div>
                        )}

                      </div>

                      {/* PRODUCT INFORMATION */}

                      <div className="product-information">

                        <p className="product-label">
                          AXIEE / COLLECTION
                        </p>

                        <h3>{item.name}</h3>

                        <p className="product-price">
                          ₹{Number(item.price).toLocaleString("en-IN")}
                        </p>

                        <div className="product-size">
                          <span>SIZE</span>
                          <strong>{item.size}</strong>
                        </div>

                        <button
                          className="remove-mobile"
                          onClick={() => removeItem(item._id)}
                        >
                          <Trash2 size={14} />
                          REMOVE
                        </button>

                      </div>

                      {/* QUANTITY */}

                      <div className="quantity-area">

                        <p className="mobile-title">QUANTITY</p>

                        <div className="quantity-controller">

                          <button
                            disabled={
                              item.quantity <= 1 ||
                              updatingItem === item._id
                            }
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus size={15} />
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            disabled={updatingItem === item._id}
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus size={15} />
                          </button>

                        </div>

                      </div>

                      {/* ITEM TOTAL */}

                      <div className="item-total">

                        <p className="mobile-title">TOTAL</p>

                        <strong>
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </strong>

                        <button
                          className="remove-button"
                          onClick={() => removeItem(item._id)}
                          disabled={updatingItem === item._id}
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </article>
                  );
                })}

                <div className="cart-bottom-actions">

                  <button
                    onClick={clearCart}
                    className="clear-cart"
                  >
                    <Trash2 size={14} />
                    CLEAR CART
                  </button>

                  <Link to="/shop">
                    <ArrowLeft size={14} />
                    ADD MORE ITEMS
                  </Link>

                </div>

              </section>

              {/* ===================================
                  RIGHT - CART SUMMARY
              =================================== */}

              <aside className="order-summary">

                <div className="summary-top">

                  <div>
                    <p>ORDER</p>
                    <h2>SUMMARY</h2>
                  </div>

                  <span>{String(totalQuantity).padStart(2, "0")}</span>

                </div>

                <div className="summary-line"></div>

                <div className="summary-row">
                  <span>SUBTOTAL</span>

                  <strong>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>SHIPPING</span>

                  <strong
                    className={
                      shipping === 0 ? "shipping-free" : ""
                    }
                  >
                    {shipping === 0
                      ? "FREE"
                      : `₹${shipping.toLocaleString("en-IN")}`}
                  </strong>
                </div>

                {subtotal < 2999 && (
                  <div className="shipping-progress">

                    <p>
                      ADD{" "}
                      <strong>
                        ₹{(2999 - subtotal).toLocaleString("en-IN")}
                      </strong>{" "}
                      MORE FOR FREE SHIPPING
                    </p>

                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(
                            (subtotal / 2999) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-total">

                  <div>
                    <span>TOTAL</span>
                    <small>INCL. TAXES</small>
                  </div>

                  <strong>
                    ₹{total.toLocaleString("en-IN")}
                  </strong>

                </div>

                <Link
                  to="/checkout"
                  className="checkout-button"
                >
                  <span>PROCEED TO CHECKOUT</span>

                  <div className="checkout-arrow">
                    <ArrowRight size={19} />
                  </div>
                </Link>

                <div className="secure-checkout">
                  <span></span>
                  SECURE CHECKOUT
                </div>

                <div className="payment-methods">
                  <span>VISA</span>
                  <span>MC</span>
                  <span>UPI</span>
                  <span>G PAY</span>
                  <span>PAYTM</span>
                </div>

              </aside>

            </div>

          )}

        </div>

      </main>

      <style>{cartCSS}</style>
    </>
  );
};

export default Cart;


// ============================================================
// AXIEE CART CSS
// ============================================================

const cartCSS = `

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #030303;
}

.cart-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 50% -20%,
      rgba(185, 255, 0, 0.10),
      transparent 35%
    ),
    #030303;

  color: #ffffff;

  padding: 180px 30px 100px;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  position: relative;

  overflow: hidden;
}

.cart-container {
  width: min(1500px, 100%);
  margin: 0 auto;

  position: relative;
  z-index: 2;
}


/* ==================================
   GLOW
================================== */

.cart-glow {
  width: 400px;
  height: 400px;

  border: 1px solid rgba(183, 255, 0, 0.24);

  border-radius: 50%;

  position: absolute;

  filter: blur(1px);

  pointer-events: none;
}

.cart-glow-left {
  top: -280px;
  left: -100px;
}

.cart-glow-right {
  top: -300px;
  right: -80px;
}


/* ==================================
   HEADER
================================== */

.cart-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  border-bottom: 1px solid #202020;

  padding-bottom: 35px;
  margin-bottom: 45px;
}

.cart-eyebrow {
  font-size: 10px;

  letter-spacing: 4px;

  color: #777;

  margin: 0 0 14px;
}

.cart-heading h1 {
  margin: 0;

  font-size: clamp(55px, 8vw, 110px);

  line-height: 0.85;

  font-weight: 400;

  letter-spacing: -6px;
}

.cart-heading h1 span {
  color: #b7ff00;

  margin-left: 25px;
}

.continue-shopping {
  height: 50px;

  padding: 0 22px;

  border: 1px solid #303030;
  border-radius: 100px;

  color: white;

  display: flex;
  align-items: center;
  gap: 10px;

  text-decoration: none;

  font-size: 10px;
  letter-spacing: 1.5px;

  transition: 0.3s;
}

.continue-shopping:hover {
  border-color: #b7ff00;
  color: #b7ff00;
}


/* ==================================
   CART GRID
================================== */

.cart-layout {
  display: grid;

  grid-template-columns:
    minmax(0, 1.7fr)
    minmax(340px, 0.7fr);

  gap: 35px;

  align-items: flex-start;
}


/* ==================================
   PRODUCT SECTION
================================== */

.cart-products {
  border: 1px solid #1e1e1e;

  background: rgba(5, 5, 5, 0.8);
}

.products-header {
  height: 55px;

  padding: 0 25px;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    150px
    130px;

  align-items: center;

  border-bottom: 1px solid #1e1e1e;

  font-size: 9px;

  letter-spacing: 2px;

  color: #656565;
}

.cart-product {
  min-height: 220px;

  display: grid;

  grid-template-columns:
    180px
    minmax(0, 1fr)
    150px
    130px;

  border-bottom: 1px solid #1e1e1e;
}


/* ==================================
   PRODUCT IMAGE
================================== */

.product-image-wrapper {
  border-right: 1px solid #1e1e1e;

  position: relative;

  background:
    linear-gradient(
      145deg,
      #101010,
      #050505
    );

  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;

  object-fit: cover;

  transition: transform 0.5s ease;
}

.cart-product:hover .product-image {
  transform: scale(1.04);
}

.image-placeholder {
  width: 100%;
  height: 100%;

  display: grid;
  place-items: center;

  color: #444;

  font-size: 13px;

  letter-spacing: 6px;
}

.item-number {
  position: absolute;

  top: 14px;
  left: 14px;

  z-index: 2;

  width: 32px;
  height: 32px;

  display: grid;
  place-items: center;

  background: #b7ff00;

  color: #050505;

  border-radius: 50%;

  font-size: 9px;

  font-weight: 700;
}


/* ==================================
   PRODUCT INFORMATION
================================== */

.product-information {
  padding: 34px;

  display: flex;

  flex-direction: column;

  justify-content: center;
}

.product-label {
  color: #636363;

  font-size: 8px;

  letter-spacing: 2px;

  margin-bottom: 10px;
}

.product-information h3 {
  margin: 0;

  font-size: 24px;

  font-weight: 400;

  letter-spacing: 1px;

  text-transform: uppercase;
}

.product-price {
  color: #b7ff00;

  font-size: 14px;

  margin: 10px 0 20px;
}

.product-size {
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 9px;
}

.product-size span {
  color: #686868;

  letter-spacing: 1px;
}

.product-size strong {
  width: 31px;
  height: 31px;

  display: grid;
  place-items: center;

  border: 1px solid #333;

  font-size: 9px;
}


/* ==================================
   QUANTITY
================================== */

.quantity-area {
  display: flex;
  align-items: center;
  justify-content: center;

  border-left: 1px solid #1e1e1e;
}

.quantity-controller {
  display: flex;

  align-items: center;

  border: 1px solid #313131;

  height: 44px;
}

.quantity-controller button {
  width: 38px;
  height: 42px;

  border: none;

  background: transparent;

  color: white;

  display: grid;
  place-items: center;

  cursor: pointer;

  transition: 0.25s;
}

.quantity-controller button:hover:not(:disabled) {
  background: #b7ff00;
  color: black;
}

.quantity-controller button:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.quantity-controller span {
  width: 40px;

  text-align: center;

  font-size: 12px;
}


/* ==================================
   ITEM TOTAL
================================== */

.item-total {
  border-left: 1px solid #1e1e1e;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 22px;
}

.item-total strong {
  font-size: 14px;
  font-weight: 500;
}

.remove-button {
  width: 34px;
  height: 34px;

  border: 1px solid #303030;

  border-radius: 50%;

  background: transparent;

  color: #777;

  cursor: pointer;

  display: grid;
  place-items: center;

  transition: 0.3s;
}

.remove-button:hover {
  color: black;

  background: #b7ff00;

  border-color: #b7ff00;
}

.remove-mobile {
  display: none;
}


/* ==================================
   BOTTOM ACTIONS
================================== */

.cart-bottom-actions {
  min-height: 75px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 25px;
}

.cart-bottom-actions button,
.cart-bottom-actions a {
  background: none;
  border: none;

  color: #777;

  text-decoration: none;

  font-size: 9px;

  letter-spacing: 1.3px;

  display: flex;
  align-items: center;

  gap: 8px;

  cursor: pointer;

  transition: 0.3s;
}

.cart-bottom-actions button:hover {
  color: #ff5a5a;
}

.cart-bottom-actions a:hover {
  color: #b7ff00;
}


/* ==================================
   SUMMARY
================================== */

.order-summary {
  border: 1px solid #292929;

  background:
    linear-gradient(
      145deg,
      rgba(16, 16, 16, 0.96),
      rgba(3, 3, 3, 0.98)
    );

  padding: 30px;

  position: sticky;

  top: 150px;
}

.summary-top {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;
}

.summary-top p {
  font-size: 9px;

  letter-spacing: 3px;

  color: #6e6e6e;

  margin: 0 0 8px;
}

.summary-top h2 {
  font-size: 30px;

  font-weight: 400;

  letter-spacing: 1px;

  margin: 0;
}

.summary-top > span {
  width: 42px;
  height: 42px;

  background: #b7ff00;

  color: black;

  border-radius: 50%;

  display: grid;
  place-items: center;

  font-size: 11px;

  font-weight: 700;
}

.summary-line {
  height: 1px;

  background: #292929;

  margin: 28px 0;
}

.summary-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin: 19px 0;

  font-size: 10px;

  letter-spacing: 1px;
}

.summary-row span {
  color: #6e6e6e;
}

.summary-row strong {
  font-size: 12px;

  font-weight: 500;
}

.shipping-free {
  color: #b7ff00;
}


/* ==================================
   SHIPPING PROGRESS
================================== */

.shipping-progress {
  margin: 30px 0 22px;
}

.shipping-progress p {
  color: #717171;

  font-size: 8px;

  letter-spacing: 1px;

  line-height: 1.7;
}

.shipping-progress strong {
  color: #b7ff00;
}

.progress-track {
  height: 2px;

  background: #222;

  margin-top: 13px;
}

.progress-bar {
  height: 100%;

  background: #b7ff00;

  box-shadow:
    0 0 8px rgba(183,255,0,.6);

  transition: width 0.35s ease;
}

.summary-divider {
  height: 1px;

  background: #292929;

  margin: 25px 0;
}


/* ==================================
   TOTAL
================================== */

.summary-total {
  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  margin-bottom: 28px;
}

.summary-total div {
  display: flex;

  flex-direction: column;

  gap: 7px;
}

.summary-total span {
  font-size: 11px;

  letter-spacing: 2px;
}

.summary-total small {
  font-size: 7px;

  letter-spacing: 1px;

  color: #666;
}

.summary-total > strong {
  font-size: 28px;

  font-weight: 400;
}


/* ==================================
   CHECKOUT
================================== */

.checkout-button {
  height: 62px;

  width: 100%;

  padding: 0 8px 0 22px;

  background: #b7ff00;

  color: #050505;

  display: flex;

  justify-content: space-between;

  align-items: center;

  text-decoration: none;

  font-size: 10px;

  letter-spacing: 1px;

  font-weight: 700;

  border-radius: 100px;

  transition: 0.3s;
}

.checkout-button:hover {
  box-shadow:
    0 0 28px rgba(183, 255, 0, 0.27);

  transform: translateY(-2px);
}

.checkout-arrow {
  width: 47px;
  height: 47px;

  border-radius: 50%;

  background: black;

  color: white;

  display: grid;
  place-items: center;
}

.secure-checkout {
  margin: 20px 0;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  color: #555;

  font-size: 8px;

  letter-spacing: 1.5px;
}

.secure-checkout span {
  width: 5px;
  height: 5px;

  background: #b7ff00;

  border-radius: 50%;

  box-shadow:
    0 0 8px #b7ff00;
}

.payment-methods {
  padding-top: 18px;

  border-top: 1px solid #222;

  display: flex;

  justify-content: center;

  flex-wrap: wrap;

  gap: 17px;

  color: #777;

  font-size: 8px;

  font-weight: 700;
}


/* ==================================
   EMPTY CART
================================== */

.empty-cart {
  min-height: 520px;

  border: 1px solid #1f1f1f;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;

  background:
    radial-gradient(
      circle,
      rgba(183,255,0,.06),
      transparent 45%
    );
}

.empty-icon {
  width: 100px;
  height: 100px;

  border: 1px solid #303030;

  border-radius: 50%;

  display: grid;

  place-items: center;

  position: relative;

  margin-bottom: 30px;
}

.empty-icon span {
  position: absolute;

  top: -3px;
  right: 2px;

  width: 26px;
  height: 26px;

  background: #b7ff00;

  color: black;

  display: grid;
  place-items: center;

  border-radius: 50%;

  font-size: 10px;

  font-weight: 700;
}

.empty-small {
  color: #686868;

  font-size: 9px;

  letter-spacing: 4px;
}

.empty-cart h2 {
  margin: 8px 0 20px;

  font-size: clamp(38px, 5vw, 65px);

  line-height: 1;

  font-weight: 400;

  letter-spacing: -2px;
}

.empty-cart h2 span {
  color: #b7ff00;
}

.empty-description {
  color: #777;

  font-size: 12px;

  line-height: 1.8;
}

.shop-button {
  margin-top: 25px;

  height: 58px;

  padding-left: 25px;

  width: 260px;

  border: 1px solid #b7ff00;

  border-radius: 100px;

  color: white;

  text-decoration: none;

  display: flex;

  align-items: center;

  justify-content: space-between;

  font-size: 9px;

  letter-spacing: 1.5px;

  transition: 0.3s;
}

.shop-button div {
  width: 44px;
  height: 44px;

  margin-right: 6px;

  background: #b7ff00;

  color: black;

  border-radius: 50%;

  display: grid;

  place-items: center;
}

.shop-button:hover {
  box-shadow:
    0 0 25px rgba(183,255,0,.25);
}


/* ==================================
   LOADER
================================== */

.ax-cart-loader {
  height: 100vh;

  background: #030303;

  color: white;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  gap: 20px;
}

.ax-cart-loader p {
  font-size: 9px;

  letter-spacing: 4px;

  color: #777;
}

.loader-circle {
  width: 55px;
  height: 55px;

  border: 1px solid #222;

  border-top-color: #b7ff00;

  border-radius: 50%;

  animation: cartSpin 0.8s linear infinite;
}

@keyframes cartSpin {
  to {
    transform: rotate(360deg);
  }
}


/* ==================================
   ERROR
================================== */

.cart-error-page {
  min-height: 100vh;

  background: #030303;

  color: white;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;
}

.cart-error-page svg {
  color: #b7ff00;
}

.cart-error-page p {
  color: #777;
}

.cart-error-page button {
  margin-top: 20px;

  background: #b7ff00;

  border: none;

  padding: 15px 28px;

  cursor: pointer;

  font-weight: 700;
}


/* ==================================
   MOBILE LABEL
================================== */

.mobile-title {
  display: none;
}


/* ==================================
   TABLET
================================== */

@media (max-width: 1050px) {

  .cart-layout {
    grid-template-columns: 1fr;
  }

  .order-summary {
    position: relative;

    top: 0;
  }

}


/* ==================================
   MOBILE
================================== */

@media (max-width: 700px) {

  .cart-page {
    padding:
      125px 15px
      60px;
  }

  .cart-heading {
    align-items: flex-start;

    gap: 25px;

    flex-direction: column;
  }

  .cart-heading h1 {
    letter-spacing: -3px;
  }

  .cart-heading h1 span {
    display: block;

    margin-left: 0;

    margin-top: 5px;
  }

  .products-header {
    display: none;
  }

  .cart-product {
    grid-template-columns:
      115px
      minmax(0, 1fr);

    min-height: 180px;

    padding-bottom: 15px;
  }

  .product-image-wrapper {
    min-height: 165px;
  }

  .product-information {
    padding: 20px;
  }

  .product-information h3 {
    font-size: 18px;
  }

  .quantity-area {
    grid-column: 1 / 2;

    border-left: 0;

    border-top: 1px solid #1e1e1e;

    padding: 15px 5px;

    flex-direction: column;

    gap: 8px;
  }

  .item-total {
    grid-column: 2 / 3;

    border-top: 1px solid #1e1e1e;

    padding: 15px;

    flex-direction: row;

    justify-content: flex-end;
  }

  .mobile-title {
    display: block;

    font-size: 7px;

    letter-spacing: 1px;

    color: #666;

    margin: 0;
  }

  .remove-button {
    display: none;
  }

  .remove-mobile {
    margin-top: 15px;

    border: none;

    padding: 0;

    background: none;

    color: #666;

    display: flex;

    align-items: center;

    gap: 6px;

    font-size: 8px;

    cursor: pointer;
  }

  .cart-bottom-actions {
    padding: 0 15px;
  }

  .order-summary {
    padding: 24px 20px;
  }

  .summary-total > strong {
    font-size: 23px;
  }

}

`;