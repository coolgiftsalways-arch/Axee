import React, { useCallback, useEffect, useRef, useState } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from "locomotive-scroll";

import "locomotive-scroll/dist/locomotive-scroll.css";

import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [heroComplete, setHeroComplete] = useState(false);

  const audioRef = useRef(null);

  /* ======================================================
     PRELOAD AUDIO
  ====================================================== */

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

  /* ======================================================
     LOADER COMPLETE
  ====================================================== */

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

    setLoadingComplete(true);
  }, []);

  /* ======================================================
     HERO COMPLETE
  ====================================================== */

  const handleHeroComplete = useCallback(() => {
    setHeroComplete(true);
  }, []);

  /* ======================================================
     SCROLL LOCK / LOCOMOTIVE
  ====================================================== */

  useEffect(() => {
    let locomotiveScroll = null;
    let refreshTimer = null;

    if (!heroComplete) {
      document.documentElement.style.overflow = "hidden";

      document.body.style.overflow = "hidden";

      return () => {
        document.documentElement.style.overflow = "";

        document.body.style.overflow = "";
      };
    }

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
  }, [heroComplete]);

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <>
      {/* AUDIO */}

      <audio ref={audioRef} src="/audio/hero.mp3" preload="auto" playsInline />

      <div className="app">
        <Navbar />

        <Home
          startAnimation={loadingComplete}
          heroComplete={heroComplete}
          onHeroComplete={handleHeroComplete}
        />

        <Footer />
      </div>

      {!loadingComplete && <Loader onComplete={handleLoaderComplete} />}
    </>
  );
}

export default App;
