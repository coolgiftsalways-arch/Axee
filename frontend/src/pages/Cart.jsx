import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Minus,
  Plus,
  Trash2,
  LockKeyhole,
  ShieldCheck,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";

import "../styles/cart.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Cart() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState("");

  const getCartId = () => localStorage.getItem("axiee-cart-id");

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/api/images/")) {
      const imageId = image.replace("/api/images/", "");
      return `${API_URL}/api/catalog/images/${imageId}`;
    }

    if (image.startsWith("/api/catalog/images/")) {
      return `${API_URL}${image}`;
    }

    if (image.startsWith("/api/")) {
      return `${API_URL}${image}`;
    }

    return image;
  };

  const fetchCart = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      setError("");

      const cartId = getCartId();

      if (!cartId) {
        setCart({ items: [] });
        return;
      }

      const response = await fetch(`${API_URL}/api/cart/${cartId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get cart");
      }

      setCart(data.cart);
    } catch (err) {
      console.error("❌ Cart fetch error:", err);
      setError(err.message || "Failed to get cart");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    const syncCart = (event) => {
      if (event?.detail?.items) {
        setCart(event.detail);
      } else {
        fetchCart({ silent: true });
      }
    };

    window.addEventListener("axiee-cart-updated", syncCart);

    return () => {
      window.removeEventListener("axiee-cart-updated", syncCart);
    };
  }, []);

  useEffect(() => {
    if (loading || error || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cart-hero-eyebrow, .cart-hero-title, .cart-hero-side",
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.09,
          ease: "power4.out",
        },
      );

      gsap.fromTo(
        ".cart-stepbar",
        {
          y: 24,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
          delay: 0.18,
        },
      );

      gsap.fromTo(
        ".cart-item",
        {
          y: 34,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.22,
        },
      );

      gsap.fromTo(
        ".cart-summary",
        {
          x: 40,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power4.out",
          delay: 0.3,
        },
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading, error]);

  const updateQuantity = async (item, amount) => {
    try {
      const cartId = getCartId();

      if (!cartId || !item?._id) return;

      const newQuantity = Math.min(
        10,
        Math.max(1, Number(item.quantity || 1) + amount),
      );

      if (newQuantity === Number(item.quantity)) {
        return;
      }

      setBusyItemId(String(item._id));

      const response = await fetch(
        `${API_URL}/api/cart/${cartId}/item/${item._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update quantity");
      }

      setCart(data.cart);

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data.cart,
        }),
      );
    } catch (err) {
      console.error("❌ Quantity update error:", err);
      setError(err.message || "Failed to update quantity");
    } finally {
      setBusyItemId("");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const cartId = getCartId();

      if (!cartId || !itemId) return;

      setBusyItemId(String(itemId));

      const response = await fetch(
        `${API_URL}/api/cart/${cartId}/item/${itemId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove item");
      }

      setCart(data.cart);

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data.cart,
        }),
      );
    } catch (err) {
      console.error("❌ Remove item error:", err);
      setError(err.message || "Failed to remove item");
    } finally {
      setBusyItemId("");
    }
  };

  const items = cart?.items || [];

  const totalItems = items.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0,
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );

  const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN");

  if (loading) {
    return (
      <main className="cart-page cart-page-state">
        <div className="cart-status">
          <span className="cart-status-eyebrow">AXIEE / BAG SYSTEM</span>

          <div className="cart-loader-mark">
            <span />
            <span />
          </div>

          <h2>BUILDING YOUR BAG</h2>

          <p>Syncing selected pieces...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cart-page cart-page-state">
        <div className="cart-status">
          <span className="cart-status-eyebrow">AXIEE / SYSTEM</span>

          <div className="cart-error-icon">×</div>

          <h2>Unable to load cart</h2>

          <p>{error}</p>

          <button type="button" onClick={() => fetchCart()}>
            TRY AGAIN
          </button>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main ref={pageRef} className="cart-page cart-page-empty">
        <div className="cart-grid-overlay" />
        <div className="cart-ghost-word">EMPTY</div>

        <section className="cart-empty">
          <span className="cart-empty-index">AX / BAG / 00</span>

          <span className="cart-hero-eyebrow">YOUR SELECTION</span>

          <h1 className="cart-hero-title">
            THE BAG
            <br />
            <em>IS QUIET.</em>
          </h1>

          <p>
            Your next AXIEE uniform starts here. Explore the collection and
            build the bag.
          </p>

          <Link to="/shop">
            SHOP COLLECTION
            <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main ref={pageRef} className="cart-page">
      <div className="cart-grid-overlay" />
      <div className="cart-glow cart-glow-a" />
      <div className="cart-glow cart-glow-b" />
      <div className="cart-ghost-word">BAG</div>

      {/* ========================= HERO ========================= */}

      <section className="cart-hero">
        <div className="cart-hero-left">
          <span className="cart-hero-eyebrow">AXIEE / CHECKOUT SYSTEM</span>

          <div className="cart-hero-title-wrap">
            <h1 className="cart-hero-title">
              YOUR
              <br />
              <em>BAG</em>
            </h1>

            <span className="cart-hero-code">COLLECTION / 26</span>
          </div>
        </div>

        <div className="cart-hero-side">
          <span className="cart-hero-side-no">
            {String(totalItems).padStart(2, "0")}
          </span>

          <span className="cart-hero-side-label">
            {totalItems === 1 ? "PIECE" : "PIECES"}
          </span>

          <p>Curated pieces ready for final review.</p>
        </div>
      </section>

      {/* ========================= STEPS ========================= */}

      <section className="cart-stepbar">
        <div className="is-active">
          <span>01</span>
          <strong>BAG</strong>
        </div>

        <div>
          <span>02</span>
          <strong>DETAILS</strong>
        </div>

        <div>
          <span>03</span>
          <strong>PAYMENT</strong>
        </div>

        <div className="cart-stepbar-end">
          <Sparkles size={13} />
          <span>AXIEE SECURE FLOW</span>
        </div>
      </section>

      {/* ========================= MAIN ========================= */}

      <section className="cart-layout">
        <div className="cart-items">
          {items.map((item, index) => {
            const itemBusy = busyItemId === String(item._id);

            return (
              <article
                className={`cart-item ${itemBusy ? "is-busy" : ""}`}
                key={item._id}
              >
                <div className="cart-item-index">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <Link
                  to={`/product/${item.productId}`}
                  className="cart-item-image"
                >
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} />
                  ) : (
                    <div className="cart-image-empty">AXIEE</div>
                  )}

                  <span className="cart-image-tag">
                    VIEW PIECE
                    <ArrowUpRight size={12} />
                  </span>

                  <span className="cart-image-light" />
                </Link>

                <div className="cart-item-content">
                  <div className="cart-item-head">
                    <div>
                      <span className="cart-item-category">
                        {item.category || "AXIEE / COLLECTION"}
                      </span>

                      <Link
                        to={`/product/${item.productId}`}
                        className="cart-product-link"
                      >
                        <h2>{item.name}</h2>
                      </Link>
                    </div>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => removeItem(item._id)}
                      disabled={itemBusy}
                    >
                      <Trash2 size={14} />
                      <span>{itemBusy ? "WORKING" : "REMOVE"}</span>
                    </button>
                  </div>

                  <div className="cart-item-specs">
                    <div>
                      <span>SIZE</span>
                      <strong>{item.size || "—"}</strong>
                    </div>

                    <div>
                      <span>PRICE</span>
                      <strong>₹{formatPrice(item.price)}</strong>
                    </div>

                    <div>
                      <span>STATUS</span>
                      <strong className="is-live">IN BAG</strong>
                    </div>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-quantity-block">
                      <span className="cart-small-label">QUANTITY</span>

                      <div className="cart-quantity">
                        <button
                          type="button"
                          disabled={itemBusy || Number(item.quantity) <= 1}
                          onClick={() => updateQuantity(item, -1)}
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          disabled={itemBusy || Number(item.quantity) >= 10}
                          onClick={() => updateQuantity(item, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="cart-line-total">
                      <span>LINE TOTAL</span>

                      <strong>
                        ₹
                        {formatPrice(
                          Number(item.price || 0) * Number(item.quantity || 1),
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="cart-item-watermark">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <div className="cart-summary-topline" />

          <div className="cart-summary-head">
            <div>
              <span>ORDER SUMMARY</span>
              <h3>FINAL REVIEW</h3>
            </div>

            <span className="cart-summary-id">
              BAG / {String(items.length).padStart(2, "0")}
            </span>
          </div>

          <p className="cart-summary-copy">
            Review the bag before continuing to secure checkout.
          </p>

          <div className="cart-summary-divider" />

          <div className="cart-summary-row">
            <span>PIECES</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="cart-summary-row">
            <span>SUBTOTAL</span>
            <strong>₹{formatPrice(subtotal)}</strong>
          </div>

          <div className="cart-summary-row">
            <span>SHIPPING</span>
            <strong className="cart-free">COMPLIMENTARY</strong>
          </div>

          <div className="cart-summary-total">
            <div>
              <span>TOTAL</span>
              <small>Taxes calculated at checkout</small>
            </div>

            <strong>₹{formatPrice(subtotal)}</strong>
          </div>

          <button
            type="button"
            className="cart-checkout"
            onClick={() => navigate("/checkout")}
          >
            <span>CONTINUE TO CHECKOUT</span>
            <ArrowUpRight size={17} />
          </button>

          <div className="cart-trust-row">
            <div>
              <LockKeyhole size={15} />
              <span>SECURE</span>
            </div>

            <div>
              <ShieldCheck size={15} />
              <span>PROTECTED</span>
            </div>

            <div>
              <PackageCheck size={15} />
              <span>TRACKED</span>
            </div>
          </div>

          <Link to="/shop" className="cart-continue">
            <ArrowLeft size={14} />
            CONTINUE SHOPPING
          </Link>

          <div className="cart-summary-bottom">
            <span>AXIEE / BAG SYSTEM</span>
            <span>2026</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Cart;
