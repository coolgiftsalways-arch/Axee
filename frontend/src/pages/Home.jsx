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
import "../styles/audioControl.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   CINEMATIC HERO SOUND

   Self-contained Web Audio cue. No MP3 file is required.
   Browsers may block audio until the visitor interacts once.
========================================================= */

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
  /*
    IMPORTANT:
    /api/products is now the PRIMARY source because it returns the same
    current MongoDB product data used by the category pages.

    /api/catalog/products stays only as a legacy fallback.
  */

  const endpoints = [
    `${API_BASE}/api/products`,
    `${API_BASE}/api/catalog/products`,
  ];

  /*
    If an absolute/configured backend fails, also try same-origin.
  */

  if (API_BASE) {
    endpoints.push("/api/products");
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
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return String(
          item?.size || item?.label || item?.name || item?.value || "",
        ).trim();
      }

      return "";
    })
    .filter(Boolean)
    .filter((size, index, array) => array.indexOf(size) === index);
};

/* =========================================================
   IMAGE HELPERS
========================================================= */

const resolveImageValue = (imageValue) => {
  if (!imageValue) {
    return "";
  }

  let value = imageValue;

  /* =======================================================
     IMAGE OBJECT

     IMPORTANT:
     Prefer the saved URL/src/path first.

     Some old objects also contain an _id that is the object/document id,
     not necessarily the real GridFS file id. Using _id first can create
     a broken image URL.
  ======================================================= */

  if (typeof value === "object") {
    const savedUrl =
      value?.url ||
      value?.src ||
      value?.path ||
      value?.image ||
      value?.imageUrl ||
      "";

    if (savedUrl) {
      return resolveImageValue(savedUrl);
    }

    const fileId = value?.fileId || value?.id || value?._id;

    if (fileId) {
      return `${API_BASE}/api/catalog/images/${String(fileId)}`;
    }

    return "";
  }

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  /* =======================================================
     RAW GRIDFS OBJECT ID
  ======================================================= */

  if (/^[a-f\d]{24}$/i.test(value)) {
    return `${API_BASE}/api/catalog/images/${value}`;
  }

  /* =======================================================
     OLD IMAGE ROUTE
  ======================================================= */

  if (value.includes("/api/images/")) {
    const imageId = value.split("/api/images/")[1];

    if (imageId) {
      return `${API_BASE}/api/catalog/images/${imageId}`;
    }
  }

  /* =======================================================
     CURRENT GRIDFS ROUTE

     Rebuild it with the current API_BASE even if MongoDB contains:
     http://localhost:5000/api/catalog/images/...
  ======================================================= */

  if (value.includes("/api/catalog/images/")) {
    const imageId = value.split("/api/catalog/images/")[1];

    if (imageId) {
      return `${API_BASE}/api/catalog/images/${imageId}`;
    }
  }

  /* =======================================================
     FULL HTTP / HTTPS URL
  ======================================================= */

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);

      const imageIsLoopback =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      /*
        CRITICAL MOBILE FIX:

        When the website is opened from a phone using:
        http://192.168.x.x:5178

        an image saved as:
        http://localhost:5000/...

        must NOT stay localhost, because localhost on the phone means
        the phone itself. Rebuild it using API_BASE.
      */

      if (imageIsLoopback) {
        return `${API_BASE}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Keep the original external URL if parsing fails.
    }

    return value;
  }

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  /* =======================================================
     BACKEND PATH
  ======================================================= */

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  /* =======================================================
     FRONTEND PUBLIC IMAGE
  ======================================================= */

  return value.startsWith("/") ? value : `/${value}`;
};

/* =========================================================
   PRODUCT IMAGES
========================================================= */

const getAllProductImages = (product) => {
  const resolvedImages = [];

  const addImage = (value) => {
    const resolved = resolveImageValue(value);

    if (resolved && !resolvedImages.includes(resolved)) {
      resolvedImages.push(resolved);
    }
  };

  /* =======================================================
     1. CURRENT ADMIN / MONGODB IMAGES ARE THE SOURCE OF TRUTH

     The order saved in product.images is the order selected in Admin.
     images[0] = MAIN
     images[1] = hover / second image
  ======================================================= */

  if (Array.isArray(product?.images) && product.images.length > 0) {
    product.images.forEach(addImage);

    return resolvedImages;
  }

  /* =======================================================
     2. SINGLE CURRENT IMAGE FIELDS
     Only use when product.images is empty.
  ======================================================= */

  addImage(product?.mainImage);
  addImage(product?.image);

  if (resolvedImages.length > 0) {
    return resolvedImages;
  }

  /* =======================================================
     3. LEGACY imageFiles
     Fallback only. Do NOT mix these before current images.
  ======================================================= */

  if (Array.isArray(product?.imageFiles)) {
    [...product.imageFiles]
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
      .forEach(addImage);
  }

  if (resolvedImages.length > 0) {
    return resolvedImages;
  }

  /* =======================================================
     4. VERY OLD imageIds / imageId
  ======================================================= */

  if (Array.isArray(product?.imageIds)) {
    product.imageIds.forEach(addImage);
  }

  addImage(product?.imageId);

  return resolvedImages;
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
   HOME PRODUCT GROUP ROTATION + MANUAL SLIDER

   FINAL BEHAVIOR:
   - Show 4 products per category.
   - ALL 4 cards change TOGETHER every 10 seconds.
   - Refresh starts from a different group of 4.
   - Arrow buttons + mobile swipe jump by one full group.
   - Every product is eventually included in the rotation.
========================================================= */

const HOME_PRODUCTS_PER_SECTION = 4;

const HOME_PRODUCT_ROTATE_MS = 10000;

const greatestCommonDivisor = (a, b) => {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);

  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x || 1;
};

const getProductGroupCount = (productCount) => {
  const count = Math.max(0, Number(productCount) || 0);

  if (count <= HOME_PRODUCTS_PER_SECTION) {
    return 1;
  }

  /*
    We move the start position by 4 every time.
    n / gcd(n, 4) gives the full cycle length so every
    product eventually becomes part of a visible group.
  */
  return Math.max(
    1,
    Math.floor(count / greatestCommonDivisor(count, HOME_PRODUCTS_PER_SECTION)),
  );
};

const normalizeRotationTick = (tick, productCount) => {
  const groupCount = getProductGroupCount(productCount);

  return ((Number(tick || 0) % groupCount) + groupCount) % groupCount;
};

const getGroupProductIndexes = (productCount, rotationTick) => {
  const count = Math.max(0, Number(productCount) || 0);

  if (count === 0) {
    return [];
  }

  const visibleCount = Math.min(HOME_PRODUCTS_PER_SECTION, count);

  if (count <= visibleCount) {
    return Array.from({ length: visibleCount }, (_, index) => index);
  }

  const safeTick = normalizeRotationTick(rotationTick, count);
  const startIndex = (safeTick * HOME_PRODUCTS_PER_SECTION) % count;

  return Array.from(
    { length: visibleCount },
    (_, index) => (startIndex + index) % count,
  );
};

const getRotatingProducts = (products, rotationTick) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  return getGroupProductIndexes(products.length, rotationTick).map(
    (productIndex) => products[productIndex],
  );
};

const groupsDoNotOverlap = (productCount, firstTick, secondTick) => {
  const first = new Set(getGroupProductIndexes(productCount, firstTick));
  const second = getGroupProductIndexes(productCount, secondTick);

  return second.every((index) => !first.has(index));
};

const getFreshRotationTick = (sectionId, productCount) => {
  const count = Math.max(0, Number(productCount) || 0);

  if (count <= HOME_PRODUCTS_PER_SECTION) {
    return 0;
  }

  const groupCount = getProductGroupCount(count);
  const storageKey = `unbound-home-rotation-${sectionId}`;

  let previousTick = -1;

  try {
    const savedTick = window.sessionStorage.getItem(storageKey);
    previousTick = savedTick === null ? -1 : Number(savedTick);
  } catch {
    previousTick = -1;
  }

  const allTicks = Array.from({ length: groupCount }, (_, index) => index);

  let candidates = allTicks;

  if (Number.isFinite(previousTick) && previousTick >= 0 && groupCount > 1) {
    const previousSafeTick = normalizeRotationTick(previousTick, count);

    /*
      If the category has enough products, prefer a refresh group
      where NONE of the previous 4 products are visible.
    */
    const completelyDifferent = allTicks.filter(
      (candidateTick) =>
        candidateTick !== previousSafeTick &&
        groupsDoNotOverlap(count, previousSafeTick, candidateTick),
    );

    if (completelyDifferent.length > 0) {
      candidates = completelyDifferent;
    } else {
      candidates = allTicks.filter((tick) => tick !== previousSafeTick);
    }
  }

  const nextTick =
    candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] ?? 0;

  try {
    window.sessionStorage.setItem(storageKey, String(nextTick));
  } catch {
    // sessionStorage can be unavailable in strict privacy modes.
  }

  return nextTick;
};

const createFreshSectionTicks = (products) => {
  const nextTicks = {};

  sectionConfig.forEach((section) => {
    const categoryProducts = products.filter((product) =>
      matchCategory(product, section.type),
    );

    nextTicks[section.id] = getFreshRotationTick(
      section.id,
      categoryProducts.length,
    );
  });

  return nextTicks;
};

const HOME_SLIDER_STYLES = `
  .ax-home-slider-shell {
    position: relative;
  }

  .ax-home-slider-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin: 0 0 16px;
  }

  .ax-home-slider-status {
    margin-right: auto;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: rgba(255,255,255,.38);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  .ax-home-slider-status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c7ff13;
    box-shadow: 0 0 10px rgba(199,255,19,.65);
  }

  .ax-home-slider-counter {
    min-width: 68px;
    color: rgba(255,255,255,.56);
    font-size: 8px;
    letter-spacing: .14em;
    text-align: center;
  }

  .ax-home-slider-arrow {
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,.025);
    color: #f5f2ea;
    font-size: 17px;
    cursor: pointer;
    transition: transform .25s ease, background .25s ease, border-color .25s ease, color .25s ease;
  }

  .ax-home-slider-arrow:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #c7ff13;
    border-color: #c7ff13;
    color: #050505;
  }

  .ax-home-slider-arrow:disabled {
    opacity: .22;
    cursor: default;
  }

  .ax-home-slider-grid {
    touch-action: pan-y;
    user-select: none;
  }

  @media (max-width: 768px) {
    .ax-home-slider-toolbar {
      margin-bottom: 12px;
    }

    .ax-home-slider-arrow {
      width: 38px;
      height: 38px;
    }

    .ax-home-slider-status {
      font-size: 6px;
      letter-spacing: .14em;
    }
  }
`;

/* =========================================================
   HERO AUDIO ELEMENT
   Uses the real /audio/hero.mp3 already mounted by App.jsx.
========================================================= */

const getHeroAudioElement = () => {
  const directAudio = document.querySelector(
    'audio[data-hero-audio="true"], audio[src="/audio/hero.mp3"]',
  );

  if (directAudio) {
    return directAudio;
  }

  const source = document.querySelector('audio source[src="/audio/hero.mp3"]');

  return source?.closest("audio") || null;
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

  const cardRef = useRef(null);

  const previousProductIdRef = useRef("");

  const productId = getProductId(product);

  const sizes = getProductSizes(product);

  const productImage = getProductImage(product);

  const hoverImage = getProductHoverImage(product);

  const selectedSize = selectedSizes[productId];

  const quantity = quantities[productId] ?? 0;

  const ratingData = getProductRatingData(product);

  /* =======================================================
     10 SECOND / MANUAL CARD SWAP ANIMATION
  ======================================================= */

  useLayoutEffect(() => {
    const card = cardRef.current;

    if (!card || !productId) {
      return;
    }

    const previousProductId = previousProductIdRef.current;

    previousProductIdRef.current = productId;

    /*
      Do not run this animation on the first render.
      The normal section scroll animation handles that.
    */

    if (!previousProductId || previousProductId === productId) {
      return;
    }

    const animation = gsap.fromTo(
      card,
      {
        opacity: 0.15,
        y: 18,
        scale: 0.985,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: "power2.out",
        clearProps: "transform",
      },
    );

    return () => {
      animation.kill();
    };
  }, [productId]);

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
    <article ref={cardRef} className="ax-product-card">
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
  onSlide,
}) {
  const touchStartXRef = useRef(null);
  const gridRef = useRef(null);

  const sliderEnabled = section.totalProducts > HOME_PRODUCTS_PER_SECTION;

  /* =======================================================
     GSAP PRODUCT GROUP ENTER

     Whenever the group changes, all 4 NEW cards enter
     together from below. No stagger: all four move as one.
  ======================================================= */

  useLayoutEffect(() => {
    const grid = gridRef.current;

    if (!grid) {
      return;
    }

    const cards = Array.from(grid.querySelectorAll(".ax-product-card"));

    if (!cards.length) {
      return;
    }

    gsap.killTweensOf(cards);

    gsap.set(cards, {
      opacity: 0,
      y: 46,
      scale: 0.955,
      rotateX: -9,
      filter: "blur(7px)",
      transformOrigin: "center top",
    });

    const tween = gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 0.62,
      ease: "power4.out",
      clearProps: "transform,filter",
    });

    return () => {
      tween.kill();
    };
  }, [section.rotationTick]);

  const visibleCount = Math.min(
    HOME_PRODUCTS_PER_SECTION,
    section.totalProducts || 0,
  );

  const safeTick = normalizeRotationTick(
    section.rotationTick || 0,
    Math.max(1, section.totalProducts || 1),
  );

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches?.[0]?.clientX;

    touchStartXRef.current = null;

    if (!sliderEnabled || startX == null || endX == null) {
      return;
    }

    const distance = endX - startX;

    if (Math.abs(distance) < 45) {
      return;
    }

    // Swipe left = next group of 4. Swipe right = previous group of 4.
    onSlide?.(section.id, distance < 0 ? 1 : -1);
  };

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

      <div className="ax-home-slider-shell">
        <div className="ax-home-slider-toolbar">
          <div className="ax-home-slider-status">
            <span className="ax-home-slider-status-dot" />
            <span>AUTO / 10 SEC</span>
          </div>

          {sliderEnabled && (
            <>
              <span className="ax-home-slider-counter">
                {String(safeTick + 1).padStart(2, "0")}
                {" / "}
                {String(section.groupCount || 1).padStart(2, "0")}
              </span>

              <button
                type="button"
                className="ax-home-slider-arrow"
                aria-label={`Previous ${section.title} product`}
                onClick={() => onSlide?.(section.id, -1)}
              >
                ←
              </button>

              <button
                type="button"
                className="ax-home-slider-arrow"
                aria-label={`Next ${section.title} product`}
                onClick={() => onSlide?.(section.id, 1)}
              >
                →
              </button>
            </>
          )}
        </div>

        <div
          ref={gridRef}
          data-product-grid={section.id}
          className="ax-products-grid ax-home-slider-grid"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {section.products.map((product, slotIndex) => (
            <ProductCard
              key={`${section.id}-group-${safeTick}-${getProductId(product)}-${slotIndex}`}
              product={product}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              quantities={quantities}
              setQuantities={setQuantities}
            />
          ))}
        </div>
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

function Home({
  startAnimation = false,
  heroAlreadyPlayed = false,
  onHeroStart,
  onHeroComplete,
} = {}) {
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

  const onHeroStartRef = useRef(onHeroStart);
  const onHeroCompleteRef = useRef(onHeroComplete);

  useEffect(() => {
    onHeroStartRef.current = onHeroStart;
  }, [onHeroStart]);

  useEffect(() => {
    onHeroCompleteRef.current = onHeroComplete;
  }, [onHeroComplete]);

  const [heroIntroDone, setHeroIntroDone] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);

  const [productsError, setProductsError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedSizes, setSelectedSizes] = useState({});

  const [quantities, setQuantities] = useState({});

  const [sectionRotationTicks, setSectionRotationTicks] = useState({});

  const productGroupAnimatingRef = useRef(false);

  /* =======================================================
     RETRACTABLE SOUND CONTROL
  ======================================================= */

  const [soundControlOpen, setSoundControlOpen] = useState(false);
  const [soundControlReady, setSoundControlReady] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);

  // Sound dock must exist ONLY while the hero section is on screen.
  const [heroSoundDockVisible, setHeroSoundDockVisible] = useState(true);

  const soundCollapseTimerRef = useRef(null);

  const soundControlVisible =
    Boolean(startAnimation || heroAlreadyPlayed) && heroSoundDockVisible;

  const clearSoundCollapseTimer = () => {
    if (soundCollapseTimerRef.current) {
      window.clearTimeout(soundCollapseTimerRef.current);
      soundCollapseTimerRef.current = null;
    }
  };

  const scheduleSoundControlCollapse = () => {
    clearSoundCollapseTimer();

    soundCollapseTimerRef.current = window.setTimeout(() => {
      setSoundControlOpen(false);
    }, 4200);
  };

  const openSoundControl = () => {
    setSoundControlOpen(true);
    scheduleSoundControlCollapse();
  };

  const toggleHeroSound = async () => {
    const audio = getHeroAudioElement();

    if (!audio) {
      setSoundControlReady(false);
      return;
    }

    try {
      if (audio.paused) {
        audio.muted = false;
        audio.volume = 1;

        const playPromise = audio.play();

        if (playPromise && typeof playPromise.then === "function") {
          await playPromise;
        }
      } else {
        audio.pause();
      }
    } catch (error) {
      console.warn("Hero audio toggle blocked:", error);
    }

    setSoundPlaying(!audio.paused && !audio.muted);
  };

  const handleSoundControlClick = () => {
    /*
      First click while tucked away:
      ONLY open the full pill.

      Once the pill is open:
      clicking it toggles SOUND ON / SOUND OFF.
    */
    if (!soundControlOpen) {
      openSoundControl();
      return;
    }

    toggleHeroSound();
    scheduleSoundControlCollapse();
  };

  /* =======================================================
     SHOW SOUND DOCK ONLY INSIDE HERO

     The dock is fixed while the hero is visible, but it is
     completely removed as soon as the visitor scrolls into
     the collection/product area. This prevents it sitting on
     top of product cards.
  ======================================================= */

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.04;

        setHeroSoundDockVisible(visible);

        if (!visible) {
          setSoundControlOpen(false);
          clearSoundCollapseTimer();
        }
      },
      {
        threshold: [0, 0.04, 0.12, 0.25],
      },
    );

    observer.observe(hero);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!soundControlVisible) {
      setSoundControlOpen(false);
      return;
    }

    let audio = null;
    let retryTimer = null;
    let attempts = 0;

    const syncAudioState = () => {
      if (!audio) {
        return;
      }

      setSoundControlReady(true);
      setSoundPlaying(!audio.paused && !audio.muted);
    };

    const connectToAudio = () => {
      audio = getHeroAudioElement();

      if (!audio) {
        attempts += 1;

        if (attempts < 24) {
          retryTimer = window.setTimeout(connectToAudio, 250);
        }

        return;
      }

      syncAudioState();

      audio.addEventListener("play", syncAudioState);
      audio.addEventListener("playing", syncAudioState);
      audio.addEventListener("pause", syncAudioState);
      audio.addEventListener("ended", syncAudioState);
      audio.addEventListener("volumechange", syncAudioState);
    };

    connectToAudio();

    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }

      clearSoundCollapseTimer();

      if (audio) {
        audio.removeEventListener("play", syncAudioState);
        audio.removeEventListener("playing", syncAudioState);
        audio.removeEventListener("pause", syncAudioState);
        audio.removeEventListener("ended", syncAudioState);
        audio.removeEventListener("volumechange", syncAudioState);
      }
    };
  }, [soundControlVisible]);

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

              setSectionRotationTicks(createFreshSectionTicks(products));

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
     GSAP PRODUCT GROUP TRANSITION

     OUT:  all current cards move up + fade + blur together.
     SWAP: React changes the whole group of 4.
     IN:   ProductSection layout effect brings all 4 new cards
           from below together.
  ======================================================= */

  const transitionProductGroups = (sectionIds, updateState) => {
    if (productGroupAnimatingRef.current) {
      return;
    }

    const ids = Array.isArray(sectionIds) ? sectionIds : [sectionIds];

    const cards = ids.flatMap((sectionId) => {
      const grid = document.querySelector(`[data-product-grid="${sectionId}"]`);

      if (!grid) {
        return [];
      }

      return Array.from(grid.querySelectorAll(".ax-product-card"));
    });

    if (!cards.length) {
      updateState?.();
      return;
    }

    productGroupAnimatingRef.current = true;

    gsap.killTweensOf(cards);

    gsap.to(cards, {
      opacity: 0,
      y: -42,
      scale: 0.955,
      rotateX: 9,
      filter: "blur(7px)",
      transformOrigin: "center bottom",
      duration: 0.38,
      ease: "power3.in",
      onComplete: () => {
        updateState?.();

        // Give React one frame to render the next 4 cards.
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            productGroupAnimatingRef.current = false;
          }, 680);
        });
      },
    });
  };

  /* =======================================================
     AUTO-ROTATE HOME PRODUCTS EVERY 10 SECONDS

     ALL FOUR cards animate OUT together, then the next
     group of four animates IN together with GSAP.
  ======================================================= */

  useEffect(() => {
    if (catalogProducts.length === 0) {
      return;
    }

    const rotatableSections = sectionConfig.filter((section) => {
      const categoryCount = catalogProducts.filter((product) =>
        matchCategory(product, section.type),
      ).length;

      return categoryCount > HOME_PRODUCTS_PER_SECTION;
    });

    if (!rotatableSections.length) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      transitionProductGroups(
        rotatableSections.map((section) => section.id),
        () => {
          setSectionRotationTicks((previous) => {
            const next = { ...previous };

            rotatableSections.forEach((section) => {
              const categoryProducts = catalogProducts.filter((product) =>
                matchCategory(product, section.type),
              );

              next[section.id] = normalizeRotationTick(
                Number(previous[section.id] || 0) + 1,
                categoryProducts.length,
              );
            });

            return next;
          });
        },
      );
    }, HOME_PRODUCT_ROTATE_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [catalogProducts]);

  /* =======================================================
     REMEMBER CURRENT GROUP

     This makes refresh choose a different group from the one
     the visitor was actually viewing before refreshing.
  ======================================================= */

  useEffect(() => {
    Object.entries(sectionRotationTicks).forEach(
      ([sectionId, rotationTick]) => {
        try {
          window.sessionStorage.setItem(
            `unbound-home-rotation-${sectionId}`,
            String(rotationTick),
          );
        } catch {
          // Ignore storage errors.
        }
      },
    );
  }, [sectionRotationTicks]);

  /* =======================================================
     MANUAL SLIDER

     Arrow click / mobile swipe changes the full group of 4 immediately.
  ======================================================= */

  const slideProductSection = (sectionId, direction) => {
    const section = sectionConfig.find((item) => item.id === sectionId);

    if (!section) {
      return;
    }

    const categoryProducts = catalogProducts.filter((product) =>
      matchCategory(product, section.type),
    );

    if (categoryProducts.length <= HOME_PRODUCTS_PER_SECTION) {
      return;
    }

    transitionProductGroups(sectionId, () => {
      setSectionRotationTicks((previous) => ({
        ...previous,
        [sectionId]: normalizeRotationTick(
          Number(previous[sectionId] || 0) + Number(direction || 0),
          categoryProducts.length,
        ),
      }));
    });
  };

  /* =======================================================
     PRODUCT SECTIONS
  ======================================================= */

  const productSections = useMemo(
    () =>
      sectionConfig.map((section) => {
        const categoryProducts = catalogProducts.filter((product) =>
          matchCategory(product, section.type),
        );

        const rotationTick = Number(sectionRotationTicks[section.id] || 0);

        return {
          ...section,
          totalProducts: categoryProducts.length,
          groupCount: getProductGroupCount(categoryProducts.length),
          rotationTick,
          products: getRotatingProducts(categoryProducts, rotationTick),
        };
      }),

    [catalogProducts, sectionRotationTicks],
  );

  /* =======================================================
     HERO INTRO

     IMPORTANT:
     - Home is mounted behind the loader.
     - It waits until Loader has completely finished.
     - Hero animation starts only after the loader disappears.
     - Home starts /audio/hero.mp3 at timeline time 0.
     - Visuals and sound therefore use the same start beat.
  ======================================================= */

  useLayoutEffect(() => {
    const navbarElement = document.querySelector(".ax-navbar");

    const setHeroFinalState = () => {
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
        scale: 1,
      });

      gsap.set(modelRef.current, {
        opacity: 1,
        yPercent: 0,
        scale: 1,
      });

      gsap.set(neonRef.current, {
        opacity: 1,
        yPercent: 0,
        scale: 1,
        rotation: 0,
      });

      gsap.set(fogBackRef.current, {
        opacity: 0.72,
        yPercent: 0,
      });

      gsap.set(fogFrontRef.current, {
        opacity: 0.84,
        yPercent: 0,
      });

      gsap.set([leftUIRef.current, exploreRef.current, engineeredRef.current], {
        opacity: 1,
        y: 0,
      });

      if (navbarElement) {
        gsap.set(navbarElement, {
          opacity: 1,
          y: 0,
        });
      }
    };

    /*
      Returning to Home after the intro has already played:
      do not replay the loader/hero.
    */

    if (heroAlreadyPlayed) {
      setHeroFinalState();
      setHeroIntroDone(true);
      return;
    }

    /*
      First page load:
      Home exists behind Loader, but the hero timeline must wait
      until Loader's green line has finished and its doors begin
      opening.
    */

    if (!startAnimation) {
      return;
    }

    const heroElements = [
      spaceRef.current,
      unboundWrapRef.current,
      unboundRef.current,
      mountainRef.current,
      modelRef.current,
      neonRef.current,
      fogBackRef.current,
      fogFrontRef.current,
      leftUIRef.current,
      exploreRef.current,
      engineeredRef.current,
    ].filter(Boolean);

    if (!heroRef.current || heroElements.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      /* ================================================
         STEP-BY-STEP TOP-DOWN HERO

         Nothing enters together.

         Order:
         1. UNBOUND
         2. Space/background
         3. Mountain
         4. Green ring
         5. Back fog
         6. Model / man
         7. Front fog
         8. Navbar
         9. Small UI

         Every foreground layer starts ABOVE the viewport.
      ================================================ */

      gsap.set(spaceRef.current, {
        opacity: 0,
        yPercent: -8,
        scale: 1.08,
      });

      gsap.set(unboundWrapRef.current, {
        opacity: 0,
        yPercent: -38,
        scale: 0.96,
      });

      gsap.set(unboundRef.current, {
        filter: "blur(18px)",
      });

      gsap.set(mountainRef.current, {
        opacity: 0,
        yPercent: -105,
        scale: 1.08,
      });

      gsap.set(neonRef.current, {
        opacity: 0,
        yPercent: -88,
        scale: 0.78,
        rotation: -12,
        filter:
          "brightness(1.2) saturate(1.35) blur(9px) drop-shadow(0 0 38px rgba(199,255,19,.5))",
      });

      gsap.set(fogBackRef.current, {
        opacity: 0,
        yPercent: -90,
        scaleX: 1.16,
        scaleY: 1.1,
      });

      gsap.set(modelRef.current, {
        opacity: 0,
        yPercent: -135,
        scale: 0.92,
        filter: "brightness(.52) contrast(1.18) blur(8px)",
      });

      gsap.set(fogFrontRef.current, {
        opacity: 0,
        yPercent: -115,
        scaleX: 1.2,
        scaleY: 1.12,
      });

      gsap.set([leftUIRef.current, exploreRef.current, engineeredRef.current], {
        opacity: 0,
        y: -34,
        filter: "blur(7px)",
      });

      if (navbarElement) {
        gsap.set(navbarElement, {
          opacity: 0,
          y: -70,
        });
      }

      /* ================================================
         ONE MASTER TIMELINE

         The loader is already completely gone before this
         timeline starts.

         Sound:
         App's real hero.mp3 starts at timeline time 0 through
         onHeroStartRef.current().
      ================================================ */

      const tl = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
        onComplete: () => {
          setHeroIntroDone(true);

          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });

          onHeroCompleteRef.current?.();
        },
      });

      /*
        SOUND + HERO START TOGETHER.
      */
      tl.call(
        () => {
          onHeroStartRef.current?.();
        },
        null,
        0,
      );

      /* ------------------------------------------------
         1. BIG UNBOUND COMES FROM TOP
      ------------------------------------------------ */

      tl.to(
        unboundWrapRef.current,
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          duration: 0.95,
          ease: "expo.out",
        },
        0.05,
      );

      tl.to(
        unboundRef.current,
        {
          filter: "blur(0px)",
          duration: 0.72,
          ease: "power3.out",
        },
        0.18,
      );

      /* ------------------------------------------------
         2. SPACE / BACKGROUND COMES DOWN
      ------------------------------------------------ */

      tl.to(
        spaceRef.current,
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          duration: 1.0,
          ease: "power3.out",
        },
        0.72,
      );

      /* ------------------------------------------------
         3. MOUNTAIN DROPS FROM TOP
      ------------------------------------------------ */

      tl.to(
        mountainRef.current,
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          duration: 1.18,
          ease: "expo.out",
        },
        1.05,
      );

      /*
        Tiny settle so it feels heavy instead of floating.
      */
      tl.to(
        mountainRef.current,
        {
          yPercent: 2,
          duration: 0.16,
          ease: "power2.in",
        },
        1.96,
      );

      tl.to(
        mountainRef.current,
        {
          yPercent: 0,
          duration: 0.28,
          ease: "power2.out",
        },
        2.12,
      );

      /* ------------------------------------------------
         4. GREEN RING FALLS IN AFTER MOUNTAIN
      ------------------------------------------------ */

      tl.to(
        neonRef.current,
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          rotation: 0,
          filter:
            "brightness(.9) saturate(1.15) blur(0px) drop-shadow(0 0 14px rgba(199,255,19,.25))",
          duration: 0.95,
          ease: "expo.out",
        },
        1.72,
      );

      /*
        Energy pulse AFTER it reaches position.
      */
      tl.to(
        neonRef.current,
        {
          scale: 1.06,
          duration: 0.14,
          ease: "power2.out",
        },
        2.42,
      );

      tl.to(
        neonRef.current,
        {
          scale: 1,
          duration: 0.3,
          ease: "power2.inOut",
        },
        2.56,
      );

      /* ------------------------------------------------
         5. BACK FOG COMES FROM TOP
      ------------------------------------------------ */

      tl.to(
        fogBackRef.current,
        {
          opacity: 0.72,
          yPercent: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 1.05,
          ease: "power4.out",
        },
        2.15,
      );

      /* ------------------------------------------------
         6. MODEL / MAN DROPS FROM TOP

         This is deliberately later than mountain + ring + back fog.
         So the environment exists FIRST, then the man enters.
      ------------------------------------------------ */

      tl.to(
        modelRef.current,
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          filter: "brightness(.9) contrast(1.1) blur(0px)",
          duration: 1.25,
          ease: "expo.out",
        },
        2.78,
      );

      /*
        Heavy landing / settle.
      */
      tl.to(
        modelRef.current,
        {
          yPercent: 1.8,
          duration: 0.13,
          ease: "power2.in",
        },
        3.73,
      );

      tl.to(
        modelRef.current,
        {
          yPercent: 0,
          duration: 0.28,
          ease: "power2.out",
        },
        3.86,
      );

      /* ------------------------------------------------
         7. FRONT FOG DROPS AFTER MODEL
         This fog sits IN FRONT of him.
      ------------------------------------------------ */

      tl.to(
        fogFrontRef.current,
        {
          opacity: 0.84,
          yPercent: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 1.02,
          ease: "power4.out",
        },
        3.48,
      );

      /* ------------------------------------------------
         8. NAVBAR COMES FROM TOP
      ------------------------------------------------ */

      if (navbarElement) {
        tl.to(
          navbarElement,
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: "expo.out",
          },
          4.02,
        );
      }

      /* ------------------------------------------------
         9. LEFT / BOTTOM UI COMES LAST
      ------------------------------------------------ */

      tl.to(
        [leftUIRef.current, exploreRef.current, engineeredRef.current],
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.14,
          duration: 0.68,
          ease: "power4.out",
        },
        4.2,
      );
    }, homeRef);

    return () => {
      ctx.revert();
    };
  }, [startAnimation, heroAlreadyPlayed]);

  /* =======================================================
     DESKTOP HERO SCROLL

     Disabled on mobile.
  ======================================================= */

  useLayoutEffect(() => {
    if (!heroIntroDone) {
      return;
    }

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
  }, [heroIntroDone]);

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
      <style>{HOME_SLIDER_STYLES}</style>
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
          RETRACTABLE HERO SOUND CONTROL

          Closed:
          only the equalizer tab peeks from the right edge.

          Click:
          full AUDIO / SOUND ON-OFF pill slides into view.
      ================================================= */}

      {soundControlVisible && (
        <div
          className={[
            "ax-sound-dock",
            soundControlOpen ? "is-open" : "is-collapsed",
            soundPlaying ? "is-playing" : "is-paused",
            soundControlReady ? "is-ready" : "is-waiting",
          ].join(" ")}
          onMouseEnter={() => {
            if (soundControlOpen) {
              clearSoundCollapseTimer();
            }
          }}
          onMouseLeave={() => {
            if (soundControlOpen) {
              scheduleSoundControlCollapse();
            }
          }}
        >
          <button
            type="button"
            className="ax-sound-panel"
            onClick={() => {
              toggleHeroSound();
              scheduleSoundControlCollapse();
            }}
            aria-label={
              soundPlaying ? "Turn hero sound off" : "Turn hero sound on"
            }
          >
            <span className="ax-sound-panel-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>

            <span className="ax-sound-control-copy">
              <small>AUDIO</small>
              <strong>
                {!soundControlReady
                  ? "AUDIO READY"
                  : soundPlaying
                    ? "SOUND ON"
                    : "SOUND OFF"}
              </strong>
            </span>
          </button>

          <button
            type="button"
            className="ax-sound-handle"
            onClick={() => {
              if (soundControlOpen) {
                clearSoundCollapseTimer();
                setSoundControlOpen(false);
              } else {
                openSoundControl();
              }
            }}
            aria-label={
              soundControlOpen ? "Close sound control" : "Open sound control"
            }
            aria-expanded={soundControlOpen}
          >
            <span className="ax-sound-handle-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      )}

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
                onSlide={slideProductSection}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Home;
