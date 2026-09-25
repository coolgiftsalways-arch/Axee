import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";
import "../styles/jackets.css";

function Jackets() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("jackets");

  return (
    <CategoryPage
      category="JACKETS"
      title="JACKETS"
      subtitle="OUTER SYSTEM"
      visualType="jackets"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          PROTECTIVE LAYERS.
          <br />
          BUILT FOR THE UNKNOWN.
        </>
      }
    />
  );
}

export default Jackets;