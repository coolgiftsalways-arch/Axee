import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   GET PRODUCTS ARRAY FROM ANY API RESPONSE SHAPE
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

const normalize = (value = "") =>
  String(value)
    .trim()
    .toLowerCase();

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchCategory = (product, type) => {
  const category = normalize(product?.category);
  const name = normalize(product?.name);

  /* =======================
     T-SHIRTS
  ======================= */

  if (type === "tshirts") {
    return (
      category === "t-shirts" ||
      category === "tshirts" ||
      category === "tees" ||
      category === "tee"
    );
  }

  /* =======================
     SHIRTS
  ======================= */

  if (type === "shirts") {
    return (
      category === "shirts" ||
      category === "shirt"
    );
  }

  /* =======================
     HOODIES
  ======================= */

  if (type === "hoodies") {
    return (
      category === "hoodies" ||
      category === "hoodie"
    );
  }

  /* =======================
     SHORTS
  ======================= */

  if (type === "shorts") {
    return (
      category === "shorts" ||
      category === "short"
    );
  }

  /* =======================
     JACKETS
  ======================= */

  if (type === "jackets") {
    return (
      category === "jackets" ||
      category === "jacket"
    );
  }

  /* =======================
     CO-ORD SETS
  ======================= */

  if (type === "coordsets") {
    return (
      category === "co-ord sets" ||
      category === "co ord sets" ||
      category === "coord sets" ||
      category === "co-ord set" ||
      category === "co ord set"
    );
  }

  /* =======================
     JEANS

     Your imported jeans are
     currently category Pants.
  ======================= */

  if (type === "jeans") {
    const pantsCategory =
      category === "pants" ||
      category === "pant";

    const denimName =
      name.includes("jeans") ||
      name.includes("jean") ||
      name.includes("denim");

    return pantsCategory && denimName;
  }

  /* =======================
     TRACK PANTS

     Keep old track-pants,
     remove imported jeans/pants.
  ======================= */

  if (type === "trackpants") {
    const pantsCategory =
      category === "pants" ||
      category === "pant" ||
      category === "track pants" ||
      category === "track pant";

    const isDenim =
      name.includes("jeans") ||
      name.includes("jean") ||
      name.includes("denim");

    const importedClothing =
      normalize(product?.source) ===
      "clothing-zip";

    return (
      pantsCategory &&
      !isDenim &&
      !importedClothing
    );
  }

  return false;
};

/* =========================================================
   HOOK
========================================================= */

function useCategoryProducts(type) {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        /* ===============================================
           IMPORTANT:
           GET ALL PRODUCTS.
           Do not filter through backend query.
        =============================================== */

        const response = await fetch(
          `${API_URL}/api/catalog/products`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load products (${response.status})`
          );
        }

        const data =
          await response.json();

        const allProducts =
          extractProducts(data);

        console.log(
          "✅ ALL MONGODB PRODUCTS:",
          allProducts.length
        );

        /* ===============================================
           DEBUG CATEGORIES
        =============================================== */

        console.log(
          "📂 DATABASE CATEGORIES:",
          [
            ...new Set(
              allProducts.map(
                (product) =>
                  product?.category
              )
            ),
          ]
        );

        /* ===============================================
           FILTER CORRECT CATEGORY
        =============================================== */

        const filteredProducts =
          allProducts.filter(
            (product) =>
              matchCategory(
                product,
                type
              )
          );

        console.log(
          `✅ ${type.toUpperCase()} PRODUCTS:`,
          filteredProducts.length,
          filteredProducts
        );

        if (!cancelled) {
          setProducts(
            filteredProducts
          );
        }
      } catch (err) {
        console.error(
          "❌ PRODUCT LOAD ERROR:",
          err
        );

        if (!cancelled) {
          setProducts([]);

          setError(
            err?.message ||
              "Unable to load products."
          );
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
  }, [type]);

  return {
    products,
    loading,
    error,
  };
}

export default useCategoryProducts;