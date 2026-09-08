import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

import { products } from "../data/products";

import shopHero from "../assets/shop/shophero.png";
import shopEnd from "../assets/shop/shopEnd.jpeg";

import "../styles/shop.css";

function CategoryPage({
  category,
  title,
  subtitle,
  description,
}) {
  const navigate = useNavigate();

  const [sort, setSort] = useState("featured");
  const [selectedSizes, setSelectedSizes] = useState({});

  const categoryProducts = useMemo(() => {
    let result = products.filter(
      (product) => product.category === category
    );

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return result;
  }, [category, sort]);

  const selectSize = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  const addToCart = (product) => {
    const size = selectedSizes[product.id];

    if (!size) {
      alert("Please select a size first.");
      return;
    }

    const cart =
      JSON.parse(localStorage.getItem("axiee-cart")) || [];

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.size === size
    );

    if (existingIndex !== -1) {
      cart[existingIndex].quantity =
        Number(cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({
        ...product,
        size,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "axiee-cart",
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event("axiee-cart-updated")
    );
  };

  const buyNow = (product) => {
    const size = selectedSizes[product.id];

    if (!size) {
      alert("Please select a size first.");
      return;
    }

    const checkoutProduct = {
      ...product,
      size,
      quantity: 1,
    };

    localStorage.setItem(
      "axiee-buy-now",
      JSON.stringify(checkoutProduct)
    );

    navigate("/checkout");
  };

  return (
    <main className="shop-page">
      {/* ================= HERO ================= */}

      <section className="shop-hero">
        <img
          src={shopHero}
          alt={title}
          className="shop-hero-image"
        />

        <div className="shop-hero-overlay" />

        <div className="shop-hero-content">
          <span>HOME / SHOP / {title}</span>

          <h1>
            {title}
            <small>({categoryProducts.length})</small>
          </h1>

          <h2>{subtitle}</h2>

          <p>{description}</p>
        </div>

        <div className="shop-hero-side">
          <span>AXIEE</span>
          <span>WEAR</span>
          <span>THE</span>
          <span>UNKNOWN</span>
        </div>
      </section>

      {/* ================= CATEGORY NAV ================= */}

      <section className="shop-category-section">
        <div className="shop-category-scroll">
          <Link
            to="/shop"
            className="shop-category"
          >
            <span className="shop-category-number">
              20
            </span>

            <strong>ALL</strong>
          </Link>

          <Link
            to="/tshirts"
            className={
              category === "T-SHIRTS"
                ? "shop-category active"
                : "shop-category"
            }
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>T-SHIRTS</strong>
          </Link>

          <Link
            to="/jeans"
            className={
              category === "JEANS"
                ? "shop-category active"
                : "shop-category"
            }
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>JEANS</strong>
          </Link>

          <Link
            to="/track-pants"
            className={
              category === "TRACK PANTS"
                ? "shop-category active"
                : "shop-category"
            }
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>TRACK PANTS</strong>
          </Link>

          <Link
            to="/shirts"
            className={
              category === "SHIRTS"
                ? "shop-category active"
                : "shop-category"
            }
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>SHIRTS</strong>
          </Link>

          <Link
            to="/shorts"
            className={
              category === "SHORTS"
                ? "shop-category active"
                : "shop-category"
            }
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>SHORTS</strong>
          </Link>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}

      <section className="shop-products-section">
        <div className="shop-products-toolbar">
          <div className="shop-products-count">
            <SlidersHorizontal size={15} />

            <span>
              {categoryProducts.length} PRODUCTS
            </span>
          </div>

          <div className="shop-sort">
            <span>SORT BY:</span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="featured">
                FEATURED
              </option>

              <option value="low">
                PRICE: LOW TO HIGH
              </option>

              <option value="high">
                PRICE: HIGH TO LOW
              </option>

              <option value="name">
                NAME
              </option>
            </select>
          </div>
        </div>

        <div className="shop-product-grid">
          {categoryProducts.map((product) => (
            <article
              className="shop-product-card"
              key={product.id}
            >
              <Link
                to={`/product/${product.id}`}
                className="shop-product-image-box"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="shop-product-image"
                />

                <span className="shop-new-tag">
                  {product.tag}
                </span>

                <button
                  type="button"
                  className="shop-heart"
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  aria-label={`Add ${product.name} to wishlist`}
                >
                  <Heart
                    size={16}
                    strokeWidth={1.5}
                  />
                </button>

                <div className="shop-image-fog" />
              </Link>

              <div className="shop-product-content">
                <div className="shop-product-name-row">
                  <div>
                    <h3>{product.name}</h3>

                    <p>
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="shop-product-arrow"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="shop-size-list">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={
                        selectedSizes[product.id] ===
                        size
                          ? "shop-size active"
                          : "shop-size"
                      }
                      onClick={() =>
                        selectSize(
                          product.id,
                          size
                        )
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="shop-product-actions">
                  <button
                    type="button"
                    className="shop-add-cart"
                    onClick={() =>
                      addToCart(product)
                    }
                  >
                    ADD TO CART
                  </button>

                  <button
                    type="button"
                    className="shop-buy-now"
                    onClick={() =>
                      buyNow(product)
                    }
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================= END BANNER ================= */}

      <section className="shop-end-banner">
        <img
          src={shopEnd}
          alt="AXIEE Collection"
        />

        <div className="shop-end-overlay" />

        <div className="shop-end-content">
          <span>AXIEE / {title}</span>

          <h2>
            BEYOND
            <br />
            THE ORDINARY.
          </h2>

          <p>
            NOT JUST CLOTHES.
            <br />
            A MINDSET.
          </p>

          <Link to="/shop">
            EXPLORE ALL
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="shop-end-side">
          <span>CLOTHES</span>
          <span>CULTURE</span>
          <span>BEYOND</span>
        </div>
      </section>
    </main>
  );
}

export default CategoryPage;