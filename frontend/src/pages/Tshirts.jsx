import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";

function Tshirts() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("tshirts");

  return (
    <CategoryPage
      category="T-SHIRTS"
      title="T-SHIRTS"
      subtitle="ESSENTIAL FORM"
      visualType="tshirts"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          ENGINEERED SILHOUETTES.
          <br />
          BUILT FOR EVERYDAY MOVEMENT.
        </>
      }
    />
  );
}

export default Tshirts;