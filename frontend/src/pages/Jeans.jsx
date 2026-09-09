import React from "react";
import CategoryPage from "../components/CategoryPage";

function Jeans() {
  return (
    <CategoryPage
      category="JEANS"
      title="JEANS"
      subtitle="BAGGY RECONSTRUCTED"
      visualType="jeans"
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