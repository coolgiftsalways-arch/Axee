import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

import "../styles/bestSellers.css";

import Best from "../assets/Bestseller/bestseller.png";

import reel1 from "../assets/Bestseller/reel1.mp4";
import reel2 from "../assets/Bestseller/reel2.mp4";
import reel3 from "../assets/Bestseller/reel3.mp4";
import reel4 from "../assets/Bestseller/reel4.mp4";
import reel5 from "../assets/Bestseller/reel5.mp4";
import reel6 from "../assets/Bestseller/reel6.mp4";
import reel7 from "../assets/Bestseller/reel7.mp4";
import reel8 from "../assets/Bestseller/reel8.mp4";
import reel9 from "../assets/Bestseller/reel9.mp4";
import reel10 from "../assets/Bestseller/reel10.mp4";

const DEV_API_BASE = `http://${window.location.hostname}:5000`;

const API_BASE = (
  import.meta.env.DEV ? DEV_API_BASE : import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

console.log("BEST SELLERS API:", API_BASE);

/* =========================================================
   CATEGORY ORDER
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

const allCategoryOrder = [
  "T-SHIRTS",
  "JEANS",
  "TRACK PANTS",
  "SHIRTS",
  "SHORTS",
  "HOODIES",
  "CO-ORD SETS",
  "JACKETS",
];

const categoryTypeMap = {
  "T-SHIRTS": "tshirts",
  JEANS: "jeans",
  "TRACK PANTS": "trackpants",
  SHIRTS: "shirts",
  SHORTS: "shorts",
  HOODIES: "hoodies",
  "CO-ORD SETS": "coordsets",
  JACKETS: "jackets",
};

/* =========================================================
   GET PRODUCTS ARRAY
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
   NORMALIZE
========================================================= */

const normalizeText = (value = "") => String(value).trim().toLowerCase();

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchCategory = (product, type) => {
  const category = normalizeText(product?.category);
  const name = normalizeText(product?.name);

  if (type === "tshirts") {
    return (
      category === "t-shirts" ||
      category === "tshirts" ||
      category === "tees" ||
      category === "tee"
    );
  }

  if (type === "shirts") {
    return category === "shirts" || category === "shirt";
  }

  if (type === "hoodies") {
    return category === "hoodies" || category === "hoodie";
  }

  if (type === "shorts") {
    return category === "shorts" || category === "short";
  }

  if (type === "jackets") {
    return category === "jackets" || category === "jacket";
  }

  if (type === "coordsets") {
    return (
      category === "co-ord sets" ||
      category === "co ord sets" ||
      category === "coord sets" ||
      category === "co-ord set" ||
      category === "co ord set"
    );
  }

  if (type === "jeans") {
    const pantsCategory = category === "pants" || category === "pant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return pantsCategory && denimName;
  }

  if (type === "trackpants") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "track pants" ||
      category === "track pant";

    const isDenim =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    const importedClothing = normalizeText(product?.source) === "clothing-zip";

    return pantsCategory && !isDenim && !importedClothing;
  }

  return false;
};

/* =========================================================
   DISPLAY CATEGORY
========================================================= */

const getDisplayCategory = (product) => {
  const match = allCategoryOrder.find((label) =>
    matchCategory(product, categoryTypeMap[label]),
  );

  if (match) {
    return match;
  }

  return String(product?.category || "OTHER").toUpperCase();
};

/* =========================================================
   MAIN IMAGE
========================================================= */

const getRawProductImage = (product) => {
  const firstImage =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images[0]
      : null;

  const value = product?.image || product?.mainImage || firstImage || "";

  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    const fileId = value?.fileId || value?._id || value?.id;

    if (fileId) {
      return `/api/catalog/images/${String(fileId)}`;
    }

    return String(value?.url || value?.src || value?.path || "");
  }

  return String(value);
};

/* =========================================================
   RESOLVE MAIN IMAGE
========================================================= */

const resolveProductImage = (product) => {
  let value = getRawProductImage(product).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  if (value.startsWith("/api/images/")) {
    value = value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    value = `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  return value.startsWith("/") ? value : `/${value}`;
};

const getBestSellerImage = (product) => resolveProductImage(product);

/* =========================================================
   RESOLVE ANY SINGLE IMAGE

   This works with:
   - GridFS objects
   - image URLs
   - /api/images
   - /api/catalog/images
   - /uploads
   - frontend public images
========================================================= */

const resolveImageValue = (imageValue) => {
  if (!imageValue) {
    return "";
  }

  let value = imageValue;

  if (typeof value === "object") {
    const fileId = value?.fileId || value?._id || value?.id;

    if (fileId) {
      value = `/api/catalog/images/${String(fileId)}`;
    } else {
      value = value?.url || value?.src || value?.path || "";
    }
  }

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  if (value.startsWith("/api/images/")) {
    value = value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    value = `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  return value.startsWith("/") ? value : `/${value}`;
};

/* =========================================================
   ⭐ HOVER IMAGE

   Main image:
   product.image / mainImage / images[0]

   Hover:
   Find next DIFFERENT available image.
========================================================= */

const getProductHoverImage = (product) => {
  const imageCandidates = [
    product?.image,
    product?.mainImage,
    ...(Array.isArray(product?.images) ? product.images : []),
  ];

  const resolvedImages = imageCandidates
    .map((image) => resolveImageValue(image))
    .filter(Boolean)
    .filter((image, index, allImages) => allImages.indexOf(image) === index);

  const mainImage = getBestSellerImage(product);

  return resolvedImages.find((image) => image !== mainImage) || "";
};

/* =========================================================
   SIZE HELPERS
========================================================= */

const getBestSellerSizes = (product) => {
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
    .map((item) => (typeof item === "string" ? item : item?.size))
    .filter(Boolean);
};

/* =========================================================
   NUMBERS
========================================================= */

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const formatReviewCount = (value) => {
  const count = safeNumber(value);

  if (count >= 1000) {
    const short =
      count >= 10000
        ? Math.round(count / 1000)
        : Math.round((count / 1000) * 10) / 10;

    return `${short}K`;
  }

  return String(count);
};

const getDiscountText = (price, oldPrice) => {
  const current = safeNumber(price);
  const old = safeNumber(oldPrice);

  if (old <= current || old <= 0) {
    return "";
  }

  const discount = Math.round(((old - current) / old) * 100);

  return `${discount}% OFF`;
};

/* =========================================================
   SALES ACTIVITY
========================================================= */

const getRecentActivityText = (lastSoldAt) => {
  if (!lastSoldAt) {
    return "Popular right now";
  }

  const timestamp = new Date(lastSoldAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Popular right now";
  }

  const difference = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Sold just now";
  }

  if (minutes < 60) {
    return `Sold ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Sold ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `Sold ${days} day${days === 1 ? "" : "s"} ago`;
};

/* =========================================================
   DISPLAY PRODUCT
========================================================= */

const buildDisplayProduct = (product, salesMap) => {
  const id = String(product?._id || product?.id || "");

  const sale = salesMap.get(id);

  const price = safeNumber(product?.price);

  const oldPrice = safeNumber(product?.oldPrice);

  const sold = sale
    ? safeNumber(sale.totalSold)
    : safeNumber(product?.soldCount);

  return {
    ...product,

    id,

    _id: id,

    category: getDisplayCategory(product),

    image: resolveProductImage(product),

    price,

    oldPrice,

    rating: safeNumber(product?.rating),

    reviews: formatReviewCount(product?.reviewCount),

    sold,

    realOrderSold: safeNumber(sale?.totalSold),

    totalRevenue: safeNumber(sale?.totalRevenue),

    orderCount: safeNumber(sale?.orderCount),

    lastSoldAt: sale?.lastSoldAt || null,

    recentActivity: getRecentActivityText(sale?.lastSoldAt),

    discount: getDiscountText(price, oldPrice),
  };
};

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
   PEOPLE REELS / VIDEOS
========================================================= */

const peopleReels = [
  { id: "reel-01", video: reel1 },
  { id: "reel-02", video: reel2 },
  { id: "reel-03", video: reel3 },
  { id: "reel-04", video: reel4 },
  { id: "reel-05", video: reel5 },
  { id: "reel-06", video: reel6 },
  { id: "reel-07", video: reel7 },
  { id: "reel-08", video: reel8 },
  { id: "reel-09", video: reel9 },
  { id: "reel-10", video: reel10 },
];

/* =========================================================
   EXTRA STYLES
========================================================= */

const peopleReelStyles = `
.best-people-section {
  position: relative;
  padding: 74px 0 86px;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,.06);
  border-bottom: 1px solid rgba(255,255,255,.06);
  background:
    radial-gradient(circle at 14% 8%, rgba(190,255,0,.08), transparent 30%),
    linear-gradient(180deg, #050605 0%, #080a07 100%);
}

.best-people-section::before {
  content: "";
  position: absolute;
  width: 360px;
  height: 360px;
  right: -120px;
  top: -120px;
  border: 1px solid rgba(190,255,0,.18);
  border-radius: 50%;
  box-shadow: 0 0 90px rgba(190,255,0,.08);
  pointer-events: none;
}

.best-people-head,
.best-reel-footer {
  width: min(1480px, calc(100% - 56px));
  margin-left: auto;
  margin-right: auto;
}

.best-people-head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 34px;
}

.best-people-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #baff00;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2.8px;
}

.best-people-kicker i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #baff00;
  box-shadow: 0 0 16px #baff00;
}

.best-people-title {
  margin: 0;
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(44px, 6vw, 88px);
  line-height: .86;
  font-weight: 500;
  letter-spacing: -3px;
}

.best-people-copy {
  max-width: 390px;
  margin: 0 0 4px;
  color: rgba(255,255,255,.56);
  font-size: 13px;
  line-height: 1.7;
}

.best-reel-viewport {
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  cursor: grab;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
}

.best-reel-viewport::-webkit-scrollbar {
  display: none;
}

.best-reel-viewport.is-paused {
  cursor: default;
}

.best-reel-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: clamp(250px, 20vw, 330px);
  gap: 14px;
  width: max-content;
  padding: 2px 28px 12px;
}

.best-reel-card {
  position: relative;
  height: 500px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 20px;
  background: #080908;
  isolation: isolate;
  transform: translateZ(0);
}

.best-reel-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(180deg, rgba(0,0,0,.2) 0%, transparent 34%, rgba(0,0,0,.83) 100%);
  pointer-events: none;
}

.best-reel-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #050505;
  filter: saturate(.9) contrast(1.05) brightness(.88);
  transform: scale(1.01);
  transition: transform .7s cubic-bezier(.2,.8,.2,1), filter .5s ease;
}

.best-reel-card:hover .best-reel-video {
  transform: scale(1.045);
  filter: saturate(1) contrast(1.03) brightness(.98);
}

.best-reel-number {
  position: absolute;
  z-index: 5;
  top: 15px;
  left: 15px;
  min-height: 29px;
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  background: rgba(5,6,5,.55);
  backdrop-filter: blur(10px);
  color: rgba(255,255,255,.92);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.best-reel-controls {
  position: absolute;
  z-index: 7;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 7px;
}

.best-reel-control {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 50%;
  background: rgba(5,6,5,.64);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: background .25s ease, color .25s ease, border-color .25s ease, transform .25s ease;
}

.best-reel-control:hover {
  color: #c7ff13;
  border-color: rgba(199,255,19,.72);
  background: rgba(5,7,4,.82);
  transform: translateY(-1px);
}

.best-reel-control.active {
  background: #c7ff13;
  border-color: #c7ff13;
  color: #050505;
}

.best-reel-center-play {
  position: absolute;
  z-index: 6;
  left: 50%;
  top: 48%;
  width: 62px;
  height: 62px;
  transform: translate(-50%, -50%) scale(.92);
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(199,255,19,.72);
  border-radius: 50%;
  background: rgba(5,7,4,.55);
  color: #c7ff13;
  opacity: 0;
  pointer-events: none;
  backdrop-filter: blur(10px);
  transition: opacity .25s ease, transform .25s ease;
}

.best-reel-card.is-paused .best-reel-center-play {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.best-reel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;
  color: rgba(255,255,255,.42);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.best-reel-footer strong {
  color: #baff00;
  font-weight: 700;
}

@media (max-width: 900px) {
  .best-people-section { padding: 58px 0 68px; }
  .best-people-head, .best-reel-footer { width: min(calc(100% - 36px), 760px); }
  .best-people-head { align-items: flex-start; flex-direction: column; margin-bottom: 26px; }
  .best-people-copy { max-width: 520px; }
  .best-reel-track { grid-auto-columns: minmax(235px, 58vw); gap: 12px; padding-left: 18px; padding-right: 18px; }
  .best-reel-card { height: 440px; }
}

@media (max-width: 560px) {
  .best-people-section { padding: 48px 0 56px; }
  .best-people-head, .best-reel-footer { width: calc(100% - 28px); }
  .best-people-title { font-size: 44px; letter-spacing: -2px; }
  .best-people-copy { font-size: 11px; line-height: 1.6; }
  .best-reel-track { grid-auto-columns: 78vw; gap: 10px; padding-left: 14px; padding-right: 14px; }
  .best-reel-card { height: min(68vh, 500px); min-height: 390px; border-radius: 16px; }
  .best-reel-controls { top: 11px; right: 11px; }
  .best-reel-control { width: 38px; height: 38px; }
  .best-reel-number { top: 11px; left: 11px; min-height: 27px; font-size: 8px; }
  .best-reel-footer { margin-top: 14px; font-size: 7px; letter-spacing: 1px; }
}

/* =========================================================
   ⭐ PRODUCT HOVER IMAGE
========================================================= */

.best-product-image {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.best-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.best-product-image
.best-image-main,
.best-product-image
.best-image-hover {
  transition:
    opacity .42s ease,
    transform .72s
      cubic-bezier(.2,.8,.2,1);

  will-change:
    opacity,
    transform;
}

.best-product-image
.best-image-main {
  position: relative;
  z-index: 0;
  opacity: 1;
  transform: scale(1);
}

.best-product-image
.best-image-hover {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  transform: scale(1.045);
  pointer-events: none;
}

/* Main image disappears */

.best-product-card:hover
.best-image-main {
  opacity: 0;
  transform: scale(1.035);
}

/* Second image appears */

.best-product-card:hover
.best-image-hover {
  opacity: 1;
  transform: scale(1);
}

/* ========================================================= */

.best-card-actions {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.best-card-actions button {
  min-height: 38px;
  border-radius: 8px;
  border:
    1px solid
    rgba(255,255,255,.14);
  background: #0b0d0b;
  color: #fff;
  font: inherit;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.1px;
  cursor: pointer;

  transition:
    border-color .2s ease,
    background .2s ease,
    color .2s ease,
    transform .2s ease;
}

.best-card-actions button:hover {
  transform:
    translateY(-1px);

  border-color:
    rgba(190,255,0,.7);
}

.best-card-actions
.best-add-cart {
  color: #c6ff13;

  border-color:
    rgba(190,255,0,.32);
}

.best-card-actions
.best-add-cart.added {
  background: #c6ff13;
  border-color: #c6ff13;
  color: #050505;
}

.best-card-actions
.best-buy-now {
  background: #c6ff13;
  border-color: #c6ff13;
  color: #050505;
}

@media (max-width: 900px) {
  .best-people-section {
    padding:
      60px 18px 70px;
  }

  .best-people-head {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .best-people-copy {
    max-width: 520px;
  }

  .best-reel-track {
    grid-auto-columns:
      minmax(220px, 58vw);
  }

  .best-reel-card {
    height: 390px;
  }
}

@media (max-width: 560px) {
  .best-people-title {
    font-size: 46px;
    letter-spacing: -2px;
  }

  .best-reel-track {
    grid-auto-columns:
      76vw;
  }

  .best-reel-card {
    height: 410px;
  }

  .best-card-actions {
    grid-template-columns:
      1fr;
  }
}
`;

/* =========================================================
   COMMUNITY VIDEO CARD
========================================================= */

function CommunityVideoCard({ reel, index, soundActive, onToggleSound }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !soundActive;

    if (isPlaying) {
      const playPromise = video.play();

      if (playPromise?.catch) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
  }, [soundActive, isPlaying]);

  const togglePlayback = (event) => {
    event.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = (event) => {
    event.stopPropagation();

    const video = videoRef.current;

    if (video) {
      const turningSoundOn = !soundActive;

      video.muted = !turningSoundOn;
      video.volume = 1;

      if (video.paused) {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    }

    onToggleSound(reel.id);
  };

  return (
    <article
      className={isPlaying ? "best-reel-card" : "best-reel-card is-paused"}
    >
      <video
        ref={videoRef}
        className="best-reel-video"
        src={reel.video}
        autoPlay
        muted={!soundActive}
        loop
        playsInline
        preload="metadata"
        aria-label={`Community reel ${index + 1}`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <span className="best-reel-number">
        REEL / {String(index + 1).padStart(2, "0")}
      </span>

      <div className="best-reel-controls">
        <button
          type="button"
          className={
            soundActive ? "best-reel-control active" : "best-reel-control"
          }
          onClick={toggleSound}
          aria-label={
            soundActive ? `Mute reel ${index + 1}` : `Unmute reel ${index + 1}`
          }
          title={soundActive ? "Mute" : "Sound on"}
        >
          {soundActive ? (
            <Volume2 size={16} strokeWidth={1.8} />
          ) : (
            <VolumeX size={16} strokeWidth={1.8} />
          )}
        </button>

        <button
          type="button"
          className="best-reel-control"
          onClick={togglePlayback}
          aria-label={
            isPlaying ? `Pause reel ${index + 1}` : `Play reel ${index + 1}`
          }
          title={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>
      </div>

      <div className="best-reel-center-play" aria-hidden="true">
        <Play size={22} fill="currentColor" />
      </div>
    </article>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

function BestSellers() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("ALL CATEGORIES");

  const [activePeriod, setActivePeriod] = useState("TODAY");

  const [sortMode, setSortMode] = useState("BEST SELLING");

  const [liked, setLiked] = useState([]);

  const [addedToCartId, setAddedToCartId] = useState("");

  const [catalogProducts, setCatalogProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);

  const [productsError, setProductsError] = useState("");

  const reelViewportRef = useRef(null);

  const [isReelSliderPaused, setIsReelSliderPaused] = useState(false);

  const [activeSoundId, setActiveSoundId] = useState(null);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadBestSellers = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const catalogResponse = await fetch(
          `${API_BASE}/api/catalog/products`,
          {
            cache: "no-store",
          },
        );

        if (!catalogResponse.ok) {
          throw new Error(
            `Unable to load catalog products (${catalogResponse.status})`,
          );
        }

        const catalogData = await catalogResponse.json();

        const allProducts = extractProducts(catalogData);

        let sales = [];

        try {
          const salesResponse = await fetch(
            `${API_BASE}/api/orders/best-sellers?limit=50`,
            {
              cache: "no-store",
            },
          );

          if (salesResponse.ok) {
            const salesData = await salesResponse.json();

            sales = Array.isArray(salesData?.bestSellers)
              ? salesData.bestSellers
              : [];
          } else {
            console.warn(
              "Best sellers sales API returned:",
              salesResponse.status,
            );
          }
        } catch (salesError) {
          console.warn("Sales data could not load:", salesError);
        }

        const salesMap = new Map(
          sales
            .filter((item) => item?.productId)
            .map((item) => [String(item.productId), item]),
        );

        const realProducts = allProducts
          .filter((product) => product?.isActive !== false)
          .map((product) => buildDisplayProduct(product, salesMap))
          .filter(
            (product) =>
              product.id && allCategoryOrder.includes(product.category),
          );

        if (!cancelled) {
          setCatalogProducts(realProducts);
        }
      } catch (error) {
        console.error("BEST SELLERS LOAD ERROR:", error);

        if (!cancelled) {
          setCatalogProducts([]);

          setProductsError(error?.message || "Unable to load best sellers.");
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadBestSellers();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     AUTO VIDEO SLIDER

     Increasing scrollLeft makes the cards move visually
     from right to left. Hover/touch pauses the rail.
  ======================================================= */

  useEffect(() => {
    const viewport = reelViewportRef.current;

    if (!viewport) return;

    let animationFrame = 0;
    let previousTime = performance.now();

    const moveSlider = (time) => {
      const delta = Math.min(64, time - previousTime) / 1000;
      previousTime = time;

      if (!isReelSliderPaused) {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;

        if (maxScroll > 0) {
          const mobile = window.innerWidth <= 560;
          const speed = mobile ? 28 : 38;
          const next = viewport.scrollLeft + speed * delta;

          viewport.scrollLeft = next >= maxScroll - 1 ? 0 : next;
        }
      }

      animationFrame = requestAnimationFrame(moveSlider);
    };

    animationFrame = requestAnimationFrame(moveSlider);

    return () => cancelAnimationFrame(animationFrame);
  }, [isReelSliderPaused]);

  /* =======================================================
     RANK PRODUCTS
  ======================================================= */

  const rankedProducts = useMemo(() => {
    const result = [];

    allCategoryOrder.forEach((category) => {
      const categoryProducts = catalogProducts
        .filter((product) => product.category === category)
        .sort((a, b) => {
          if (b.realOrderSold !== a.realOrderSold) {
            return b.realOrderSold - a.realOrderSold;
          }

          if (b.sold !== a.sold) {
            return b.sold - a.sold;
          }

          if (Number(b.bestSeller) !== Number(a.bestSeller)) {
            return Number(b.bestSeller) - Number(a.bestSeller);
          }

          if (Number(b.featured) !== Number(a.featured)) {
            return Number(b.featured) - Number(a.featured);
          }

          return safeNumber(b.rating) - safeNumber(a.rating);
        })
        .map((product, index) => ({
          ...product,

          rank: index + 1,
        }));

      result.push(...categoryProducts);
    });

    return result;
  }, [catalogProducts]);

  /* =======================================================
     VISIBLE PRODUCTS
  ======================================================= */

  const visibleProducts = useMemo(() => {
    if (activeCategory === "ALL CATEGORIES") {
      return allCategoryOrder
        .map((category) =>
          rankedProducts.find(
            (product) => product.category === category && product.rank === 1,
          ),
        )
        .filter(Boolean);
    }

    let result = rankedProducts.filter(
      (product) => product.category === activeCategory,
    );

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

    return result.slice(0, 8);
  }, [activeCategory, rankedProducts, sortMode]);

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
     OPEN PRODUCT
  ======================================================= */

  const openProduct = (product) => {
    navigate(`/product/${product.id}`);
  };

  /* =======================================================
     ADD CART
  ======================================================= */

  const addBestSellerToCart = async (product) => {
    try {
      const sizes = getBestSellerSizes(product);

      const size = sizes[0] || "ONE SIZE";

      let cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        cartId = crypto.randomUUID();

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

          productId: product.id,

          name: product.name,

          category: product.category,

          price: Number(product.price || 0),

          image: getBestSellerImage(product),

          size,

          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not add product to cart.");
      }

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data?.cart,
        }),
      );

      setAddedToCartId(product.id);

      window.setTimeout(() => {
        setAddedToCartId((current) => (current === product.id ? "" : current));
      }, 1500);
    } catch (error) {
      console.error("BEST SELLER ADD TO CART ERROR:", error);

      alert(error.message || "Unable to add product to cart.");
    }
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const buyBestSeller = (product) => {
    localStorage.removeItem("axiee-buy-now");

    navigate(`/product/${product.id}`);
  };

  /* =======================================================
     SCROLL
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
      <style>{peopleReelStyles}</style>

      {/* =============================
          HERO
      ============================= */}

      <section className="best-hero">
        <div className="best-hero-grid" />

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

        <div className="best-hero-collage">
          <div className="best-main-image best-main-image-full">
            <img src={Best} alt="Best selling fashion" />

            <div className="best-hero-image-overlay" />

            <div className="best-hero-image-number">01 / BEST SELLERS</div>
          </div>

          <div className="best-collage-line" />
        </div>
      </section>

      {/* =============================
          STATS
      ============================= */}

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

      {/* =============================
          CATEGORY FILTER
      ============================= */}

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

      {/* =============================
          PRODUCTS
      ============================= */}

      <section className="best-products">
        <div className="best-products-head">
          <div>
            <span className="best-products-category">{activeCategory}</span>

            <h2>
              {activeCategory === "ALL CATEGORIES"
                ? "TOP 8 BEST SELLERS"
                : `TOP 8 ${activeCategory}`}
            </h2>

            <p>Real products from your store, ranked by sales.</p>
          </div>

          <div className="best-period-wrapper">
            <div className="best-live-update">
              <i />
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

        {productsLoading && (
          <div
            style={{
              padding: "34px 0",

              color: "rgba(255,255,255,.55)",

              fontSize: "11px",

              letterSpacing: "1.4px",
            }}
          >
            LOADING REAL BEST SELLERS...
          </div>
        )}

        {!productsLoading && productsError && (
          <div
            style={{
              padding: "34px 0",

              color: "#ff7777",

              fontSize: "11px",

              letterSpacing: "1px",
            }}
          >
            {productsError}
          </div>
        )}

        {!productsLoading && !productsError && visibleProducts.length === 0 && (
          <div
            style={{
              padding: "34px 0",

              color: "rgba(255,255,255,.55)",

              fontSize: "11px",

              letterSpacing: "1.2px",
            }}
          >
            NO ACTIVE PRODUCTS FOUND FOR THIS CATEGORY.
          </div>
        )}

        {/* =============================
            PRODUCT GRID
        ============================= */}

        <div className="best-product-grid best-eight-grid">
          {visibleProducts.map((product, index) => {
            const displayRank =
              activeCategory === "ALL CATEGORIES" ? index + 1 : product.rank;

            const hoverImage = getProductHoverImage(product);

            return (
              <article
                key={product.id}
                className={
                  displayRank === 1
                    ? "best-product-card winner"
                    : "best-product-card"
                }
              >
                {/* =============================
                      PRODUCT IMAGE
                  ============================= */}

                <div
                  className="best-product-image"
                  role="button"
                  tabIndex={0}
                  onClick={() => openProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();

                      openProduct(product);
                    }
                  }}
                  aria-label={`View ${product.name}`}
                >
                  {/* MAIN IMAGE */}

                  <img
                    className="best-image-main"
                    src={getBestSellerImage(product)}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      console.error(
                        "Product image failed:",
                        product.name,
                        getBestSellerImage(product),
                      );

                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />

                  {/* ⭐ SECOND IMAGE ON HOVER */}

                  {hoverImage && (
                    <img
                      className="best-image-hover"
                      src={hoverImage}
                      alt={`${product.name} alternate view`}
                      loading="lazy"
                      onError={(event) => {
                        console.error(
                          "Product hover image failed:",
                          product.name,
                          hoverImage,
                        );

                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <div className="best-rank">#{displayRank}</div>

                  {displayRank === 1 && <div className="best-crown">♛</div>}

                  <button
                    type="button"
                    className={
                      liked.includes(product.id)
                        ? "best-like liked"
                        : "best-like"
                    }
                    onClick={(event) => {
                      event.stopPropagation();

                      toggleLike(product.id);
                    }}
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      size={18}
                      fill={
                        liked.includes(product.id) ? "currentColor" : "none"
                      }
                    />
                  </button>

                  <div className="best-image-shade" />
                </div>

                {/* =============================
                      CONTENT
                  ============================= */}

                <div className="best-product-content">
                  <span className="best-card-category">{product.category}</span>

                  <h3>{product.name}</h3>

                  <div className="best-rating">
                    <Star size={11} fill="currentColor" />

                    <strong>{product.rating}</strong>

                    <span>({product.reviews})</span>
                  </div>

                  <div className="best-sold">
                    {product.sold.toLocaleString("en-IN")}+ sold
                  </div>

                  <div className="best-price-row">
                    <div>
                      <strong>₹{product.price.toLocaleString("en-IN")}</strong>

                      {product.oldPrice > product.price && (
                        <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>
                      )}
                    </div>

                    {product.discount && (
                      <span className="best-discount">{product.discount}</span>
                    )}
                  </div>

                  <div className="best-activity">
                    <span>⚡</span>

                    {product.recentActivity}
                  </div>

                  <div className="best-card-actions">
                    <button
                      type="button"
                      className={
                        addedToCartId === product.id
                          ? "best-add-cart added"
                          : "best-add-cart"
                      }
                      onClick={() => addBestSellerToCart(product)}
                    >
                      {addedToCartId === product.id ? "ADDED ✓" : "ADD TO CART"}
                    </button>

                    <button
                      type="button"
                      className="best-buy-now"
                      onClick={() => buyBestSeller(product)}
                    >
                      BUY NOW →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =============================
          PEOPLE / VIDEO REELS
      ============================= */}

      <section className="best-people-section">
        <div className="best-people-head">
          <div>
            <span className="best-people-kicker">
              <i />
              COMMUNITY / 10 VIDEO REELS
            </span>

            <h2 className="best-people-title">
              WORN BY
              <br />
              REAL PEOPLE
            </h2>
          </div>

          <p className="best-people-copy">
            Ten community videos play automatically while the reel rail moves
            from right to left. Hover the rail to pause the movement, or use the
            sound and play controls on any reel.
          </p>
        </div>

        <div
          ref={reelViewportRef}
          className={
            isReelSliderPaused
              ? "best-reel-viewport is-paused"
              : "best-reel-viewport"
          }
          onMouseEnter={() => setIsReelSliderPaused(true)}
          onMouseLeave={() => setIsReelSliderPaused(false)}
          onTouchStart={() => setIsReelSliderPaused(true)}
          onTouchEnd={() => setIsReelSliderPaused(false)}
          onTouchCancel={() => setIsReelSliderPaused(false)}
          aria-label="Auto moving community video reels"
        >
          <div className="best-reel-track">
            {peopleReels.map((reel, index) => (
              <CommunityVideoCard
                key={reel.id}
                reel={reel}
                index={index}
                soundActive={activeSoundId === reel.id}
                onToggleSound={(id) => {
                  setActiveSoundId((current) => (current === id ? null : id));
                }}
              />
            ))}
          </div>
        </div>

        <div className="best-reel-footer">
          <strong>#UNBOUNDPEOPLE</strong>
        </div>
      </section>

      {/* =============================
          BOTTOM INSIGHTS
      ============================= */}
    </main>
  );
}

export default BestSellers;
