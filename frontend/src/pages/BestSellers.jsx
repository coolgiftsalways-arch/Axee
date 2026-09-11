import React, { useMemo, useState } from "react";

import {
  ArrowRight,
  Heart,
  Star,
  ShoppingBag,
  Users,
  Globe2,
  Flame,
  TrendingUp,
  MapPin,
  Tag,
  ChevronDown,
} from "lucide-react";

import "../styles/bestSellers.css";

import Best from "../assets/Bestseller/bestseller.png";

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  "ALL CATEGORIES",
  "T-SHIRTS",
  "JEANS",
  "TRACK PANTS",
  "SHIRTS",
  "SHORTS",
  "HOODIES",
  "CO-ORD SETS",
  "JACKETS",
];

/* =========================================================
   ALL CATEGORY FIXED ORDER

   THIS IS THE ORDER THAT WILL ALWAYS SHOW
   WHEN "ALL CATEGORIES" IS SELECTED
========================================================= */

const allCategoryOrder = [
  "HOODIES",
  "T-SHIRTS",
  "JEANS",
  "JACKETS",
  "TRACK PANTS",
  "SHIRTS",
  "SHORTS",
  "CO-ORD SETS",
];

/* =========================================================
   PRODUCT CREATOR
========================================================= */

const createProduct = ({
  id,
  rank,
  name,
  category,
  image,
  price,
  oldPrice,
  rating,
  reviews,
  sold,
  minutes,
}) => {
  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

  return {
    id,
    rank,
    name,
    category,
    image,
    price,
    oldPrice,
    rating,
    reviews,
    sold,
    minutes,
    discount: `${discount}% OFF`,
  };
};

/* =========================================================
   T-SHIRTS
========================================================= */

const tshirts = [
  {
    name: "VOID TEE",
    price: 1499,
    oldPrice: 2199,
    rating: 4.9,
    reviews: "12.4K",
    sold: 18920,
  },
  {
    name: "SIGNAL TEE",
    price: 1699,
    oldPrice: 2399,
    rating: 4.8,
    reviews: "10.8K",
    sold: 17340,
  },
  {
    name: "ECHO TEE",
    price: 1599,
    oldPrice: 2299,
    rating: 4.8,
    reviews: "9.7K",
    sold: 15890,
  },
  {
    name: "UNKNOWN TEE",
    price: 1899,
    oldPrice: 2699,
    rating: 4.7,
    reviews: "8.9K",
    sold: 14250,
  },
  {
    name: "SYSTEM TEE",
    price: 1799,
    oldPrice: 2499,
    rating: 4.7,
    reviews: "7.8K",
    sold: 13100,
  },
  {
    name: "FRAME TEE",
    price: 1699,
    oldPrice: 2399,
    rating: 4.6,
    reviews: "6.9K",
    sold: 11940,
  },
  {
    name: "STATIC TEE",
    price: 1999,
    oldPrice: 2799,
    rating: 4.6,
    reviews: "5.8K",
    sold: 10860,
  },
  {
    name: "CORE TEE",
    price: 1599,
    oldPrice: 2199,
    rating: 4.5,
    reviews: "4.9K",
    sold: 9760,
  },
];

/* =========================================================
   JEANS
========================================================= */

const jeans = [
  {
    name: "SHADOW DENIM",
    price: 2899,
    oldPrice: 3999,
    rating: 4.9,
    reviews: "11.8K",
    sold: 17850,
  },
  {
    name: "VOID DENIM",
    price: 3199,
    oldPrice: 4499,
    rating: 4.8,
    reviews: "10.2K",
    sold: 16290,
  },
  {
    name: "FRACTURE JEAN",
    price: 3499,
    oldPrice: 4799,
    rating: 4.8,
    reviews: "9.4K",
    sold: 15140,
  },
  {
    name: "RAW DENIM 01",
    price: 2999,
    oldPrice: 4199,
    rating: 4.7,
    reviews: "8.7K",
    sold: 13990,
  },
  {
    name: "BAGGY DENIM",
    price: 3299,
    oldPrice: 4599,
    rating: 4.7,
    reviews: "7.7K",
    sold: 12870,
  },
  {
    name: "DISTRESSED DENIM",
    price: 3599,
    oldPrice: 4999,
    rating: 4.6,
    reviews: "6.8K",
    sold: 11680,
  },
  {
    name: "RELAXED JEAN",
    price: 3099,
    oldPrice: 4299,
    rating: 4.6,
    reviews: "5.6K",
    sold: 10290,
  },
  {
    name: "WIDE LEG DENIM",
    price: 3399,
    oldPrice: 4699,
    rating: 4.5,
    reviews: "4.8K",
    sold: 9340,
  },
];

/* =========================================================
   TRACK PANTS
========================================================= */

const tracks = [
  {
    name: "MOTION TRACK",
    price: 2499,
    oldPrice: 3499,
    rating: 4.9,
    reviews: "10.9K",
    sold: 16980,
  },
  {
    name: "CORE TRACK",
    price: 2699,
    oldPrice: 3799,
    rating: 4.8,
    reviews: "9.8K",
    sold: 15460,
  },
  {
    name: "TERMINAL TRACK",
    price: 2899,
    oldPrice: 3999,
    rating: 4.8,
    reviews: "8.9K",
    sold: 14380,
  },
  {
    name: "PHANTOM TRACK",
    price: 2999,
    oldPrice: 4199,
    rating: 4.7,
    reviews: "8.1K",
    sold: 13240,
  },
  {
    name: "SYSTEM TRACK",
    price: 2799,
    oldPrice: 3899,
    rating: 4.7,
    reviews: "7.1K",
    sold: 12140,
  },
  {
    name: "SHADOW TRACK",
    price: 3199,
    oldPrice: 4399,
    rating: 4.6,
    reviews: "6.2K",
    sold: 10880,
  },
  {
    name: "VOID TRACK",
    price: 2899,
    oldPrice: 3999,
    rating: 4.6,
    reviews: "5.3K",
    sold: 9860,
  },
  {
    name: "SIGNAL TRACK",
    price: 2699,
    oldPrice: 3699,
    rating: 4.5,
    reviews: "4.5K",
    sold: 8710,
  },
];

/* =========================================================
   SHIRTS
========================================================= */

const shirts = [
  {
    name: "SYSTEM SHIRT",
    price: 2199,
    oldPrice: 3099,
    rating: 4.9,
    reviews: "10.4K",
    sold: 16120,
  },
  {
    name: "SIGNAL SHIRT",
    price: 2399,
    oldPrice: 3399,
    rating: 4.8,
    reviews: "9.2K",
    sold: 14860,
  },
  {
    name: "SHADOW SHIRT",
    price: 2599,
    oldPrice: 3599,
    rating: 4.8,
    reviews: "8.5K",
    sold: 13680,
  },
  {
    name: "FRAME SHIRT",
    price: 2299,
    oldPrice: 3199,
    rating: 4.7,
    reviews: "7.7K",
    sold: 12540,
  },
  {
    name: "VOID SHIRT",
    price: 2499,
    oldPrice: 3499,
    rating: 4.7,
    reviews: "6.9K",
    sold: 11360,
  },
  {
    name: "STRUCTURE SHIRT",
    price: 2699,
    oldPrice: 3799,
    rating: 4.6,
    reviews: "6.0K",
    sold: 10220,
  },
  {
    name: "RAW SHIRT",
    price: 2399,
    oldPrice: 3299,
    rating: 4.6,
    reviews: "5.1K",
    sold: 9130,
  },
  {
    name: "FORM SHIRT",
    price: 2599,
    oldPrice: 3599,
    rating: 4.5,
    reviews: "4.3K",
    sold: 8210,
  },
];

/* =========================================================
   SHORTS
========================================================= */

const shorts = [
  {
    name: "VOID SHORT",
    price: 1799,
    oldPrice: 2499,
    rating: 4.9,
    reviews: "9.8K",
    sold: 15320,
  },
  {
    name: "CARGO SHORT",
    price: 1999,
    oldPrice: 2799,
    rating: 4.8,
    reviews: "8.9K",
    sold: 14120,
  },
  {
    name: "MOTION SHORT",
    price: 1899,
    oldPrice: 2699,
    rating: 4.8,
    reviews: "8.0K",
    sold: 12940,
  },
  {
    name: "UTILITY SHORT",
    price: 2199,
    oldPrice: 2999,
    rating: 4.7,
    reviews: "7.2K",
    sold: 11720,
  },
  {
    name: "CORE SHORT",
    price: 1899,
    oldPrice: 2599,
    rating: 4.7,
    reviews: "6.4K",
    sold: 10640,
  },
  {
    name: "PHANTOM SHORT",
    price: 2299,
    oldPrice: 3199,
    rating: 4.6,
    reviews: "5.5K",
    sold: 9480,
  },
  {
    name: "SIGNAL SHORT",
    price: 1999,
    oldPrice: 2799,
    rating: 4.6,
    reviews: "4.7K",
    sold: 8560,
  },
  {
    name: "TERMINAL SHORT",
    price: 2399,
    oldPrice: 3299,
    rating: 4.5,
    reviews: "4.0K",
    sold: 7690,
  },
];

/* =========================================================
   HOODIES
========================================================= */

const hoodies = [
  {
    name: "VOID HOODIE",
    price: 3299,
    oldPrice: 4599,
    rating: 4.9,
    reviews: "13.8K",
    sold: 20120,
  },
  {
    name: "SYSTEM HOODIE",
    price: 3499,
    oldPrice: 4899,
    rating: 4.9,
    reviews: "12.1K",
    sold: 18340,
  },
  {
    name: "SHADOW HOODIE",
    price: 3699,
    oldPrice: 5199,
    rating: 4.8,
    reviews: "10.9K",
    sold: 16790,
  },
  {
    name: "TERMINAL HOODIE",
    price: 3899,
    oldPrice: 5499,
    rating: 4.8,
    reviews: "9.8K",
    sold: 15120,
  },
  {
    name: "PHANTOM HOODIE",
    price: 3599,
    oldPrice: 4999,
    rating: 4.7,
    reviews: "8.6K",
    sold: 13740,
  },
  {
    name: "FRAME HOODIE",
    price: 3399,
    oldPrice: 4699,
    rating: 4.7,
    reviews: "7.5K",
    sold: 12480,
  },
  {
    name: "SIGNAL HOODIE",
    price: 3799,
    oldPrice: 5299,
    rating: 4.6,
    reviews: "6.4K",
    sold: 10930,
  },
  {
    name: "CORE HOODIE",
    price: 3199,
    oldPrice: 4499,
    rating: 4.6,
    reviews: "5.3K",
    sold: 9620,
  },
];

/* =========================================================
   CO-ORD SETS
========================================================= */

const coords = [
  {
    name: "VOID CO-ORD",
    price: 3999,
    oldPrice: 5599,
    rating: 4.9,
    reviews: "10.6K",
    sold: 15980,
  },
  {
    name: "SYSTEM CO-ORD",
    price: 4299,
    oldPrice: 5999,
    rating: 4.8,
    reviews: "9.5K",
    sold: 14650,
  },
  {
    name: "MOTION CO-ORD",
    price: 4499,
    oldPrice: 6299,
    rating: 4.8,
    reviews: "8.7K",
    sold: 13490,
  },
  {
    name: "SHADOW CO-ORD",
    price: 4699,
    oldPrice: 6599,
    rating: 4.7,
    reviews: "7.8K",
    sold: 12280,
  },
  {
    name: "TERMINAL CO-ORD",
    price: 4399,
    oldPrice: 6099,
    rating: 4.7,
    reviews: "6.9K",
    sold: 11160,
  },
  {
    name: "FRAME CO-ORD",
    price: 4199,
    oldPrice: 5799,
    rating: 4.6,
    reviews: "6.0K",
    sold: 9940,
  },
  {
    name: "SIGNAL CO-ORD",
    price: 4599,
    oldPrice: 6399,
    rating: 4.6,
    reviews: "5.0K",
    sold: 8720,
  },
  {
    name: "RAW CO-ORD",
    price: 4899,
    oldPrice: 6799,
    rating: 4.5,
    reviews: "4.2K",
    sold: 7580,
  },
];

/* =========================================================
   JACKETS
========================================================= */

const jackets = [
  {
    name: "VOID JACKET",
    price: 4499,
    oldPrice: 6299,
    rating: 4.9,
    reviews: "11.5K",
    sold: 17120,
  },
  {
    name: "VARSITY 01",
    price: 4799,
    oldPrice: 6699,
    rating: 4.9,
    reviews: "10.3K",
    sold: 15640,
  },
  {
    name: "SHADOW JACKET",
    price: 4999,
    oldPrice: 6999,
    rating: 4.8,
    reviews: "9.2K",
    sold: 14280,
  },
  {
    name: "SYSTEM JACKET",
    price: 4699,
    oldPrice: 6499,
    rating: 4.8,
    reviews: "8.3K",
    sold: 13120,
  },
  {
    name: "TERMINAL JACKET",
    price: 5299,
    oldPrice: 7399,
    rating: 4.7,
    reviews: "7.4K",
    sold: 11840,
  },
  {
    name: "MOTION JACKET",
    price: 4899,
    oldPrice: 6799,
    rating: 4.7,
    reviews: "6.5K",
    sold: 10490,
  },
  {
    name: "PHANTOM JACKET",
    price: 5499,
    oldPrice: 7699,
    rating: 4.6,
    reviews: "5.5K",
    sold: 9280,
  },
  {
    name: "FRAME JACKET",
    price: 4599,
    oldPrice: 6399,
    rating: 4.5,
    reviews: "4.6K",
    sold: 8160,
  },
];

/* =========================================================
   CONVERT CATEGORY ARRAYS TO PRODUCT OBJECTS
========================================================= */

const buildCategory = (data, category, imagePrefix) =>
  data.map((product, index) =>
    createProduct({
      ...product,

      id: `${imagePrefix}-${index + 1}`,

      rank: index + 1,

      category,

      image: `/products/${imagePrefix}-${index + 1}.jpg`,

      minutes: index === 0 ? 2 : 3 + index * 3,
    }),
  );

/* =========================================================
   ALL PRODUCTS
========================================================= */

const bestSellerProducts = [
  ...buildCategory(tshirts, "T-SHIRTS", "tshirt"),

  ...buildCategory(jeans, "JEANS", "jean"),

  ...buildCategory(tracks, "TRACK PANTS", "track"),

  ...buildCategory(shirts, "SHIRTS", "shirt"),

  ...buildCategory(shorts, "SHORTS", "short"),

  ...buildCategory(hoodies, "HOODIES", "hoodie"),

  ...buildCategory(coords, "CO-ORD SETS", "coord"),

  ...buildCategory(jackets, "JACKETS", "jacket"),
];

/* =========================================================
   STATS
========================================================= */

const stats = [
  {
    icon: ShoppingBag,
    value: "2,46,890",
    title: "Items Sold",
    extra: "+32%",
    subtitle: "than last month",
  },

  {
    icon: Users,
    value: "1,85,430",
    title: "Happy Customers",
    extra: "+28%",
    subtitle: "than last month",
  },

  {
    icon: Star,
    value: "4.8/5",
    title: "Average Rating",
    extra: "+0.4",
    subtitle: "than last month",
  },

  {
    icon: Globe2,
    value: "25+",
    title: "Countries",
    extra: "+12",
    subtitle: "new this month",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

function BestSellers() {
  const [activeCategory, setActiveCategory] = useState("ALL CATEGORIES");

  const [activePeriod, setActivePeriod] = useState("TODAY");

  const [sortMode, setSortMode] = useState("BEST SELLING");

  const [liked, setLiked] = useState([]);

  /* =======================================================
     PRODUCTS TO DISPLAY
  ======================================================= */

  const visibleProducts = useMemo(() => {
    /* =====================================================
       ALL CATEGORIES

       IMPORTANT:
       DO NOT SORT THIS.

       Always:

       #1 Hoodie
       #2 T-Shirt
       #3 Jeans
       #4 Jacket
       #5 Track Pant
       #6 Shirt
       #7 Shorts
       #8 Co-ord
    ===================================================== */

    if (activeCategory === "ALL CATEGORIES") {
      return allCategoryOrder
        .map((category) =>
          bestSellerProducts.find(
            (product) => product.category === category && product.rank === 1,
          ),
        )
        .filter(Boolean);
    }

    /* =====================================================
       CATEGORY PAGE

       Shows all 8 products
    ===================================================== */

    let result = bestSellerProducts.filter(
      (product) => product.category === activeCategory,
    );

    /* =====================================================
       SORTING
    ===================================================== */

    if (sortMode === "BEST SELLING") {
      result = [...result].sort((a, b) => a.rank - b.rank);
    }

    if (sortMode === "PRICE LOW") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortMode === "PRICE HIGH") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    if (sortMode === "RATING") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [activeCategory, sortMode]);

  /* =======================================================
     LIKE
  ======================================================= */

  const toggleLike = (id) => {
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  /* =======================================================
     SCROLL TO PRODUCTS
  ======================================================= */

  const scrollToProducts = () => {
    document.querySelector(".best-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="best-page">
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="best-hero">
        <div className="best-hero-grid"></div>

        {/* LEFT */}

        <div className="best-hero-left">
          <span className="best-eyebrow">FASHION LIVES HERE</span>

          <h1>
            BEST
            <br />
            SELLERS
          </h1>

          <p>
            Most loved. Most worn.
            <br />
            Always on trend.
          </p>

          <div className="best-hero-actions">
            <button
              type="button"
              className="best-main-button"
              onClick={scrollToProducts}
            >
              SHOP BEST SELLERS
              <ArrowRight size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* =================================================
            HERO IMAGE
        ================================================= */}

        <div className="best-hero-collage">
          <div className="best-main-image best-main-image-full">
            <img src={Best} alt="Best selling fashion" />

            <div className="best-hero-image-overlay"></div>

            <div className="best-hero-image-number">01 / BEST SELLERS</div>
          </div>

          <div className="best-collage-line"></div>
        </div>
      </section>

      {/* ===================================================
          STATS
      =================================================== */}

      <section className="best-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.title} className="best-stat-card">
              <Icon size={31} strokeWidth={1.2} />

              <div>
                <strong>{stat.value}</strong>

                <span>{stat.title}</span>
              </div>

              <div className="best-stat-extra">
                <strong>↑ {stat.extra}</strong>

                <span>{stat.subtitle}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* ===================================================
          CATEGORY FILTER
      =================================================== */}

      <section className="best-filter-section">
        <div className="best-category-list">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                activeCategory === category
                  ? "best-category active"
                  : "best-category"
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* SORT */}

        <div className="best-sort">
          <span>SORT BY:</span>

          <div className="best-sort-select">
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
            >
              <option>BEST SELLING</option>

              <option>PRICE LOW</option>

              <option>PRICE HIGH</option>

              <option>RATING</option>
            </select>

            <ChevronDown size={15} />
          </div>
        </div>
      </section>

      {/* ===================================================
          PRODUCTS
      =================================================== */}

      <section className="best-products">
        {/* HEADER */}

        <div className="best-products-head">
          <div>
            <span className="best-products-category">{activeCategory}</span>

            <h2>
              {activeCategory === "ALL CATEGORIES"
                ? "TOP 8 BEST SELLERS"
                : `TOP 8 ${activeCategory}`}
            </h2>

            <p>Most purchased AXIEE pieces right now.</p>
          </div>

          {/* PERIOD */}

          <div className="best-period-wrapper">
            <div className="best-live-update">
              <i></i>
              RECENT ACTIVITY
            </div>

            <div className="best-period-buttons">
              {["TODAY", "THIS WEEK", "THIS MONTH"].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={activePeriod === period ? "active" : ""}
                  onClick={() => setActivePeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        <div className="best-product-grid best-eight-grid">
          {visibleProducts.map((product, index) => {
            /* ===========================================
                 RANK

                 ALL:
                 index controls:
                 #1 - #8

                 CATEGORY:
                 original product rank
              =========================================== */

            const displayRank =
              activeCategory === "ALL CATEGORIES" ? index + 1 : product.rank;

            return (
              <article
                key={product.id}
                className={
                  displayRank === 1
                    ? "best-product-card winner"
                    : "best-product-card"
                }
              >
                {/* =======================================
                      IMAGE
                  ======================================= */}

                <div className="best-product-image">
                  <img src={product.image} alt={product.name} />

                  {/* RANK */}

                  <div className="best-rank">#{displayRank}</div>

                  {/* CROWN */}

                  {displayRank === 1 && <div className="best-crown">♛</div>}

                  {/* HEART */}

                  <button
                    type="button"
                    className={
                      liked.includes(product.id)
                        ? "best-like liked"
                        : "best-like"
                    }
                    onClick={() => toggleLike(product.id)}
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      size={18}
                      fill={
                        liked.includes(product.id) ? "currentColor" : "none"
                      }
                    />
                  </button>

                  <div className="best-image-shade"></div>
                </div>

                {/* =======================================
                      CONTENT
                  ======================================= */}

                <div className="best-product-content">
                  {/* CATEGORY */}

                  <span className="best-card-category">{product.category}</span>

                  {/* NAME */}

                  <h3>{product.name}</h3>

                  {/* RATING */}

                  <div className="best-rating">
                    <Star size={11} fill="currentColor" />

                    <strong>{product.rating}</strong>

                    <span>({product.reviews})</span>
                  </div>

                  {/* SOLD */}

                  <div className="best-sold">
                    {product.sold.toLocaleString("en-IN")}+ sold
                  </div>

                  {/* PRICE */}

                  <div className="best-price-row">
                    <div>
                      <strong>₹{product.price.toLocaleString("en-IN")}</strong>

                      <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>
                    </div>

                    <span className="best-discount">{product.discount}</span>
                  </div>

                  {/* ACTIVITY */}

                  <div className="best-activity">
                    <span>⚡</span>
                    Bought {product.minutes} minutes ago
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          BOTTOM INSIGHTS
      =================================================== */}

      <section className="best-insights">
        {/* CARD 1 */}

        <article className="best-insight-card">
          <Flame size={31} strokeWidth={1.3} />

          <div>
            <span>FASTEST SELLING RIGHT NOW</span>

            <strong>VOID HOODIE</strong>

            <p>20,120+ units sold</p>
          </div>
        </article>

        {/* CARD 2 */}

        <article className="best-insight-card">
          <TrendingUp size={31} strokeWidth={1.3} />

          <div>
            <span>TODAY&apos;S SALES</span>

            <strong>₹2,46,890+</strong>

            <p>↑ 32% from yesterday</p>
          </div>
        </article>

        {/* CARD 3 */}

        <article className="best-insight-card">
          <MapPin size={31} strokeWidth={1.3} />

          <div>
            <span>MOST POPULAR CITY</span>

            <strong>Mumbai</strong>

            <p>18% of total sales</p>
          </div>
        </article>

        {/* CARD 4 */}

        <article className="best-insight-card">
          <Tag size={31} strokeWidth={1.3} />

          <div>
            <span>TRENDING CATEGORY</span>

            <strong>Hoodies</strong>

            <p>Highest selling category</p>
          </div>
        </article>
      </section>
    </main>
  );
}

export default BestSellers;
