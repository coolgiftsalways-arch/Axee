import React, { useState } from "react";

import { Plus, Minus } from "lucide-react";

import { FaWhatsapp, FaInstagram, FaEnvelope } from "react-icons/fa";

import { Link } from "react-router-dom";

import "../styles/footer.css";

function Footer() {
  const [openSection, setOpenSection] = useState("");

  /* =========================================================
     TOGGLE MOBILE SECTION
  ========================================================= */

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? "" : section));
  };

  /* =========================================================
     CLOSE MOBILE SECTION
  ========================================================= */

  const closeAccordion = () => {
    setOpenSection("");
  };

  return (
    <footer className="ax-footer">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="ax-footer-planet ax-footer-planet-left" />

      <div className="ax-footer-planet ax-footer-planet-right" />

      <div className="ax-footer-mountains ax-footer-mountains-left" />

      <div className="ax-footer-mountains ax-footer-mountains-right" />

      <div className="ax-footer-fog" />

      {/* =====================================================
          INNER
      ===================================================== */}

      <div className="ax-footer-inner">
        <div className="ax-footer-main">
          {/* =================================================
              BRAND
          ================================================= */}

          <div className="ax-footer-brand">
            <Link to="/" className="ax-footer-logo">
              UNBOUND
            </Link>

            <h2>
              MORE
              <br />
              THAN
              <br />
              CLOTHES
            </h2>

            <p>
              A new era of self expression.
              <br />
              Premium streetwear for those
              <br />
              who see beyond.
            </p>

            {/* ===============================================
                SOCIAL LINKS
            =============================================== */}

            <div className="ax-footer-socials">
              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>

              <a
                href="https://instagram.com/yourusername"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram />
              </a>

              <a href="mailto:your@email.com" aria-label="Email" title="Email">
                <FaEnvelope />
              </a>
            </div>
          </div>

          {/* =================================================
              DESKTOP LINKS
          ================================================= */}

          <div className="ax-footer-links-desktop">
            {/* ===============================================
                SHOP
            =============================================== */}

            <div className="ax-footer-column">
              <h3>SHOP</h3>

              <Link to="/shop">All Products</Link>

              <Link to="/tshirts">T-Shirts</Link>

              <Link to="/jeans">Jeans</Link>

              <Link to="/track-pants">Track Pants</Link>

              <Link to="/shirts">Shirts</Link>

              <Link to="/shorts">Shorts</Link>

              <Link to="/hoodies">Hoodies</Link>

              <Link to="/co-ord-sets">Co-ord Sets</Link>

              <Link to="/jackets">Jackets</Link>
            </div>

            {/* ===============================================
                PAGES
            =============================================== */}

            <div className="ax-footer-column">
              <h3>PAGES</h3>

              <Link to="/">Home</Link>

              <Link to="/shop">Shop</Link>

              <Link to="/best-sellers">Best Sellers</Link>

              <Link to="/track-order">Track Order</Link>
            </div>

            {/* ===============================================
                ADDRESS
            =============================================== */}

            <div className="ax-footer-column ax-footer-address">
              <h3>ADDRESS</h3>

              <p>
                TP Road,
                <br />
                Whitefield,
                <br />
                Bangalore,
                <br />
                Karnataka - 560066,
                <br />
                India
              </p>
            </div>
          </div>

          {/* =================================================
              NEWSLETTER
          ================================================= */}

          <div className="ax-footer-newsletter">
            <span className="ax-footer-small-title">STAY IN THE LOOP</span>

            <h3>
              BE THE FIRST
              <br />
              TO KNOW
            </h3>

            <p>
              Join our newsletter for exclusive drops,
              <br />
              early access and special offers.
            </p>
          </div>
        </div>

        {/* =====================================================
            MOBILE ACCORDIONS
        ===================================================== */}

        <div className="ax-footer-mobile-links">
          {/* =================================================
              SHOP
          ================================================= */}

          <div className="ax-footer-accordion">
            <button type="button" onClick={() => toggleSection("shop")}>
              <span>SHOP</span>

              {openSection === "shop" ? (
                <Minus size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>

            <div
              className={`ax-footer-accordion-content ${
                openSection === "shop" ? "active" : ""
              }`}
            >
              <Link to="/shop" onClick={closeAccordion}>
                All Products
              </Link>

              <Link to="/tshirts" onClick={closeAccordion}>
                T-Shirts
              </Link>

              <Link to="/jeans" onClick={closeAccordion}>
                Jeans
              </Link>

              <Link to="/track-pants" onClick={closeAccordion}>
                Track Pants
              </Link>

              <Link to="/shirts" onClick={closeAccordion}>
                Shirts
              </Link>

              <Link to="/shorts" onClick={closeAccordion}>
                Shorts
              </Link>

              <Link to="/hoodies" onClick={closeAccordion}>
                Hoodies
              </Link>

              <Link to="/co-ord-sets" onClick={closeAccordion}>
                Co-ord Sets
              </Link>

              <Link to="/jackets" onClick={closeAccordion}>
                Jackets
              </Link>
            </div>
          </div>

          {/* =================================================
              PAGES
          ================================================= */}

          <div className="ax-footer-accordion">
            <button type="button" onClick={() => toggleSection("pages")}>
              <span>PAGES</span>

              {openSection === "pages" ? (
                <Minus size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>

            <div
              className={`ax-footer-accordion-content ${
                openSection === "pages" ? "active" : ""
              }`}
            >
              <Link to="/" onClick={closeAccordion}>
                Home
              </Link>

              <Link to="/shop" onClick={closeAccordion}>
                Shop
              </Link>

              <Link to="/best-sellers" onClick={closeAccordion}>
                Best Sellers
              </Link>

              <Link to="/track-order" onClick={closeAccordion}>
                Track Order
              </Link>
            </div>
          </div>

          {/* =================================================
              ADDRESS
          ================================================= */}

          <div className="ax-footer-accordion">
            <button type="button" onClick={() => toggleSection("address")}>
              <span>ADDRESS</span>

              {openSection === "address" ? (
                <Minus size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>

            <div
              className={`ax-footer-accordion-content ${
                openSection === "address" ? "active" : ""
              }`}
            >
              <p className="ax-footer-mobile-address">
                TP Road,
                <br />
                Whitefield,
                <br />
                Bangalore,
                <br />
                Karnataka - 560066,
                <br />
                India
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
