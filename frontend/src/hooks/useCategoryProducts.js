import { useEffect, useMemo, useState } from "react";

/* =========================================================
   API BASE
========================================================= */

const DEV_API_BASE = `http://${window.location.hostname}:5000`;

const API_BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_API_BASE : "")
).replace(/\/+$/, "");

console.log("🌐 CATEGORY API:", API_BASE || "same-domain");

/* =========================================================
   SAFE JSON RESPONSE
========================================================= */

const readJsonResponse = async (response, label = "Products API") => {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(`${label} failed (${response.status})`);
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

    throw new Error(`${label} returned invalid JSON (${response.status}).`);
  }
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
   NORMALIZE TEXT
========================================================= */

const normalize = (value = "") => String(value).trim().toLowerCase();

/* =========================================================
   MONGODB ID
========================================================= */

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

/* =========================================================
   IMAGE URL
========================================================= */

const normalizeImageValue = (value) => {
  if (!value) {
    return "";
  }

  let rawValue = value;

  /* =======================================================
     OBJECT IMAGE
  ======================================================= */

  if (typeof value === "object" && value !== null) {
    rawValue =
      value.url ||
      value.src ||
      value.path ||
      value.image ||
      value.imageUrl ||
      value.location ||
      "";

    if (!rawValue) {
      const fileId = value.fileId || value.id || value._id;

      if (fileId && isMongoId(fileId)) {
        return `${API_BASE}/api/catalog/images/${String(fileId)}`;
      }
    }
  }

  if (!rawValue) {
    return "";
  }

  let url = String(rawValue).trim().replace(/\\/g, "/");

  if (!url) {
    return "";
  }

  /* =======================================================
     CURRENT GRIDFS

     Also fixes old:
     http://localhost:5000/api/catalog/images/...
  ======================================================= */

  const gridFsMatch = url.match(/\/api\/catalog\/images\/([a-f\d]{24})/i);

  if (gridFsMatch?.[1]) {
    return `${API_BASE}/api/catalog/images/${gridFsMatch[1]}`;
  }

  /* =======================================================
     OLD GRIDFS
  ======================================================= */

  const oldGridFsMatch = url.match(/\/api\/images\/([a-f\d]{24})/i);

  if (oldGridFsMatch?.[1]) {
    return `${API_BASE}/api/catalog/images/${oldGridFsMatch[1]}`;
  }

  /* =======================================================
     RELATIVE API
  ======================================================= */

  if (url.startsWith("/api/")) {
    return `${API_BASE}${url}`;
  }

  if (url.startsWith("api/")) {
    return `${API_BASE}/${url}`;
  }

  /* =======================================================
     PRODUCT IMAGES
  ======================================================= */

  if (url.startsWith("/product-images/")) {
    return url;
  }

  if (url.startsWith("product-images/")) {
    return `/${url}`;
  }

  /* =======================================================
     VITE PUBLIC
  ======================================================= */

  if (url.startsWith("/products/")) {
    return url;
  }

  /* =======================================================
     EXTERNAL URL
  ======================================================= */

  if (url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }

  return url;
};

/* =========================================================
   PRODUCT IMAGES

   IMPORTANT:
   product.images is PRIMARY.

   Legacy images are used only when
   product.images is empty.
========================================================= */

const normalizeProductImages = (product = {}) => {
  const images = [];

  const addImage = (value) => {
    const normalized = normalizeImageValue(value);

    if (normalized && !images.includes(normalized)) {
      images.push(normalized);
    }
  };

  /* =======================================================
     1. CURRENT ADMIN IMAGES
  ======================================================= */

  if (Array.isArray(product?.images) && product.images.length > 0) {
    product.images.forEach(addImage);

    return images;
  }

  /* =======================================================
     2. MAIN IMAGE FALLBACK
  ======================================================= */

  addImage(product?.mainImage);

  addImage(product?.image);

  if (images.length > 0) {
    return images;
  }

  /* =======================================================
     3. LEGACY imageFiles
  ======================================================= */

  if (Array.isArray(product?.imageFiles)) {
    [...product.imageFiles]
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
      .forEach(addImage);
  }

  if (images.length > 0) {
    return images;
  }

  /* =======================================================
     4. LEGACY imageIds
  ======================================================= */

  if (Array.isArray(product?.imageIds)) {
    product.imageIds.forEach((id) => {
      if (id && isMongoId(id)) {
        addImage({
          fileId: id,
        });
      }
    });
  }

  if (product?.imageId && isMongoId(product.imageId)) {
    addImage({
      fileId: product.imageId,
    });
  }

  return images;
};

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchesCategory = (product, type) => {
  const category = normalize(product?.category);

  const name = normalize(product?.name);

  /* =======================================================
     T-SHIRTS
  ======================================================= */

  if (type === "tshirts") {
    return ["t-shirts", "tshirt", "tshirts", "t-shirt", "tees", "tee"].includes(
      category,
    );
  }

  /* =======================================================
     SHIRTS
  ======================================================= */

  if (type === "shirts") {
    return ["shirts", "shirt"].includes(category);
  }

  /* =======================================================
     HOODIES
  ======================================================= */

  if (type === "hoodies") {
    return ["hoodies", "hoodie"].includes(category);
  }

  /* =======================================================
     SHORTS
  ======================================================= */

  if (type === "shorts") {
    return ["shorts", "short"].includes(category);
  }

  /* =======================================================
     JACKETS
  ======================================================= */

  if (type === "jackets") {
    return ["jackets", "jacket"].includes(category);
  }

  /* =======================================================
     CO-ORD SETS
  ======================================================= */

  if (type === "coordsets") {
    return [
      "co-ord sets",
      "co ord sets",
      "coord sets",
      "co-ord set",
      "co ord set",
      "coord set",
      "coordset",
      "coordsets",
    ].includes(category);
  }

  /* =======================================================
     JEANS
  ======================================================= */

  if (type === "jeans") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "jeans" ||
      category === "jean" ||
      category === "denim";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return (
      category === "jeans" ||
      category === "jean" ||
      category === "denim" ||
      (pantsCategory && denimName)
    );
  }

  /* =======================================================
     TRACK PANTS
  ======================================================= */

  if (type === "trackpants") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "track pants" ||
      category === "track pant" ||
      category === "trackpants" ||
      category === "trackpant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return pantsCategory && !denimName;
  }

  return true;
};

/* =========================================================
   DEFAULT SIZE FALLBACK

   THIS IS THE IMPORTANT FIX.

   If an old product has:
   sizes: []

   then show default sizes on the website.

   Saved MongoDB sizes ALWAYS have priority.
========================================================= */

const getDefaultSizes = (product) => {
  const category = normalize(product?.category);

  const name = normalize(product?.name);

  /* =======================================================
     T-SHIRTS
  ======================================================= */

  const isTshirt =
    ["t-shirts", "tshirt", "tshirts", "t-shirt", "tees", "tee"].includes(
      category,
    ) ||
    name.includes("t-shirt") ||
    name.includes("tshirt");

  /* =======================================================
     SHIRTS
  ======================================================= */

  const isShirt = ["shirt", "shirts"].includes(category);

  /* =======================================================
     HOODIES
  ======================================================= */

  const isHoodie = ["hoodie", "hoodies"].includes(category);

  /* =======================================================
     JACKETS
  ======================================================= */

  const isJacket = ["jacket", "jackets"].includes(category);

  /* =======================================================
     CO-ORD
  ======================================================= */

  const isCoord = [
    "co-ord sets",
    "co ord sets",
    "coord sets",
    "co-ord set",
    "co ord set",
    "coord set",
    "coordset",
    "coordsets",
  ].includes(category);

  /* =======================================================
     JEANS
  ======================================================= */

  const isJeans =
    ["jeans", "jean", "denim"].includes(category) ||
    ((category === "pants" || category === "pant") &&
      (name.includes("jean") || name.includes("denim")));

  /* =======================================================
     TRACK PANTS
  ======================================================= */

  const isTrackPant = [
    "track pants",
    "track pant",
    "trackpants",
    "trackpant",
  ].includes(category);

  /* =======================================================
     SHORTS
  ======================================================= */

  const isShort = ["short", "shorts"].includes(category);

  /* =======================================================
     TOP DEFAULT SIZES
  ======================================================= */

  if (isTshirt || isShirt || isHoodie || isJacket || isCoord) {
    return ["S", "M", "L", "XL"];
  }

  /* =======================================================
     JEANS DEFAULT SIZES
  ======================================================= */

  if (isJeans) {
    return ["28", "30", "32", "34", "36"];
  }

  /* =======================================================
     TRACK PANTS / SHORTS
  ======================================================= */

  if (isTrackPant || isShort) {
    return ["S", "M", "L", "XL"];
  }

  return [];
};

/* =========================================================
   NORMALIZE SIZES
========================================================= */

const normalizeSizes = (product) => {
  const rawSizes = Array.isArray(product?.sizes)
    ? product.sizes
    : Array.isArray(product?.availableSizes)
      ? product.availableSizes
      : [];

  /* =======================================================
     NORMALIZE SAVED SIZES
  ======================================================= */

  const savedSizes = rawSizes
    .map((item) => {
      /* ===================================================
         STRING SIZE
      =================================================== */

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

      /* ===================================================
         OBJECT SIZE
      =================================================== */

      if (item && typeof item === "object") {
        const size = String(
          item?.size ?? item?.label ?? item?.name ?? item?.value ?? "",
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
      }

      return null;
    })
    .filter(Boolean);

  /* =======================================================
     SAVED SIZES EXIST

     MongoDB / Admin sizes always win.
  ======================================================= */

  if (savedSizes.length > 0) {
    const seen = new Set();

    return savedSizes.filter((item) => {
      const key = String(item.size).toUpperCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  }

  /* =======================================================
     NO SIZES SAVED

     Add fallback sizes.

     IMPORTANT:
     Does NOT overwrite MongoDB.
  ======================================================= */

  return getDefaultSizes(product).map((size) => ({
    size,

    stock: 0,

    fallback: true,
  }));
};

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

const normalizeProduct = (product) => {
  const id = String(product?._id || product?.id || "");

  const price = Number(product?.price);

  const oldPrice = Number(product?.oldPrice);

  const rating = Number(product?.rating);

  const reviews = Number(product?.reviewCount ?? product?.reviews);

  /* =======================================================
     IMAGES
  ======================================================= */

  const images = normalizeProductImages(product);

  const mainImage =
    images[0] ||
    normalizeImageValue(product?.mainImage) ||
    normalizeImageValue(product?.image) ||
    "";

  /* =======================================================
     RESULT
  ======================================================= */

  return {
    ...product,

    id,

    _id: product?._id || id,

    price: Number.isFinite(price) ? price : 0,

    oldPrice: Number.isFinite(oldPrice) ? oldPrice : 0,

    rating: Number.isFinite(rating) ? rating : 0,

    reviewCount: Number.isFinite(reviews) ? reviews : 0,

    /* =====================================================
       SIZES
    ===================================================== */

    sizes: normalizeSizes(product),

    /* =====================================================
       IMAGES
    ===================================================== */

    images,

    image: mainImage,

    mainImage,
  };
};

/* =========================================================
   CATEGORY PRODUCTS HOOK
========================================================= */

export default function useCategoryProducts(type) {
  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);

        setError("");

        const url = `${API_BASE}/api/products`;

        console.log("================================");

        console.log("📦 CATEGORY PRODUCTS API:");

        console.log(url);

        console.log("================================");

        const response = await fetch(url, {
          method: "GET",

          cache: "no-store",

          headers: {
            Accept: "application/json",
          },
        });

        const data = await readJsonResponse(response, "Products API");

        if (!response.ok) {
          throw new Error(
            data?.message || `Products request failed (${response.status})`,
          );
        }

        const loadedProducts = extractProducts(data)
          .filter((product) => product?.isActive !== false)
          .map(normalizeProduct)
          .filter((product) => Boolean(product.id));

        console.log("✅ PRODUCTS LOADED:", loadedProducts.length);

        /* =================================================
             DEBUG
          ================================================= */

        loadedProducts.forEach((product, index) => {
          console.log(`📦 PRODUCT ${index + 1}:`, product.name, {
            id: product.id,

            category: product.category,

            sizes: product.sizes,

            images: product.images,

            mainImage: product.mainImage,
          });
        });

        if (!cancelled) {
          setAllProducts(loadedProducts);
        }
      } catch (err) {
        console.error("❌ CATEGORY PRODUCTS ERROR:", err);

        if (!cancelled) {
          setAllProducts([]);

          setError(err?.message || "Products could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FILTER CATEGORY
  ======================================================= */

  const products = useMemo(() => {
    const filtered = allProducts.filter((product) =>
      matchesCategory(product, type),
    );

    console.log(`✅ ${String(type).toUpperCase()} PRODUCTS:`, filtered.length);

    return filtered;
  }, [allProducts, type]);

  return {
    products,

    loading,

    error,
  };
}
