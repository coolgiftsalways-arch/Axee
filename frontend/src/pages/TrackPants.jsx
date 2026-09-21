import React, { useEffect, useState } from "react";
import CategoryPage from "../components/CategoryPage";
import "../styles/trackpants.css";

function TrackPants() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchTrackPants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/catalog/products?category=Pants`
        );

        if (!response.ok) {
          throw new Error("Failed to load Track Pants");
        }

        const data = await response.json();

        const formattedProducts = (data.products || []).map(
          (product) => ({
            ...product,

            // MongoDB _id becomes normal frontend id
            id: product._id,

            // Main GridFS image
            image:
              product.imageFiles?.length > 0
                ? `${API_URL}/api/catalog/images/${product.imageFiles[0].fileId}`
                : "",

            // All product images
            images:
              product.imageFiles?.map(
                (img) =>
                  `${API_URL}/api/catalog/images/${img.fileId}`
              ) || [],

            price: Number(product.price || 699),
          })
        );

        setProducts(formattedProducts);

        console.log(
          "✅ Track Pants loaded:",
          formattedProducts
        );
      } catch (err) {
        console.error("❌ Track Pants error:", err);

        setError("Unable to load Track Pants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackPants();
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