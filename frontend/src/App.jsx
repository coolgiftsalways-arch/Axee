import { useCallback, useEffect, useRef, useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   COMPONENTS
========================================================= */

import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

/* =========================================================
   WEBSITE PAGES
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
import Cart from "./pages/Cart.jsx";
import BestSellers from "./pages/BestSellers.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Checkout from "./pages/Checkout.jsx";

/* =========================================================
   ADMIN
========================================================= */

import AdminLayout from "./Admin/AdminLayout.jsx";

import Dashboard from "./Admin/Dashboard.jsx";
import Orders from "./Admin/Orders.jsx";
import Products from "./Admin/Products.jsx";
import Categories from "./Admin/Categories.jsx";
import Customers from "./Admin/Customers.jsx";
import Coupons from "./Admin/Coupons.jsx";
import Sliders from "./Admin/Sliders.jsx";
import Banners from "./Admin/Banners.jsx";
import Settings from "./Admin/Settings.jsx";
import Shipping from "./Admin/Shipping.jsx";

/* =========================================================
   ADMIN LOGIN
========================================================= */

import AdminLogin from "./Admin/AdminLogin.jsx";
import ProtectedDashboard from "./Admin/ProtectedDashboard.jsx";

/* =========================================================
   STYLE
========================================================= */

import "./styles/pageTransition.css";

/* =========================================================
   LAYOUT
========================================================= */

function Layout() {
  const location = useLocation();

  const navigationType = useNavigationType();

  const pathname = location.pathname;

  const pathnameLower = pathname.toLowerCase();

  const isHomePage = pathname === "/";

  const isAdminRoute =
    pathnameLower === "/admin" || pathnameLower.startsWith("/admin/");

  /* =======================================================
     STATE
  ======================================================= */

  const [loadingComplete, setLoadingComplete] = useState(false);

  const [heroStarted, setHeroStarted] = useState(false);

  const [heroComplete, setHeroComplete] = useState(false);

  const [heroAlreadyPlayed, setHeroAlreadyPlayed] = useState(false);

  const [soundOn, setSoundOn] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const audioRef = useRef(null);

  const locomotiveRef = useRef(null);

  const scrollPositionsRef = useRef(new Map());

  const shouldPlayHeroIntro = heroStarted && !heroAlreadyPlayed;

  const locationKey =
    location.key || `${location.pathname}${location.search || ""}`;

  /* =========================================================
     BROWSER SCROLL RESTORATION
  ========================================================= */

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  /* =========================================================
     CURRENT SCROLL POSITION
  ========================================================= */

  const getCurrentScrollY = useCallback(() => {
    const locomotive = locomotiveRef.current;

    const possibleValues = [
      window.scrollY,

      window.pageYOffset,

      document.documentElement.scrollTop,

      document.body.scrollTop,

      locomotive?.lenis?.scroll,

      locomotive?.lenis?.animatedScroll,

      locomotive?.lenisInstance?.scroll,

      locomotive?.lenisInstance?.animatedScroll,

      locomotive?.scroll?.y,

      locomotive?.scroll?.instance?.scroll?.y,
    ]
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0);

    if (possibleValues.length === 0) {
      return 0;
    }

    return Math.max(...possibleValues);
  }, []);

  /* =========================================================
     SCROLL TO POSITION
  ========================================================= */

  const scrollToPosition = useCallback((position = 0) => {
    const top = Math.max(0, Number(position) || 0);

    try {
      ScrollTrigger.clearScrollMemory("manual");
    } catch (error) {
      console.warn("ScrollTrigger scroll memory error:", error);
    }

    /* BROWSER */

    document.documentElement.scrollTop = top;

    document.body.scrollTop = top;

    window.scrollTo({
      top,

      left: 0,

      behavior: "auto",
    });

    /* LOCOMOTIVE */

    const locomotive = locomotiveRef.current;

    if (!locomotive) {
      return;
    }

    try {
      locomotive.scrollTo?.(top, {
        duration: 0,

        offset: 0,

        disableLerp: true,

        immediate: true,
      });
    } catch (error) {
      console.warn("Locomotive scrollTo error:", error);
    }

    /* LENIS */

    try {
      locomotive.lenis?.scrollTo?.(top, {
        immediate: true,

        force: true,
      });
    } catch (error) {
      console.warn("Lenis scrollTo error:", error);
    }

    /* LENIS INSTANCE */

    try {
      locomotive.lenisInstance?.scrollTo?.(top, {
        immediate: true,

        force: true,
      });
    } catch (error) {
      console.warn("Lenis instance scrollTo error:", error);
    }
  }, []);

  /* =========================================================
     FORCE TOP
  ========================================================= */

  const forceScrollToTop = useCallback(() => {
    scrollToPosition(0);
  }, [scrollToPosition]);

  /* =========================================================
     SAVE PAGE POSITION
  ========================================================= */

  useEffect(() => {
    const key = locationKey;

    return () => {
      if (isAdminRoute) {
        return;
      }

      const currentPosition = getCurrentScrollY();

      scrollPositionsRef.current.set(key, currentPosition);
    };
  }, [locationKey, isAdminRoute, getCurrentScrollY]);

  /* =========================================================
     ROUTE SCROLL HANDLING
  ========================================================= */

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    const savedPosition = scrollPositionsRef.current.get(locationKey);

    const shouldRestore =
      navigationType === "POP" && Number.isFinite(savedPosition);

    const targetPosition = shouldRestore ? savedPosition : 0;

    let frameOne = null;

    let frameTwo = null;

    let cancelled = false;

    const timers = [];

    const applyPosition = () => {
      if (cancelled) {
        return;
      }

      scrollToPosition(targetPosition);

      requestAnimationFrame(() => {
        if (!cancelled) {
          ScrollTrigger.refresh();
        }
      });
    };

    frameOne = requestAnimationFrame(() => {
      applyPosition();

      frameTwo = requestAnimationFrame(() => {
        applyPosition();
      });
    });

    const delays = shouldRestore ? [120, 350, 700, 1100] : [120];

    delays.forEach((delay) => {
      const timer = window.setTimeout(applyPosition, delay);

      timers.push(timer);
    });

    const cancelPendingRestore = () => {
      cancelled = true;

      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };

    window.addEventListener("wheel", cancelPendingRestore, {
      once: true,

      passive: true,
    });

    window.addEventListener("touchstart", cancelPendingRestore, {
      once: true,

      passive: true,
    });

    window.addEventListener("pointerdown", cancelPendingRestore, {
      once: true,

      passive: true,
    });

    return () => {
      cancelled = true;

      if (frameOne !== null) {
        cancelAnimationFrame(frameOne);
      }

      if (frameTwo !== null) {
        cancelAnimationFrame(frameTwo);
      }

      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      window.removeEventListener("wheel", cancelPendingRestore);

      window.removeEventListener("touchstart", cancelPendingRestore);

      window.removeEventListener("pointerdown", cancelPendingRestore);
    };
  }, [locationKey, navigationType, isAdminRoute, scrollToPosition]);

  /* =========================================================
     HERO AUDIO

     IMPORTANT:
     - Audio does NOT play during Loader.
     - Loader must finish first.
     - Home calls handleHeroAudioStart at hero timeline time 0.
     - If the browser blocks autoplay, the side SOUND control
       remains visible so the visitor can start it manually.
  ========================================================= */

  useEffect(() => {
    if (!isHomePage || isAdminRoute) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.preload = "auto";
    audio.volume = 1;
    audio.muted = false;
    audio.load();

    const handlePlay = () => {
      setSoundOn(true);
      setSoundBlocked(false);
    };

    const handlePause = () => {
      setSoundOn(false);
    };

    const handleEnded = () => {
      setSoundOn(false);
    };

    const handleReady = () => {
      console.log("✅ hero.mp3 ready");
    };

    const handleError = () => {
      console.error("❌ Could not load /audio/hero.mp3");
      setSoundOn(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("error", handleError);
    };
  }, [isHomePage, isAdminRoute]);

  const handleHeroAudioStart = useCallback(() => {
    if (isAdminRoute || !isHomePage) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setSoundOn(true);
            setSoundBlocked(false);
            console.log("🔊 HERO SOUND STARTED WITH HERO ANIMATION");
          })
          .catch((error) => {
            setSoundOn(false);
            setSoundBlocked(true);
            console.warn("Browser blocked hero autoplay:", error);
          });
      }
    } catch (error) {
      setSoundOn(false);
      setSoundBlocked(true);
      console.error("Hero audio start error:", error);
    }
  }, [isAdminRoute, isHomePage]);

  const toggleHeroSound = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.paused && !audio.muted) {
      audio.pause();
      setSoundOn(false);
      return;
    }

    try {
      audio.muted = false;
      audio.volume = 1;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setSoundOn(true);
            setSoundBlocked(false);
          })
          .catch((error) => {
            setSoundOn(false);
            setSoundBlocked(true);
            console.warn("Sound control play blocked:", error);
          });
      }
    } catch (error) {
      setSoundOn(false);
      setSoundBlocked(true);
      console.error("Sound control error:", error);
    }
  }, []);

  /* =========================================================
     LOADER REVEAL

     The loader doors can open over the static hero background,
     but the actual hero GSAP timeline waits for Loader onComplete.
  ========================================================= */

  /* =========================================================
     LOADER FULLY COMPLETE

     Only removes the loader after the black doors finish.
  ========================================================= */

  const handleLoaderComplete = useCallback(() => {
    if (isAdminRoute) {
      return;
    }

    forceScrollToTop();

    /*
      Loader is now completely gone.
      Start Home's visual timeline.
      Home itself starts hero.mp3 at timeline position 0.
    */
    setLoadingComplete(true);
    setHeroStarted(true);
  }, [isAdminRoute, forceScrollToTop]);

  /* =========================================================
     HERO COMPLETE
  ========================================================= */

  const handleHeroComplete = useCallback(() => {
    setHeroComplete(true);

    setHeroAlreadyPlayed(true);

    ScrollTrigger.refresh();
  }, []);

  /* =========================================================
     STOP HERO AUDIO WHEN LEAVING HOME
  ========================================================= */

  useEffect(() => {
    if (isHomePage) {
      return;
    }

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setSoundOn(false);
    setSoundBlocked(false);
  }, [isHomePage]);

  /* =========================================================
     ADMIN CLEANUP
  ========================================================= */

  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    const audio = audioRef.current;

    if (audio) {
      audio.pause();

      audio.currentTime = 0;
    }

    document.documentElement.style.overflow = "";

    document.body.style.overflow = "";

    document.documentElement.style.height = "";

    document.body.style.height = "";

    forceScrollToTop();

    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });
  }, [isAdminRoute, forceScrollToTop]);

  /* =========================================================
     LOCOMOTIVE
  ========================================================= */

  useEffect(() => {
    let locomotiveScroll = null;

    let refreshTimer = null;

    /* ADMIN */

    if (isAdminRoute) {
      document.documentElement.style.overflow = "";

      document.body.style.overflow = "";

      return;
    }

    /* HOME INTRO */

    if (isHomePage && !heroComplete) {
      document.documentElement.style.overflow = "hidden";

      document.body.style.overflow = "hidden";

      return () => {
        document.documentElement.style.overflow = "";

        document.body.style.overflow = "";
      };
    }

    /* NORMAL WEBSITE */

    document.documentElement.style.overflow = "";

    document.body.style.overflow = "";

    try {
      locomotiveScroll = new LocomotiveScroll({
        lenisOptions: {
          lerp: 0.08,

          smoothWheel: true,

          wheelMultiplier: 0.8,
        },
      });

      locomotiveRef.current = locomotiveScroll;
    } catch (error) {
      console.warn("Locomotive Scroll error:", error);
    }

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

      if (locomotiveRef.current === locomotiveScroll) {
        locomotiveRef.current = null;
      }
    };
  }, [heroComplete, isHomePage, isAdminRoute, pathname]);

  /* =========================================================
     SCROLLTRIGGER
  ========================================================= */

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, isAdminRoute]);

  /* =========================================================
     ADMIN ROUTES
  ========================================================= */

  if (isAdminRoute) {
    return (
      <Routes>
        {/* LOGIN */}

        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ADMIN LAYOUT */}

        <Route path="/admin" element={<AdminLayout />}>
          {/* DASHBOARD */}

          <Route
            index
            element={
              <ProtectedDashboard>
                <Dashboard />
              </ProtectedDashboard>
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedDashboard>
                <Dashboard />
              </ProtectedDashboard>
            }
          />

          {/* OTHER ADMIN */}

          <Route path="orders" element={<Orders />} />

          <Route path="products" element={<Products />} />

          <Route path="categories" element={<Categories />} />

          <Route path="customers" element={<Customers />} />

          <Route path="coupons" element={<Coupons />} />

          <Route path="sliders" element={<Sliders />} />

          <Route path="banners" element={<Banners />} />

          <Route path="settings" element={<Settings />} />

          <Route
  path="/admin/shipping"
  element={<Shipping />}
/>

          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>
      </Routes>
    );
  }

  /* =========================================================
     WEBSITE
  ========================================================= */

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/hero.mp3"
        preload="auto"
        style={{
          display: "none",
        }}
      />

      {/* Sound UI is rendered only by Home.jsx via .ax-sound-dock */}

      <div className="app">
        <Navbar />

        <Routes>
          {/* HOME */}

          <Route
            path="/"
            element={
              <Home
                startAnimation={shouldPlayHeroIntro}
                heroComplete={heroComplete}
                heroAlreadyPlayed={heroAlreadyPlayed}
                onHeroStart={handleHeroAudioStart}
                onHeroComplete={handleHeroComplete}
              />
            }
          />

          {/* PRODUCT */}

          <Route path="/product/:id" element={<ProductDetails />} />

          {/* TSHIRTS */}

          <Route path="/tshirts" element={<Tshirts />} />

          <Route path="/t-shirts" element={<Tshirts />} />

          {/* SHIRTS */}

          <Route path="/shirts" element={<Shirts />} />

          {/* HOODIES */}

          <Route path="/hoodies" element={<Hoodies />} />

          {/* JEANS */}

          <Route path="/jeans" element={<Jeans />} />

          {/* TRACK PANTS */}

          <Route path="/track-pants" element={<TrackPants />} />

          {/* SHORTS */}

          <Route path="/shorts" element={<Shorts />} />

          {/* JACKETS */}

          <Route path="/jackets" element={<Jackets />} />

          {/* CO-ORD */}

          <Route path="/co-ord-sets" element={<CoOrdSets />} />

          {/* BEST SELLERS */}

          <Route path="/best-sellers" element={<BestSellers />} />

          {/* TRACK ORDER */}

          <Route path="/track-order" element={<TrackOrder />} />

          {/* CART */}

          <Route path="/cart" element={<Cart />} />

          {/* CHECKOUT */}

          <Route path="/checkout" element={<Checkout />} />

          {/* WRONG URL */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>

      {/* HOME LOADER */}

      {isHomePage && !loadingComplete && !heroAlreadyPlayed && (
        <Loader onComplete={handleLoaderComplete} />
      )}
    </>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
