import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import "../styles/bestSellers.css";

import Best from "../assets/Bestseller/bestseller.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   CATEGORY ORDER

   This matches your Explore menu:
   01 T-SHIRTS
   02 JEANS
   03 TRACK PANTS
   04 SHIRTS
   05 SHORTS
   06 HOODIES
   07 CO-ORD SETS
   08 JACKETS
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
   GET PRODUCTS ARRAY FROM API RESPONSE
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
   SAME CATEGORY RULES AS useCategoryProducts.js
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

  /*
    Imported jeans are currently stored as Pants,
    so identify them using denim/jean in the name.
  */
  if (type === "jeans") {
    const pantsCategory = category === "pants" || category === "pant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return pantsCategory && denimName;
  }

  /*
    Track pants can also be stored as Pants.
    Exclude denim/imported clothing exactly like your hook.
  */
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
   FIND DISPLAY CATEGORY
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
   IMAGE HELPERS

   Uses the SAME MongoDB/GridFS image returned by
   /api/catalog/products.
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

  /*
    API and upload paths belong to backend.
  */
  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  /*
    Public frontend assets such as /products/file.jpg
    should stay on the frontend origin.
  */
  return value.startsWith("/") ? value : `/${value}`;
};

const getBestSellerImage = (product) => resolveProductImage(product);

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

      /*
        If stock exists, only choose sizes that have stock.
        If stock is absent, keep the size.
      */
      if (item?.stock !== undefined && item?.stock !== null) {
        return Number(item.stock) > 0;
      }

      return true;
    })
    .map((item) => (typeof item === "string" ? item : item?.size))
    .filter(Boolean);
};

/* =========================================================
   NUMBER HELPERS
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
   SALES / ACTIVITY
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
   MERGE REAL CATALOG PRODUCT + REAL ORDER SALES
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
   PEOPLE / REELS
   Portrait fashion content shown between products + insights.
========================================================= */

const peopleReels = [
  {
    id: "reel-01",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=88",
    name: "VOID HOODIE",
    meta: "MUMBAI / 00:12",
    handle: "@unbound.people",
  },
  {
    id: "reel-02",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=88",
    name: "SHADOW DENIM",
    meta: "DELHI / 00:09",
    handle: "@unbound.people",
  },
  {
    id: "reel-03",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=88",
    name: "SYSTEM SHIRT",
    meta: "BANGALORE / 00:14",
    handle: "@unbound.people",
  },
  {
    id: "reel-04",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=88",
    name: "VOID JACKET",
    meta: "PUNE / 00:11",
    handle: "@unbound.people",
  },
  {
    id: "reel-05",
    image:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&q=88",
    name: "MOTION TRACK",
    meta: "HYDERABAD / 00:08",
    handle: "@unbound.people",
  },
  {
    id: "reel-06",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=88",
    name: "VOID CO-ORD",
    meta: "GOA / 00:13",
    handle: "@unbound.people",
  },
];

const peopleReelStyles = `
  .best-people-section {
    position: relative;
    padding: 84px 28px 92px;
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
    max-width: 370px;
    margin: 0 0 4px;
    color: rgba(255,255,255,.56);
    font-size: 13px;
    line-height: 1.7;
  }

  .best-reel-viewport {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    cursor: grab;
  }

  .best-reel-viewport::-webkit-scrollbar {
    display: none;
  }

  .best-reel-track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(235px, 20vw);
    gap: 14px;
    width: max-content;
    padding: 2px 2px 10px;
  }

  .best-reel-card {
    position: relative;
    height: 430px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 18px;
    background: #0a0b09;
    isolation: isolate;
  }

  .best-reel-card::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    background:
      linear-gradient(180deg, rgba(0,0,0,.08) 30%, rgba(0,0,0,.8) 100%);
    pointer-events: none;
  }

  .best-reel-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: saturate(.82) contrast(1.05) brightness(.8);
    transform: scale(1.01);
    transition: transform .65s cubic-bezier(.2,.8,.2,1),
                filter .65s ease;
  }

  .best-reel-card:hover img {
    transform: scale(1.07);
    filter: saturate(1) contrast(1.04) brightness(.92);
  }

  .best-reel-number,
  .best-reel-social {
    position: absolute;
    z-index: 4;
    top: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 999px;
    background: rgba(5,6,5,.55);
    backdrop-filter: blur(10px);
    color: rgba(255,255,255,.9);
    font-size: 9px;
    letter-spacing: 1.3px;
  }

  .best-reel-number {
    left: 16px;
  }

  .best-reel-social {
    right: 16px;
    width: 30px;
    padding: 0;
  }

  .best-reel-play {
    position: absolute;
    z-index: 5;
    left: 50%;
    top: 48%;
    width: 58px;
    height: 58px;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    border: 1px solid rgba(190,255,0,.72);
    border-radius: 50%;
    background: rgba(5,7,4,.58);
    color: #c6ff13;
    box-shadow: 0 0 0 8px rgba(190,255,0,.04), 0 0 34px rgba(190,255,0,.14);
    backdrop-filter: blur(10px);
    transition: transform .25s ease, background .25s ease;
  }

  .best-reel-card:hover .best-reel-play {
    transform: translate(-50%, -50%) scale(1.08);
    background: rgba(190,255,0,.13);
  }

  .best-reel-info {
    position: absolute;
    z-index: 4;
    left: 18px;
    right: 18px;
    bottom: 18px;
  }

  .best-reel-handle {
    display: block;
    margin-bottom: 5px;
    color: #baff00;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
  }

  .best-reel-name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #fff;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -.2px;
  }

  .best-reel-meta {
    display: block;
    margin-top: 6px;
    color: rgba(255,255,255,.55);
    font-size: 9px;
    letter-spacing: 1.4px;
  }

  .best-reel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-top: 22px;
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
    .best-people-section {
      padding: 60px 18px 70px;
    }

    .best-people-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .best-people-copy {
      max-width: 520px;
    }

    .best-reel-track {
      grid-auto-columns: minmax(220px, 58vw);
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
      grid-auto-columns: 76vw;
    }

    .best-reel-card {
      height: 410px;
    }
  }

  .best-product-image {
    cursor: pointer;
  }

  .best-product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .best-card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;
  }

  .best-card-actions button {
    min-height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.14);
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
    transform: translateY(-1px);
    border-color: rgba(190,255,0,.7);
  }

  .best-card-actions .best-add-cart {
    color: #c6ff13;
    border-color: rgba(190,255,0,.32);
  }

  .best-card-actions .best-add-cart.added {
    background: #c6ff13;
    border-color: #c6ff13;
    color: #050505;
  }

  .best-card-actions .best-buy-now {
    background: #c6ff13;
    border-color: #c6ff13;
    color: #050505;
  }

  @media (max-width: 560px) {
    .best-card-actions {
      grid-template-columns: 1fr;
    }
  }
`;

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

  /* =======================================================
     LOAD REAL MONGODB PRODUCTS + REAL ORDER SALES
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadBestSellers = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        /*
          Same source used by your category pages:
          GET ALL MongoDB catalog products.
        */
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

        /*
          Load actual order sales too.
          Use 50 rather than 8 because we need to find
          the winner INSIDE every category.
        */
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
          /*
            Catalog should still render even if there
            are no orders yet or the sales endpoint
            temporarily fails.
          */
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
     RANK EVERY REAL PRODUCT INSIDE ITS OWN CATEGORY
  ======================================================= */

  const rankedProducts = useMemo(() => {
    const result = [];

    allCategoryOrder.forEach((category) => {
      const categoryProducts = catalogProducts
        .filter((product) => product.category === category)
        .sort((a, b) => {
          /*
                1. Actual order quantity
                2. Product model soldCount
                3. manually marked bestSeller
                4. featured
                5. rating
              */
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
     PRODUCTS TO DISPLAY
  ======================================================= */

  const visibleProducts = useMemo(() => {
    /*
      ALL CATEGORIES:
      exactly ONE real winning product from each Explore category.
    */
    if (activeCategory === "ALL CATEGORIES") {
      return allCategoryOrder
        .map((category) =>
          rankedProducts.find(
            (product) => product.category === category && product.rank === 1,
          ),
        )
        .filter(Boolean);
    }

    /*
      CATEGORY FILTER:
      Show real MongoDB products from the selected category.
    */
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
     PRODUCT ACTIONS
  ======================================================= */

  const openProduct = (product) => {
    navigate(`/product/${product.id}`);
  };

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

  const buyBestSeller = (product) => {
    localStorage.removeItem("axiee-buy-now");
    navigate(`/product/${product.id}`);
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
      <style>{peopleReelStyles}</style>
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

            <p>Real products from your store, ranked by sales.</p>
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
                  <img
                    src={getBestSellerImage(product)}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      console.error(
                        "Product image failed:",
                        product.name,
                        getBestSellerImage(product),
                      );

                      event.currentTarget.style.opacity = "0";
                    }}
                  />

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

                      {product.oldPrice > product.price && (
                        <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>
                      )}
                    </div>

                    {product.discount && (
                      <span className="best-discount">{product.discount}</span>
                    )}
                  </div>

                  {/* ACTIVITY */}

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

      {/* ===================================================
          PEOPLE / REELS
      =================================================== */}

      <section className="best-people-section">
        <div className="best-people-head">
          <div>
            <span className="best-people-kicker">
              <i></i>
              COMMUNITY / REELS
            </span>

            <h2 className="best-people-title">
              WORN BY
              <br />
              REAL PEOPLE
            </h2>
          </div>

          <p className="best-people-copy">
            Street fits, daily rotation and UNBOUND pieces in motion. Scroll
            through the community and discover how the collection lives outside
            the studio.
          </p>
        </div>

        <div className="best-reel-viewport">
          <div className="best-reel-track">
            {peopleReels.map((reel, index) => (
              <article key={reel.id} className="best-reel-card">
                <img
                  src={reel.image}
                  alt={`${reel.name} street style`}
                  loading="lazy"
                />

                <span className="best-reel-number">
                  REEL / {String(index + 1).padStart(2, "0")}
                </span>

                <span className="best-reel-social" aria-hidden="true">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4.2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <circle cx="17.4" cy="6.8" r="1.1" fill="currentColor" />
                  </svg>
                </span>

                <button
                  type="button"
                  className="best-reel-play"
                  aria-label={`Play ${reel.name} reel`}
                >
                  <Play size={20} fill="currentColor" />
                </button>

                <div className="best-reel-info">
                  <span className="best-reel-handle">{reel.handle}</span>

                  <div className="best-reel-name">
                    <span>{reel.name}</span>
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </div>

                  <span className="best-reel-meta">{reel.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="best-reel-footer">
          <span>DRAG / SCROLL TO EXPLORE</span>
          <strong>#UNBOUNDPEOPLE</strong>
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
