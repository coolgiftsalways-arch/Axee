import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowRight, SlidersHorizontal, Search, X } from "lucide-react";

import { products } from "../data/products";
import "../styles/shop.css";

/* =========================================================
   CATEGORY VISUAL
========================================================= */

function CategoryVisual({ type }) {
  /* =======================================================
     T-SHIRTS VISUAL
  ======================================================= */

  if (type === "tshirts") {
    return (
      <div className="category-visual category-visual-tshirts">
        <svg
          className="category-tshirt-svg"
          viewBox="0 0 700 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="
              M265 75
              L320 45
              L380 45
              L435 75
              L515 120
              L470 205
              L430 182
              L430 350
              L270 350
              L270 182
              L230 205
              L185 120
              Z
            "
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.35"
          />

          <path
            d="
              M320 45
              C325 88
              375 88
              380 45
            "
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.22"
          />

          <path
            d="M270 182H430"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.08"
          />

          <path
            d="M350 70V350"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.08"
          />

          <circle
            cx="350"
            cy="210"
            r="82"
            stroke="currentColor"
            opacity="0.12"
          />

          <circle cx="350" cy="210" r="5" fill="currentColor" />

          <path d="M165 70H240" stroke="currentColor" opacity="0.25" />

          <path d="M460 340H545" stroke="currentColor" opacity="0.25" />

          <path d="M165 70V120" stroke="currentColor" opacity="0.25" />

          <path d="M545 290V340" stroke="currentColor" opacity="0.25" />
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>FORM</span>
          <span>COTTON</span>
          <span>STRUCTURE</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>01 / 06</span>
          <span>ESSENTIAL</span>
          <span>TEE SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / TS / 001</span>

        <span className="category-coordinate bottom">GARMENT STUDY / 2026</span>
      </div>
    );
  }

  /* =======================================================
     SHIRTS VISUAL
  ======================================================= */

  if (type === "shirts") {
    return (
      <div className="category-visual category-visual-shirts">
        <svg
          className="category-shirt-svg"
          viewBox="0 0 700 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="235"
            y="90"
            width="230"
            height="245"
            stroke="currentColor"
            opacity="0.2"
          />

          <path
            d="M235 90L310 50H390L465 90"
            stroke="currentColor"
            opacity="0.35"
          />

          <path
            d="M310 50L350 110L390 50"
            stroke="currentColor"
            opacity="0.28"
          />

          <path d="M350 110V335" stroke="currentColor" opacity="0.18" />

          <circle cx="350" cy="145" r="3" fill="currentColor" />

          <circle cx="350" cy="190" r="3" fill="currentColor" />

          <circle cx="350" cy="235" r="3" fill="currentColor" />

          <path d="M170 130H225" stroke="currentColor" opacity="0.2" />

          <path d="M475 290H540" stroke="currentColor" opacity="0.2" />
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>TAILORED</span>
          <span>STRUCTURE</span>
          <span>FORM</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>02 / 06</span>
          <span>REFINED</span>
          <span>SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / SH / 002</span>

        <span className="category-coordinate bottom">
          STRUCTURE STUDY / 2026
        </span>
      </div>
    );
  }

  /* =======================================================
     HOODIES VISUAL
  ======================================================= */

  if (type === "hoodies") {
    return (
      <div className="category-visual category-visual-hoodies">
        <svg
          className="category-hoodie-svg"
          viewBox="0 0 700 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="350"
            cy="255"
            r="175"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
          />

          <circle
            cx="350"
            cy="255"
            r="120"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
            strokeDasharray="5 9"
          />

          {/* HOOD */}

          <path
            d="
              M285 145
              C300 95 330 75 350 75
              C370 75 400 95 415 145
              L390 175
              C378 145 365 130 350 130
              C335 130 322 145 310 175
              Z
            "
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="
              M310 145
              C322 112 338 98 350 98
              C362 98 378 112 390 145
            "
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="5 6"
          />

          {/* BODY */}

          <path
            d="
              M310 165
              L255 190
              L205 285
              L245 305
              L280 255
              L270 430
              L430 430
              L420 255
              L455 305
              L495 285
              L445 190
              L390 165
            "
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="M310 165L350 190L390 165"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          <line
            x1="350"
            y1="190"
            x2="350"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="5 6"
          />

          {/* POCKET */}

          <path
            d="
              M300 335
              L400 335
              L420 390
              L280 390
              Z
            "
            stroke="currentColor"
            strokeOpacity="0.7"
            strokeWidth="1"
          />

          <path
            d="M300 335L350 365L400 335"
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="1"
          />

          {/* CUFFS */}

          <line
            x1="205"
            y1="285"
            x2="245"
            y2="305"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.65"
          />

          <line
            x1="455"
            y1="305"
            x2="495"
            y2="285"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.65"
          />

          {/* BOTTOM */}

          <line
            x1="270"
            y1="430"
            x2="430"
            y2="430"
            stroke="currentColor"
            strokeWidth="5"
            strokeOpacity="0.65"
          />

          {/* DRAW STRINGS */}

          <line
            x1="338"
            y1="158"
            x2="330"
            y2="225"
            stroke="currentColor"
            strokeOpacity="0.8"
            strokeWidth="1"
          />

          <line
            x1="362"
            y1="158"
            x2="370"
            y2="225"
            stroke="currentColor"
            strokeOpacity="0.8"
            strokeWidth="1"
          />

          <circle cx="330" cy="228" r="3" fill="currentColor" />

          <circle cx="370" cy="228" r="3" fill="currentColor" />

          {/* MEASURE */}

          <line
            x1="180"
            y1="150"
            x2="180"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <line
            x1="165"
            y1="150"
            x2="195"
            y2="150"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <line
            x1="165"
            y1="430"
            x2="195"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <text
            x="158"
            y="300"
            fill="currentColor"
            fillOpacity="0.3"
            fontSize="9"
            letterSpacing="3"
            transform="rotate(-90 158 300)"
          >
            BODY LENGTH
          </text>

          {/* TECH COPY */}

          <line
            x1="460"
            y1="170"
            x2="510"
            y2="170"
            stroke="currentColor"
            strokeOpacity="0.25"
          />

          <text
            x="525"
            y="165"
            fill="currentColor"
            fillOpacity="0.7"
            fontSize="9"
            letterSpacing="3"
          >
            HOOD
          </text>

          <text
            x="525"
            y="190"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="8"
            letterSpacing="2"
          >
            STRUCTURE
          </text>

          <text
            x="525"
            y="215"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="8"
            letterSpacing="2"
          >
            LAYER
          </text>

          <text
            x="520"
            y="330"
            fill="currentColor"
            fillOpacity="0.18"
            fontSize="48"
            fontFamily="serif"
          >
            06
          </text>

          <text
            x="520"
            y="355"
            fill="currentColor"
            fillOpacity="0.4"
            fontSize="8"
            letterSpacing="2"
          >
            LAYER SYSTEM
          </text>

          <text
            x="235"
            y="485"
            fill="currentColor"
            fillOpacity="0.3"
            fontSize="8"
            letterSpacing="3"
          >
            AX / HD / 006
          </text>

          <text
            x="420"
            y="485"
            fill="currentColor"
            fillOpacity="0.18"
            fontSize="8"
            letterSpacing="2"
          >
            GARMENT STUDY / 2026
          </text>
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>PROTECT</span>
          <span>LAYER</span>
          <span>FORM</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>06 / 06</span>
          <span>HOODED</span>
          <span>SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / HD / 006</span>

        <span className="category-coordinate bottom">LAYER STUDY / 2026</span>
      </div>
    );
  }

  /* =======================================================
     DEFAULT VISUAL
  ======================================================= */

  return (
    <div className="category-visual">
      <svg
        className="category-orbit-svg"
        viewBox="0 0 700 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="390"
          cy="210"
          r="135"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.18"
        />

        <circle
          cx="390"
          cy="210"
          r="88"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.1"
        />

        <ellipse
          cx="390"
          cy="210"
          rx="240"
          ry="72"
          transform="rotate(-17 390 210)"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        <ellipse
          cx="390"
          cy="210"
          rx="185"
          ry="45"
          transform="rotate(24 390 210)"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.14"
        />

        <circle cx="519" cy="163" r="5" fill="currentColor" />
      </svg>
    </div>
  );
}

/* =========================================================
   CATEGORY PAGE
========================================================= */

function CategoryPage({
  category,
  title,
  subtitle,
  description,
  visualType = "default",
}) {
  const navigate = useNavigate();

  const [sort, setSort] = useState("featured");

  const [search, setSearch] = useState("");

  const [selectedSizes, setSelectedSizes] = useState({});

  /* =======================================================
     QUICK SEARCH FOR EVERY CATEGORY
  ======================================================= */

  const quickSearchOptions = {
    "T-SHIRTS": ["WHITE", "BLACK", "RED", "OVERSIZED", "GRAPHIC"],

    SHIRTS: ["WHITE", "BLACK", "BLUE", "OVERSIZED", "FORMAL"],

    HOODIES: ["WHITE", "BLACK", "RED", "GREY", "OVERSIZED"],

    JEANS: ["BLACK", "BLUE", "GREY", "BAGGY", "STRAIGHT"],

    "TRACK PANTS": ["BLACK", "GREY", "WHITE", "BAGGY", "RELAXED"],

    SHORTS: ["BLACK", "GREY", "CARGO", "OVERSIZED", "UTILITY"],
  };

  const quickSearch = quickSearchOptions[category] || ["BLACK", "WHITE", "NEW"];

  /* =======================================================
     SEARCH PLACEHOLDER
  ======================================================= */

  const getSearchPlaceholder = () => {
    if (category === "T-SHIRTS") {
      return "SEARCH WHITE T-SHIRT, BLACK T-SHIRT, OVERSIZED...";
    }

    if (category === "SHIRTS") {
      return "SEARCH WHITE SHIRT, BLACK SHIRT, BLUE...";
    }

    if (category === "HOODIES") {
      return "SEARCH WHITE HOODIE, RED HOODIE, BLACK...";
    }

    if (category === "JEANS") {
      return "SEARCH BLACK JEANS, BLUE JEANS, BAGGY...";
    }

    if (category === "TRACK PANTS") {
      return "SEARCH BLACK TRACK PANTS, GREY, BAGGY...";
    }

    if (category === "SHORTS") {
      return "SEARCH BLACK SHORTS, CARGO, UTILITY...";
    }

    return `SEARCH ${title}...`;
  };

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const categoryProducts = useMemo(() => {
    let result = products.filter((product) => product.category === category);

    /* SEARCH */

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      const searchWords = searchValue.split(/\s+/);

      result = result.filter((product) => {
        const searchableText = [
          product.name,
          product.category,
          product.color,
          product.fit,
          product.style,
          product.tag,
          product.description,

          ...(product.colors || []),
          ...(product.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchWords.every((word) => searchableText.includes(word));
      });
    }

    /* IMPORTANT:
       Copy array before sort
    */

    result = [...result];

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [category, sort, search]);

  /* =======================================================
     TOTAL CATEGORY PRODUCTS
  ======================================================= */

  const totalCategoryProducts = useMemo(() => {
    return products.filter((product) => product.category === category).length;
  }, [category]);

  /* =======================================================
     SELECT SIZE
  ======================================================= */

  const selectSize = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,

      [productId]: size,
    }));
  };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = (product) => {
    const size = selectedSizes[product.id];

    if (!size) {
      alert("Please select a size first.");

      return;
    }

    const cart = JSON.parse(localStorage.getItem("axiee-cart")) || [];

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.size === size,
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

    localStorage.setItem("axiee-cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("axiee-cart-updated"));
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

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

    localStorage.setItem("axiee-buy-now", JSON.stringify(checkoutProduct));

    navigate("/checkout");
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="shop-page">
      {/* ===================================================
          CATEGORY HERO
      =================================================== */}

      <section className="category-text-hero">
        <div className="category-grid-bg" />

        <div className="category-glow category-glow-one" />

        <div className="category-glow category-glow-two" />

        <div className="category-text-content">
          <span className="category-breadcrumb">HOME / SHOP / {title}</span>

          <div className="category-title-row">
            <h1>{title}</h1>

            <span className="category-product-number">
              ({totalCategoryProducts})
            </span>
          </div>

          <h2>{subtitle}</h2>

          <p>{description}</p>
        </div>

        <CategoryVisual type={visualType} />

        <div className="category-hero-bottom">
          <span>AXIEE / CATEGORY</span>

          <span>FORM FOLLOWS MOVEMENT</span>
        </div>
      </section>

      {/* ===================================================
          PRODUCTS
      =================================================== */}

      <section className="shop-products-section">
        {/* =================================================
            PRODUCTS TOOLBAR
        ================================================= */}

        <div className="shop-products-toolbar">
          <div className="shop-products-count">
            <SlidersHorizontal size={15} />

            <span>{categoryProducts.length} PRODUCTS</span>
          </div>

          <div className="shop-sort">
            <span>SORT BY:</span>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">FEATURED</option>

              <option value="low">PRICE: LOW TO HIGH</option>

              <option value="high">PRICE: HIGH TO LOW</option>

              <option value="name">NAME</option>
            </select>
          </div>
        </div>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <div className="category-global-search">
          <div className="category-global-search-top">
            <span>01 / SEARCH</span>

            <small>FIND YOUR STYLE</small>
          </div>

          <div className="category-global-search-box">
            <Search
              size={20}
              strokeWidth={1.3}
              className="category-global-search-icon"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={getSearchPlaceholder()}
              aria-label={`Search ${title}`}
            />

            {search && (
              <button
                type="button"
                className="category-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={13} strokeWidth={1.4} />

                <span>CLEAR</span>
              </button>
            )}
          </div>

          {/* ===============================================
              QUICK SEARCH
          =============================================== */}

          <div className="category-quick-search">
            <span className="category-quick-title">QUICK SEARCH</span>

            {quickSearch.map((option) => (
              <button
                type="button"
                key={option}
                className={
                  search.toLowerCase() === option.toLowerCase() ? "active" : ""
                }
                onClick={() => setSearch(option.toLowerCase())}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        <div className="shop-product-grid">
          {/* ===============================================
              NO RESULTS
          =============================================== */}

          {categoryProducts.length === 0 && (
            <div className="category-no-results">
              <span>NO RESULTS</span>

              <h3>
                NOTHING FOUND
                <br />
                FOR "{search}"
              </h3>

              <p>TRY ANOTHER COLOUR, STYLE OR PRODUCT NAME</p>

              <button type="button" onClick={() => setSearch("")}>
                CLEAR SEARCH
              </button>
            </div>
          )}

          {/* ===============================================
              PRODUCTS
          =============================================== */}

          {categoryProducts.map((product) => (
            <article className="shop-product-card" key={product.id}>
              {/* IMAGE */}

              <Link
                to={`/product/${product.id}`}
                className="shop-product-image-box"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="shop-product-image"
                />

                {product.tag && (
                  <span className="shop-new-tag">{product.tag}</span>
                )}

                <button
                  type="button"
                  className="shop-heart"
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  aria-label={`Add ${product.name} to wishlist`}
                >
                  <Heart size={16} strokeWidth={1.5} />
                </button>

                <div className="shop-image-fog" />
              </Link>

              {/* CONTENT */}

              <div className="shop-product-content">
                <div className="shop-product-name-row">
                  <div>
                    <h3>{product.name}</h3>

                    <p>₹{product.price.toLocaleString("en-IN")}</p>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="shop-product-arrow"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* PRODUCT COLOUR */}

                {product.color && (
                  <div className="category-product-meta">
                    <span>COLOUR</span>

                    <strong>{product.color}</strong>
                  </div>
                )}

                {/* SIZES */}

                <div className="shop-size-list">
                  {product.sizes.map((size) => (
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

                {/* BUTTONS */}

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
          ))}
        </div>
      </section>
    </main>
  );
}

export default CategoryPage;
