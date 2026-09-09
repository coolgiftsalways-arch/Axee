import React from "react";
import CategoryPage from "../components/CategoryPage";
import "../styles/trackpants.css";

function TrackPants() {
  return (
    <CategoryPage
      category="TRACK PANTS"
      title="TRACK PANTS"
      subtitle="MOTION SYSTEM"
      visualType="trackpants"
      description={
        <>
          RELAXED MOVEMENT.
          <br />
          BUILT FOR EVERYDAY MOTION.
        </>
      }
    />
  );
}

export default TrackPants;