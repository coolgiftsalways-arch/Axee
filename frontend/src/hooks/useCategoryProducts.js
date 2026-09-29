import { useEffect, useMemo, useState } from "react";

/* =========================================================
   API BASE

   PC:
   http://localhost:5178
   ->
   http://localhost:5000

   MOBILE ON SAME WIFI:
   http://192.168.x.x:5178
   ->
   http://192.168.x.x:5000
========================================================= */

const DEV_API_BASE = `http://${window.location.hostname}:5000`;

const API_BASE = (
  import.meta.env.DEV ? DEV_API_BASE : import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

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
   NORMALIZE TEXT
========================================================= */

const normalize = (value = "") => String(value).trim().toLowerCase();

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchesCategory = (product, type) => {
  const category = normalize(product?.category);

  const name = normalize(product?.name);

  /* =========================
     T-SHIRTS
  ========================= */

  if (type === "tshirts") {
    return (
      category === "t-shirts" ||
      category === "tshirts" ||
      category === "t-shirt" ||
      category === "tshirt" ||
      category === "tees" ||
      category === "tee"
    );
  }

  /* =========================
     SHIRTS
  ========================= */

  if (type === "shirts") {
    return category === "shirts" || category === "shirt";
  }

  /* =========================
     HOODIES
  ========================= */

  if (type === "hoodies") {
    return category === "hoodies" || category === "hoodie";
  }

  /* =========================
     SHORTS
  ========================= */

  if (type === "shorts") {
    return category === "shorts" || category === "short";
  }

  /* =========================
     JACKETS
  ========================= */

  if (type === "jackets") {
    return category === "jackets" || category === "jacket";
  }

  /* =========================
     CO-ORD SETS
  ========================= */

  if (type === "coordsets") {
    return (
      category === "co-ord sets" ||
      category === "co ord sets" ||
      category === "coord sets" ||
      category === "co-ord set" ||
      category === "co ord set" ||
      category === "coord set"
    );
  }

  /* =========================
     JEANS
  ========================= */

  if (type === "jeans") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "jeans" ||
      category === "jean";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return (
      category === "jeans" ||
      category === "jean" ||
      (pantsCategory && denimName)
    );
  }

  /* =========================
     TRACK PANTS
  ========================= */

  if (type === "trackpants") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "track pants" ||
      category === "track pant" ||
      category === "trackpants" ||
      category === "trackpant";

    const isDenim =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return pantsCategory && !isDenim;
  }

  return true;
};

/* =========================================================
   READ JSON SAFELY

   Fixes:
   Unexpected token '<',
   "<!doctype"... is not valid JSON
========================================================= */

const readJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  const text = await response.text();

  if (!contentType.includes("application/json")) {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");

    throw new Error(
      `API returned HTML/text instead of JSON. ` +
        `URL: ${response.url}. ` +
        `Status: ${response.status}. ` +
        `Response starts with: ${preview}`,
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Backend returned invalid JSON from ${response.url}`);
  }
};

/* =========================================================
   NORMALIZE SIZE ARRAY
========================================================= */

const normalizeSizes = (product) => {
  const rawSizes = Array.isArray(product?.sizes)
    ? product.sizes
    : Array.isArray(product?.availableSizes)
      ? product.availableSizes
      : [];

  return rawSizes
    .map((item) => {
      /* STRING SIZE */

      if (typeof item === "string") {
        return item.trim();
      }

      /* OBJECT SIZE */

      if (item && typeof item === "object") {
        return {
          ...item,

          size: String(
            item?.size ?? item?.label ?? item?.name ?? item?.value ?? "",
          ).trim(),
        };
      }

      return "";
    })
    .filter((item) => {
      if (typeof item === "string") {
        return Boolean(item);
      }

      return Boolean(item?.size);
    });
};

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

const normalizeProduct = (product) => {
  const id = String(product?._id || product?.id || "");

  const priceNumber = Number(product?.price);

  const oldPriceNumber = Number(product?.oldPrice);

  const ratingNumber = Number(product?.rating);

  const reviewNumber = Number(product?.reviewCount ?? product?.reviews);

  return {
    ...product,

    id,

    _id: product?._id || id,

    price: Number.isFinite(priceNumber) ? priceNumber : 0,

    oldPrice: Number.isFinite(oldPriceNumber) ? oldPriceNumber : 0,

    rating: Number.isFinite(ratingNumber) ? ratingNumber : 0,

    reviewCount: Number.isFinite(reviewNumber) ? reviewNumber : 0,

    sizes: normalizeSizes(product),
  };
};

/* =========================================================
   USE CATEGORY PRODUCTS
========================================================= */

export default function useCategoryProducts(type) {
  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     FETCH PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);

        setError("");

        const url = `${API_BASE}/api/catalog/products`;

        console.log("================================");

        console.log("CATEGORY PRODUCTS API:");

        console.log(url);

        console.log("================================");

        const response = await fetch(url, {
          method: "GET",

          cache: "no-store",

          headers: {
            Accept: "application/json",
          },
        });

        /* =========================
             HTTP ERROR
          ========================= */

        if (!response.ok) {
          throw new Error(`Products request failed (${response.status})`);
        }

        /* =========================
             JSON
          ========================= */

        const data = await readJsonResponse(response);

        /* =========================
             EXTRACT PRODUCTS
          ========================= */

        const products = extractProducts(data)
          .filter((product) => product?.isActive !== false)
          .map(normalizeProduct)
          .filter((product) => Boolean(product.id));

        console.log("✅ PRODUCTS LOADED:", products.length);

        console.log("✅ API:", url);

        /* =========================
             DEBUG FIRST PRODUCT
          ========================= */

        if (products.length > 0) {
          console.log("✅ FIRST PRODUCT:", {
            id: products[0]?.id,

            name: products[0]?.name,

            category: products[0]?.category,

            price: products[0]?.price,

            oldPrice: products[0]?.oldPrice,

            sizes: products[0]?.sizes,
          });
        }

        if (!cancelled) {
          setAllProducts(products);
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
     FILTER BY CATEGORY
  ======================================================= */

  const products = useMemo(() => {
    const filtered = allProducts.filter((product) =>
      matchesCategory(product, type),
    );

    console.log(`✅ ${type} PRODUCTS:`, filtered.length);

    return filtered;
  }, [allProducts, type]);

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    products,
    loading,
    error,
  };
}
