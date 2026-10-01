import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import gsap from "gsap";

import products from "../data/products";

import "../styles/productDetails.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : "")
).replace(/\/+$/, "");

console.log("🌐 PRODUCT DETAILS API:", API_BASE || "same-domain");

/* =========================================================
   SAFE CART ID

   crypto.randomUUID() can be unavailable when the website is
   opened on a phone through a local HTTP address such as:

   http://192.168.x.x:5178

   This helper:
   1. Uses randomUUID() when available.
   2. Falls back to crypto.getRandomValues().
   3. Uses a final timestamp/random fallback if needed.
========================================================= */

const createSafeUUID = () => {
  const webCrypto =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);

    webCrypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `cart-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}-${Math.random().toString(16).slice(2)}`;
};

/* =========================================================
   SAFE API RESPONSE
========================================================= */

const readJsonResponse = async (response, label = "Product API") => {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(
        `${label} failed (${response.status} ${
          response.statusText || ""
        })`.trim(),
      );
    }

    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`❌ ${label} returned non-JSON:`, {
      status: response.status,

      statusText: response.statusText,

      url: response.url,

      body: text.slice(0, 500),
    });

    throw new Error(
      `${label} returned an invalid response (${response.status}).`,
    );
  }
};

/* =========================================================
   IMAGE URL
========================================================= */

const resolveImageUrl = (value) => {
  if (!value) {
    return "";
  }

  /* =======================================================
     IMAGE OBJECT

     IMPORTANT:
     Prefer the real saved URL before any _id/id field.
     Some image objects can have their own MongoDB subdocument
     _id which is NOT the GridFS file id.
  ======================================================= */

  if (typeof value === "object") {
    const directUrl =
      value?.url ||
      value?.src ||
      value?.path ||
      value?.image ||
      value?.imageUrl ||
      value?.location ||
      "";

    if (directUrl) {
      return resolveImageUrl(directUrl);
    }

    const fileId = value?.fileId;

    if (fileId) {
      return `${API_BASE}/api/catalog/images/${String(fileId)}`;
    }

    return "";
  }

  const url = String(value).trim();

  if (!url) {
    return "";
  }

  /* =======================================================
     OLD GRIDFS

     Handles both:
     /api/images/ID
     http://localhost:5000/api/images/ID
  ======================================================= */

  if (url.includes("/api/images/")) {
    const imageId = url.split("/api/images/")[1]?.split(/[?#]/)[0];

    if (imageId) {
      return `${API_BASE}/api/catalog/images/${imageId}`;
    }
  }

  /* =======================================================
     CURRENT GRIDFS

     Rebuild with the CURRENT API_BASE.
     This also fixes old localhost URLs saved in MongoDB.
  ======================================================= */

  if (url.includes("/api/catalog/images/")) {
    const imageId = url.split("/api/catalog/images/")[1]?.split(/[?#]/)[0];

    if (imageId) {
      return `${API_BASE}/api/catalog/images/${imageId}`;
    }
  }

  /* =======================================================
     FULL URL / DATA / BLOB
  ======================================================= */

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  /* =======================================================
     OTHER BACKEND API
  ======================================================= */

  if (url.startsWith("/api/")) {
    return `${API_BASE}${url}`;
  }

  if (url.startsWith("api/")) {
    return `${API_BASE}/${url}`;
  }

  /* =======================================================
     STATIC / PUBLIC IMAGE
  ======================================================= */

  if (url.startsWith("product-images/")) {
    return `/${url}`;
  }

  return url;
};

/* =========================================================
   CHECK MONGODB ID
========================================================= */

const isMongoId = (value) => {
  return /^[a-f\d]{24}$/i.test(value || "");
};

/* =========================================================
   EXTRACT PRODUCTS
========================================================= */

const extractProducts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

/* =========================================================
   SIZE GUIDE

   This chart is a GENERAL INDIA / SOUTH-ASIAN menswear reference.

   IMPORTANT:
   - It is a measurement guide only.
   - It does NOT show inventory / stock status.
   - The chart changes automatically by product category.
   - Actual purchasable sizes still come from MongoDB product.sizes.
========================================================= */

const SIZE_GUIDE_LIBRARY = {
  tshirt: {
    eyebrow: "T-SHIRT / TEE",
    title: "T-SHIRT SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "length", label: "LENGTH" },
      { key: "shoulder", label: "SHOULDER" },
      { key: "sleeve", label: "SLEEVE" },
    ],
    rows: [
      { size: "XS", chest: "36", length: "26", shoulder: "16.5", sleeve: "8" },
      { size: "S", chest: "38", length: "27", shoulder: "17", sleeve: "8.5" },
      { size: "M", chest: "40", length: "28", shoulder: "18", sleeve: "9" },
      { size: "L", chest: "42", length: "29", shoulder: "19", sleeve: "9.5" },
      { size: "XL", chest: "44", length: "30", shoulder: "20", sleeve: "10" },
      {
        size: "XXL",
        chest: "46",
        length: "31",
        shoulder: "21",
        sleeve: "10.5",
      },
    ],
    fitTip:
      "For an oversized streetwear fit, choose one size larger than your regular fitted T-shirt size.",
  },

  shirt: {
    eyebrow: "SHIRT",
    title: "SHIRT SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "length", label: "LENGTH" },
      { key: "shoulder", label: "SHOULDER" },
      { key: "sleeve", label: "SLEEVE" },
    ],
    rows: [
      { size: "S", chest: "38", length: "28", shoulder: "17", sleeve: "24" },
      { size: "M", chest: "40", length: "29", shoulder: "18", sleeve: "24.5" },
      { size: "L", chest: "42", length: "30", shoulder: "19", sleeve: "25" },
      { size: "XL", chest: "44", length: "31", shoulder: "20", sleeve: "25.5" },
      { size: "XXL", chest: "46", length: "32", shoulder: "21", sleeve: "26" },
    ],
    fitTip:
      "Choose your regular size for a relaxed shirt fit. Size up once for a looser overshirt silhouette.",
  },

  hoodie: {
    eyebrow: "HOODIE",
    title: "HOODIE SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "length", label: "LENGTH" },
      { key: "shoulder", label: "SHOULDER" },
      { key: "sleeve", label: "SLEEVE" },
    ],
    rows: [
      { size: "S", chest: "40", length: "26", shoulder: "18", sleeve: "24" },
      { size: "M", chest: "42", length: "27", shoulder: "19", sleeve: "24.5" },
      { size: "L", chest: "44", length: "28", shoulder: "20", sleeve: "25" },
      { size: "XL", chest: "46", length: "29", shoulder: "21", sleeve: "25.5" },
      { size: "XXL", chest: "48", length: "30", shoulder: "22", sleeve: "26" },
    ],
    fitTip:
      "Hoodies are intended to feel relaxed. Size up once for a heavier oversized streetwear fit.",
  },

  sweatshirt: {
    eyebrow: "SWEATSHIRT",
    title: "SWEATSHIRT SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "length", label: "LENGTH" },
      { key: "shoulder", label: "SHOULDER" },
      { key: "sleeve", label: "SLEEVE" },
    ],
    rows: [
      { size: "S", chest: "40", length: "26", shoulder: "18", sleeve: "23.5" },
      { size: "M", chest: "42", length: "27", shoulder: "19", sleeve: "24" },
      { size: "L", chest: "44", length: "28", shoulder: "20", sleeve: "24.5" },
      { size: "XL", chest: "46", length: "29", shoulder: "21", sleeve: "25" },
      {
        size: "XXL",
        chest: "48",
        length: "30",
        shoulder: "22",
        sleeve: "25.5",
      },
    ],
    fitTip:
      "Choose your usual size for a relaxed fit or go one size up for a boxier oversized silhouette.",
  },

  jacket: {
    eyebrow: "JACKET / OUTERWEAR",
    title: "JACKET SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "length", label: "LENGTH" },
      { key: "shoulder", label: "SHOULDER" },
      { key: "sleeve", label: "SLEEVE" },
    ],
    rows: [
      { size: "S", chest: "40", length: "26", shoulder: "18", sleeve: "24.5" },
      { size: "M", chest: "42", length: "27", shoulder: "19", sleeve: "25" },
      { size: "L", chest: "44", length: "28", shoulder: "20", sleeve: "25.5" },
      { size: "XL", chest: "46", length: "29", shoulder: "21", sleeve: "26" },
      {
        size: "XXL",
        chest: "48",
        length: "30",
        shoulder: "22",
        sleeve: "26.5",
      },
    ],
    fitTip:
      "If you plan to layer a hoodie or sweatshirt underneath, choose one size larger.",
  },

  jeans: {
    eyebrow: "JEANS / DENIM",
    title: "JEANS SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "waist", label: "WAIST" },
      { key: "hip", label: "HIP" },
      { key: "inseam", label: "INSEAM" },
      { key: "outseam", label: "OUTSEAM" },
    ],
    rows: [
      { size: "28", waist: "28", hip: "36", inseam: "30", outseam: "40" },
      { size: "30", waist: "30", hip: "38", inseam: "30", outseam: "40.5" },
      { size: "32", waist: "32", hip: "40", inseam: "31", outseam: "41" },
      { size: "34", waist: "34", hip: "42", inseam: "31", outseam: "41.5" },
      { size: "36", waist: "36", hip: "44", inseam: "32", outseam: "42" },
      { size: "38", waist: "38", hip: "46", inseam: "32", outseam: "42.5" },
    ],
    fitTip:
      "Use your natural waist as the starting point. For a baggier look, size up while keeping the intended rise in mind.",
  },

  trackpants: {
    eyebrow: "TRACK PANTS / JOGGERS",
    title: "TRACK PANTS SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "waist", label: "WAIST" },
      { key: "hip", label: "HIP" },
      { key: "length", label: "LENGTH" },
      { key: "bottom", label: "BOTTOM" },
    ],
    rows: [
      { size: "S", waist: "28–30", hip: "38", length: "39", bottom: "12" },
      { size: "M", waist: "30–32", hip: "40", length: "40", bottom: "12.5" },
      { size: "L", waist: "32–34", hip: "42", length: "41", bottom: "13" },
      { size: "XL", waist: "34–36", hip: "44", length: "42", bottom: "13.5" },
      { size: "XXL", waist: "36–38", hip: "46", length: "43", bottom: "14" },
    ],
    fitTip:
      "Elastic-waist track pants cover a small waist range. Choose the larger size for a relaxed leg and longer drape.",
  },

  shorts: {
    eyebrow: "SHORTS",
    title: "SHORTS SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "waist", label: "WAIST" },
      { key: "hip", label: "HIP" },
      { key: "length", label: "LENGTH" },
      { key: "legOpening", label: "LEG OPENING" },
    ],
    rows: [
      {
        size: "S",
        waist: "28–30",
        hip: "38",
        length: "18",
        legOpening: "11.5",
      },
      {
        size: "M",
        waist: "30–32",
        hip: "40",
        length: "18.5",
        legOpening: "12",
      },
      {
        size: "L",
        waist: "32–34",
        hip: "42",
        length: "19",
        legOpening: "12.5",
      },
      {
        size: "XL",
        waist: "34–36",
        hip: "44",
        length: "19.5",
        legOpening: "13",
      },
      {
        size: "XXL",
        waist: "36–38",
        hip: "46",
        length: "20",
        legOpening: "13.5",
      },
    ],
    fitTip:
      "For a looser summer/streetwear fit, choose the upper end of your waist range.",
  },

  coord: {
    eyebrow: "CO-ORD SET",
    title: "CO-ORD SET SIZE GUIDE",
    unit: "GENERAL GARMENT MEASUREMENTS / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "topChest", label: "TOP CHEST" },
      { key: "topLength", label: "TOP LENGTH" },
      { key: "bottomWaist", label: "BOTTOM WAIST" },
      { key: "bottomLength", label: "BOTTOM LENGTH" },
    ],
    rows: [
      {
        size: "S",
        topChest: "38",
        topLength: "27",
        bottomWaist: "28–30",
        bottomLength: "39",
      },
      {
        size: "M",
        topChest: "40",
        topLength: "28",
        bottomWaist: "30–32",
        bottomLength: "40",
      },
      {
        size: "L",
        topChest: "42",
        topLength: "29",
        bottomWaist: "32–34",
        bottomLength: "41",
      },
      {
        size: "XL",
        topChest: "44",
        topLength: "30",
        bottomWaist: "34–36",
        bottomLength: "42",
      },
      {
        size: "XXL",
        topChest: "46",
        topLength: "31",
        bottomWaist: "36–38",
        bottomLength: "43",
      },
    ],
    fitTip:
      "Choose the size that best matches both your chest and waist. If the two fall in different sizes, choose the larger one.",
  },

  general: {
    eyebrow: "UNBOUND / GENERAL",
    title: "GENERAL SIZE GUIDE",
    unit: "GENERAL BODY REFERENCE / INCHES",
    columns: [
      { key: "size", label: "SIZE" },
      { key: "chest", label: "CHEST" },
      { key: "waist", label: "WAIST" },
      { key: "hip", label: "HIP" },
    ],
    rows: [
      { size: "S", chest: "38", waist: "30", hip: "38" },
      { size: "M", chest: "40", waist: "32", hip: "40" },
      { size: "L", chest: "42", waist: "34", hip: "42" },
      { size: "XL", chest: "44", waist: "36", hip: "44" },
      { size: "XXL", chest: "46", waist: "38", hip: "46" },
    ],
    fitTip:
      "If you are between two sizes, choose the larger size for a more relaxed fit.",
  },
};

const getSizeGuideType = (product) => {
  const category = String(product?.category || "")
    .trim()
    .toLowerCase();

  const name = String(product?.name || "")
    .trim()
    .toLowerCase();

  const combined = `${category} ${name}`;

  if (combined.includes("jean") || combined.includes("denim")) {
    return "jeans";
  }

  if (
    combined.includes("track pant") ||
    combined.includes("trackpant") ||
    combined.includes("jogger")
  ) {
    return "trackpants";
  }

  if (combined.includes("short")) {
    return "shorts";
  }

  if (
    combined.includes("co-ord") ||
    combined.includes("co ord") ||
    combined.includes("coord")
  ) {
    return "coord";
  }

  if (combined.includes("hood")) {
    return "hoodie";
  }

  if (combined.includes("sweat")) {
    return "sweatshirt";
  }

  if (combined.includes("jacket")) {
    return "jacket";
  }

  if (
    combined.includes("t-shirt") ||
    combined.includes("tshirt") ||
    combined.includes("tee")
  ) {
    return "tshirt";
  }

  if (combined.includes("shirt")) {
    return "shirt";
  }

  return "general";
};

const getSizeGuideConfig = (product) => {
  const type = getSizeGuideType(product);

  return SIZE_GUIDE_LIBRARY[type] || SIZE_GUIDE_LIBRARY.general;
};

/* =========================================================
   FALLBACK PRODUCT SIZES

   IMPORTANT:
   - Real MongoDB/Admin sizes always win.
   - These sizes are used ONLY when product.sizes is empty.
   - This makes SELECT SIZE + SIZE CHART visible for old/imported
     products such as TEES that do not yet have size data saved.
========================================================= */

const getFallbackSizeNames = (product) => {
  const category = String(product?.category || "")
    .trim()
    .toLowerCase();

  const name = String(product?.name || "")
    .trim()
    .toLowerCase();

  const combined = `${category} ${name}`;

  /* JEANS / DENIM */

  if (combined.includes("jean") || combined.includes("denim")) {
    return ["28", "30", "32", "34", "36"];
  }

  /* TOPS */

  if (
    combined.includes("t-shirt") ||
    combined.includes("tshirt") ||
    combined.includes("tee") ||
    combined.includes("shirt") ||
    combined.includes("hood") ||
    combined.includes("jacket") ||
    combined.includes("sweat") ||
    combined.includes("coord") ||
    combined.includes("co-ord")
  ) {
    return ["S", "M", "L", "XL"];
  }

  /* SHORTS / TRACK PANTS */

  if (
    combined.includes("short") ||
    combined.includes("track pant") ||
    combined.includes("trackpant") ||
    combined.includes("jogger")
  ) {
    return ["S", "M", "L", "XL"];
  }

  return [];
};

const normalizeProductSizes = (product) => {
  const rawSizes = Array.isArray(product?.sizes)
    ? product.sizes
    : Array.isArray(product?.availableSizes)
      ? product.availableSizes
      : [];

  const savedSizes = rawSizes
    .map((item) => {
      if (typeof item === "string") {
        const size = item.trim();

        if (!size) {
          return null;
        }

        return {
          size,
          stock: Number(product?.stock ?? product?.totalStock ?? 0),
          fallback: false,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const size = String(
        item?.size ?? item?.name ?? item?.label ?? item?.value ?? "",
      ).trim();

      if (!size) {
        return null;
      }

      return {
        ...item,
        size,
        stock: Number(
          item?.stock ?? product?.stock ?? product?.totalStock ?? 0,
        ),
        fallback: false,
      };
    })
    .filter(Boolean);

  if (savedSizes.length > 0) {
    const seen = new Set();

    return savedSizes.filter((item) => {
      const key = String(item.size).trim().toUpperCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  }

  /*
    No sizes were saved in MongoDB.

    We show fallback sizes so every clothing product detail page
    still has SELECT SIZE and SIZE CHART.

    stock: null means "unknown/not supplied per-size".
    We do NOT invent per-size inventory.
  */

  return getFallbackSizeNames(product).map((size) => ({
    size,
    stock: null,
    fallback: true,
  }));
};

/* =========================================================
   SAMPLE / DEMO REVIEW CARDS

   These cards are intentionally labeled SAMPLE.
   They are category-aware UI content for preview/testing.
   They are NOT presented as verified customer submissions.
========================================================= */

const SAMPLE_REVIEW_NAMES = [
  "Arjun M.",
  "Rohan K.",
  "Kabir S.",
  "Dev A.",
  "Aman R.",
  "Ishaan P.",
  "Vihaan N.",
  "Kunal J.",
];

const SAMPLE_REVIEW_PROFILES = {
  jeans: {
    label: "JEANS / DENIM",
    openers: [
      "The waist sits comfortably without feeling tight.",
      "The baggy shape falls cleanly through the leg.",
      "The denim has a substantial feel without being too rigid.",
      "The rise and leg opening give it a proper streetwear shape.",
      "The fit feels roomy but still looks structured.",
      "The length works well with chunky sneakers.",
      "The fabric feels durable and keeps its shape.",
      "The relaxed cut gives good movement through the thigh.",
    ],
    closers: [
      "I would stay true to size for this fit.",
      "Size up once if you want an even looser silhouette.",
      "The wash and structure make it easy to style.",
      "It works especially well with oversized tees.",
      "The leg shape is the strongest part of the fit.",
      "Good option for everyday baggy denim.",
      "The material feels better after a little wear.",
      "Easy to pair with sneakers or boots.",
    ],
  },

  trackpants: {
    label: "TRACK PANTS / JOGGERS",
    openers: [
      "The waistband feels secure without digging in.",
      "There is enough room through the thigh for easy movement.",
      "The fabric falls cleanly instead of bunching around the knee.",
      "The relaxed leg gives it a strong streetwear shape.",
      "Comfort is the best part of this pair.",
      "The length works well with low and high-top sneakers.",
      "The material feels soft while still holding its shape.",
      "The fit stays relaxed without looking oversized everywhere.",
    ],
    closers: [
      "Good for long everyday wear.",
      "I would choose my regular size.",
      "Size up once for a wider leg.",
      "The silhouette works well with hoodies and jackets.",
      "The waistband has a useful amount of stretch.",
      "Easy choice for travel or casual outfits.",
      "The fabric does not feel too thin.",
      "A balanced mix of comfort and structure.",
    ],
  },

  shorts: {
    label: "SHORTS",
    openers: [
      "The waist feels comfortable and easy to adjust.",
      "The length sits nicely without feeling too short.",
      "There is enough room through the leg for movement.",
      "The fabric feels light but not flimsy.",
      "The shape stays relaxed when walking or sitting.",
      "The leg opening gives it a clean streetwear look.",
      "The fit feels easy around the hip.",
      "The material works well for warm weather.",
    ],
    closers: [
      "I would take the regular size.",
      "Size up for a looser summer fit.",
      "Pairs easily with oversized tees.",
      "Comfort stays good through the day.",
      "The proportion works well with high socks and sneakers.",
      "A useful everyday short.",
      "The waistband feels flexible enough.",
      "Simple fit with a good amount of room.",
    ],
  },

  jacket: {
    label: "JACKET / OUTERWEAR",
    openers: [
      "The outer fabric feels substantial and well structured.",
      "There is enough room underneath for a hoodie.",
      "The shoulders sit cleanly without feeling restrictive.",
      "The jacket keeps its shape while still allowing movement.",
      "The material feels protective without being overly heavy.",
      "The length works well with wider pants.",
      "The sleeves have enough room for layering.",
      "The structure gives the outfit a stronger silhouette.",
    ],
    closers: [
      "I would stay true to size for light layering.",
      "Size up if you plan to wear a thick hoodie underneath.",
      "The material is the strongest part for me.",
      "It works well as an everyday outer layer.",
      "The fit feels relaxed rather than slim.",
      "Good balance of structure and comfort.",
      "Looks best over a simple tee or sweatshirt.",
      "A solid option for cooler evenings.",
    ],
  },

  hoodie: {
    label: "HOODIE",
    openers: [
      "The inside feels soft and comfortable against the skin.",
      "The body has a relaxed shape without feeling too long.",
      "The hood sits well and does not pull the neckline back.",
      "The fabric has a nice weight for everyday layering.",
      "The sleeves feel roomy in the right places.",
      "The hem keeps the oversized shape looking controlled.",
      "The hoodie feels warm without becoming bulky.",
      "The shoulder drop gives it a strong streetwear fit.",
    ],
    closers: [
      "Regular size already feels relaxed.",
      "Size up once for a more oversized look.",
      "Good weight for everyday use.",
      "Pairs easily with baggy denim.",
      "The softness is noticeable straight away.",
      "The fit works well under a jacket.",
      "Comfort and shape are both strong.",
      "A good daily hoodie.",
    ],
  },

  sweatshirt: {
    label: "SWEATSHIRT",
    openers: [
      "The fabric feels soft with a useful amount of weight.",
      "The neckline keeps its shape well.",
      "The body fits relaxed without hanging too low.",
      "The shoulder line gives it a clean oversized look.",
      "The material feels comfortable for long wear.",
      "The sleeves have a relaxed but controlled shape.",
      "The hem sits nicely over wider trousers.",
      "The sweatshirt feels warm without being too thick.",
    ],
    closers: [
      "I would choose the regular size.",
      "Size up once for a boxier fit.",
      "Easy to layer over a tee.",
      "The material feels good for everyday use.",
      "Works especially well with loose denim.",
      "The overall shape is clean and balanced.",
      "Comfortable enough for all-day wear.",
      "A simple piece with a good silhouette.",
    ],
  },

  shirt: {
    label: "SHIRT",
    openers: [
      "The fabric drapes cleanly instead of feeling stiff.",
      "The shoulder seam sits in a comfortable position.",
      "The collar keeps a neat shape throughout the day.",
      "The shirt has enough room through the chest.",
      "The material feels breathable and easy to wear.",
      "The length works both tucked and untucked.",
      "The sleeves sit comfortably without pulling.",
      "The relaxed fit still looks clean around the body.",
    ],
    closers: [
      "I would keep the regular size.",
      "Size up for an overshirt-style fit.",
      "Easy to wear with denim or trousers.",
      "The material is comfortable for longer wear.",
      "The drape is what makes this work.",
      "Looks clean worn open over a tee.",
      "Good balance between casual and structured.",
      "A versatile everyday shirt.",
    ],
  },

  coord: {
    label: "CO-ORD SET",
    openers: [
      "The top and bottom proportions work well together.",
      "The fabric feels consistent across both pieces.",
      "The set has enough room without losing its shape.",
      "The matching silhouette makes styling very easy.",
      "The waistband and top fit feel balanced together.",
      "The material has a clean drape from top to bottom.",
      "The relaxed shape feels comfortable for long wear.",
      "Both pieces also work well when styled separately.",
    ],
    closers: [
      "I would choose one size based on the larger measurement.",
      "The set looks strongest worn with simple sneakers.",
      "Good option when you want an easy complete outfit.",
      "The overall fit feels coordinated rather than oversized.",
      "Comfort is consistent across both pieces.",
      "The fabric makes the set feel more premium.",
      "Easy to dress up or down.",
      "A useful set for travel and everyday wear.",
    ],
  },

  tshirt: {
    label: "T-SHIRT / TEE",
    openers: [
      "The fabric feels soft but still has enough weight.",
      "The oversized fit sits cleanly through the shoulders.",
      "The print feels well placed and does not overpower the tee.",
      "The body has enough room without becoming too long.",
      "The neckline feels structured and keeps its shape.",
      "The sleeves have a good relaxed width.",
      "The tee drapes nicely over wider pants.",
      "The material feels comfortable for all-day wear.",
    ],
    closers: [
      "I would stay true to size for the intended fit.",
      "Size up once if you want a more exaggerated oversized look.",
      "The fabric quality is the standout for me.",
      "Easy to pair with baggy jeans.",
      "The print and fit feel balanced.",
      "The shape works well on its own or under a jacket.",
      "A strong everyday heavyweight-style tee.",
      "The relaxed silhouette feels easy to wear.",
    ],
  },

  general: {
    label: "PRODUCT",
    openers: [
      "The fit feels comfortable and easy to wear.",
      "The material has a clean feel and useful structure.",
      "The proportions look balanced when worn.",
      "There is enough room for normal everyday movement.",
      "The piece feels easy to style with streetwear basics.",
      "The fabric feels comfortable for longer wear.",
      "The shape works well without feeling restrictive.",
      "The overall finish feels clean and wearable.",
    ],
    closers: [
      "I would choose the regular size.",
      "Size up if you prefer a looser silhouette.",
      "Easy to wear as part of an everyday outfit.",
      "The material and fit feel nicely balanced.",
      "Works well with simple sneakers.",
      "A versatile addition to a casual wardrobe.",
      "Comfort is consistent throughout the day.",
      "The overall silhouette is the strongest point.",
    ],
  },
};

const getSampleReviewType = (product) => {
  const type = getSizeGuideType(product);

  if (SAMPLE_REVIEW_PROFILES[type]) {
    return type;
  }

  return "general";
};

const stableTextHash = (value = "") => {
  let hash = 0;

  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getSampleReviews = (product) => {
  const type = getSampleReviewType(product);

  const profile =
    SAMPLE_REVIEW_PROFILES[type] || SAMPLE_REVIEW_PROFILES.general;

  const seed = stableTextHash(
    `${product?._id || product?.id || ""}-${product?.name || ""}`,
  );

  const productSizes = Array.isArray(product?.sizes)
    ? product.sizes
        .map((item) => String(item?.size || "").trim())
        .filter(Boolean)
    : [];

  const sizeFallback =
    type === "jeans" ? ["28", "30", "32", "34", "36"] : ["S", "M", "L", "XL"];

  const sizes = productSizes.length > 0 ? productSizes : sizeFallback;

  return SAMPLE_REVIEW_NAMES.map((name, index) => {
    const opener = profile.openers[(seed + index) % profile.openers.length];

    const closer = profile.closers[(seed + index * 3) % profile.closers.length];

    /*
      Stable sample rating from 3★ to 5★.

      Each product/review keeps the same value on refresh,
      but cards can now show 3★, 4★, or 5★.
    */
    const rating = 3 + ((seed + index) % 3);

    return {
      id: `${seed}-${index}`,
      name,
      rating,
      size: sizes[index % sizes.length] || "—",
      text: `${opener} ${closer}`,
      label: profile.label,
    };
  });
};

/* =========================================================
   NORMALIZE PRODUCT DATA
========================================================= */

const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  /* =======================================================
     SIZES
  ======================================================= */

  const normalizedSizes = normalizeProductSizes(product);

  /* =======================================================
     IMAGES

     SOURCE OF TRUTH:
     product.images

     The Admin product editor controls the order of this array:

     images[0] = MAIN
     images[1] = 02
     images[2] = 03
     images[3] = 04
     images[4] = 05

     Do NOT mix old imageFiles before this array because that
     changes the Admin-selected order and can add stale images.
  ======================================================= */

  const normalizedImages = [];

  const addImage = (value) => {
    const resolved = resolveImageUrl(value);

    if (resolved && !normalizedImages.includes(resolved)) {
      normalizedImages.push(resolved);
    }
  };

  /* =======================================================
     1. CURRENT ADMIN / MONGODB IMAGES FIRST
  ======================================================= */

  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach(addImage);
  }

  /* =======================================================
     2. SINGLE MAIN IMAGE FALLBACK

     Only used when product.images is empty.
  ======================================================= */

  if (normalizedImages.length === 0) {
    addImage(product.mainImage);
    addImage(product.image);
  }

  /* =======================================================
     3. LEGACY imageFiles FALLBACK ONLY

     Never mix these with product.images.
  ======================================================= */

  if (normalizedImages.length === 0 && Array.isArray(product.imageFiles)) {
    [...product.imageFiles]
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
      .forEach((item) => {
        if (item?.url) {
          addImage(item.url);
          return;
        }

        if (item?.fileId) {
          addImage(`${API_BASE}/api/catalog/images/${String(item.fileId)}`);
        }
      });
  }

  /* =======================================================
     4. LEGACY imageIds FALLBACK ONLY
  ======================================================= */

  if (normalizedImages.length === 0 && Array.isArray(product.imageIds)) {
    product.imageIds.forEach((imageId) => {
      if (imageId) {
        addImage(`${API_BASE}/api/catalog/images/${String(imageId)}`);
      }
    });
  }

  /* =======================================================
     WEBSITE LIMIT

     Maximum 4 images / 4 thumbnail boxes.
  ======================================================= */

  const websiteImages = normalizedImages.slice(0, 4);

  /* =======================================================
     STOCK
  ======================================================= */

  const calculatedStock = normalizedSizes.reduce(
    (total, item) => total + Number(item.stock || 0),
    0,
  );

  const totalStock =
    product.totalStock !== undefined
      ? Number(product.totalStock)
      : product.stock !== undefined
        ? Number(product.stock)
        : calculatedStock;

  /* =======================================================
     RESULT
  ======================================================= */

  return {
    ...product,

    id: product._id || product.id,

    _id: product._id || product.id,

    image:
      websiteImages[0] ||
      resolveImageUrl(product.mainImage) ||
      resolveImageUrl(product.image),

    mainImage:
      websiteImages[0] ||
      resolveImageUrl(product.mainImage) ||
      resolveImageUrl(product.image),

    images: websiteImages,

    price: Number(product.price || 0),

    oldPrice: Number(product.oldPrice || 0),

    sizes: normalizedSizes,

    totalStock,

    colors: Array.isArray(product.colors)
      ? product.colors
      : product.color
        ? [product.color]
        : [],
  };
};

/* =========================================================
   PRODUCT DETAILS
========================================================= */

function ProductDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const pageRef = useRef(null);

  const mainImageRef = useRef(null);

  /* =======================================================
     STATE
  ======================================================= */

  const [product, setProduct] = useState(null);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState("");

  const [quantity, setQuantity] = useState(0);

  const [liked, setLiked] = useState(false);

  const [cartMessage, setCartMessage] = useState("");

  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const [reviewsPaused, setReviewsPaused] = useState(false);

  const reviewTrackRef = useRef(null);

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);

        setError("");

        setProduct(null);

        setRelatedProducts([]);

        setActiveImage(0);

        setSelectedSize("");

        setQuantity(0);

        setCartMessage("");

        setSizeChartOpen(false);

        let loadedProduct = null;

        /* ===============================================
             MONGODB PRODUCT
          =============================================== */

        if (isMongoId(id)) {
          /*
              DIRECT:

              GET /api/products/:id
            */

          try {
            const response = await fetch(`${API_BASE}/api/products/${id}`, {
              method: "GET",

              cache: "no-store",

              headers: {
                Accept: "application/json",
              },
            });

            const data = await readJsonResponse(
              response,
              "Product details API",
            );

            if (response.ok) {
              loadedProduct = normalizeProduct(data?.product || data);
            } else {
              console.warn("Direct product request failed:", data);
            }
          } catch (directError) {
            console.log("Direct product API failed:", directError);
          }

          /* =============================================
               FALLBACK: LOAD ALL PRODUCTS
            ============================================= */

          if (!loadedProduct) {
            console.log("Trying product-list fallback:", id);

            const allResponse = await fetch(`${API_BASE}/api/products`, {
              method: "GET",

              cache: "no-store",

              headers: {
                Accept: "application/json",
              },
            });

            const allData = await readJsonResponse(allResponse, "Products API");

            if (!allResponse.ok) {
              throw new Error(
                allData?.message ||
                  `Products API failed (${allResponse.status})`,
              );
            }

            const allProducts = extractProducts(allData);

            console.log("All products for detail lookup:", allProducts.length);

            const foundProduct = allProducts.find((item) => {
              const itemId = String(item?._id || item?.id || "");

              return itemId === String(id);
            });

            if (foundProduct) {
              loadedProduct = normalizeProduct(foundProduct);

              console.log("✅ PRODUCT FOUND USING FALLBACK:", loadedProduct);
            }
          }
        }

        /* ===============================================
             LOCAL PRODUCT FALLBACK
          =============================================== */

        if (!loadedProduct) {
          const localProduct = products.find(
            (item) => String(item.id) === String(id),
          );

          if (localProduct) {
            loadedProduct = normalizeProduct(localProduct);
          }
        }

        /* ===============================================
             NOTHING FOUND
          =============================================== */

        if (!loadedProduct) {
          throw new Error("Product not found.");
        }

        if (cancelled) {
          return;
        }

        setProduct(loadedProduct);

        /* ===============================================
             AUTO SIZE
          =============================================== */

        if (loadedProduct.sizes?.length > 0) {
          const availableSize =
            loadedProduct.sizes.find(
              (item) => item?.fallback === true || Number(item?.stock) > 0,
            ) || loadedProduct.sizes[0];

          if (availableSize) {
            setSelectedSize(availableSize.size);
          }
        }

        /* ===============================================
             RELATED PRODUCTS
          =============================================== */

        try {
          const relatedResponse = await fetch(
            `${API_BASE}/api/products/${loadedProduct._id || loadedProduct.id}/related`,
            {
              cache: "no-store",

              headers: {
                Accept: "application/json",
              },
            },
          );

          const relatedData = await readJsonResponse(
            relatedResponse,
            "Related products API",
          );

          if (relatedResponse.ok) {
            const suggestions = extractProducts(relatedData)
              .map(normalizeProduct)
              .filter(Boolean)
              .slice(0, 4);

            if (!cancelled) {
              setRelatedProducts(suggestions);
            }
          } else {
            console.warn("Related products API failed:", relatedData);
          }
        } catch (relatedError) {
          console.warn("Related API fallback:", relatedError);

          /*
              FALLBACK:
              load all products
            */

          try {
            const response = await fetch(`${API_BASE}/api/products`, {
              cache: "no-store",

              headers: {
                Accept: "application/json",
              },
            });

            const data = await readJsonResponse(
              response,
              "Suggested products API",
            );

            if (response.ok) {
              const allProducts = extractProducts(data);

              const currentId = String(
                loadedProduct?._id || loadedProduct?.id || id || "",
              );

              const currentCategory = String(loadedProduct?.category || "")
                .trim()
                .toLowerCase();

              const sameCategory = allProducts
                .filter((item) => {
                  const itemId = String(item?._id || item?.id || "");

                  const itemCategory = String(item?.category || "")
                    .trim()
                    .toLowerCase();

                  return (
                    itemId &&
                    itemId !== currentId &&
                    itemCategory === currentCategory
                  );
                })
                .map(normalizeProduct)
                .filter(Boolean);

              const sameIds = new Set(
                sameCategory.map((item) => String(item?._id || item?.id || "")),
              );

              const others = allProducts
                .filter((item) => {
                  const itemId = String(item?._id || item?.id || "");

                  return itemId && itemId !== currentId && !sameIds.has(itemId);
                })
                .map(normalizeProduct)
                .filter(Boolean);

              if (!cancelled) {
                setRelatedProducts([...sameCategory, ...others].slice(0, 4));
              }
            }
          } catch (fallbackError) {
            console.error("Suggested products could not load:", fallbackError);
          }
        }
      } catch (loadError) {
        console.error("PRODUCT LOAD ERROR:", loadError);

        if (!cancelled) {
          setError(loadError?.message || "Unable to load this product.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================================================
     PAGE GSAP
  ========================================================= */

  useEffect(() => {
    if (!product || !pageRef.current) {
      return;
    }

    const ctx = gsap.context(
      () => {
        gsap.fromTo(
          ".pd-animate",

          {
            opacity: 0,

            y: 24,
          },

          {
            opacity: 1,

            y: 0,

            duration: 0.65,

            stagger: 0.07,

            ease: "power3.out",
          },
        );
      },

      pageRef,
    );

    return () => {
      ctx.revert();
    };
  }, [product]);

  /* =========================================================
     IMAGE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!mainImageRef.current) {
      return;
    }

    gsap.killTweensOf(mainImageRef.current);

    gsap.fromTo(
      mainImageRef.current,

      {
        opacity: 0,

        scale: 1.045,
      },

      {
        opacity: 1,

        scale: 1,

        duration: 0.45,

        ease: "power3.out",
      },
    );
  }, [activeImage]);

  /* =========================================================
     IMAGES
  ========================================================= */

  const images = useMemo(() => {
    if (!Array.isArray(product?.images)) {
      return [];
    }

    return product.images.filter(Boolean).slice(0, 4);
  }, [product]);

  /* =========================================================
     CURRENT SIZE
  ========================================================= */

  const currentSizeData = product?.sizes?.find(
    (item) => item.size === selectedSize,
  );

  const currentSizeStockKnown =
    currentSizeData?.stock !== null &&
    currentSizeData?.stock !== undefined &&
    currentSizeData?.stock !== "";

  const currentStock = currentSizeStockKnown
    ? Number(currentSizeData.stock || 0)
    : Number(product?.totalStock || product?.stock || 0);

  const sizeGuide = useMemo(() => getSizeGuideConfig(product), [product]);

  const sizeGuideRows = sizeGuide.rows;

  const sampleReviews = useMemo(() => getSampleReviews(product), [product]);

  /* =========================================================
     SAMPLE REVIEW CAROUSEL
  ========================================================= */

  useEffect(() => {
    const track = reviewTrackRef.current;

    if (!track || reviewsPaused || sampleReviews.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const firstCard = track.querySelector(".pd-review-card");

      if (!firstCard) {
        return;
      }

      const styles = window.getComputedStyle(track);

      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;

      const step = firstCard.getBoundingClientRect().width + gap;

      const maxScroll = track.scrollWidth - track.clientWidth;

      if (track.scrollLeft + step >= maxScroll - 4) {
        track.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        track.scrollBy({
          left: step,
          behavior: "smooth",
        });
      }
    }, 3600);

    return () => {
      window.clearInterval(timer);
    };
  }, [sampleReviews, reviewsPaused]);

  /* =========================================================
     STOCK
  ========================================================= */

  const hasStock =
    product?.sizes?.length > 0
      ? currentSizeData?.fallback
        ? Number(product?.totalStock || product?.stock || 0) > 0
        : currentStock > 0
      : Number(product?.totalStock || product?.stock || 0) > 0;

  /* =========================================================
     IMAGES PREVIOUS / NEXT
  ========================================================= */

  const previousImage = () => {
    if (images.length <= 1) {
      return;
    }

    setActiveImage(
      (previous) => (previous - 1 + images.length) % images.length,
    );
  };

  const nextImage = () => {
    if (images.length <= 1) {
      return;
    }

    setActiveImage((previous) => (previous + 1) % images.length);
  };

  /* =========================================================
     QUANTITY
  ========================================================= */

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(0, previous - 1));
  };

  const increaseQuantity = () => {
    let maximum = 10;

    if (currentStock > 0) {
      maximum = currentStock;
    } else if (Number(product?.totalStock || 0) > 0) {
      maximum = Number(product.totalStock);
    }

    setQuantity((previous) => Math.min(maximum, previous + 1));
  };

  /* =========================================================
     CREATE CART ITEM
  ========================================================= */

  const createCartItem = () => {
    return {
      ...product,

      id: product._id || product.id,

      productId: product._id || product.id,

      image: images[0] || "",

      images,

      size: selectedSize,

      quantity,

      price: Number(product.price),
    };
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = async () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMessage("PLEASE SELECT A SIZE");

      return;
    }

    if (!hasStock) {
      setCartMessage("THIS SIZE IS OUT OF STOCK");

      return;
    }

    if (quantity <= 0) {
      setCartMessage("PLEASE SELECT QUANTITY");

      return;
    }

    try {
      let cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        cartId = createSafeUUID();

        localStorage.setItem("axiee-cart-id", cartId);
      }

      const productId = product._id || product.id;

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

          name: product?.name || "",

          category: product?.category || "",

          price: Number(product?.price || 0),

          image: images[0] || "",
        }),
      });

      const data = await readJsonResponse(response, "Cart API");

      if (!response.ok) {
        throw new Error(data?.message || "Could not add to cart");
      }

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data?.cart,
        }),
      );

      setCartMessage("ADDED TO CART");

      window.setTimeout(
        () => {
          setCartMessage("");
        },

        1800,
      );
    } catch (cartError) {
      console.error("ADD TO CART ERROR:", cartError);

      setCartMessage(cartError?.message || "COULD NOT ADD TO CART");
    }
  };

  /* =========================================================
     BUY NOW
  ========================================================= */

  const buyNow = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMessage("PLEASE SELECT A SIZE");

      return;
    }

    if (!hasStock) {
      setCartMessage("THIS SIZE IS OUT OF STOCK");

      return;
    }

    if (quantity <= 0) {
      setCartMessage("PLEASE SELECT QUANTITY");

      return;
    }

    const item = createCartItem();

    localStorage.setItem(
      "axiee-buy-now",

      JSON.stringify(item),
    );

    navigate("/checkout");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="pd-state-page">
        <div className="pd-loader">
          <span>AXIEE</span>

          <div className="pd-loader-line">
            <div />
          </div>

          <p>LOADING PRODUCT</p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !product) {
    return (
      <main className="pd-state-page">
        <div className="pd-error">
          <span>404 / PRODUCT</span>

          <h1>PRODUCT NOT FOUND</h1>

          <p>{error || "This product is currently unavailable."}</p>

          <Link to="/shop">RETURN TO SHOP</Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main ref={pageRef} className="pd-page">
      {/* ===================================================
          TOP BAR
      =================================================== */}

      <section className="pd-topbar pd-animate">
        <button type="button" className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} strokeWidth={1.4} />

          <span>BACK</span>
        </button>

        <div className="pd-breadcrumb">
          <Link to="/">AXIEE</Link>

          <span>/</span>

          <Link to="/shop">SHOP</Link>

          <span>/</span>

          <strong>{product.name}</strong>
        </div>

        <span className="pd-product-code">
          PRODUCT /{" "}
          {String(product.id || "")
            .slice(-6)
            .toUpperCase()}
        </span>
      </section>

      {/* ===================================================
          MAIN PRODUCT
      =================================================== */}

      <section className="pd-main">
        {/* =================================================
            LEFT GALLERY
        ================================================= */}

        <div className="pd-gallery pd-animate">
          {images.length > 0 && (
            <div className="pd-thumbnails">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    activeImage === index
                      ? "pd-thumbnail active"
                      : "pd-thumbnail"
                  }
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />

                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pd-main-image-box">
            {images.length > 0 ? (
              <img
                ref={mainImageRef}
                src={images[activeImage]}
                alt={product.name}
                className="pd-main-image"
                draggable="false"
              />
            ) : (
              <div className="pd-no-image">NO IMAGE</div>
            )}

            {images.length > 1 && (
              <div className="pd-image-number">
                <strong>{String(activeImage + 1).padStart(2, "0")}</strong>

                <span>/</span>

                <span>{String(images.length).padStart(2, "0")}</span>
              </div>
            )}

            {images.length > 1 && (
              <div className="pd-image-navigation">
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} strokeWidth={1.4} />
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={18} strokeWidth={1.4} />
                </button>
              </div>
            )}

            {product.featured && (
              <span className="pd-featured-tag">FEATURED</span>
            )}
          </div>
        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <aside className="pd-info pd-animate">
          <div className="pd-info-top">
            <div>
              <span className="pd-category">{product.category}</span>

              <h1>{product.name}</h1>
            </div>

            <button
              type="button"
              className={liked ? "pd-heart active" : "pd-heart"}
              onClick={() => setLiked((previous) => !previous)}
              aria-label="Wishlist"
            >
              <Heart
                size={19}
                strokeWidth={1.35}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>

          {/* PRICE */}

          <div className="pd-price-row">
            <strong>₹{Number(product.price).toLocaleString("en-IN")}</strong>

            {Number(product.oldPrice || 0) > Number(product.price || 0) && (
              <del>₹{Number(product.oldPrice).toLocaleString("en-IN")}</del>
            )}
          </div>

          {/* DESCRIPTION */}

          <p className="pd-short-description">
            {product.shortDescription ||
              product.description ||
              "Designed beyond convention. AXIEE contemporary streetwear built for modern movement."}
          </p>

          {/* META */}

          <div className="pd-meta">
            <div>
              <span>COLOR</span>

              <strong>
                {product.colors?.[0]?.toUpperCase() ||
                  product.color?.toUpperCase() ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>FIT</span>

              <strong>{product.fit?.toUpperCase() || "—"}</strong>
            </div>

            <div>
              <span>MATERIAL</span>

              <strong>{product.material?.toUpperCase() || "—"}</strong>
            </div>

            <div>
              <span>GENDER</span>

              <strong>{product.gender || "UNISEX"}</strong>
            </div>
          </div>

          {/* SIZE */}

          {product.sizes?.length > 0 && (
            <div className="pd-option-section">
              <div className="pd-option-heading">
                <span>SELECT SIZE</span>

                <small>
                  {selectedSize
                    ? currentSizeData?.fallback
                      ? "SIZE SELECTED"
                      : currentStock > 0
                        ? `${currentStock} IN STOCK`
                        : "OUT OF STOCK"
                    : "SELECT"}
                </small>
              </div>

              {/* ALL CONFIGURED SIZES STAY VISIBLE */}

              <div className="pd-sizes">
                {product.sizes.map((item) => {
                  const stockKnown =
                    item?.stock !== null &&
                    item?.stock !== undefined &&
                    item?.stock !== "";

                  const disabled =
                    item?.fallback === true
                      ? false
                      : stockKnown
                        ? Number(item.stock) <= 0
                        : false;

                  const isActive = selectedSize === item.size;

                  return (
                    <button
                      type="button"
                      key={item.size}
                      disabled={disabled}
                      className={[
                        isActive ? "active" : "",
                        disabled ? "out-of-stock" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        if (disabled) return;

                        setSelectedSize(item.size);
                        setQuantity(0);
                        setCartMessage("");
                      }}
                      aria-label={
                        disabled
                          ? `${item.size} - out of stock`
                          : `Select size ${item.size}`
                      }
                    >
                      <span className="pd-size-button-copy">{item.size}</span>

                      {disabled && (
                        <>
                          <span className="pd-size-strike" />
                          <small className="pd-size-out-label">OUT</small>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SIZE CHART */}

              <div
                className={
                  sizeChartOpen ? "pd-size-chart open" : "pd-size-chart"
                }
              >
                <button
                  type="button"
                  className="pd-size-chart-toggle"
                  onClick={() => setSizeChartOpen((current) => !current)}
                  aria-expanded={sizeChartOpen}
                >
                  <span className="pd-size-chart-toggle-copy">
                    <span>SIZE CHART</span>

                    <small>
                      {sizeChartOpen
                        ? "CLOSE SIZE GUIDE"
                        : "VIEW SIZE & MEASUREMENT GUIDE"}
                    </small>
                  </span>

                  <span className="pd-size-chart-arrow">
                    <ChevronDown size={15} strokeWidth={1.4} />
                  </span>
                </button>

                <div
                  className={
                    sizeChartOpen
                      ? "pd-size-chart-panel open"
                      : "pd-size-chart-panel"
                  }
                >
                  <div className="pd-size-chart-inner">
                    <div className="pd-size-chart-top">
                      <div>
                        <span>UNBOUND / SIZE SYSTEM</span>

                        <h3>
                          FIND YOUR
                          <br />
                          RIGHT FIT.
                        </h3>
                      </div>

                      <p>
                        Standard Indian-market reference measurements. Compare
                        with a garment you already own for best fit.
                      </p>
                    </div>

                    <div className="pd-size-chart-note">
                      <span>{sizeGuide.title}</span>

                      <small>{sizeGuide.unit}</small>
                    </div>

                    <div className="pd-size-chart-category">
                      <span>{sizeGuide.eyebrow}</span>

                      <p>
                        Use this as a general fit reference. Final garment
                        measurements can vary slightly by fabric, wash, cut and
                        construction.
                      </p>
                    </div>

                    <div className="pd-size-chart-table-wrap">
                      <table className="pd-size-chart-table">
                        <thead>
                          <tr>
                            {sizeGuide.columns.map((column) => (
                              <th key={column.key}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {sizeGuideRows.map((row) => (
                            <tr
                              key={row.size}
                              className={
                                selectedSize === row.size ? "active" : ""
                              }
                            >
                              {sizeGuide.columns.map((column) => (
                                <td key={`${row.size}-${column.key}`}>
                                  {row[column.key] ?? "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pd-size-chart-footer">
                      <span>FIT TIP</span>

                      <p>{sizeGuide.fitTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUANTITY */}

          <div className="pd-option-section">
            <div className="pd-option-heading">
              <span>QUANTITY</span>

              <small>MAX {currentStock || product.totalStock || 10}</small>
            </div>

            <div className="pd-quantity">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 0}
              >
                <Minus size={15} strokeWidth={1.4} />
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={currentStock > 0 && quantity >= currentStock}
              >
                <Plus size={15} strokeWidth={1.4} />
              </button>
            </div>
          </div>

          {/* MESSAGE */}

          {cartMessage && (
            <div className="pd-message">
              <Check size={13} strokeWidth={1.7} />

              <span>{cartMessage}</span>
            </div>
          )}

          {/* ACTIONS */}

          <div className="pd-actions">
            <button
              type="button"
              className="pd-add-cart"
              onClick={addToCart}
              disabled={!hasStock || quantity <= 0}
            >
              <ShoppingBag size={16} strokeWidth={1.4} />

              <span>
                {!hasStock
                  ? "OUT OF STOCK"
                  : quantity <= 0
                    ? "SELECT QUANTITY"
                    : "ADD TO CART"}
              </span>
            </button>

            <button
              type="button"
              className="pd-buy-now"
              onClick={buyNow}
              disabled={!hasStock || quantity <= 0}
            >
              <span>BUY NOW</span>

              <ArrowRight size={16} strokeWidth={1.4} />
            </button>
          </div>

          {/* PAYMENT */}

          <div className="pd-payment-box">
            <div className="pd-payment-title">
              <CreditCard size={17} strokeWidth={1.35} />

              <div>
                <strong>SECURE CHECKOUT</strong>

                <span>PAYMENT OPTIONS AT CHECKOUT</span>
              </div>
            </div>

            <div className="pd-payment-methods">
              <span>UPI</span>

              <span>CARDS</span>

              <span>NET BANKING</span>

              <span>COD</span>
            </div>
          </div>

          {/* SERVICES */}

          <div className="pd-service-list">
            <div>
              <Truck size={17} strokeWidth={1.25} />

              <div>
                <strong>DELIVERY</strong>

                <span>SHIPPING CALCULATED AT CHECKOUT</span>
              </div>
            </div>

            <div>
              <ShieldCheck size={17} strokeWidth={1.25} />

              <div>
                <strong>SECURE PAYMENT</strong>

                <span>PROTECTED CHECKOUT</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ===================================================
          PRODUCT INFORMATION
      =================================================== */}

      <section className="pd-details pd-animate">
        <div className="pd-details-heading">
          <span>01 / PRODUCT INFORMATION</span>

          <h2>
            BUILT BEYOND
            <br />
            CONVENTION.
          </h2>
        </div>

        <div className="pd-details-content">
          <div>
            <span>DESCRIPTION</span>

            <p>
              {product.description ||
                product.shortDescription ||
                "AXIEE contemporary streetwear engineered for everyday movement, comfort and unconventional form."}
            </p>
          </div>

          <div className="pd-spec-list">
            <div>
              <span>CATEGORY</span>

              <strong>{product.category || "—"}</strong>
            </div>

            <div>
              <span>FIT</span>

              <strong>{product.fit || "—"}</strong>
            </div>

            <div>
              <span>STYLE</span>

              <strong>{product.style || "—"}</strong>
            </div>

            <div>
              <span>MATERIAL</span>

              <strong>{product.material || "—"}</strong>
            </div>

            <div>
              <span>GENDER</span>

              <strong>{product.gender || "UNISEX"}</strong>
            </div>

            <div>
              <span>STOCK</span>

              <strong>{product.totalStock || 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          SAMPLE REVIEW CAROUSEL

          IMPORTANT:
          These are clearly marked sample/demo fit notes.
          Replace with real customer review data when available.
      =================================================== */}

      <section className="pd-reviews pd-animate">
        <div className="pd-reviews-heading">
          <div>
            <span>02 / SAMPLE FEEDBACK</span>

            <h2>
              SAMPLE REVIEWS
              <small> ({sampleReviews.length})</small>
            </h2>
          </div>

          <button
            type="button"
            className={reviewsPaused ? "is-paused" : ""}
            onClick={() => setReviewsPaused((current) => !current)}
          >
            {reviewsPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>

        <div className="pd-reviews-note">
          DEMO CONTENT — REPLACE WITH VERIFIED CUSTOMER REVIEWS WHEN AVAILABLE
        </div>

        <div
          ref={reviewTrackRef}
          className="pd-review-track"
          onMouseEnter={() => setReviewsPaused(true)}
          onMouseLeave={() => setReviewsPaused(false)}
          onClick={() => setReviewsPaused((current) => !current)}
        >
          {sampleReviews.map((review) => (
            <article className="pd-review-card" key={review.id}>
              <div className="pd-review-card-top">
                <div className="pd-review-stars">
                  <strong>{review.rating}</strong>

                  <span>★</span>
                </div>

                <span className="pd-review-sample-badge">SAMPLE</span>

                <span className="pd-review-size">SIZE: {review.size}</span>
              </div>

              <p>{review.text}</p>

              <div className="pd-review-card-footer">
                <span className="pd-review-check">
                  <Check size={13} strokeWidth={2.2} />
                </span>

                <div>
                  <strong>{review.name}</strong>

                  <small>{review.label} FIT NOTE</small>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pd-review-scroll-hint">
          <span>{reviewsPaused ? "PAUSED" : "AUTO SCROLL"}</span>

          <span>SWIPE / DRAG TO EXPLORE</span>
        </div>
      </section>

      {/* ===================================================
          RELATED PRODUCTS
      =================================================== */}

      {relatedProducts.length > 0 && (
        <section className="pd-related pd-animate">
          <div className="pd-related-heading">
            <div>
              <span>03 / DISCOVER</span>

              <h2>
                YOU MAY ALSO
                <br />
                LIKE
              </h2>
            </div>

            <Link to="/shop">
              VIEW ALL
              <ArrowRight size={14} strokeWidth={1.4} />
            </Link>
          </div>

          <div className="pd-related-grid">
            {relatedProducts.slice(0, 4).map((item, index) => (
              <Link
                key={item._id || item.id || index}
                to={`/product/${item._id || item.id}`}
                className="pd-related-card"
              >
                <div className="pd-related-image">
                  {item.images?.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="pd-related-placeholder">AXIEE</div>
                  )}

                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>

                <div className="pd-related-info">
                  <div>
                    <h3>{item.name}</h3>

                    <p>{item.category}</p>
                  </div>

                  <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetails;
