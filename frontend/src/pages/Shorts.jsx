import React from "react";
import CategoryPage from "../components/CategoryPage";

function Shirts() {
  return (
    <CategoryPage
      category="SHIRTS"
      title="SHIRTS"
      subtitle="REDEFINED FORM"
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
