import React from "react";
import CategoryPage from "../components/CategoryPage";
import useCategoryProducts from "../hooks/useCategoryProducts";

function CoOrdSets() {
  const {
    products,
    loading,
    error,
  } = useCategoryProducts("coordsets");

  return (
    <CategoryPage
      category="CO-ORD SETS"
      title="CO-ORD SETS"
      subtitle="MATCHED SYSTEM"
      visualType="coordsets"
      products={products}
      loading={loading}
      error={error}
      description={
        <>
          MATCHED FORMS.
          <br />
          BUILT AS ONE SYSTEM.
        </>
      }
    />
  );
}

export default CoOrdSets;