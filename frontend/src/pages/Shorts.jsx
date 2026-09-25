import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";
import "../styles/shorts.css";

function Shorts() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("shorts");

  return (
    <CategoryPage
      category="SHORTS"
      title="SHORTS"
      subtitle="UTILITY FORM"
      visualType="shorts"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          REDUCED STRUCTURE.
          <br />
          MAXIMUM MOVEMENT.
        </>
      }
    />
  );
}

export default Shorts;