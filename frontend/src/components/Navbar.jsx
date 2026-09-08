import React, { useEffect, useRef, useState } from "react";

import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import "../styles/navbar.css";

/* =========================================================
   SHOP CATEGORIES
========================================================= */

const shopCategories = [
  {
    id: "tshirts",
    name: "T-SHIRTS",
    number: "01",
    href: "/tshirts",
    image: "/products/tshirt-1.jpg",
  },

  {
    id: "jeans",
    name: "JEANS",
    number: "02",
    href: "/jeans",
    image: "/products/jean-1.jpg",
  },

  {
    id: "tracks",
    name: "TRACK PANTS",
    number: "03",
    href: "/track-pants",
    image: "/products/track-1.jpg",
  },

  {
    id: "shirts",
    name: "SHIRTS",
    number: "04",
    href: "/shirts",
    image: "/products/shirt-1.jpg",
  },

  {
    id: "shorts",
    name: "SHORTS",
    number: "05",
    href: "/shorts",
    image: "/products/short-1.jpg",
  },
];

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  /* =========================================================
     MOBILE STATES
  ========================================================= */

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [
    mobileShopOpen,
    setMobileShopOpen,
  ] = useState(false);

  /* =========================================================
     DESKTOP SHOP STATES
  ========================================================= */

  const [shopOpen, setShopOpen] =
    useState(false);

  const [
    activeShopItem,
    setActiveShopItem,
  ] = useState(shopCategories[0]);

  const shopCloseTimer =
    useRef(null);

  /* =========================================================
     CART
  ========================================================= */

  const [cartCount, setCartCount] =
    useState(0);

  /* =========================================================
     OPEN DESKTOP SHOP
  ========================================================= */

  const openShopMenu = () => {
    if (shopCloseTimer.current) {
      clearTimeout(
        shopCloseTimer.current
      );

      shopCloseTimer.current =
        null;
    }

    setShopOpen(true);
  };

  /* =========================================================
     CLOSE DESKTOP SHOP
  ========================================================= */

  const closeShopMenu = () => {
    if (shopCloseTimer.current) {
      clearTimeout(
        shopCloseTimer.current
      );
    }

    shopCloseTimer.current =
      setTimeout(() => {
        setShopOpen(false);

        shopCloseTimer.current =
          null;
      }, 250);
  };

  /* =========================================================
     CLEAR TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (
        shopCloseTimer.current
      ) {
        clearTimeout(
          shopCloseTimer.current
        );
      }
    };
  }, []);

  /* =========================================================
     CART COUNT
  ========================================================= */

  const updateCartCount = () => {
    try {
      const cart =
        JSON.parse(
          localStorage.getItem(
            "axiee-cart"
          )
        ) || [];

      const totalQuantity =
        cart.reduce(
          (total, item) => {
            return (
              total +
              Number(
                item.quantity || 1
              )
            );
          },
          0
        );

      setCartCount(
        totalQuantity
      );
    } catch (error) {
      console.error(
        "Cart count error:",
        error
      );

      setCartCount(0);
    }
  };

  /* =========================================================
     CART LISTENER
  ========================================================= */

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate =
      () => {
        updateCartCount();
      };

    const handleStorage =
      (event) => {
        if (
          event.key ===
          "axiee-cart"
        ) {
          updateCartCount();
        }
      };

    window.addEventListener(
      "axiee-cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "axiee-cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =========================================================
     LOCK BODY
  ========================================================= */

  useEffect(() => {
    if (
      menuOpen ||
      searchOpen
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    menuOpen,
    searchOpen,
  ]);

  /* =========================================================
     CLOSE EVERYTHING
  ========================================================= */

  const closeAll = () => {
    setMenuOpen(false);

    setSearchOpen(false);

    setMobileShopOpen(false);

    setShopOpen(false);

    if (shopCloseTimer.current) {
      clearTimeout(
        shopCloseTimer.current
      );

      shopCloseTimer.current =
        null;
    }
  };

  return (
    <>
      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <header className="ax-navbar">
        {/* =================================================
            LOGO
        ================================================= */}

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

        {/* =================================================
            DESKTOP LINKS
        ================================================= */}

        <nav className="ax-navbar-links">
          <NavLink
            to="/"
            className={({
              isActive,
            }) =>
              isActive
                ? "active"
                : ""
            }
          >
            HOME
          </NavLink>

          {/* =================================================
              DESKTOP SHOP
          ================================================= */}

          <div
            className="ax-shop-nav-item"
            onMouseEnter={
              openShopMenu
            }
            onMouseLeave={
              closeShopMenu
            }
          >
            <button
              type="button"
              className={
                shopOpen
                  ? "ax-shop-trigger active"
                  : "ax-shop-trigger"
              }
            >
              SHOP

              <span className="ax-shop-trigger-dot"></span>
            </button>

            {/* =============================================
                MEGA MENU
            ============================================= */}

            <div
              className={
                shopOpen
                  ? "ax-shop-mega active"
                  : "ax-shop-mega"
              }
              onMouseEnter={
                openShopMenu
              }
              onMouseLeave={
                closeShopMenu
              }
            >
              {/* =========================================
                  LEFT SIDE
              ========================================= */}

              <div className="ax-shop-mega-left">
                <div className="ax-shop-mega-top">
                  <span>
                    SHOP / COLLECTIONS
                  </span>

                  <span>
                    AXIEE © 2026
                  </span>
                </div>

                <div className="ax-shop-mega-title">
                  <span>
                    EXPLORE
                  </span>

                  <h2>
                    THE
                    <br />
                    UNKNOWN
                  </h2>
                </div>

                {/* =====================================
                    CATEGORIES
                ===================================== */}

                <div className="ax-shop-category-list">
                  {shopCategories.map(
                    (item) => (
                      <Link
                        key={
                          item.id
                        }
                        to={
                          item.href
                        }
                        className={
                          activeShopItem.id ===
                          item.id
                            ? "ax-shop-category active"
                            : "ax-shop-category"
                        }
                        onMouseEnter={() =>
                          setActiveShopItem(
                            item
                          )
                        }
                        onClick={
                          closeAll
                        }
                      >
                        <span className="ax-shop-category-number">
                          {
                            item.number
                          }
                        </span>

                        <strong>
                          {
                            item.name
                          }
                        </strong>

                        <ArrowRight
                          size={
                            21
                          }
                          strokeWidth={
                            1.3
                          }
                        />
                      </Link>
                    )
                  )}
                </div>

                {/* =====================================
                    BOTTOM
                ===================================== */}

                <div className="ax-shop-mega-bottom">
                  <span>
                    MORE THAN
                    CLOTHES.
                    <br />
                    A MINDSET.
                  </span>

                  <Link
                    to="/shop"
                    onClick={
                      closeAll
                    }
                  >
                    VIEW ALL

                    <ArrowRight
                      size={15}
                    />
                  </Link>
                </div>
              </div>

              {/* =========================================
                  RIGHT IMAGE
              ========================================= */}

              <div className="ax-shop-mega-right">
                <div
                  key={
                    activeShopItem.id
                  }
                  className="ax-shop-preview-image"
                >
                  <img
                    src={
                      activeShopItem.image
                    }
                    alt={
                      activeShopItem.name
                    }
                  />
                </div>

                <div className="ax-shop-image-dark"></div>

                <div className="ax-shop-image-top">
                  <span>
                    {
                      activeShopItem.number
                    }
                  </span>

                  <span>
                    AXIEE
                    <br />
                    COLLECTION
                  </span>
                </div>

                <div className="ax-shop-image-content">
                  <span>
                    SELECTED CATEGORY
                  </span>

                  <h3>
                    {
                      activeShopItem.name
                    }
                  </h3>

                  <Link
                    to={
                      activeShopItem.href
                    }
                    onClick={
                      closeAll
                    }
                  >
                    DISCOVER

                    <ArrowRight
                      size={16}
                    />
                  </Link>
                </div>

                <div className="ax-shop-image-word">
                  AXIEE
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              COLLECTIONS
          ================================================= */}

          <a href="/#collections">
            COLLECTIONS
          </a>

          {/* =================================================
              ABOUT
          ================================================= */}

          <a href="/#about">
            ABOUT
          </a>
        </nav>

        {/* =================================================
            RIGHT ACTIONS
        ================================================= */}

        <div className="ax-navbar-actions">
          {/* SEARCH */}

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

          {/* MOBILE SEARCH */}

          <button
            type="button"
            className="ax-mobile-search-button"
            aria-label="Search"
            onClick={() => {
              setSearchOpen(
                true
              );

              setMenuOpen(
                false
              );

              setMobileShopOpen(
                false
              );

              setShopOpen(
                false
              );
            }}
          >
            <Search
              size={19}
              strokeWidth={1.7}
            />
          </button>

          {/* ACCOUNT */}

          <button
            type="button"
            className="ax-account-button"
            aria-label="Account"
          >
            <UserRound
              size={20}
              strokeWidth={1.6}
            />
          </button>

          {/* CART */}

          <button
            type="button"
            className="ax-cart-button"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag
              size={20}
              strokeWidth={1.6}
            />

            <span className="ax-cart-count">
              {cartCount}
            </span>
          </button>

          {/* EXPLORE */}

          <Link
            to="/shop"
            className="ax-explore-button"
            onClick={closeAll}
          >
            <span>
              EXPLORE
            </span>

            <ArrowRight
              size={17}
              strokeWidth={1.5}
            />
          </Link>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            className="ax-menu-button"
            aria-label="Menu"
            onClick={() => {
              setMenuOpen(
                (prev) =>
                  !prev
              );

              setSearchOpen(
                false
              );

              setShopOpen(
                false
              );

              if (
                menuOpen
              ) {
                setMobileShopOpen(
                  false
                );
              }
            }}
          >
            {menuOpen ? (
              <X
                size={22}
                strokeWidth={
                  1.5
                }
              />
            ) : (
              <Menu
                size={22}
                strokeWidth={
                  1.5
                }
              />
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          MOBILE FULLSCREEN MENU
      ===================================================== */}

      <div
        className={`ax-mobile-menu ${
          menuOpen
            ? "active"
            : ""
        }`}
      >
        {/* HEADER */}

        <div className="ax-mobile-menu-header">
          {/* LOGO */}

          <Link
            to="/"
            className="ax-navbar-logo"
            onClick={
              closeAll
            }
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
            aria-label="Close menu"
            onClick={
              closeAll
            }
          >
            <X
              size={23}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* =================================================
            MOBILE LINKS
        ================================================= */}

        <nav className="ax-mobile-links">
          <NavLink
            to="/"
            onClick={
              closeAll
            }
            className={({
              isActive,
            }) =>
              isActive
                ? "active"
                : ""
            }
          >
            <i></i>

            HOME
          </NavLink>

          {/* =================================================
              MOBILE SHOP DROPDOWN
          ================================================= */}

          <div
            className={`ax-mobile-shop ${
              mobileShopOpen
                ? "active"
                : ""
            }`}
          >
            <button
              type="button"
              className="ax-mobile-shop-trigger"
              onClick={() =>
                setMobileShopOpen(
                  (prev) =>
                    !prev
                )
              }
            >
              <span className="ax-mobile-shop-trigger-left">
                <i></i>

                <span>
                  SHOP
                </span>
              </span>

              <ChevronDown
                size={20}
                strokeWidth={
                  1.5
                }
              />
            </button>

            {/* =============================================
                MOBILE SHOP ITEMS
            ============================================= */}

            <div className="ax-mobile-shop-dropdown">
              {shopCategories.map(
                (item) => (
                  <Link
                    key={
                      item.id
                    }
                    to={
                      item.href
                    }
                    onClick={
                      closeAll
                    }
                  >
                    <span>
                      {
                        item.number
                      }
                    </span>

                    <strong>
                      {
                        item.name
                      }
                    </strong>

                    <ArrowRight
                      size={
                        17
                      }
                      strokeWidth={
                        1.4
                      }
                    />
                  </Link>
                )
              )}
            </div>
          </div>

          {/* =================================================
              COLLECTIONS
          ================================================= */}

          <a
            href="/#collections"
            onClick={
              closeAll
            }
          >
            <i></i>

            COLLECTIONS
          </a>

          {/* =================================================
              ABOUT
          ================================================= */}

          <a
            href="/#about"
            onClick={
              closeAll
            }
          >
            <i></i>

            ABOUT
          </a>
        </nav>

        {/* DIVIDER */}

        <div className="ax-mobile-divider"></div>

        {/* MOBILE ACTIONS */}

        <div className="ax-mobile-actions">
          {/* SEARCH */}

          <button
            type="button"
            onClick={() => {
              setMenuOpen(
                false
              );

              setMobileShopOpen(
                false
              );

              setSearchOpen(
                true
              );
            }}
          >
            <Search
              size={18}
              strokeWidth={1.6}
            />

            Search products...
          </button>

          {/* ACCOUNT */}

          <button type="button">
            <UserRound
              size={18}
              strokeWidth={1.6}
            />

            My Account
          </button>

          {/* CART */}

          <button type="button">
            <ShoppingBag
              size={18}
              strokeWidth={1.6}
            />

            Cart ({cartCount})
          </button>
        </div>

        {/* TEXT */}

        <div className="ax-mobile-copy">
          <span>
            CLOTHES
          </span>

          <span>
            CULTURE
          </span>

          <span>
            BEYOND
          </span>
        </div>

        <div className="ax-mobile-glow"></div>
      </div>

      {/* =====================================================
          SEARCH OVERLAY
      ===================================================== */}

      <div
        className={`ax-search-overlay ${
          searchOpen
            ? "active"
            : ""
        }`}
      >
        <div className="ax-search-header">
          {/* LOGO */}

          <Link
            to="/"
            className="ax-navbar-logo"
            onClick={
              closeAll
            }
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
            aria-label="Close search"
            onClick={() =>
              setSearchOpen(
                false
              )
            }
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