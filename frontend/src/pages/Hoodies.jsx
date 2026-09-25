import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";
import "../styles/hoodies.css";

function Hoodies() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("hoodies");

  return (
    <CategoryPage
      category="HOODIES"
      title="HOODIES"
      subtitle="BUILT FOR LAYERS"
      visualType="hoodies"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          ENGINEERED COMFORT.
          <br />
          BUILT BEYOND SEASONS.
        </>
      }
    />
  );
}

export default Hoodies;