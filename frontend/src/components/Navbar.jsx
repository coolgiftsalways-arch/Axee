import React, { useEffect, useRef, useState } from "react";

import { ShoppingBag, Menu, X, ArrowRight, ChevronDown } from "lucide-react";

import { Link, NavLink, useNavigate } from "react-router-dom";

import "../styles/navbar.css";

/* =========================================================
   NAVBAR IMAGES
========================================================= */

import Hoodie from "../assets/navbar-image/Hoodie.png";
import Shirt from "../assets/navbar-image/Shirt.png";
import Tshirt from "../assets/navbar-image/Tshirt.png";
import Jean from "../assets/navbar-image/Jean.png";
import Track from "../assets/navbar-image/Track.png";
import Coord from "../assets/navbar-image/Co-ord.png";
import Short from "../assets/navbar-image/Short.png";
import Jacket from "../assets/navbar-image/Jacket.png";

/* =========================================================
   SHOP CATEGORIES
========================================================= */

const shopCategories = [
  {
    id: "tshirts",
    name: "T-SHIRTS",
    number: "01",
    href: "/tshirts",
    image: Tshirt,
  },

  {
    id: "jeans",
    name: "JEANS",
    number: "02",
    href: "/jeans",
    image: Jean,
  },

  {
    id: "tracks",
    name: "TRACK PANTS",
    number: "03",
    href: "/track-pants",
    image: Track,
  },

  {
    id: "shirts",
    name: "SHIRTS",
    number: "04",
    href: "/shirts",
    image: Shirt,
  },

  {
    id: "shorts",
    name: "SHORTS",
    number: "05",
    href: "/shorts",
    image: Short,
  },

  {
    id: "hoodies",
    name: "HOODIES",
    number: "06",
    href: "/hoodies",
    image: Hoodie,
  },

  {
    id: "coords",
    name: "CO-ORD SETS",
    number: "07",
    href: "/co-ord-sets",
    image: Coord,
  },

  {
    id: "jackets",
    name: "JACKETS",
    number: "08",
    href: "/jackets",
    image: Jacket,
  },
];

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Controls the scrolling announcement above the desktop/mobile navbar.
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const announcementVisible = announcementOpen && !menuOpen;
  // The delivery offer is highlighted without mentioning payment methods.
  const announcements = [
    { id: "delivery-1", text: "GET DELIVERED IN 1–2 DAYS", featured: true },
    { id: "collection", text: "EXPLORE THE COLLECTION" },
    { id: "delivery-2", text: "GET DELIVERED IN 1–2 DAYS", featured: true },
    { id: "unbound", text: "UNBOUND — MORE THAN CLOTHES" },
    { id: "delivery-3", text: "GET DELIVERED IN 1–2 DAYS", featured: true },
    { id: "streetwear", text: "STREETWEAR WITHOUT LIMITS" },
    { id: "delivery-4", text: "GET DELIVERED IN 1–2 DAYS", featured: true },
  ];

  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const [shopOpen, setShopOpen] = useState(false);

  const [activeShopItem, setActiveShopItem] = useState(shopCategories[0]);

  const [cartCount, setCartCount] = useState(0);

  const shopCloseTimer = useRef(null);
  const navbarRef = useRef(null);

  const navigate = useNavigate();

  /* =========================================================
     KEEP PAGE CONTENT BELOW THE FIXED NAVBAR.
     The measured bottom automatically handles the announcement
     bar opening/closing and desktop/mobile navbar heights.
  ========================================================= */
  useEffect(() => {
    let frame = null;

    const updateContentOffset = () => {
      if (!navbarRef.current) return;

      const navbarBottom = navbarRef.current.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty(
        "--ax-nav-content-offset",
        `${Math.ceil(navbarBottom + 16)}px`,
      );
    };

    const handleResize = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateContentOffset);
    };

    updateContentOffset();
    window.addEventListener("resize", handleResize);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      document.documentElement.style.removeProperty("--ax-nav-content-offset");
    };
  }, [announcementVisible]);

  /* =========================================================
     OPEN SHOP MENU
  ========================================================= */

  const openShopMenu = () => {
    if (shopCloseTimer.current) {
      clearTimeout(shopCloseTimer.current);

      shopCloseTimer.current = null;
    }

    setShopOpen(true);
  };

  /* =========================================================
     CLOSE SHOP MENU
  ========================================================= */

  const closeShopMenu = () => {
    if (shopCloseTimer.current) {
      clearTimeout(shopCloseTimer.current);
    }

    shopCloseTimer.current = setTimeout(() => {
      setShopOpen(false);

      shopCloseTimer.current = null;
    }, 250);
  };

  /* =========================================================
     CLEAN SHOP TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (shopCloseTimer.current) {
        clearTimeout(shopCloseTimer.current);
      }
    };
  }, []);

  /* =========================================================
     API
  ========================================================= */

  const API_BASE = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : "")
  ).replace(/\/+$/, "");

  console.log("🌐 Navbar API:", API_BASE || "same-origin");

  const readApiResponse = async (response, label = "API") => {
    const text = await response.text();

    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        console.error(`❌ ${label} returned invalid JSON:`, {
          status: response.status,
          statusText: response.statusText,
          body: text,
        });

        throw new Error(
          `${label} returned an invalid response (${response.status})`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          `${label} failed (${response.status} ${response.statusText})`,
      );
    }

    return data;
  };

  /* =========================================================
     CART ID WATCHER
  ========================================================= */

  const lastCartIdRef = useRef(localStorage.getItem("axiee-cart-id"));

  /* =========================================================
     CALCULATE CART COUNT
  ========================================================= */

  const getCartQuantity = (cart) => {
    const items = Array.isArray(cart?.items) ? cart.items : [];

    return items.reduce(
      (total, item) => total + Number(item?.quantity || 1),
      0,
    );
  };

  /* =========================================================
     LOAD CART COUNT
  ========================================================= */

  const updateCartCount = async () => {
    try {
      const cartId = localStorage.getItem("axiee-cart-id");

      lastCartIdRef.current = cartId;

      /* ===============================================
           NO CART ID
        =============================================== */

      if (!cartId) {
        setCartCount(0);

        return;
      }

      /* ===============================================
           GET CART
        =============================================== */

      const response = await fetch(`${API_BASE}/api/cart/${cartId}`, {
        cache: "no-store",

        headers: {
          Accept: "application/json",
        },
      });

      const data = await readApiResponse(response, "Navbar cart");

      const updatedCart = data?.cart ||
        data || {
          items: [],
        };

      setCartCount(getCartQuantity(updatedCart));
    } catch (error) {
      console.error("Navbar cart count error:", error);

      if (!localStorage.getItem("axiee-cart-id")) {
        setCartCount(0);
      }
    }
  };

  /* =========================================================
     CART AUTO SYNC
  ========================================================= */

  useEffect(() => {
    /* ===============================================
       INITIAL COUNT
    =============================================== */

    updateCartCount();

    /* ===============================================
       CART UPDATED EVENT
    =============================================== */

    const handleCartUpdate = (event) => {
      const updatedCart = event?.detail;

      if (updatedCart && Array.isArray(updatedCart.items)) {
        setCartCount(getCartQuantity(updatedCart));

        lastCartIdRef.current = localStorage.getItem("axiee-cart-id");

        return;
      }

      updateCartCount();
    };

    /* ===============================================
       CART CLEARED EVENT
    =============================================== */

    const handleCartCleared = () => {
      lastCartIdRef.current = null;

      setCartCount(0);
    };

    /* ===============================================
       STORAGE EVENT
    =============================================== */

    const handleStorage = (event) => {
      if (event.key !== "axiee-cart-id") {
        return;
      }

      if (!event.newValue) {
        lastCartIdRef.current = null;

        setCartCount(0);

        return;
      }

      lastCartIdRef.current = event.newValue;

      updateCartCount();
    };

    /* ===============================================
       WINDOW FOCUS
    =============================================== */

    const handleWindowFocus = () => {
      updateCartCount();
    };

    /* ===============================================
       TAB VISIBILITY
    =============================================== */

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateCartCount();
      }
    };

    /* ===============================================
       SAME TAB CART WATCHER
    =============================================== */

    const cartIdWatcher = window.setInterval(() => {
      const currentCartId = localStorage.getItem("axiee-cart-id");

      if (currentCartId === lastCartIdRef.current) {
        return;
      }

      lastCartIdRef.current = currentCartId;

      /* =========================================
             CART REMOVED
          ========================================= */

      if (!currentCartId) {
        setCartCount(0);

        return;
      }

      /* =========================================
             NEW CART
          ========================================= */

      updateCartCount();
    }, 250);

    /* ===============================================
       EVENTS
    =============================================== */

    window.addEventListener("axiee-cart-updated", handleCartUpdate);

    window.addEventListener("axiee-cart-cleared", handleCartCleared);

    window.addEventListener("storage", handleStorage);

    window.addEventListener("focus", handleWindowFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    /* ===============================================
       CLEANUP
    =============================================== */

    return () => {
      window.clearInterval(cartIdWatcher);

      window.removeEventListener("axiee-cart-updated", handleCartUpdate);

      window.removeEventListener("axiee-cart-cleared", handleCartCleared);

      window.removeEventListener("storage", handleStorage);

      window.removeEventListener("focus", handleWindowFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* =========================================================
     BODY SCROLL
  ========================================================= */

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* =========================================================
     CLOSE EVERYTHING
  ========================================================= */

  const closeAll = () => {
    setMenuOpen(false);

    setMobileShopOpen(false);

    setShopOpen(false);

    if (shopCloseTimer.current) {
      clearTimeout(shopCloseTimer.current);

      shopCloseTimer.current = null;
    }
  };

  /* =========================================================
     CART
  ========================================================= */

  const openCart = () => {
    closeAll();

    navigate("/cart");
  };

  /* =========================================================
     CATEGORY
  ========================================================= */

  const goToCategory = (href) => {
    closeAll();

    navigate(href);
  };

  /* =========================================================
     SHOP MORE
  ========================================================= */

  const openBestSellers = () => {
    closeAll();

    navigate("/best-sellers");
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <>
      {/* =====================================================
          SCROLLING ANNOUNCEMENT — DESKTOP + MOBILE
      ===================================================== */}
      {announcementVisible && (
        <aside className="ax-announcement-bar" aria-label="UNBOUND updates">
          {/* Always-visible delivery highlight, including on mobile. */}
          <span
            className="ax-announcement-label"
            aria-label="Estimated delivery in 1 to 2 days"
          >
            <span className="ax-announcement-label-icon" aria-hidden="true">
              ✦
            </span>
            <span className="ax-announcement-label-copy">
              <strong>DELIVERY IN 1–2 DAYS</strong>
            </span>
          </span>

          <div className="ax-announcement-marquee" aria-hidden="true">
            <div className="ax-announcement-track">
              {[0, 1].map((copy) => (
                <div className="ax-announcement-group" key={copy}>
                  {announcements.map((message) => (
                    <React.Fragment key={`${copy}-${message.id}`}>
                      <span
                        className={`ax-announcement-text${message.featured ? " ax-announcement-text-featured" : ""}`}
                      >
                        {message.featured && (
                          <span className="ax-announcement-fast-icon">✦</span>
                        )}
                        {message.text}
                      </span>
                      <span className="ax-announcement-star">✦</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="ax-announcement-close"
            aria-label="Close announcement bar"
            onClick={() => setAnnouncementOpen(false)}
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </aside>
      )}

      {/* =====================================================
          DESKTOP NAVBAR
      ===================================================== */}

      <header
        ref={navbarRef}
        className={`ax-navbar${announcementVisible ? " ax-navbar-with-announcement" : ""}`}
      >
        {/* ===============================================
            LOGO
        =============================================== */}

        <Link
          to="/"
          className="ax-navbar-logo ax-unbound-logo"
          onClick={closeAll}
        >
          UNBOUND
        </Link>

        {/* ===================================================
            NAV LINKS
        =================================================== */}

        <nav className="ax-navbar-links">
          {/* HOME */}

          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            HOME
          </NavLink>

          {/* =================================================
              SHOP
          ================================================= */}

          <div
            className="ax-shop-nav-item"
            onMouseEnter={openShopMenu}
            onMouseLeave={closeShopMenu}
          >
            <button
              type="button"
              className={
                shopOpen ? "ax-shop-trigger active" : "ax-shop-trigger"
              }
            >
              SHOP
              <span className="ax-shop-trigger-dot"></span>
            </button>

            {/* ===============================================
                SHOP MEGA MENU
            =============================================== */}

            <div
              className={shopOpen ? "ax-shop-mega active" : "ax-shop-mega"}
              onMouseEnter={openShopMenu}
              onMouseLeave={closeShopMenu}
            >
              {/* =============================================
                  LEFT
              ============================================= */}

              <div className="ax-shop-mega-left">
                <div className="ax-shop-mega-top">
                  <span>SHOP / COLLECTIONS</span>

                  <span>UNBOUND © 2026</span>
                </div>

                {/* TITLE */}

                <div className="ax-shop-mega-title">
                  <span>EXPLORE</span>

                  <h2>
                    THE
                    <br />
                    UNKNOWN
                  </h2>
                </div>

                {/* ===========================================
                    CATEGORY LIST
                =========================================== */}

                <div className="ax-shop-category-list">
                  {shopCategories.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        activeShopItem.id === item.id
                          ? "ax-shop-category active"
                          : "ax-shop-category"
                      }
                      onMouseEnter={() => setActiveShopItem(item)}
                      onClick={() => goToCategory(item.href)}
                    >
                      <span className="ax-shop-category-number">
                        {item.number}
                      </span>

                      <strong>{item.name}</strong>

                      <ArrowRight size={21} strokeWidth={1.3} />
                    </button>
                  ))}
                </div>

                {/* ===========================================
                    BOTTOM
                =========================================== */}

                <div className="ax-shop-mega-bottom">
                  <span>
                    MORE THAN CLOTHES.
                    <br />A MINDSET.
                  </span>
                </div>
              </div>

              {/* =============================================
                  RIGHT
              ============================================= */}

              <div className="ax-shop-mega-right">
                {/* IMAGE */}

                <div key={activeShopItem.id} className="ax-shop-preview-image">
                  <img src={activeShopItem.image} alt={activeShopItem.name} />
                </div>

                <div className="ax-shop-image-dark"></div>

                {/* TOP */}

                <div className="ax-shop-image-top">
                  <span>{activeShopItem.number}</span>

                  <span>
                    UNBOUND
                    <br />
                    COLLECTION
                  </span>
                </div>

                {/* CONTENT */}

                <div className="ax-shop-image-content">
                  <span>SELECTED CATEGORY</span>

                  <h3>{activeShopItem.name}</h3>

                  <button
                    type="button"
                    onClick={() => goToCategory(activeShopItem.href)}
                  >
                    DISCOVER
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="ax-shop-image-word">UNBOUND</div>
              </div>
            </div>
          </div>

          {/* =================================================
              BEST SELLERS
          ================================================= */}

          <NavLink
            to="/best-sellers"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            BEST SELLERS
          </NavLink>

          {/* =================================================
              TRACK ORDER
          ================================================= */}

          <NavLink
            to="/track-order"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            TRACK ORDER
          </NavLink>
        </nav>

        {/* ===================================================
            DESKTOP ACTIONS
        =================================================== */}

        <div className="ax-navbar-actions">
          {/* ===============================================
              ACCOUNT REMOVED
          =============================================== */}

          {/* ===============================================
              CART
          =============================================== */}

          <button
            type="button"
            className="ax-cart-button"
            aria-label={`Cart with ${cartCount} items`}
            onClick={openCart}
          >
            <ShoppingBag size={20} strokeWidth={1.6} />

            <span className="ax-cart-count">{cartCount}</span>
          </button>

          {/* ===============================================
              SHOP MORE
          =============================================== */}

          <Link
            to="/best-sellers"
            className="ax-explore-button"
            onClick={closeAll}
          >
            <span>SHOP MORE</span>

            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>

          {/* ===============================================
              MENU
          =============================================== */}

          <button
            type="button"
            className="ax-menu-button"
            aria-label="Menu"
            onClick={() => {
              setMenuOpen((previous) => !previous);

              setShopOpen(false);

              if (menuOpen) {
                setMobileShopOpen(false);
              }
            }}
          >
            {menuOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <div className={`ax-mobile-menu ${menuOpen ? "active" : ""}`}>
        {/* ===================================================
            MOBILE HEADER

            SECOND UNBOUND LOGO REMOVED
        =================================================== */}

        <div className="ax-mobile-menu-header">
          <button
            type="button"
            className="ax-mobile-close"
            onClick={closeAll}
            aria-label="Close menu"
          >
            <X size={23} strokeWidth={1.5} />
          </button>
        </div>

        {/* ===================================================
            MOBILE LINKS
        =================================================== */}

        <nav className="ax-mobile-links">
          {/* HOME */}

          <NavLink
            to="/"
            onClick={closeAll}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <i></i>
            HOME
          </NavLink>

          {/* =================================================
              MOBILE SHOP
          ================================================= */}

          <div className={`ax-mobile-shop ${mobileShopOpen ? "active" : ""}`}>
            <button
              type="button"
              className="ax-mobile-shop-trigger"
              onClick={() => setMobileShopOpen((previous) => !previous)}
            >
              <span className="ax-mobile-shop-trigger-left">
                <i></i>

                <span>SHOP</span>
              </span>

              <ChevronDown size={20} strokeWidth={1.5} />
            </button>

            {/* ===============================================
                MOBILE CATEGORY DROPDOWN
            =============================================== */}

            <div className="ax-mobile-shop-dropdown">
              {shopCategories.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => goToCategory(item.href)}
                >
                  <span>{item.number}</span>

                  <strong>{item.name}</strong>

                  <ArrowRight size={17} strokeWidth={1.4} />
                </button>
              ))}
            </div>
          </div>

          {/* =================================================
              BEST SELLERS
          ================================================= */}

          <NavLink
            to="/best-sellers"
            onClick={closeAll}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <i></i>
            BEST SELLERS
          </NavLink>

          {/* =================================================
              TRACK ORDER
          ================================================= */}

          <NavLink
            to="/track-order"
            onClick={closeAll}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <i></i>
            TRACK ORDER
          </NavLink>
        </nav>

        <div className="ax-mobile-divider"></div>

        {/* ===================================================
            MOBILE ACTIONS
        =================================================== */}

        <div className="ax-mobile-actions">
          {/* ===============================================
              MY ACCOUNT REMOVED
          =============================================== */}

          {/* ===============================================
              SHOP MORE
          =============================================== */}

          <button type="button" onClick={openBestSellers}>
            SHOP MORE
            <ArrowRight size={18} strokeWidth={1.6} />
          </button>

          {/* ===============================================
              CART
          =============================================== */}

          <button type="button" onClick={openCart}>
            <ShoppingBag size={18} strokeWidth={1.6} />
            Cart ({cartCount})
          </button>
        </div>

        {/* ===================================================
            MOBILE WORDS
        =================================================== */}

        <div className="ax-mobile-copy">
          <span>CLOTHES</span>

          <span>CULTURE</span>

          <span>BEYOND</span>
        </div>

        <div className="ax-mobile-glow"></div>
      </div>
    </>
  );
}

export default Navbar;
