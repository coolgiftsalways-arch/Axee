import React from "react";
import CategoryPage from "../components/CategoryPage";

function Tshirts() {
  return (
    <CategoryPage
      category="T-SHIRTS"
      title="T-SHIRTS"
      subtitle="ESSENTIAL FORM"
      visualType="tshirts"
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
