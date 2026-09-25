import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";
import "../styles/trackpants.css";

function TrackPants() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("trackpants");

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