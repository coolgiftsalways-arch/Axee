import React, { useEffect, useState } from "react";

import CategoryPage from "../components/CategoryPage";

import "../styles/trackpants.css";

function TrackPants() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* =========================================================
     FIX IMAGE URL
  ========================================================= */

  const fixImageUrl = (url) => {
    if (!url) return "";

    /*
      Already full URL
    */

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    /*
      Backend GridFS route
    */

    if (url.startsWith("/api/")) {
      return `${API_URL}${url}`;
    }

    /*
      Frontend public image
    */

    return url;
  };

  /* =========================================================
     LOAD TRACK PANTS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchTrackPants = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await fetch(
          `${API_URL}/api/catalog/products?category=Pants`,
        );

        if (!response.ok) {
          throw new Error(`Failed to load Track Pants (${response.status})`);
        }

        const data = await response.json();

        const formattedProducts = (data.products || []).map((product) => {
          /* =================================================
             GET ALL IMAGES

             Supports:
             product.images
             product.image
             product.imageFiles
          ================================================= */

          let images = [];

          /*
            Backend already gave us images
          */

          if (Array.isArray(product.images) && product.images.length > 0) {
            images = product.images.map(fixImageUrl).filter(Boolean);
          }

          /*
            MongoDB imageFiles fallback
          */

          if (images.length === 0 && Array.isArray(product.imageFiles)) {
            images = product.imageFiles
              .map((img) => {
                const fileId = img?.fileId || img?._id || img?.id;

                if (!fileId) return "";

                return `${API_URL}/api/catalog/images/${fileId}`;
              })
              .filter(Boolean);
          }

          /*
            Single image fallback
          */

          const mainImage = images[0] || fixImageUrl(product.image) || "";

          return {
            ...product,

            id: product.id || product._id,

            _id: product._id || product.id,

            image: mainImage,

            images: images.length > 0 ? images : mainImage ? [mainImage] : [],

            price: Number(product.price || 699),
          };
        });

        if (cancelled) return;

        setProducts(formattedProducts);

        console.log("✅ Track Pants loaded:", formattedProducts);

        formattedProducts.forEach((product) => {
          console.log(`🖼 ${product.name}:`, product.images);
        });
      } catch (err) {
        console.error("❌ Track Pants error:", err);

        if (!cancelled) {
          setError("Unable to load Track Pants.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTrackPants();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  return (
    <CategoryPage
      category="TRACK PANTS"
      title="TRACK PANTS"
      subtitle="MOTION SYSTEM"
      visualType="trackpants"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          RELAXED MOVEMENT.
          <br />
          BUILT FOR EVERYDAY MOTION.
        </>
      }
    />
  );
}

export default TrackPants;
