import React, { useEffect, useState } from "react";

import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import "../styles/navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  /* =========================================
     CART COUNT
  ========================================= */

  const [cartCount, setCartCount] = useState(0);

  const navigate = useNavigate();

  /* =========================================
     UPDATE CART COUNT
  ========================================= */

  const updateCartCount = () => {
    try {
      const cart =
        JSON.parse(
          localStorage.getItem("axiee-cart"),
        ) || [];

      /*
        Example:
        Product 1 quantity = 4
        Product 2 quantity = 2

        Cart count = 6
      */

      const totalQuantity = cart.reduce(
        (total, item) => {
          return (
            total +
            Number(item.quantity || 1)
          );
        },
        0,
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error(
        "Cart count error:",
        error,
      );

      setCartCount(0);
    }
  };

  /* =========================================
     CART EVENT LISTENERS
  ========================================= */

  useEffect(() => {
    /*
      Read cart when Navbar loads
    */

    updateCartCount();

    /*
      Same-tab update
    */

    const handleCartUpdate = () => {
      updateCartCount();
    };

    /*
      Other browser tab update
    */

    const handleStorage = (event) => {
      if (event.key === "axiee-cart") {
        updateCartCount();
      }
    };

    window.addEventListener(
      "axiee-cart-updated",
      handleCartUpdate,
    );

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "axiee-cart-updated",
        handleCartUpdate,
      );

      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  /* =========================================
     BODY SCROLL LOCK
  ========================================= */

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  /* =========================================
     CLOSE MENU + SEARCH
  ========================================= */

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  /* =========================================
     CART PAGE
  ========================================= */

  const openCart = () => {
    closeAll();

    /*
      When we create Cart.jsx,
      this will open /cart
    */

    navigate("/cart");
  };

  /* =========================================
     ACCOUNT PAGE
  ========================================= */

  const openAccount = () => {
    closeAll();

    /*
      Later this can be /login
      or /account
    */

    navigate("/account");
  };

  return (
    <>
      {/* =====================================
          NAVBAR
      ===================================== */}

      <header className="ax-navbar">
        {/* LOGO */}

        <Link
          to="/"
          className="ax-navbar-logo"
          onClick={closeAll}
        >
          <span className="ax-logo-a"></span>

          <span>X</span>
          <span>I</span>
          <span>E</span>
          <span>E</span>
        </Link>

        {/* =================================
            DESKTOP LINKS
        ================================= */}

        <nav className="ax-navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            HOME
          </NavLink>

          <NavLink
            to="/shop"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            SHOP
          </NavLink>

          <a href="/#collections">
            COLLECTIONS
          </a>

          <a href="/#about">
            ABOUT
          </a>
        </nav>

        {/* =================================
            RIGHT SIDE
        ================================= */}

        <div className="ax-navbar-actions">
          {/* DESKTOP SEARCH */}

          <div className="ax-navbar-search">
            <Search
              size={18}
              strokeWidth={1.7}
            />

            <input
              type="text"
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>

          {/* =================================
              MOBILE SEARCH
          ================================= */}

          <button
            type="button"
            className="ax-mobile-search-button"
            onClick={() => {
              setSearchOpen(true);
              setMenuOpen(false);
            }}
            aria-label="Search"
          >
            <Search
              size={19}
              strokeWidth={1.7}
            />
          </button>

          {/* =================================
              ACCOUNT
          ================================= */}

          <button
            type="button"
            className="ax-account-button"
            aria-label="Account"
            onClick={openAccount}
          >
            <UserRound
              size={20}
              strokeWidth={1.6}
            />
          </button>

          {/* =================================
              CART

              LIVE CART COUNT
          ================================= */}

          <button
            type="button"
            className="ax-cart-button"
            aria-label={`Cart with ${cartCount} items`}
            onClick={openCart}
          >
            <ShoppingBag
              size={20}
              strokeWidth={1.6}
            />

            <span className="ax-cart-count">
              {cartCount}
            </span>
          </button>

          {/* =================================
              EXPLORE
          ================================= */}

          <Link
            to="/shop"
            className="ax-explore-button"
            onClick={closeAll}
          >
            <span>EXPLORE</span>

            <ArrowRight
              size={17}
              strokeWidth={1.5}
            />
          </Link>

          {/* =================================
              MOBILE MENU BUTTON
          ================================= */}

          <button
            type="button"
            className="ax-menu-button"
            onClick={() => {
              setMenuOpen(
                (previous) => !previous,
              );

              setSearchOpen(false);
            }}
            aria-label="Menu"
          >
            {menuOpen ? (
              <X
                size={22}
                strokeWidth={1.5}
              />
            ) : (
              <Menu
                size={22}
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>
      </header>

      {/* =====================================
          MOBILE MENU
      ===================================== */}

      <div
        className={`ax-mobile-menu ${
          menuOpen ? "active" : ""
        }`}
      >
        <div className="ax-mobile-menu-header">
          {/* LOGO */}

          <Link
            to="/"
            className="ax-navbar-logo"
            onClick={closeAll}
          >
            <span className="ax-logo-a"></span>

            <span>X</span>
            <span>I</span>
            <span>E</span>
            <span>E</span>
          </Link>

          {/* CLOSE */}

          <button
            type="button"
            className="ax-mobile-close"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Close menu"
          >
            <X
              size={23}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* =================================
            MOBILE LINKS
        ================================= */}

        <nav className="ax-mobile-links">
          <NavLink
            to="/"
            onClick={closeAll}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <i></i>
            HOME
          </NavLink>

          <NavLink
            to="/shop"
            onClick={closeAll}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <i></i>
            SHOP
          </NavLink>

          <a
            href="/#collections"
            onClick={closeAll}
          >
            <i></i>
            COLLECTIONS
          </a>

          <a
            href="/#about"
            onClick={closeAll}
          >
            <i></i>
            ABOUT
          </a>
        </nav>

        <div className="ax-mobile-divider"></div>

        {/* =================================
            MOBILE ACTIONS
        ================================= */}

        <div className="ax-mobile-actions">
          {/* SEARCH */}

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
          >
            <Search
              size={18}
              strokeWidth={1.6}
            />

            Search products...
          </button>

          {/* ACCOUNT */}

          <button
            type="button"
            onClick={openAccount}
          >
            <UserRound
              size={18}
              strokeWidth={1.6}
            />

            My Account
          </button>

          {/* CART */}

          <button
            type="button"
            onClick={openCart}
          >
            <ShoppingBag
              size={18}
              strokeWidth={1.6}
            />

            Cart ({cartCount})
          </button>
        </div>

        {/* =================================
            MOBILE TEXT
        ================================= */}

        <div className="ax-mobile-copy">
          <span>CLOTHES</span>
          <span>CULTURE</span>
          <span>BEYOND</span>
        </div>

        <div className="ax-mobile-glow"></div>
      </div>

      {/* =====================================
          MOBILE SEARCH OVERLAY
      ===================================== */}

      <div
        className={`ax-search-overlay ${
          searchOpen ? "active" : ""
        }`}
      >
        <div className="ax-search-header">
          {/* LOGO */}

          <Link
            to="/"
            className="ax-navbar-logo"
            onClick={closeAll}
          >
            <span className="ax-logo-a"></span>

            <span>X</span>
            <span>I</span>
            <span>E</span>
            <span>E</span>
          </Link>

          {/* CLOSE */}

          <button
            type="button"
            className="ax-mobile-close"
            onClick={() =>
              setSearchOpen(false)
            }
            aria-label="Close search"
          >
            <X
              size={23}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* =================================
            SEARCH CONTENT
        ================================= */}

        <div className="ax-search-content">
          <div className="ax-search-large">
            <Search
              size={20}
              strokeWidth={1.6}
            />

            <input
              type="text"
              autoFocus
              placeholder="Search products..."
            />
          </div>

          <div className="ax-search-copy">
            <p>
              FIND
              <br />
              YOUR
              <br />
              NEXT DROP
            </p>

            <span></span>
          </div>
        </div>

        <div className="ax-search-glow"></div>
      </div>
    </>
  );
}

export default Navbar;
