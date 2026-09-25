import { useCallback, useEffect, useRef, useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   WEBSITE COMPONENTS
========================================================= */

import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

/* =========================================================
   WEBSITE PAGES
========================================================= */

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
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

/* =========================================================
   STYLES
========================================================= */

import "./styles/pageTransition.css";

/* =========================================================
   LAYOUT
========================================================= */

function Layout() {
  const location = useLocation();

  const pathname = location.pathname;

  const pathnameLower = pathname.toLowerCase();

  const isHomePage = pathname === "/";

  const isAdminRoute =
    pathnameLower === "/admin" || pathnameLower.startsWith("/admin/");

  /* =====================================================
     WEBSITE STATE
  ===================================================== */

  const [loadingComplete, setLoadingComplete] = useState(false);

  const [heroComplete, setHeroComplete] = useState(false);

  const [heroAlreadyPlayed, setHeroAlreadyPlayed] = useState(false);

  const audioRef = useRef(null);

  const locomotiveRef = useRef(null);

  const shouldPlayHeroIntro = loadingComplete && !heroAlreadyPlayed;

  /* =====================================================
     SCROLL RESTORATION
     ALWAYS OPEN A NEW ROUTE FROM THE TOP
  ===================================================== */

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

  const forceScrollToTop = useCallback(() => {
    /* =================================================
       CLEAR GSAP SCROLL MEMORY
    ================================================= */

    try {
      ScrollTrigger.clearScrollMemory("manual");
    } catch (error) {
      console.warn("ScrollTrigger scroll memory error:", error);
    }

    /* =================================================
       NORMAL BROWSER SCROLL
    ================================================= */

    document.documentElement.scrollTop = 0;

    document.body.scrollTop = 0;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    /* =================================================
       LOCOMOTIVE / LENIS SCROLL
    ================================================= */

    const locomotive = locomotiveRef.current;

    if (locomotive) {
      try {
        locomotive.scrollTo?.(0, {
          duration: 0,
          offset: 0,
          disableLerp: true,
          immediate: true,
        });
      } catch (error) {
        console.warn("Locomotive scrollTo error:", error);
      }

      try {
        locomotive.lenis?.scrollTo?.(0, {
          immediate: true,
          force: true,
        });
      } catch (error) {
        console.warn("Lenis scrollTo error:", error);
      }

      try {
        locomotive.lenisInstance?.scrollTo?.(0, {
          immediate: true,
          force: true,
        });
      } catch (error) {
        console.warn("Lenis instance scrollTo error:", error);
      }
    }
  }, []);

  /* =====================================================
     ROUTE CHANGE -> TOP
  ===================================================== */

  useEffect(() => {
    let frameTwo = null;

    forceScrollToTop();

    const frameOne = requestAnimationFrame(() => {
      forceScrollToTop();

      frameTwo = requestAnimationFrame(() => {
        forceScrollToTop();
      });
    });

    const timer = setTimeout(() => {
      forceScrollToTop();

      if (!isAdminRoute) {
        ScrollTrigger.refresh();
      }
    }, 120);

    return () => {
      cancelAnimationFrame(frameOne);

      if (frameTwo !== null) {
        cancelAnimationFrame(frameTwo);
      }

      clearTimeout(timer);
    };
  }, [pathname, isAdminRoute, forceScrollToTop]);

  /* =====================================================
     HERO AUDIO
     WEBSITE ONLY
  ===================================================== */

  useEffect(() => {
    if (isAdminRoute) {
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
  }, [isAdminRoute]);

  /* =====================================================
     LOADER COMPLETE
  ===================================================== */

  const handleLoaderComplete = useCallback(() => {
    if (isAdminRoute) {
      return;
    }

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
              console.warn("Browser blocked autoplay:", error);
            });
        }
      } catch (error) {
        console.error("Audio error:", error);
      }
    }

    setLoadingComplete(true);
  }, [isAdminRoute]);

  /* =====================================================
     HERO COMPLETE
  ===================================================== */

  const handleHeroComplete = useCallback(() => {
    setHeroComplete(true);

    setHeroAlreadyPlayed(true);
  }, []);

  /* =====================================================
     ADMIN CLEANUP
  ===================================================== */

  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    /* STOP WEBSITE AUDIO */

    const audio = audioRef.current;

    if (audio) {
      audio.pause();

      audio.currentTime = 0;
    }

    /* RESTORE NORMAL SCROLL */

    document.documentElement.style.overflow = "";

    document.body.style.overflow = "";

    document.documentElement.style.height = "";

    document.body.style.height = "";

    /* SCROLL TOP */

    forceScrollToTop();

    /* REMOVE WEBSITE SCROLL TRIGGERS */

    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });
  }, [isAdminRoute, forceScrollToTop]);

  /* =====================================================
     LOCOMOTIVE SCROLL
     WEBSITE ONLY
  ===================================================== */

  useEffect(() => {
    let locomotiveScroll = null;

    let refreshTimer = null;

    /* ===================================================
       ADMIN
    =================================================== */

    if (isAdminRoute) {
      document.documentElement.style.overflow = "";

      document.body.style.overflow = "";

      return;
    }

    /* ===================================================
       HOME INTRO
    =================================================== */

    if (isHomePage && !heroComplete) {
      document.documentElement.style.overflow = "hidden";

      document.body.style.overflow = "hidden";

      return () => {
        document.documentElement.style.overflow = "";

        document.body.style.overflow = "";
      };
    }

    /* ===================================================
       NORMAL WEBSITE
    =================================================== */

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

      forceScrollToTop();
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
  }, [heroComplete, isHomePage, isAdminRoute, pathname, forceScrollToTop]);

  /* =====================================================
     SCROLLTRIGGER REFRESH AFTER ROUTE CHANGE
  ===================================================== */

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

  /* =====================================================
     ADMIN ROUTES
  ===================================================== */

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route index element={<Dashboard />} />

          <Route path="dashboard" element={<Dashboard />} />

          {/* =================================================
              ORDERS
          ================================================= */}

          <Route path="orders" element={<Orders />} />

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <Route path="products" element={<Products />} />

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <Route path="categories" element={<Categories />} />

          {/* =================================================
              CUSTOMERS
          ================================================= */}

          <Route path="customers" element={<Customers />} />

          {/* =================================================
              COUPONS
          ================================================= */}

          <Route path="coupons" element={<Coupons />} />

          {/* =================================================
              SLIDERS
          ================================================= */}

          <Route path="sliders" element={<Sliders />} />

          {/* =================================================
              BANNERS
          ================================================= */}

          <Route path="banners" element={<Banners />} />

          {/* =================================================
              SETTINGS
          ================================================= */}

          <Route path="settings" element={<Settings />} />

          {/* =================================================
              WRONG ADMIN URL
          ================================================= */}

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    );
  }

  /* =====================================================
     NORMAL WEBSITE
  ===================================================== */

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/hero.mp3"
        preload="auto"
        style={{ display: "none" }}
      />

      <div className="app">
        <Navbar />

        <Routes>
          {/* =================================================
              HOME
          ================================================= */}

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

          {/* =================================================
              SHOP
          ================================================= */}

          <Route path="/shop" element={<Shop />} />

          {/* =================================================
              PRODUCT DETAILS
          ================================================= */}

          <Route path="/product/:id" element={<ProductDetails />} />

          {/* =================================================
              T-SHIRTS
          ================================================= */}

          <Route path="/tshirts" element={<Tshirts />} />

          <Route path="/t-shirts" element={<Tshirts />} />

          {/* =================================================
              SHIRTS
          ================================================= */}

          <Route path="/shirts" element={<Shirts />} />

          {/* =================================================
              HOODIES
          ================================================= */}

          <Route path="/hoodies" element={<Hoodies />} />

          {/* =================================================
              JEANS
          ================================================= */}

          <Route path="/jeans" element={<Jeans />} />

          {/* =================================================
              TRACK PANTS
          ================================================= */}

          <Route path="/track-pants" element={<TrackPants />} />

          {/* =================================================
              SHORTS
          ================================================= */}

          <Route path="/shorts" element={<Shorts />} />

          {/* =================================================
              JACKETS
          ================================================= */}

          <Route path="/jackets" element={<Jackets />} />

          {/* =================================================
              CO-ORD SETS
          ================================================= */}

          <Route path="/co-ord-sets" element={<CoOrdSets />} />

          {/* =================================================
              BEST SELLERS
          ================================================= */}

          <Route path="/best-sellers" element={<BestSellers />} />

          {/* =================================================
              TRACK ORDER
          ================================================= */}

          <Route path="/track-order" element={<TrackOrder />} />

          {/* =================================================
              CART
          ================================================= */}

          <Route path="/cart" element={<Cart />} />

          {/* =================================================
              CHECKOUT
          ================================================= */}

          <Route path="/checkout" element={<Checkout />} />

          {/* =================================================
              WRONG URL
          ================================================= */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>

      {/* =====================================================
          HOME LOADER
      ===================================================== */}

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
