import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroSpace from "../assets/hero-space.png";
import heroMountain from "../assets/hero-mountain.png";
import heroModel from "../assets/hero-model.png";
import heroNeon from "../assets/hero-neon.png";
import heroFog from "../assets/hero-fog.png";

import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   API
========================================================= */

const isLocalHostName = (hostname = "") => {
  const host = String(hostname).trim().toLowerCase();

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
};

const getApiBase = () => {
  const configured = String(import.meta.env.VITE_API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const browserHost = window.location.hostname;

  const browserIsLocal = isLocalHostName(browserHost);

  /*
    IMPORTANT:

    If production was accidentally built with:

    VITE_API_URL=http://localhost:5000

    we DO NOT use localhost on:
    unboundclothing.in

    because localhost on customer's phone
    means customer's phone itself.
  */

  if (configured) {
    try {
      const configuredUrl = new URL(configured, window.location.origin);

      const configuredIsLoopback =
        configuredUrl.hostname === "localhost" ||
        configuredUrl.hostname === "127.0.0.1";

      if (!browserIsLocal && configuredIsLoopback) {
        return "";
      }
    } catch {
      // Relative configured API URL is okay.
    }

    return configured;
  }

  /*
    LOCAL DEVELOPMENT

    PC:
    localhost:5173
    -> localhost:5000

    PHONE ON SAME WIFI:
    192.168.x.x:5173
    -> 192.168.x.x:5000
  */

  if (import.meta.env.DEV) {
    return `http://${browserHost}:5000`;
  }

  /*
    PRODUCTION

    React is served by backend,
    therefore use same-origin /api routes.
  */

  return "";
};

const API_BASE = getApiBase();

/* =========================================================
   CATALOG ENDPOINTS
========================================================= */

const getCatalogEndpoints = () => {
  const endpoints = [];

  const mainEndpoint = `${API_BASE}/api/catalog/products`;

  endpoints.push(mainEndpoint);

  /*
      Fallback to same-origin
      if configured API fails.
    */

  if (API_BASE && mainEndpoint !== "/api/catalog/products") {
    endpoints.push("/api/catalog/products");
  }

  return [...new Set(endpoints)];
};

/* =========================================================
   COLLECTIONS
========================================================= */

const sectionConfig = [
  {
    id: "tshirts",
    type: "tshirts",
    title: "T-SHIRTS",
    number: "01",
    eyebrow: "ESSENTIAL / FORM",
    subtitle: "Engineered silhouettes for everyday movement.",
    link: "/tshirts",
  },

  {
    id: "jeans",
    type: "jeans",
    title: "JEANS",
    number: "02",
    eyebrow: "DENIM / DISTORTION",
    subtitle: "Oversized denim built beyond convention.",
    link: "/jeans",
  },

  {
    id: "trackpants",
    type: "trackpants",
    title: "TRACK PANTS",
    number: "03",
    eyebrow: "MOTION / SYSTEM",
    subtitle: "Utility forms designed for unrestricted movement.",
    link: "/track-pants",
  },

  {
    id: "shirts",
    type: "shirts",
    title: "SHIRTS",
    number: "04",
    eyebrow: "STRUCTURE / LAYER",
    subtitle: "Dark tailoring reshaped for the next world.",
    link: "/shirts",
  },

  {
    id: "shorts",
    type: "shorts",
    title: "SHORTS",
    number: "05",
    eyebrow: "UTILITY / SUMMER",
    subtitle: "Reduced construction. Maximum movement.",
    link: "/shorts",
  },

  {
    id: "hoodies",
    type: "hoodies",
    title: "HOODIES",
    number: "06",
    eyebrow: "HEAVY / LAYER",
    subtitle: "Oversized layers engineered for the street.",
    link: "/hoodies",
  },

  {
    id: "coordsets",
    type: "coordsets",
    title: "CO-ORD SETS",
    number: "07",
    eyebrow: "MATCHED / SYSTEM",
    subtitle: "Complete silhouettes designed as one system.",
    link: "/co-ord-sets",
  },

  {
    id: "jackets",
    type: "jackets",
    title: "JACKETS",
    number: "08",
    eyebrow: "OUTER / SHELL",
    subtitle: "Outer layers built for movement beyond convention.",
    link: "/jackets",
  },
];

/* =========================================================
   PRODUCTS ARRAY
========================================================= */

const extractProducts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

/* =========================================================
   TEXT
========================================================= */

const normalizeText = (value = "") => String(value).trim().toLowerCase();

/* =========================================================
   RATING
========================================================= */

const getStableProductSeed = (product) => {
  const source = String(
    product?._id ||
      product?.id ||
      product?.slug ||
      product?.sku ||
      product?.name ||
      "unbound-product",
  );

  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);

    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const getProductRatingData = (product) => {
  const seed = getStableProductSeed(product);

  const fallbackRating = (35 + (seed % 16)) / 10;

  const fallbackReviews = 50 + (Math.floor(seed / 17) % 151);

  const savedRating = Number(product?.rating);

  const savedReviews = Number(product?.reviewCount ?? product?.reviews);

  const rating =
    Number.isFinite(savedRating) && savedRating >= 3.5 && savedRating <= 5
      ? Math.round(savedRating * 10) / 10
      : fallbackRating;

  const reviews =
    Number.isFinite(savedReviews) && savedReviews >= 50 && savedReviews <= 200
      ? Math.round(savedReviews)
      : fallbackReviews;

  return {
    rating,
    reviews,
  };
};

/* =========================================================
   RATING UI
========================================================= */

function RatingStars({ rating, reviews }) {
  const percentage = Math.max(
    0,
    Math.min(100, (Number(rating || 0) / 5) * 100),
  );

  return (
    <div className="unbound-card-rating">
      <span
        className="unbound-stars"
        aria-label={`${Number(rating || 0).toFixed(1)} out of 5 stars`}
      >
        <span className="unbound-stars-empty">★★★★★</span>

        <span
          className="unbound-stars-filled"
          style={{
            width: `${percentage}%`,
          }}
        >
          ★★★★★
        </span>
      </span>

      <strong>{Number(rating || 0).toFixed(1)}</strong>

      <span className="unbound-review-count">
        ({Number(reviews || 0)} reviews)
      </span>
    </div>
  );
}

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchCategory = (product, type) => {
  const category = normalizeText(product?.category);

  const name = normalizeText(product?.name);

  if (type === "tshirts") {
    return ["t-shirts", "tshirt", "tshirts", "t-shirt", "tees", "tee"].includes(
      category,
    );
  }

  if (type === "shirts") {
    return ["shirts", "shirt"].includes(category);
  }

  if (type === "hoodies") {
    return ["hoodies", "hoodie"].includes(category);
  }

  if (type === "shorts") {
    return ["shorts", "short"].includes(category);
  }

  if (type === "jackets") {
    return ["jackets", "jacket"].includes(category);
  }

  if (type === "coordsets") {
    return [
      "co-ord sets",
      "co ord sets",
      "coord sets",
      "co-ord set",
      "co ord set",
      "coordset",
      "coordsets",
    ].includes(category);
  }

  if (type === "jeans") {
    const direct = ["jeans", "jean", "denim"].includes(category);

    const pantsCategory = category === "pants" || category === "pant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return direct || (pantsCategory && denimName);
  }

  if (type === "trackpants") {
    const direct = ["track pants", "track pant", "trackpants"].includes(
      category,
    );

    const pantsCategory = category === "pants" || category === "pant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return direct || (pantsCategory && !denimName);
  }

  return false;
};

/* =========================================================
   PRODUCT ID
========================================================= */

const getProductId = (product) =>
  String(product?._id || product?.id || product?.slug || "");

/* =========================================================
   SIZES
========================================================= */

const getProductSizes = (product) => {
  if (!Array.isArray(product?.sizes)) {
    return [];
  }

  return product.sizes
    .filter((item) => {
      if (typeof item === "string") {
        return true;
      }

      if (item?.stock !== undefined && item?.stock !== null) {
        return Number(item.stock) > 0;
      }

      return true;
    })
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.size;
    })
    .filter(Boolean);
};

/* =========================================================
   IMAGE HELPERS
========================================================= */

const resolveImageValue = (imageValue) => {
  if (!imageValue) {
    return "";
  }

  let value = imageValue;

  /*
    OBJECT IMAGE

    Example:
    {
      fileId: "..."
    }
  */

  if (typeof value === "object") {
    const fileId = value?.fileId || value?._id || value?.id;

    if (fileId) {
      return `${API_BASE}/api/catalog/images/${String(fileId)}`;
    }

    value = value?.url || value?.src || value?.path || "";
  }

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  /*
    OLD IMAGE ROUTE
  */

  if (value.startsWith("/api/images/")) {
    value = value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    value = `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  /*
    FULL HTTP URL
  */

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);

      const imageIsLocal =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      const browserIsLocal = isLocalHostName(window.location.hostname);

      /*
        Fix old MongoDB records
        containing localhost image URL
        when customer is on production.
      */

      if (imageIsLocal && !browserIsLocal) {
        return `${API_BASE}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Keep original image.
    }

    return value;
  }

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  /*
    BACKEND PATH
  */

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  /*
    FRONTEND PUBLIC IMAGE
  */

  return value.startsWith("/") ? value : `/${value}`;
};

/* =========================================================
   PRODUCT IMAGES
========================================================= */

const getAllProductImages = (product) => {
  const values = [
    ...(Array.isArray(product?.imageFiles) ? product.imageFiles : []),

    ...(Array.isArray(product?.images) ? product.images : []),

    ...(Array.isArray(product?.imageIds) ? product.imageIds : []),

    product?.mainImage,
    product?.image,
    product?.imageId,
  ];

  return values
    .map((image) => resolveImageValue(image))
    .filter(Boolean)
    .filter((image, index, array) => array.indexOf(image) === index);
};

const getProductImage = (product) => {
  const images = getAllProductImages(product);

  return images[0] || "";
};

const getProductHoverImage = (product) => {
  const images = getAllProductImages(product);

  return images[1] || "";
};

/* =========================================================
   CART ID
========================================================= */

const createCartId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  selectedSizes,
  setSelectedSizes,
  quantities,
  setQuantities,
}) {
  const navigate = useNavigate();

  const productId = getProductId(product);

  const sizes = getProductSizes(product);

  const productImage = getProductImage(product);

  const hoverImage = getProductHoverImage(product);

  const selectedSize = selectedSizes[productId];

  const quantity = quantities[productId] ?? 0;

  const ratingData = getProductRatingData(product);

  /* =======================================================
     QUANTITY
  ======================================================= */

  const changeQuantity = (amount) => {
    setQuantities((previous) => {
      const current = previous[productId] ?? 0;

      const next = Math.min(10, Math.max(0, current + amount));

      return {
        ...previous,

        [productId]: next,
      };
    });
  };

  /* =======================================================
     SIZE
  ======================================================= */

  const chooseSize = (size) => {
    setSelectedSizes((previous) => ({
      ...previous,

      [productId]: size,
    }));
  };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = async () => {
    if (!productId) {
      alert("Product ID is missing.");

      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert("Please select a size first.");

      return;
    }

    if (quantity <= 0) {
      alert("Please select quantity first.");

      return;
    }

    try {
      let cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        cartId = createCartId();

        localStorage.setItem("axiee-cart-id", cartId);
      }

      const response = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          cartId,

          productId,

          size: selectedSize || "ONE SIZE",

          quantity,

          name: product?.name || "UNBOUND Product",

          price: Number(product?.price || 0),

          image: productImage || "",

          category: product?.category || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to add to cart.");
      }

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data?.cart,
        }),
      );

      alert(
        `${product.name}${
          selectedSize ? ` - Size ${selectedSize}` : ""
        } added to cart`,
      );
    } catch (error) {
      console.error("HOME ADD CART ERROR:", error);

      alert(error?.message || "Unable to add product to cart.");
    }
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const buyNow = () => {
    localStorage.removeItem("axiee-buy-now");

    navigate(`/product/${productId}`);
  };

  if (!productId) {
    return null;
  }

  return (
    <article className="ax-product-card">
      <Link
        to={`/product/${productId}`}
        className="ax-product-image-wrap"
        aria-label={`View ${product.name}`}
      >
        {productImage ? (
          <>
            <img
              src={productImage}
              alt={product.name}
              className="ax-product-image ax-home-main-image"
              loading="lazy"
              onError={(event) => {
                console.error(
                  "Product image failed:",
                  product.name,
                  productImage,
                );

                event.currentTarget.style.display = "none";
              }}
            />

            {hoverImage && (
              <img
                src={hoverImage}
                alt={`${product.name} alternate`}
                className="ax-product-image ax-home-hover-image"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </>
        ) : (
          <div className="ax-product-no-image">NO IMAGE</div>
        )}

        <div className="ax-product-smoke" />

        <span className="ax-product-index">
          AX / {productId.slice(0, 2).toUpperCase()}
        </span>

        <button
          type="button"
          className="ax-wishlist"
          aria-label="Wishlist"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          ♡
        </button>

        <span className="ax-view-product">
          VIEW
          <span>↗</span>
        </span>
      </Link>

      <div className="ax-product-info">
        <div className="ax-product-heading">
          <div>
            <h3>{product.name}</h3>

            <p>₹{Number(product.price || 0).toLocaleString("en-IN")}</p>

            <RatingStars
              rating={ratingData.rating}
              reviews={ratingData.reviews}
            />
          </div>

          <Link to={`/product/${productId}`} className="ax-card-arrow">
            →
          </Link>
        </div>

        {sizes.length > 0 && (
          <div className="ax-size-area">
            <span className="ax-size-label">SELECT SIZE</span>

            <div className="ax-size-list">
              {sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={
                    selectedSize === size ? "ax-size active" : "ax-size"
                  }
                  onClick={() => chooseSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ax-quantity-area">
          <span className="ax-quantity-label">QUANTITY</span>

          <div className="ax-quantity-counter">
            <button
              type="button"
              className="ax-quantity-btn"
              disabled={quantity <= 0}
              onClick={() => changeQuantity(-1)}
            >
              −
            </button>

            <span className="ax-quantity-number">{quantity}</span>

            <button
              type="button"
              className="ax-quantity-btn"
              disabled={quantity >= 10}
              onClick={() => changeQuantity(1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="ax-product-actions">
          <button type="button" className="ax-add-cart" onClick={addToCart}>
            <span>ADD TO CART</span>

            <span>＋</span>
          </button>

          <button type="button" className="ax-buy-now" onClick={buyNow}>
            BUY NOW
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PRODUCT SECTION
========================================================= */

function ProductSection({
  section,
  selectedSizes,
  setSelectedSizes,
  quantities,
  setQuantities,
}) {
  return (
    <section className="ax-product-section" id={section.id}>
      <div className="ax-product-section-top">
        <div className="ax-product-section-meta">
          <span>{section.number} / COLLECTION</span>

          <p>{section.eyebrow}</p>
        </div>

        <div className="ax-product-section-title">
          <h2>{section.title}</h2>

          <p>{section.subtitle}</p>
        </div>
      </div>

      <div className="ax-products-grid">
        {section.products.map((product) => {
          const productId = getProductId(product);

          return (
            <ProductCard
              key={productId}
              product={product}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              quantities={quantities}
              setQuantities={setQuantities}
            />
          );
        })}
      </div>

      <div className="ax-shop-more-wrap">
        <Link
          to={section.link}
          className="ax-shop-more-btn"
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "auto",
            });
          }}
        >
          <span>SHOP MORE {section.title}</span>

          <span className="ax-shop-more-arrow">→</span>
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home({ startAnimation, heroAlreadyPlayed, onHeroComplete }) {
  const homeRef = useRef(null);

  const heroRef = useRef(null);

  const spaceRef = useRef(null);

  const unboundWrapRef = useRef(null);

  const unboundRef = useRef(null);

  const mountainRef = useRef(null);

  const modelRef = useRef(null);

  const neonRef = useRef(null);

  const fogBackRef = useRef(null);

  const fogFrontRef = useRef(null);

  const leftUIRef = useRef(null);

  const exploreRef = useRef(null);

  const engineeredRef = useRef(null);

  const [catalogProducts, setCatalogProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);

  const [productsError, setProductsError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedSizes, setSelectedSizes] = useState({});

  const [quantities, setQuantities] = useState({});

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setProductsLoading(true);

      setProductsError("");

      let lastError = null;

      try {
        const endpoints = getCatalogEndpoints();

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              cache: "no-store",

              headers: {
                Accept: "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(`Unable to load products (${response.status})`);
            }

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
              throw new Error("Product API returned HTML instead of JSON.");
            }

            const data = await response.json();

            const products = extractProducts(data).filter(
              (product) => product?.isActive !== false,
            );

            if (!cancelled) {
              setCatalogProducts(products);

              setProductsError("");
            }

            return;
          } catch (error) {
            lastError = error;

            console.warn("PRODUCT API FAILED:", endpoint, error);
          }
        }

        throw lastError || new Error("Unable to load products.");
      } catch (error) {
        console.error("HOME PRODUCTS ERROR:", error);

        if (!cancelled) {
          setCatalogProducts([]);

          setProductsError("COLLECTION COULD NOT LOAD");
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /* =======================================================
     PRODUCT SECTIONS
  ======================================================= */

  const productSections = useMemo(
    () =>
      sectionConfig.map((section) => ({
        ...section,

        products: catalogProducts
          .filter((product) => matchCategory(product, section.type))
          .slice(0, 4),
      })),

    [catalogProducts],
  );

  /* =======================================================
     HERO INTRO
  ======================================================= */

  useLayoutEffect(() => {
    const elements = [
      spaceRef.current,
      unboundWrapRef.current,
      mountainRef.current,
      modelRef.current,
      neonRef.current,
      fogBackRef.current,
      fogFrontRef.current,
      leftUIRef.current,
      exploreRef.current,
      engineeredRef.current,
    ].filter(Boolean);

    if (!elements.length) {
      return;
    }

    const ctx = gsap.context(() => {
      /*
            If hero has already played
            OR App says do not run animation,
            immediately show final state.
          */

      if (heroAlreadyPlayed || !startAnimation) {
        gsap.set(spaceRef.current, {
          opacity: 1,
          scale: 1,
          yPercent: 0,
        });

        gsap.set(unboundWrapRef.current, {
          opacity: 1,
          xPercent: 0,
          yPercent: 0,
        });

        gsap.set(unboundRef.current, {
          filter: "blur(0px)",
        });

        gsap.set(mountainRef.current, {
          opacity: 1,
          yPercent: 0,
        });

        gsap.set(modelRef.current, {
          opacity: 1,
          yPercent: 0,
        });

        gsap.set(neonRef.current, {
          opacity: 1,
          scale: 1,
          rotation: 0,
        });

        gsap.set(fogBackRef.current, {
          opacity: 0.72,
          y: 0,
        });

        gsap.set(fogFrontRef.current, {
          opacity: 0.84,
          y: 0,
        });

        gsap.set(
          [leftUIRef.current, exploreRef.current, engineeredRef.current],
          {
            opacity: 1,
            y: 0,
          },
        );

        return;
      }

      /*
            INITIAL STATE
          */

      gsap.set(spaceRef.current, {
        opacity: 0,
        scale: 1.08,
      });

      gsap.set(unboundWrapRef.current, {
        opacity: 0,
        xPercent: 110,
      });

      gsap.set(unboundRef.current, {
        filter: "blur(14px)",
      });

      gsap.set(mountainRef.current, {
        opacity: 0,
        yPercent: -80,
      });

      gsap.set(modelRef.current, {
        opacity: 0,
        yPercent: -80,
      });

      gsap.set(neonRef.current, {
        opacity: 0,
        scale: 0.7,
      });

      gsap.set([fogBackRef.current, fogFrontRef.current], {
        opacity: 0,
        y: 100,
      });

      gsap.set([leftUIRef.current, exploreRef.current, engineeredRef.current], {
        opacity: 0,
        y: 20,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          onHeroComplete?.();
        },
      });

      tl.to(
        unboundWrapRef.current,
        {
          opacity: 1,
          xPercent: 0,
          duration: 1.1,
          ease: "expo.out",
        },
        0,
      );

      tl.to(
        unboundRef.current,
        {
          filter: "blur(0px)",
          duration: 0.8,
        },
        0,
      );

      tl.to(
        spaceRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 1,
        },
        0.45,
      );

      tl.to(
        mountainRef.current,
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
        },
        1.15,
      );

      tl.to(
        modelRef.current,
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
        },
        1.35,
      );

      tl.to(
        neonRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
        },
        1.5,
      );

      tl.to(
        fogBackRef.current,
        {
          opacity: 0.72,
          y: 0,
          duration: 0.7,
        },
        1.55,
      );

      tl.to(
        fogFrontRef.current,
        {
          opacity: 0.84,
          y: 0,
          duration: 0.7,
        },
        1.65,
      );

      tl.to(
        [leftUIRef.current, exploreRef.current, engineeredRef.current],
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.55,
        },
        1.7,
      );
    }, homeRef);

    return () => {
      ctx.revert();
    };
  }, [startAnimation, heroAlreadyPlayed, onHeroComplete]);

  /* =======================================================
     DESKTOP HERO SCROLL

     Disabled on mobile.
  ======================================================= */

  useLayoutEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;

    if (mobile) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(spaceRef.current, {
        yPercent: 7,
        scale: 1.03,

        ease: "none",

        scrollTrigger: {
          trigger: heroRef.current,

          start: "top top",

          end: "bottom top",

          scrub: 1.2,
        },
      });

      gsap.to(unboundWrapRef.current, {
        yPercent: -6,

        ease: "none",

        scrollTrigger: {
          trigger: heroRef.current,

          start: "top top",

          end: "bottom top",

          scrub: 1.2,
        },
      });

      gsap.to(mountainRef.current, {
        yPercent: -12,

        ease: "none",

        scrollTrigger: {
          trigger: heroRef.current,

          start: "top top",

          end: "bottom top",

          scrub: 1.2,
        },
      });

      gsap.to(modelRef.current, {
        yPercent: -5,

        ease: "none",

        scrollTrigger: {
          trigger: heroRef.current,

          start: "top top",

          end: "bottom top",

          scrub: 1.2,
        },
      });
    }, homeRef);

    return () => {
      ctx.revert();
    };
  }, []);

  /* =======================================================
     PRODUCT ANIMATION

     Desktop only.
     Mobile cards are always visible.
  ======================================================= */

  useLayoutEffect(() => {
    if (catalogProducts.length === 0) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 768px)").matches;

    const sections = gsap.utils.toArray(".ax-product-section");

    if (mobile) {
      sections.forEach((section) => {
        gsap.set(section.querySelector(".ax-product-section-top"), {
          opacity: 1,
          y: 0,
        });

        gsap.set(section.querySelectorAll(".ax-product-card"), {
          opacity: 1,
          y: 0,
        });

        gsap.set(section.querySelector(".ax-shop-more-wrap"), {
          opacity: 1,
          y: 0,
        });
      });

      return;
    }

    const animations = [];

    sections.forEach((section) => {
      const heading = section.querySelector(".ax-product-section-top");

      const cards = section.querySelectorAll(".ax-product-card");

      const button = section.querySelector(".ax-shop-more-wrap");

      if (heading) {
        const animation = gsap.fromTo(
          heading,
          {
            opacity: 0,
            y: 28,
          },

          {
            opacity: 1,
            y: 0,
            duration: 0.7,

            scrollTrigger: {
              trigger: section,

              start: "top 85%",
            },
          },
        );

        animations.push(animation);
      }

      if (cards.length) {
        const animation = gsap.fromTo(
          cards,
          {
            opacity: 0,
            y: 35,
          },

          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.07,

            scrollTrigger: {
              trigger: section,

              start: "top 80%",
            },
          },
        );

        animations.push(animation);
      }

      if (button) {
        const animation = gsap.fromTo(
          button,
          {
            opacity: 0,
            y: 12,
          },

          {
            opacity: 1,
            y: 0,
            duration: 0.5,

            scrollTrigger: {
              trigger: button,

              start: "top 95%",
            },
          },
        );

        animations.push(animation);
      }
    });

    ScrollTrigger.refresh();

    return () => {
      animations.forEach((animation) => {
        animation?.scrollTrigger?.kill();

        animation?.kill();
      });
    };
  }, [catalogProducts.length]);

  /* =======================================================
     REFRESH AFTER PRODUCTS LOAD
  ======================================================= */

  useEffect(() => {
    if (productsLoading) {
      return;
    }

    const timeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [productsLoading, catalogProducts.length]);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main ref={homeRef} className="ax-home">
      {/* =================================================
          HERO
      ================================================= */}

      <section ref={heroRef} className="ax-hero" id="home">
        <img ref={spaceRef} src={heroSpace} className="hero-space" alt="" />

        <div ref={unboundWrapRef} className="hero-unbound-wrapper">
          <h1 ref={unboundRef} className="hero-unbound">
            UNBOUND
          </h1>
        </div>

        <img
          ref={mountainRef}
          src={heroMountain}
          className="hero-mountain"
          alt=""
        />

        <img
          ref={fogBackRef}
          src={heroFog}
          className="hero-fog hero-fog-back"
          alt=""
        />

        <img ref={neonRef} src={heroNeon} className="hero-neon" alt="" />

        <img
          ref={modelRef}
          src={heroModel}
          className="hero-model"
          alt="UNBOUND streetwear"
        />

        <img
          ref={fogFrontRef}
          src={heroFog}
          className="hero-fog hero-fog-front"
          alt=""
        />

        <div className="hero-vignette" />

        <div ref={leftUIRef} className="hero-left-ui">
          <span>AXIEE</span>

          <p>
            MORE
            <br />
            THAN
            <br />
            CLOTHES
          </p>
        </div>

        <a ref={exploreRef} href="#tshirts" className="hero-explore">
          EXPLORE DROP
          <span>→</span>
        </a>

        <div ref={engineeredRef} className="hero-engineered">
          <p>
            ENGINEERED
            <br />
            FOR WHAT&apos;S NEXT
          </p>

          <span>↓</span>
        </div>
      </section>

      {/* =================================================
          INTRO
      ================================================= */}

      <section className="ax-collection-intro">
        <div>
          <span>AXIEE / 2026</span>

          <h2>
            WEAR THE
            <br />
            UNKNOWN.
          </h2>
        </div>

        <p>
          CLOTHES /
          <br />
          CULTURE /
          <br />
          BEYOND
        </p>
      </section>

      {/* =================================================
          LOADING
      ================================================= */}

      {productsLoading && (
        <div className="ax-home-products-status">LOADING COLLECTION...</div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {!productsLoading && productsError && (
        <div className="ax-home-products-status error">
          <span>{productsError}</span>

          <button
            type="button"
            className="ax-home-retry-btn"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            RETRY COLLECTION
            <span>→</span>
          </button>
        </div>
      )}

      {/* =================================================
          PRODUCTS
      ================================================= */}

      {!productsLoading && !productsError && (
        <div className="ax-collections">
          {productSections.map((section) => {
            if (section.products.length === 0) {
              return null;
            }

            return (
              <ProductSection
                key={section.id}
                section={section}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                quantities={quantities}
                setQuantities={setQuantities}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Home;
