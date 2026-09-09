// frontend/src/pages/Jackets.jsx

import React from "react";
import CategoryPage from "../components/CategoryPage";
import "../styles/jackets.css";

function Jackets() {
  return (
    <CategoryPage
      category="JACKETS"
      title="JACKETS"
      subtitle="OUTER SYSTEM"
      visualType="jackets"
      description={
        <>
          PROTECTIVE LAYERS.
          <br />
          BUILT FOR THE UNKNOWN.
        </>
      }
    />
  );
}

export default Jackets;