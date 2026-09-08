import React from "react";
import CategoryPage from "../components/CategoryPage";

function Shorts() {
  return (
    <CategoryPage
      category="SHORTS"
      title="SHORTS"
      subtitle="FREEDOM IN MOTION"
      description={
        <>
          BUILT LIGHT.
          <br />
          MADE TO MOVE.
        </>
      }
    />
  );
}

export default Shorts;