import React, { useMemo, useState } from "react";

import { Search, X, Heart, ArrowRight, SlidersHorizontal } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import products from "../data/products";

import "../styles/shop.css";

/* =========================================================
   SHOP CATEGORIES
========================================================= */

const categories = [
  {
    id: "all",
    label: "ALL",
    value: "ALL",
  },

  {
    id: "tshirts",
    label: "T-SHIRTS",
    value: "T-SHIRTS",
  },

  {
    id: "jeans",
    label: "JEANS",
    value: "JEANS",
  },

  {
    id: "trackpants",
    label: "TRACK PANTS",
    value: "TRACK PANTS",
  },

  {
    id: "shirts",
    label: "SHIRTS",
    value: "SHIRTS",
  },

  {
    id: "shorts",
    label: "SHORTS",
    value: "SHORTS",
  },

  {
    id: "hoodies",
    label: "HOODIES",
    value: "HOODIES",
  },

  {
    id: "coords",
    label: "CO-ORD SETS",
    value: "CO-ORD SETS",
  },

  {
    id: "jackets",
    label: "JACKETS",
    value: "JACKETS",
  },
];

/* =========================================================
   QUICK SEARCH
========================================================= */

const quickSearchItems = [
  "BLACK",
  "WHITE",
  "GREY",
  "RED",
  "BLUE",
  "OVERSIZED",
  "BAGGY",
  "STREETWEAR",
];

/* =========================================================
   SHOP
========================================================= */

function Shop() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("ALL");

  const [sort, setSort] = useState("featured");

  const [selectedSizes, setSelectedSizes] = useState({});

  const [likedProducts, setLikedProducts] = useState({});

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /* CATEGORY */

    if (activeCategory !== "ALL") {
      result = result.filter((product) => product.category === activeCategory);
    }

    /* SEARCH */

    const cleanSearch = search.trim().toLowerCase();

    if (cleanSearch) {
      result = result.filter((product) => {
        const searchableText = [
          product.name,
          product.category,
          product.color,
          ...(product.colors || []),
          product.fit,
          product.style,
          ...(product.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(cleanSearch);
      });
    }

    /* SORT */

    if (sort === "low-high") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "high-low") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeCategory, search, sort]);

  /* =========================================================
     SELECT SIZE
  ========================================================= */

  const selectSize = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,

      [productId]: size,
    }));
  };

  /* =========================================================
     LIKE PRODUCT
  ========================================================= */

  const toggleLike = (productId) => {
    setLikedProducts((previous) => ({
      ...previous,

      [productId]: !previous[productId],
    }));
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = (product) => {
    const selectedSize = selectedSizes[product.id] || product.sizes?.[0];

    if (!selectedSize) {
      alert("Please select a size.");

      return;
    }

    try {
      const currentCart = JSON.parse(localStorage.getItem("axiee-cart")) || [];

      const existingItemIndex = currentCart.findIndex(
        (item) => item.id === product.id && item.size === selectedSize,
      );

      if (existingItemIndex !== -1) {
        currentCart[existingItemIndex].quantity =
          Number(currentCart[existingItemIndex].quantity || 1) + 1;
      } else {
        currentCart.push({
          ...product,

          size: selectedSize,

          quantity: 1,
        });
      }

      localStorage.setItem("axiee-cart", JSON.stringify(currentCart));

      window.dispatchEvent(new Event("axiee-cart-updated"));
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  /* =========================================================
     BUY NOW
  ========================================================= */

  const buyNow = (product) => {
    const selectedSize = selectedSizes[product.id] || product.sizes?.[0];

    if (!selectedSize) {
      alert("Please select a size.");

      return;
    }

    const buyNowProduct = {
      ...product,

      size: selectedSize,

      quantity: 1,
    };

    localStorage.setItem("axiee-buy-now", JSON.stringify(buyNowProduct));

    navigate("/checkout");
  };

  /* =========================================================
     PRODUCT URL
  ========================================================= */

  const productUrl = (product) => {
    return `/product/${product.id}`;
  };

  return (
    <main className="shop-page">
      {/* =====================================================
          SHOP HERO
      ===================================================== */}

      <section className="category-text-hero">
        <div className="category-grid-bg"></div>

        <div className="category-glow category-glow-one"></div>

        <div className="category-glow category-glow-two"></div>

        {/* LEFT */}

        <div className="category-text-content">
          <span className="category-breadcrumb">
            AXIEE / SHOP / ALL COLLECTIONS
          </span>

          <div className="category-title-row">
            <h1>SHOP</h1>

            <span className="category-product-number">
              {String(products.length).padStart(2, "0")}
            </span>
          </div>

          <h2>THE COMPLETE SYSTEM</h2>

          <p>
            CLOTHING FOR THE UNKNOWN.
            <br />
            BUILT BEYOND CONVENTION.
          </p>
        </div>

        {/* RIGHT TECHNICAL ART */}

        <div className="category-visual">
          <svg
            className="category-orbit-svg"
            viewBox="0 0 700 430"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="350"
              cy="215"
              r="145"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.32"
            />

            <circle
              cx="350"
              cy="215"
              r="105"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.18"
            />

            <ellipse
              cx="350"
              cy="215"
              rx="250"
              ry="92"
              stroke="currentColor"
              opacity="0.28"
            />

            <ellipse
              cx="350"
              cy="215"
              rx="250"
              ry="92"
              transform="rotate(55 350 215)"
              stroke="currentColor"
              opacity="0.2"
            />

            <ellipse
              cx="350"
              cy="215"
              rx="250"
              ry="92"
              transform="rotate(-55 350 215)"
              stroke="currentColor"
              opacity="0.2"
            />

            <line
              x1="75"
              y1="215"
              x2="625"
              y2="215"
              stroke="currentColor"
              opacity="0.15"
            />

            <line
              x1="350"
              y1="20"
              x2="350"
              y2="410"
              stroke="currentColor"
              opacity="0.15"
            />

            <circle cx="350" cy="215" r="8" fill="currentColor" />

            <circle cx="523" cy="215" r="4" fill="currentColor" />
          </svg>

          <div className="category-side-copy category-side-copy-one">
            <span>AXIEE</span>

            <span>FORM</span>

            <span>SYSTEM</span>
          </div>

          <div className="category-side-copy category-side-copy-two">
            <span>COLLECTION</span>

            <span>08 / SERIES</span>
          </div>

          <span className="category-coordinate top">19°04'26"N</span>

          <span className="category-coordinate bottom">72°52'18"E</span>
        </div>

        {/* BOTTOM */}

        <div className="category-hero-bottom">
          <span>AXIEE © 2026</span>

          <span>CLOTHES / CULTURE / BEYOND</span>
        </div>
      </section>

      {/* =====================================================
          GLOBAL SEARCH
      ===================================================== */}

      <section className="category-global-search">
        <div className="category-global-search-top">
          <span>SEARCH COLLECTION</span>

          <small>{filteredProducts.length} RESULTS</small>
        </div>

        <div className="category-global-search-box">
          <Search
            className="category-global-search-icon"
            size={20}
            strokeWidth={1.4}
          />

          <input
            type="text"
            value={search}
            placeholder="SEARCH BLACK JEANS, WHITE HOODIE, OVERSIZED..."
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="category-search-clear"
              onClick={() => setSearch("")}
            >
              <span>CLEAR</span>

              <X size={15} strokeWidth={1.4} />
            </button>
          )}
        </div>

        {/* QUICK SEARCH */}

        <div className="category-quick-search">
          <span className="category-quick-title">QUICK SEARCH</span>

          {quickSearchItems.map((item) => (
            <button
              type="button"
              key={item}
              className={search.toUpperCase() === item ? "active" : ""}
              onClick={() => setSearch(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section className="shop-products-section">
        {/* =================================================
            CATEGORY FILTER
        ================================================= */}

        <div className="shop-category-filter">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={activeCategory === category.value ? "active" : ""}
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="shop-products-toolbar">
          <div className="shop-products-count">
            <SlidersHorizontal size={14} strokeWidth={1.4} />

            <span>
              {String(filteredProducts.length).padStart(2, "0")} PRODUCTS
            </span>
          </div>

          <div className="shop-sort">
            <span>SORT BY:</span>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">FEATURED</option>

              <option value="low-high">PRICE LOW → HIGH</option>

              <option value="high-low">PRICE HIGH → LOW</option>

              <option value="name">NAME A → Z</option>
            </select>
          </div>
        </div>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        <div className="shop-product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <article key={product.id} className="shop-product-card">
                {/* IMAGE */}

                <Link
                  to={productUrl(product)}
                  className="shop-product-image-box"
                >
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    className="shop-product-image"
                  />

                  <div className="shop-image-fog"></div>

                  {product.isNew !== false && (
                    <span className="shop-new-tag">NEW</span>
                  )}
                </Link>

                {/* HEART */}

                <button
                  type="button"
                  className="shop-heart"
                  aria-label="Wishlist"
                  onClick={() => toggleLike(product.id)}
                >
                  <Heart
                    size={16}
                    strokeWidth={1.4}
                    fill={likedProducts[product.id] ? "currentColor" : "none"}
                  />
                </button>

                {/* CONTENT */}

                <div className="shop-product-content">
                  <div className="shop-product-name-row">
                    <div>
                      <h3>{product.name}</h3>

                      <p>₹{Number(product.price).toLocaleString("en-IN")}</p>
                    </div>

                    <Link
                      to={productUrl(product)}
                      className="shop-product-arrow"
                    >
                      <ArrowRight size={14} strokeWidth={1.4} />
                    </Link>
                  </div>

                  {/* PRODUCT META */}

                  <div className="category-product-meta">
                    <span>{product.color || product.category}</span>

                    <strong>{product.fit || product.style || "AXIEE"}</strong>
                  </div>

                  {/* SIZE */}

                  <div className="shop-size-list">
                    {product.sizes?.map((size) => (
                      <button
                        type="button"
                        key={size}
                        className={
                          selectedSizes[product.id] === size
                            ? "shop-size active"
                            : "shop-size"
                        }
                        onClick={() => selectSize(product.id, size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {/* ACTIONS */}

                  <div className="shop-product-actions">
                    <button
                      type="button"
                      className="shop-add-cart"
                      onClick={() => addToCart(product)}
                    >
                      ADD TO CART
                    </button>

                    <button
                      type="button"
                      className="shop-buy-now"
                      onClick={() => buyNow(product)}
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="category-no-results">
              <span>00 / NO RESULTS</span>

              <h3>NOTHING FOUND.</h3>

              <p>TRY ANOTHER SEARCH OR CATEGORY.</p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");

                  setActiveCategory("ALL");
                }}
              >
                RESET SEARCH
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Shop;
