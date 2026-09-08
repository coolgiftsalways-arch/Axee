import React, { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  Heart,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

import shopHero from "../assets/shop/shophero.png";
import shopEnd from "../assets/shop/shopEnd.jpeg";

import "../styles/shop.css";

/* =========================================================
   PRODUCTS
========================================================= */

const products = [
  /* ================= T-SHIRTS ================= */

  {
    id: 1,
    name: "VOID TEE",
    category: "T-SHIRTS",
    price: 1499,
    image: "/products/tshirt-1.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 2,
    name: "SIGNAL TEE",
    category: "T-SHIRTS",
    price: 1699,
    image: "/products/tshirt-2.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 3,
    name: "ECHO TEE",
    category: "T-SHIRTS",
    price: 1599,
    image: "/products/tshirt-3.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 4,
    name: "UNKNOWN TEE",
    category: "T-SHIRTS",
    price: 1899,
    image: "/products/tshirt-4.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  /* ================= JEANS ================= */

  {
    id: 5,
    name: "SHADOW DENIM",
    category: "JEANS",
    price: 2899,
    image: "/products/jean-1.jpg",
    sizes: ["28", "30", "32", "34"],
    tag: "NEW",
  },

  {
    id: 6,
    name: "VOID DENIM",
    category: "JEANS",
    price: 3199,
    image: "/products/jean-2.jpg",
    sizes: ["28", "30", "32", "34"],
    tag: "NEW",
  },

  {
    id: 7,
    name: "FRACTURE JEAN",
    category: "JEANS",
    price: 3499,
    image: "/products/jean-3.jpg",
    sizes: ["28", "30", "32", "34"],
    tag: "NEW",
  },

  {
    id: 8,
    name: "RAW DENIM 01",
    category: "JEANS",
    price: 2999,
    image: "/products/jean-4.jpg",
    sizes: ["28", "30", "32", "34"],
    tag: "NEW",
  },

  /* ================= TRACK PANTS ================= */

  {
    id: 9,
    name: "MOTION TRACK",
    category: "TRACK PANTS",
    price: 2499,
    image: "/products/track-1.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 10,
    name: "CORE TRACK",
    category: "TRACK PANTS",
    price: 2699,
    image: "/products/track-2.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 11,
    name: "TERMINAL TRACK",
    category: "TRACK PANTS",
    price: 2899,
    image: "/products/track-3.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 12,
    name: "PHANTOM TRACK",
    category: "TRACK PANTS",
    price: 2999,
    image: "/products/track-4.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  /* ================= SHIRTS ================= */

  {
    id: 13,
    name: "SYSTEM SHIRT",
    category: "SHIRTS",
    price: 2199,
    image: "/products/shirt-1.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 14,
    name: "SIGNAL SHIRT",
    category: "SHIRTS",
    price: 2399,
    image: "/products/shirt-2.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 15,
    name: "SHADOW SHIRT",
    category: "SHIRTS",
    price: 2599,
    image: "/products/shirt-3.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 16,
    name: "FRAME SHIRT",
    category: "SHIRTS",
    price: 2299,
    image: "/products/shirt-4.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  /* ================= SHORTS ================= */

  {
    id: 17,
    name: "VOID SHORT",
    category: "SHORTS",
    price: 1799,
    image: "/products/short-1.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 18,
    name: "CARGO SHORT",
    category: "SHORTS",
    price: 1999,
    image: "/products/short-2.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 19,
    name: "MOTION SHORT",
    category: "SHORTS",
    price: 1899,
    image: "/products/short-3.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },

  {
    id: 20,
    name: "UTILITY SHORT",
    category: "SHORTS",
    price: 2199,
    image: "/products/short-4.jpg",
    sizes: ["S", "M", "L", "XL"],
    tag: "NEW",
  },
];

/* =========================================================
   PRODUCT CARD
========================================================= */

function ShopProductCard({
  product,
  selectedSize,
  onSizeChange,
  onAddCart,
  onBuyNow,
}) {
  return (
    <article className="shop-product-card">
      {/* PRODUCT IMAGE */}

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

      {/* PRODUCT DETAILS */}

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
            aria-label={`View ${product.name}`}
          >
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* SIZE LIST */}

        <div className="shop-size-list">
          {product.sizes.map((size) => (
            <button
              type="button"
              key={size}
              className={
                selectedSize === size
                  ? "shop-size active"
                  : "shop-size"
              }
              onClick={() =>
                onSizeChange(
                  product.id,
                  size
                )
              }
            >
              {size}
            </button>
          ))}
        </div>

        {/* PRODUCT BUTTONS */}

        <div className="shop-product-actions">
          <button
            type="button"
            className="shop-add-cart"
            onClick={() =>
              onAddCart(product)
            }
          >
            ADD TO CART
          </button>

          <button
            type="button"
            className="shop-buy-now"
            onClick={() =>
              onBuyNow(product)
            }
          >
            BUY NOW
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   SHOP PAGE
========================================================= */

function Shop() {
  const [sort, setSort] =
    useState("featured");

  const [
    selectedSizes,
    setSelectedSizes,
  ] = useState({});

  /* =========================================================
     SORT PRODUCTS
  ========================================================= */

  const filteredProducts =
    useMemo(() => {
      const result = [...products];

      if (sort === "low") {
        result.sort(
          (a, b) =>
            a.price - b.price
        );
      }

      if (sort === "high") {
        result.sort(
          (a, b) =>
            b.price - a.price
        );
      }

      if (sort === "name") {
        result.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        );
      }

      return result;
    }, [sort]);

  /* =========================================================
     SELECT SIZE
  ========================================================= */

  const selectSize = (
    productId,
    size
  ) => {
    setSelectedSizes(
      (previous) => ({
        ...previous,
        [productId]: size,
      })
    );
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = (product) => {
    const size =
      selectedSizes[product.id];

    if (!size) {
      alert(
        "Please select a size first."
      );

      return;
    }

    const cart =
      JSON.parse(
        localStorage.getItem(
          "axiee-cart"
        )
      ) || [];

    const existingIndex =
      cart.findIndex(
        (item) =>
          item.id === product.id &&
          item.size === size
      );

    if (existingIndex !== -1) {
      cart[
        existingIndex
      ].quantity =
        Number(
          cart[existingIndex]
            .quantity || 1
        ) + 1;
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
      new Event(
        "axiee-cart-updated"
      )
    );
  };

  /* =========================================================
     BUY NOW
  ========================================================= */

  const buyNow = (product) => {
    const size =
      selectedSizes[product.id];

    if (!size) {
      alert(
        "Please select a size first."
      );

      return;
    }

    const checkoutProduct = {
      ...product,
      size,
      quantity: 1,
    };

    localStorage.setItem(
      "axiee-buy-now",
      JSON.stringify(
        checkoutProduct
      )
    );

    window.location.href =
      "/checkout";
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="shop-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="shop-hero">
        <img
          src={shopHero}
          alt="AXIEE Shop The Unknown"
          className="shop-hero-image"
        />

        <div className="shop-hero-overlay" />

        <div className="shop-hero-content">
          <span>
            HOME / SHOP
          </span>

          <h1>
            SHOP

            <small>
              ({products.length})
            </small>
          </h1>

          <h2>
            CLOTHES FOR A HIGHER SELF
          </h2>

          <p>
            WEAR THE UNKNOWN.
            <br />
            A NEW ERA IN MOTION.
          </p>
        </div>

        <div className="shop-hero-side">
          <span>NOT</span>
          <span>JUST</span>
          <span>CLOTHES</span>
          <span>A</span>
          <span>MINDSET</span>
        </div>
      </section>

      {/* =====================================================
          CATEGORY NAVIGATION
      ===================================================== */}

      <section className="shop-category-section">
        <div className="shop-category-scroll">

          {/* ALL */}

          <Link
            to="/shop"
            className="shop-category active"
          >
            <span className="shop-category-number">
              20
            </span>

            <strong>
              ALL
            </strong>
          </Link>

          {/* T-SHIRTS */}

          <Link
            to="/tshirts"
            className="shop-category"
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>
              T-SHIRTS
            </strong>
          </Link>

          {/* JEANS */}

          <Link
            to="/jeans"
            className="shop-category"
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>
              JEANS
            </strong>
          </Link>

          {/* TRACK PANTS */}

          <Link
            to="/track-pants"
            className="shop-category"
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>
              TRACK PANTS
            </strong>
          </Link>

          {/* SHIRTS */}

          <Link
            to="/shirts"
            className="shop-category"
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>
              SHIRTS
            </strong>
          </Link>

          {/* SHORTS */}

          <Link
            to="/shorts"
            className="shop-category"
          >
            <span className="shop-category-number">
              04
            </span>

            <strong>
              SHORTS
            </strong>
          </Link>

        </div>
      </section>

      {/* =====================================================
          PRODUCTS HEADER
      ===================================================== */}

      <section
        className="shop-products-section"
        id="shop-products"
      >
        <div className="shop-products-toolbar">

          <div className="shop-products-count">
            <SlidersHorizontal
              size={15}
            />

            <span>
              {
                filteredProducts.length
              }{" "}
              PRODUCTS
            </span>
          </div>

          <div className="shop-sort">
            <span>
              SORT BY:
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value
                )
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

        {/* ===================================================
            PRODUCT GRID
        =================================================== */}

        <div className="shop-product-grid">
          {filteredProducts.map(
            (product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                selectedSize={
                  selectedSizes[
                    product.id
                  ]
                }
                onSizeChange={
                  selectSize
                }
                onAddCart={
                  addToCart
                }
                onBuyNow={
                  buyNow
                }
              />
            )
          )}
        </div>
      </section>

      {/* =====================================================
          CINEMATIC END BANNER
      ===================================================== */}

      <section className="shop-end-banner">
        <img
          src={shopEnd}
          alt="AXIEE Collection"
        />

        <div className="shop-end-overlay" />

        <div className="shop-end-content">
          <span>
            AXIEE / DROP 01
          </span>

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

          <a href="#shop-products">
            EXPLORE COLLECTION

            <ArrowRight
              size={16}
            />
          </a>
        </div>

        <div className="shop-end-side">
          <span>
            CLOTHES
          </span>

          <span>
            CULTURE
          </span>

          <span>
            BEYOND
          </span>
        </div>
      </section>

      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="shop-benefits">

        <div>
          <span>01</span>

          <strong>
            WORLDWIDE SHIPPING
          </strong>

          <p>
            Fast & reliable delivery
          </p>
        </div>

        <div>
          <span>02</span>

          <strong>
            SECURE PAYMENTS
          </strong>

          <p>
            100% secure checkout
          </p>
        </div>

        <div>
          <span>03</span>

          <strong>
            EASY RETURNS
          </strong>

          <p>
            Hassle-free returns
          </p>
        </div>

        <div>
          <span>04</span>

          <strong>
            PREMIUM QUALITY
          </strong>

          <p>
            Built to last
          </p>
        </div>

      </section>

      {/* =====================================================
          NEWSLETTER
      ===================================================== */}

      <section className="shop-newsletter">

        <div className="shop-newsletter-left">
          <span>
            STAY
            <br />
            IN
            <br />
            THE
            <br />
            LOOP
          </span>
        </div>

        <div className="shop-newsletter-copy">
          <h3>
            JOIN THE MOVEMENT
          </h3>

          <p>
            Sign up for drops,
            exclusive access and
            more.
          </p>
        </div>

        <form
          className="shop-newsletter-form"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <input
            type="email"
            placeholder="Enter your email"
            required
          />

          <button type="submit">
            SUBSCRIBE

            <ArrowRight
              size={15}
            />
          </button>
        </form>

      </section>

    </main>
  );
}

export default Shop;