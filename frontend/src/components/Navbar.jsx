import React, { useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

import "../styles/navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="ax-navbar">
        {/* LOGO */}
        <a href="#home" className="ax-navbar-logo">
          <span className="ax-logo-a"></span>
          <span>X</span>
          <span>I</span>
          <span>E</span>
          <span>E</span>
        </a>

        {/* DESKTOP LINKS */}
        <nav className="ax-navbar-links">
          <a href="#home" className="active">
            HOME
          </a>

          <a href="#shop">SHOP</a>

          <a href="#collections">COLLECTIONS</a>

          <a href="#about">ABOUT</a>
        </nav>

        {/* RIGHT SIDE */}
        <div className="ax-navbar-actions">
          {/* DESKTOP SEARCH */}
          <div className="ax-navbar-search">
            <Search size={18} strokeWidth={1.7} />

            <input
              type="text"
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>

          {/* MOBILE SEARCH BUTTON */}
          <button
            className="ax-mobile-search-button"
            onClick={() => {
              setSearchOpen(true);
              setMenuOpen(false);
            }}
            aria-label="Search"
          >
            <Search size={19} strokeWidth={1.7} />
          </button>

          {/* ACCOUNT */}
          <button className="ax-account-button" aria-label="Account">
            <UserRound size={20} strokeWidth={1.6} />
          </button>

          {/* CART */}
          <button className="ax-cart-button" aria-label="Cart">
            <ShoppingBag size={20} strokeWidth={1.6} />

            <span className="ax-cart-count">0</span>
          </button>

          {/* EXPLORE */}
          <a href="#shop" className="ax-explore-button">
            <span>EXPLORE</span>

            <ArrowRight size={17} strokeWidth={1.5} />
          </a>

          {/* MOBILE MENU BUTTON */}
          <button
            className="ax-menu-button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setSearchOpen(false);
            }}
            aria-label="Menu"
          >
            {menuOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* =========================
          MOBILE MENU
      ========================= */}

      <div className={`ax-mobile-menu ${menuOpen ? "active" : ""}`}>
        <div className="ax-mobile-menu-header">
          <a href="#home" className="ax-navbar-logo" onClick={closeAll}>
            <span className="ax-logo-a"></span>
            <span>X</span>
            <span>I</span>
            <span>E</span>
            <span>E</span>
          </a>

          <button
            className="ax-mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            <X size={23} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="ax-mobile-links">
          <a href="#home" className="active" onClick={closeAll}>
            <i></i>
            HOME
          </a>

          <a href="#shop" onClick={closeAll}>
            <i></i>
            SHOP
          </a>

          <a href="#collections" onClick={closeAll}>
            <i></i>
            COLLECTIONS
          </a>

          <a href="#about" onClick={closeAll}>
            <i></i>
            ABOUT
          </a>
        </nav>

        <div className="ax-mobile-divider"></div>

        <div className="ax-mobile-actions">
          <button
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
          >
            <Search size={18} strokeWidth={1.6} />
            Search products...
          </button>

          <button>
            <UserRound size={18} strokeWidth={1.6} />
            My Account
          </button>

          <button>
            <ShoppingBag size={18} strokeWidth={1.6} />
            Cart (0)
          </button>
        </div>

        <div className="ax-mobile-copy">
          <span>CLOTHES</span>
          <span>CULTURE</span>
          <span>BEYOND</span>
        </div>

        <div className="ax-mobile-glow"></div>
      </div>

      {/* =========================
          MOBILE SEARCH OVERLAY
      ========================= */}

      <div className={`ax-search-overlay ${searchOpen ? "active" : ""}`}>
        <div className="ax-search-header">
          <a href="#home" className="ax-navbar-logo" onClick={closeAll}>
            <span className="ax-logo-a"></span>
            <span>X</span>
            <span>I</span>
            <span>E</span>
            <span>E</span>
          </a>

          <button
            className="ax-mobile-close"
            onClick={() => setSearchOpen(false)}
          >
            <X size={23} strokeWidth={1.5} />
          </button>
        </div>

        <div className="ax-search-content">
          <div className="ax-search-large">
            <Search size={20} strokeWidth={1.6} />

            <input type="text" autoFocus placeholder="Search products..." />
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
