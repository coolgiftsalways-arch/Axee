import React, { useEffect, useRef, useState } from "react";

import {
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

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

  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const [shopOpen, setShopOpen] = useState(false);

  const [activeShopItem, setActiveShopItem] = useState(shopCategories[0]);

  const [cartCount, setCartCount] = useState(0);

  const shopCloseTimer = useRef(null);

  const navigate = useNavigate();

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
     CART COUNT
  ========================================================= */

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("axiee-cart")) || [];

      const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0,
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error("Cart count error:", error);

      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

    const handleStorage = (event) => {
      if (event.key === "axiee-cart") {
        updateCartCount();
      }
    };

    window.addEventListener("axiee-cart-updated", handleCartUpdate);

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("axiee-cart-updated", handleCartUpdate);

      window.removeEventListener("storage", handleStorage);
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
     ACCOUNT
  ========================================================= */

  const openAccount = () => {
    closeAll();

    navigate("/account");
  };

  /* =========================================================
     CATEGORY NAVIGATION
  ========================================================= */

  const goToCategory = (href) => {
    closeAll();

    navigate(href);
  };

  return (
    <>
      {/* =====================================================
          DESKTOP NAVBAR
      ===================================================== */}

      <header className="ax-navbar">
        {/* LOGO */}

        <Link to="/" className="ax-navbar-logo" onClick={closeAll}>
          <span className="ax-logo-a"></span>

          <span>X</span>
          <span>I</span>
          <span>E</span>
          <span>E</span>
        </Link>

        {/* =================================================
            NAV LINKS
        ================================================= */}

        <nav className="ax-navbar-links">
          {/* HOME */}

          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            HOME
          </NavLink>

          {/* =================================================
              SHOP MEGA MENU
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

            {/* MEGA MENU */}

            <div
              className={shopOpen ? "ax-shop-mega active" : "ax-shop-mega"}
              onMouseEnter={openShopMenu}
              onMouseLeave={closeShopMenu}
            >
              {/* =============================================
                  LEFT SIDE
              ============================================= */}

              <div className="ax-shop-mega-left">
                <div className="ax-shop-mega-top">
                  <span>SHOP / COLLECTIONS</span>

                  <span>AXIEE © 2026</span>
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

                {/* BOTTOM */}

                <div className="ax-shop-mega-bottom">
                  <span>
                    MORE THAN CLOTHES.
                    <br />A MINDSET.
                  </span>

                  <button type="button" onClick={() => goToCategory("/shop")}>
                    VIEW ALL
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* =============================================
                  RIGHT SIDE
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
                    AXIEE
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

                <div className="ax-shop-image-word">AXIEE</div>
              </div>
            </div>
          </div>

          {/* COLLECTIONS */}

          <a href="/#collections">COLLECTIONS</a>

          {/* ABOUT */}

          <a href="/#about">ABOUT</a>
        </nav>

        {/* =================================================
            NAVBAR ACTIONS
        ================================================= */}

        <div className="ax-navbar-actions">
          {/* ACCOUNT */}

          <button
            type="button"
            className="ax-account-button"
            aria-label="Account"
            onClick={openAccount}
          >
            <UserRound size={20} strokeWidth={1.6} />
          </button>

          {/* CART */}

          <button
            type="button"
            className="ax-cart-button"
            aria-label={`Cart with ${cartCount} items`}
            onClick={openCart}
          >
            <ShoppingBag size={20} strokeWidth={1.6} />

            <span className="ax-cart-count">{cartCount}</span>
          </button>

          {/* EXPLORE */}

          <Link to="/shop" className="ax-explore-button" onClick={closeAll}>
            <span>EXPLORE</span>

            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>

          {/* MOBILE MENU BUTTON */}

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
        {/* MOBILE HEADER */}

        <div className="ax-mobile-menu-header">
          <Link to="/" className="ax-navbar-logo" onClick={closeAll}>
            <span className="ax-logo-a"></span>

            <span>X</span>
            <span>I</span>
            <span>E</span>
            <span>E</span>
          </Link>

          <button
            type="button"
            className="ax-mobile-close"
            onClick={closeAll}
            aria-label="Close menu"
          >
            <X size={23} strokeWidth={1.5} />
          </button>
        </div>

        {/* =================================================
            MOBILE LINKS
        ================================================= */}

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

          {/* MOBILE SHOP */}

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

            {/* CATEGORY DROPDOWN */}

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

          {/* COLLECTIONS */}

          <a href="/#collections" onClick={closeAll}>
            <i></i>
            COLLECTIONS
          </a>

          {/* ABOUT */}

          <a href="/#about" onClick={closeAll}>
            <i></i>
            ABOUT
          </a>
        </nav>

        <div className="ax-mobile-divider"></div>

        {/* =================================================
            MOBILE ACTIONS
        ================================================= */}

        <div className="ax-mobile-actions">
          {/* ACCOUNT */}

          <button type="button" onClick={openAccount}>
            <UserRound size={18} strokeWidth={1.6} />
            My Account
          </button>

          {/* CART */}

          <button type="button" onClick={openCart}>
            <ShoppingBag size={18} strokeWidth={1.6} />
            Cart ({cartCount})
          </button>
        </div>

        {/* WORDS */}

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
