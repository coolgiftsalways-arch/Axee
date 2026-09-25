import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";

function Shirts() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("shirts");

  return (
    <CategoryPage
      category="SHIRTS"
      title="SHIRTS"
      subtitle="REDEFINED FORM"
      visualType="shirts"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          STRUCTURED FORMS.
          <br />
          DESIGNED BEYOND CONVENTION.
        </>
      }
    />
  );
}

export default Shirts;
