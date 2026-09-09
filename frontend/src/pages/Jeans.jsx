import React from "react";
import CategoryPage from "../components/CategoryPage";

function Jeans() {
  return (
    <CategoryPage
      category="JEANS"
      title="JEANS"
      subtitle="DENIM WITHOUT LIMITS"
      description={
        <>
          RAW STRUCTURE.
          <br />
          BUILT FOR MOVEMENT.
        </>
      }
    />
  );
}

export default Jeans;