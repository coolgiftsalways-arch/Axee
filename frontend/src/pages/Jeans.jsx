import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";

function Jeans() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("jeans");

  return (
    <CategoryPage
      category="JEANS"
      title="JEANS"
      subtitle="BAGGY RECONSTRUCTED"
      visualType="jeans"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          RELAXED SILHOUETTES.
          <br />
          BUILT FOR MOVEMENT.
        </>
      }
    />
  );
}

export default Jeans;