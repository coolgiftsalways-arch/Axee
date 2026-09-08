import React from "react";
import CategoryPage from "../components/CategoryPage";

function Tshirts() {
  return (
    <CategoryPage
      category="T-SHIRTS"
      title="T-SHIRTS"
      subtitle="BUILT BEYOND THE BASIC"
      description={
        <>
          OVERSIZED SILHOUETTES.
          <br />
          MADE FOR THE UNKNOWN.
        </>
      }
    />
  );
}

export default Tshirts;