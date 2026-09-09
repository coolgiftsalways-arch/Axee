// frontend/src/pages/Shorts.jsx

import React from "react";
import CategoryPage from "../components/CategoryPage";
import "../styles/shorts.css";

function Shorts() {
  return (
    <CategoryPage
      category="SHORTS"
      title="SHORTS"
      subtitle="UTILITY FORM"
      visualType="shorts"
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