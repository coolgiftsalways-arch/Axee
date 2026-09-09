import React from "react";
import CategoryPage from "../components/CategoryPage";

import "../styles/hoodies.css";

function Hoodies() {
  return (
    <CategoryPage
      category="HOODIES"
      title="HOODIES"
      subtitle="BUILT FOR LAYERS"
      visualType="hoodies"
      description={
        <>
          ENGINEERED COMFORT.
          <br />
          BUILT BEYOND SEASONS.
        </>
      }
    />
  );
}

export default Hoodies;
