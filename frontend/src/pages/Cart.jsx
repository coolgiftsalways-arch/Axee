import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";

import "../styles/cart.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET CART ID
  // =====================================================

  const getCartId = () => {
    return localStorage.getItem("axiee-cart-id");
  };

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    // Already complete URL
    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    // Old GridFS format:
    // /api/images/IMAGE_ID
    if (image.startsWith("/api/images/")) {
      const imageId = image.replace("/api/images/", "");

      return `${API_URL}/api/catalog/images/${imageId}`;
    }

    // New format
    if (image.startsWith("/api/catalog/images/")) {
      return `${API_URL}${image}`;
    }

    return image;
  };

  // =====================================================
  // FETCH CART
  // =====================================================

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const cartId = getCartId();

      // User hasn't added anything yet
      if (!cartId) {
        setCart({
          items: [],
        });

        return;
      }

      const response = await fetch(
        `${API_URL}/api/cart/${cartId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get cart"
        );
      }

      setCart(data.cart);
    } catch (err) {
      console.error("❌ Cart fetch error:", err);

      setError(err.message || "Failed to get cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = async (item, amount) => {
    try {
      const cartId = getCartId();

      if (!cartId) {
        return;
      }

      const newQuantity = Math.min(
        10,
        Math.max(1, Number(item.quantity) + amount)
      );

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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update quantity"
        );
      }

      setCart(data.cart);

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data.cart,
        })
      );
    } catch (error) {
      console.error(
        "❌ Quantity update error:",
        error
      );
    }
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = async (itemId) => {
    try {
      const cartId = getCartId();

      if (!cartId) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/cart/${cartId}/item/${itemId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove item"
        );
      }

      setCart(data.cart);

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data.cart,
        })
      );
    } catch (error) {
      console.error(
        "❌ Remove item error:",
        error
      );
    }
  };

  // =====================================================
  // TOTALS
  // =====================================================

  const items = cart?.items || [];

  const totalItems = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 1),
    0
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-status">
          <h2>LOADING CART...</h2>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="cart-page">
        <div className="cart-status">
          <div className="cart-error-icon">×</div>

          <h2>Unable to load cart</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchCart}
          >
            TRY AGAIN
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <span>AXIEE / CART</span>

          <h1>
            YOUR CART
            <br />
            IS EMPTY
          </h1>

          <p>
            Add something from the collection.
          </p>

          <Link to="/shop">
            CONTINUE SHOPPING
          </Link>
        </section>
      </main>
    );
  }

  // =====================================================
  // CART
  // =====================================================

  return (
    <main className="cart-page">
      <section className="cart-header">
        <div>
          <span>AXIEE / SHOPPING BAG</span>

          <h1>CART</h1>
        </div>

        <div className="cart-header-count">
          {totalItems} ITEMS
        </div>
      </section>

      <section className="cart-layout">
        {/* LEFT SIDE */}

        <div className="cart-items">
          {items.map((item, index) => (
            <article
              className="cart-item"
              key={item._id}
            >
              <div className="cart-item-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="cart-item-image">
                {item.image ? (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                  />
                ) : (
                  <div className="cart-image-empty">
                    AXIEE
                  </div>
                )}
              </div>

              <div className="cart-item-info">
                <div className="cart-item-top">
                  <div>
                    <span className="cart-item-category">
                      TRACK PANTS
                    </span>

                    <h2>{item.name}</h2>
                  </div>

                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() =>
                      removeItem(item._id)
                    }
                  >
                    <Trash2 size={16} />

                    <span>REMOVE</span>
                  </button>
                </div>

                <div className="cart-item-details">
                  <div>
                    <span>SIZE</span>

                    <strong>{item.size}</strong>
                  </div>

                  <div>
                    <span>PRICE</span>

                    <strong>
                      ₹
                      {Number(
                        item.price || 0
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="cart-item-bottom">
                  <div className="cart-quantity">
                    <button
                      type="button"
                      disabled={
                        Number(item.quantity) <= 1
                      }
                      onClick={() =>
                        updateQuantity(item, -1)
                      }
                    >
                      <Minus size={15} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      disabled={
                        Number(item.quantity) >= 10
                      }
                      onClick={() =>
                        updateQuantity(item, 1)
                      }
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <strong className="cart-item-total">
                    ₹
                    {(
                      Number(item.price || 0) *
                      Number(item.quantity || 1)
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* RIGHT SIDE */}

        <aside className="cart-summary">
          <span className="cart-summary-label">
            ORDER SUMMARY
          </span>

          <div className="cart-summary-row">
            <span>ITEMS</span>

            <strong>{totalItems}</strong>
          </div>

          <div className="cart-summary-row">
            <span>SUBTOTAL</span>

            <strong>
              ₹{subtotal.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="cart-summary-row">
            <span>SHIPPING</span>

            <strong>FREE</strong>
          </div>

          <div className="cart-summary-total">
            <span>TOTAL</span>

            <strong>
              ₹{subtotal.toLocaleString("en-IN")}
            </strong>
          </div>

          <button
            type="button"
            className="cart-checkout"
            onClick={() => navigate("/checkout")}
          >
            CHECKOUT
          </button>

          <Link
            to="/shop"
            className="cart-continue"
          >
            <ArrowLeft size={14} />

            CONTINUE SHOPPING
          </Link>
        </aside>
      </section>
    </main>
  );
}

export default Cart;