import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from "locomotive-scroll";

import "locomotive-scroll/dist/locomotive-scroll.css";

import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

/* ==============================
   PAGES
============================== */

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";

import Tshirts from "./pages/Tshirts.jsx";
import Jeans from "./pages/Jeans.jsx";
import TrackPants from "./pages/TrackPants.jsx";
import Shirts from "./pages/Shirts.jsx";
import Shorts from "./pages/Shorts.jsx";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  const [loadingComplete, setLoadingComplete] =
    useState(false);

  const [heroComplete, setHeroComplete] =
    useState(false);

  const audioRef = useRef(null);

  /* ======================================================
     PRELOAD HERO AUDIO
     HOME PAGE ONLY
  ====================================================== */

  useEffect(() => {
    if (!isHomePage) return;

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
      console.error(
        "❌ Could not load /audio/hero.mp3"
      );
    };

    audio.addEventListener(
      "canplaythrough",
      handleReady
    );

    audio.addEventListener(
      "error",
      handleError
    );

    return () => {
      audio.removeEventListener(
        "canplaythrough",
        handleReady
      );

      audio.removeEventListener(
        "error",
        handleError
      );
    };
  }, [isHomePage]);

  /* ======================================================
     LOADER COMPLETE
  ====================================================== */

  const handleLoaderComplete =
    useCallback(() => {
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
                console.log(
                  "🔊 AXIEE SOUND PLAYING"
                );
              })
              .catch((error) => {
                console.warn(
                  "🔇 Browser blocked autoplay:",
                  error
                );
              });
          }
        } catch (error) {
          console.error(
            "Audio error:",
            error
          );
        }
      }

      /*
        Hero starts at same time
        as loader finishes
      */

      setLoadingComplete(true);
    }, []);

  /* ======================================================
     HERO COMPLETE
  ====================================================== */

  const handleHeroComplete =
    useCallback(() => {
      setHeroComplete(true);
    }, []);

  /* ======================================================
     RESET PAGE SCROLL WHEN ROUTE CHANGES
  ====================================================== */

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /* ======================================================
     LOCOMOTIVE SCROLL

     HOME:
     Wait until hero animation completes.

     OTHER PAGES:
     Start immediately.
  ====================================================== */

  useEffect(() => {
    let locomotiveScroll = null;
    let refreshTimer = null;

    /*
      On HOME we lock scrolling
      until hero is finished.
    */

    if (isHomePage && !heroComplete) {
      document.documentElement.style.overflow =
        "hidden";

      document.body.style.overflow =
        "hidden";

      return () => {
        document.documentElement.style.overflow =
          "";

        document.body.style.overflow =
          "";
      };
    }

    /*
      Shop / Jeans / T-Shirts /
      Track Pants / Shirts / Shorts
      can scroll immediately.
    */

    document.documentElement.style.overflow =
      "";

    document.body.style.overflow =
      "";

    locomotiveScroll =
      new LocomotiveScroll({
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

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      window.removeEventListener(
        "resize",
        handleResize
      );

      locomotiveScroll?.destroy?.();
    };
  }, [
    heroComplete,
    isHomePage,
    location.pathname,
  ]);

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <>
      {/* =================================
          HERO AUDIO
          HOME PAGE ONLY
      ================================= */}

      {isHomePage && (
        <audio
          ref={audioRef}
          src="/audio/hero.mp3"
          preload="auto"
          playsInline
        />
      )}

      <div className="app">
        <Navbar />

        <Routes>
          {/* ==============================
              HOME
          ============================== */}

          <Route
            path="/"
            element={
              <Home
                startAnimation={
                  loadingComplete
                }
                heroComplete={
                  heroComplete
                }
                onHeroComplete={
                  handleHeroComplete
                }
              />
            }
          />

          {/* ==============================
              SHOP - ALL PRODUCTS
          ============================== */}

          <Route
            path="/shop"
            element={<Shop />}
          />

          {/* ==============================
              T-SHIRTS
          ============================== */}

          <Route
            path="/tshirts"
            element={<Tshirts />}
          />

          {/* ==============================
              JEANS
          ============================== */}

          <Route
            path="/jeans"
            element={<Jeans />}
          />

          {/* ==============================
              TRACK PANTS
          ============================== */}

          <Route
            path="/track-pants"
            element={<TrackPants />}
          />

          {/* ==============================
              SHIRTS / TOPS
          ============================== */}

          <Route
            path="/shirts"
            element={<Shirts />}
          />

          {/* ==============================
              SHORTS
          ============================== */}

          <Route
            path="/shorts"
            element={<Shorts />}
          />
        </Routes>

        <Footer />
      </div>

      {/* =================================
          LOADER
          ONLY HOME PAGE
      ================================= */}

      {isHomePage &&
        !loadingComplete && (
          <Loader
            onComplete={
              handleLoaderComplete
            }
          />
        )}
    </>
  );
}

export default App;
