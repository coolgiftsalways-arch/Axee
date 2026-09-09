// frontend/src/pages/CoOrdSets.jsx

import React from "react";
import CategoryPage from "../components/CategoryPage";
import "../styles/coordsets.css";

function CoOrdSets() {
  return (
    <CategoryPage
      category="CO-ORD SETS"
      title="CO-ORD SETS"
      subtitle="SYNCED FORM"
      visualType="coordsets"
      description={
        <>
          MATCHED STRUCTURES.
          <br />
          DESIGNED AS ONE SYSTEM.
        </>
      }
    />
  );
}

export default CoOrdSets;