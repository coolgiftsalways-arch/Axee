import React, { useCallback, useEffect, useRef, useState } from "react";

import { Routes, Route, useLocation } from "react-router-dom";

import gsap from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";

import LocomotiveScroll from "locomotive-scroll";

import "locomotive-scroll/dist/locomotive-scroll.css";

/* =========================================================
   COMPONENTS
========================================================= */

import Loader from "./components/Loader.jsx";

import Navbar from "./components/Navbar.jsx";

import Footer from "./components/Footer.jsx";

import PageTransition from "./components/PageTransition.jsx";

/* =========================================================
   PAGES
========================================================= */

import Home from "./pages/Home.jsx";

import Tshirts from "./pages/Tshirts.jsx";

import Shirts from "./pages/Shirts.jsx";

import Hoodies from "./pages/Hoodies.jsx";
import Jeans from "./pages/Jeans.jsx";
import TrackPants from "./pages/TrackPants.jsx";
import Shorts from "./pages/Shorts.jsx";
import Jackets from "./pages/jackets.jsx";
import CoOrdSets from "./pages/CoOrdSets.jsx";

/* =========================================================
   GSAP
========================================================= */

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   APP
========================================================= */

function App() {
  /* =========================================
     APP STATE
  ========================================= */

  const [loadingComplete, setLoadingComplete] = useState(false);

  const [heroComplete, setHeroComplete] = useState(false);

  /*
    false = hero has not played yet

    On normal route changes:
    value stays true.

    On browser refresh:
    App reloads and this goes back to false.
  */

  const [heroAlreadyPlayed, setHeroAlreadyPlayed] = useState(false);

  const audioRef = useRef(null);

  const location = useLocation();

  const isHomePage = location.pathname === "/";

  /* =========================================
     SHOULD HERO INTRO PLAY
  ========================================= */

  const shouldPlayHeroIntro = loadingComplete && !heroAlreadyPlayed;

  /* =========================================
     PRELOAD HERO AUDIO
  ========================================= */

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.preload = "auto";

    audio.volume = 1;

    audio.muted = false;

    audio.load();

    const handleReady = () => {
      console.log("✅ hero.mp3 ready");
    };

    const handleError = () => {
      console.error("❌ Could not load /audio/hero.mp3");
    };

    audio.addEventListener("canplaythrough", handleReady);

    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("canplaythrough", handleReady);

      audio.removeEventListener("error", handleError);
    };
  }, []);

  /* =========================================
     LOADER COMPLETE
  ========================================= */

  const handleLoaderComplete = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      try {
        audio.pause();

        audio.currentTime = 0;

        audio.volume = 1;

        audio.muted = false;

        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("🔊 AXIEE SOUND PLAYING");
            })

            .catch((error) => {
              console.warn("🔇 Browser blocked autoplay:", error);
            });
        }
      } catch (error) {
        console.error("Audio error:", error);
      }
    }

    /*
        Loader finishes.

        startAnimation becomes true

        and Home intro begins.
      */

    setLoadingComplete(true);
  }, []);

  /* =========================================
     HERO COMPLETE
  ========================================= */

  const handleHeroComplete = useCallback(() => {
    setHeroComplete(true);

    /*
        Prevent hero intro replay when:

        Home → Shirts → Home

        Home → T-Shirts → Home

        Home → Hoodies → Home

        etc.
      */

    setHeroAlreadyPlayed(true);
  }, []);

  /* =========================================
     LOCOMOTIVE SCROLL
  ========================================= */

  useEffect(() => {
    let locomotiveScroll = null;

    let refreshTimer = null;

    /* -----------------------------------------
       LOCK SCROLL DURING FIRST HERO INTRO
    ----------------------------------------- */

    if (isHomePage && !heroComplete) {
      document.documentElement.style.overflow = "hidden";

      document.body.style.overflow = "hidden";

      return () => {
        document.documentElement.style.overflow = "";

        document.body.style.overflow = "";
      };
    }

    /* -----------------------------------------
       ENABLE SCROLL
    ----------------------------------------- */

    document.documentElement.style.overflow = "";

    document.body.style.overflow = "";

    locomotiveScroll = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.08,

        smoothWheel: true,

        wheelMultiplier: 0.8,
      },
    });

    refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      window.removeEventListener("resize", handleResize);

      locomotiveScroll?.destroy?.();
    };
  }, [heroComplete, isHomePage, location.pathname]);

  /* =========================================
     SCROLL TO TOP ON ROUTE CHANGE
  ========================================= */

  useEffect(() => {
    window.scrollTo({
      top: 0,

      left: 0,

      behavior: "auto",
    });

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  /* =========================================
     RETURN
  ========================================= */

  return (
    <>
      {/* =====================================
          PAGE CHANGE ANIMATION

          This does NOT show during
          initial Loader.

          It only plays after route changes.
      ===================================== */}

      <PageTransition />

      {/* =====================================
          HERO AUDIO
      ===================================== */}

      <audio ref={audioRef} src="/audio/hero.mp3" preload="auto" playsInline />

      {/* =====================================
          WEBSITE
      ===================================== */}

      <div className="app">
        <Navbar />

        <Routes>
          {/* =================================
              HOME
          ================================= */}

          <Route
            path="/"
            element={
              <Home
                startAnimation={shouldPlayHeroIntro}
                heroComplete={heroComplete}
                heroAlreadyPlayed={heroAlreadyPlayed}
                onHeroComplete={handleHeroComplete}
              />
            }
          />

          {/* =================================
              T-SHIRTS
          ================================= */}

          <Route path="/tshirts" element={<Tshirts />} />

          <Route path="/jeans" element={<Jeans />} />
          <Route path="/track-pants" element={<TrackPants />} />

          {/* =================================
              SHIRTS
          ================================= */}

          <Route path="/shirts" element={<Shirts />} />

          {/* =================================
              HOODIES
          ================================= */}

          <Route path="/hoodies" element={<Hoodies />} />
          <Route path="/shorts" element={<Shorts />} />

<Route path="/jackets" element={<Jackets />} />

<Route path="/co-ord-sets" element={<CoOrdSets />} />

          {/* =================================
              TEMPORARY SHOP

              For now /shop opens Shirts.

              Later when we make the complete
              Shop page, replace this.
          ================================= */}

          <Route path="/shop" element={<Shirts />} />

          {/* =================================
              FUTURE CATEGORY ROUTES
          ================================= */}

          {/*
          <Route
            path="/jeans"
            element={<Jeans />}
          />

          <Route
            path="/track-pants"
            element={<TrackPants />}
          />

          <Route
            path="/shorts"
            element={<Shorts />}
          />
          */}
        </Routes>

        <Footer />
      </div>

      {/* =====================================
          LOADER

          ONLY:
          website open / browser refresh
          while on Home.

          NOT:
          Shirts → Home
          T-Shirts → Home
          Hoodies → Home
      ===================================== */}

      {isHomePage && !loadingComplete && !heroAlreadyPlayed && (
        <Loader onComplete={handleLoaderComplete} />
      )}
    </>
  );
}

export default App;
