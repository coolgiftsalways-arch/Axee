import React, { useState } from "react";

import { ArrowRight, Plus, Minus } from "lucide-react";

import "../styles/footer.css";

function Footer() {
  const [openSection, setOpenSection] = useState("");

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? "" : section));
  };

  return (
    <footer className="ax-footer">
      <div className="ax-footer-planet ax-footer-planet-left"></div>
      <div className="ax-footer-planet ax-footer-planet-right"></div>

      <div className="ax-footer-mountains ax-footer-mountains-left"></div>
      <div className="ax-footer-mountains ax-footer-mountains-right"></div>

      <div className="ax-footer-fog"></div>

      <div className="ax-footer-inner">
        <div className="ax-footer-main">
          {/* BRAND */}

          <div className="ax-footer-brand">
            <a href="#home" className="ax-footer-logo">
              <span className="ax-footer-logo-a"></span>
              <span>X</span>
              <span>I</span>
              <span>E</span>
              <span>E</span>
            </a>

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

            {/* SOCIALS - NO LUCIDE ICONS */}

            <div className="ax-footer-socials">
              <a href="#" aria-label="Instagram">
                IG
              </a>

              <a href="#" aria-label="X">
                X
              </a>

              <a href="#" aria-label="YouTube">
                YT
              </a>

              <a href="#" aria-label="Pinterest">
                P
              </a>

              <a href="#" aria-label="Spotify">
                SP
              </a>
            </div>
          </div>

          {/* DESKTOP LINKS */}

          <div className="ax-footer-links-desktop">
            <div className="ax-footer-column">
              <h3>SHOP</h3>

              <a href="#shop">All Products</a>
              <a href="#shop">T-Shirts</a>
              <a href="#shop">Hoodies</a>
              <a href="#shop">Jackets</a>
              <a href="#shop">Jeans</a>
              <a href="#shop">Shorts</a>
              <a href="#shop">Accessories</a>
              <a href="#shop">New Drops</a>
            </div>

            <div className="ax-footer-column">
              <h3>COMPANY</h3>

              <a href="#about">About Us</a>
              <a href="#about">Our Story</a>
              <a href="#about">Sustainability</a>
              <a href="#about">Careers</a>
              <a href="#about">Press</a>
              <a href="#about">Affiliates</a>
            </div>

            <div className="ax-footer-column">
              <h3>HELP</h3>

              <a href="#faq">FAQ</a>
              <a href="#shipping">Shipping Info</a>
              <a href="#returns">Returns & Exchange</a>
              <a href="#size">Size Guide</a>
              <a href="#track">Track Order</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>

          {/* NEWSLETTER */}

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

            <form
              className="ax-footer-email"
              onSubmit={(event) => event.preventDefault()}
            >
              <input type="email" placeholder="Enter your email" />

              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={19} />
              </button>
            </form>
          </div>
        </div>

        {/* MOBILE ACCORDIONS */}

        <div className="ax-footer-mobile-links">
          {/* SHOP */}

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
              <a href="#shop">All Products</a>
              <a href="#shop">T-Shirts</a>
              <a href="#shop">Hoodies</a>
              <a href="#shop">Jackets</a>
              <a href="#shop">Jeans</a>
              <a href="#shop">Shorts</a>
              <a href="#shop">Accessories</a>
              <a href="#shop">New Drops</a>
            </div>
          </div>

          {/* COMPANY */}

          <div className="ax-footer-accordion">
            <button type="button" onClick={() => toggleSection("company")}>
              <span>COMPANY</span>

              {openSection === "company" ? (
                <Minus size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>

            <div
              className={`ax-footer-accordion-content ${
                openSection === "company" ? "active" : ""
              }`}
            >
              <a href="#about">About Us</a>
              <a href="#about">Our Story</a>
              <a href="#about">Sustainability</a>
              <a href="#about">Careers</a>
              <a href="#about">Press</a>
              <a href="#about">Affiliates</a>
            </div>
          </div>

          {/* HELP */}

          <div className="ax-footer-accordion">
            <button type="button" onClick={() => toggleSection("help")}>
              <span>HELP</span>

              {openSection === "help" ? (
                <Minus size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>

            <div
              className={`ax-footer-accordion-content ${
                openSection === "help" ? "active" : ""
              }`}
            >
              <a href="#faq">FAQ</a>
              <a href="#shipping">Shipping Info</a>
              <a href="#returns">Returns & Exchange</a>
              <a href="#size">Size Guide</a>
              <a href="#track">Track Order</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>
        </div>

        {/* BOTTOM */}

        <div className="ax-footer-bottom">
          <div className="ax-footer-tagline">WEAR THE UNKNOWN</div>

          <div className="ax-footer-bottom-row">
            <p>© 2026 AXIEE. ALL RIGHTS RESERVED.</p>

            <div className="ax-footer-payments">
              <span>VISA</span>
              <span>MC</span>
              <span>PAYPAL</span>
              <span>G PAY</span>
              <span>APPLE PAY</span>
            </div>

            <div className="ax-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </div>

      <div className="ax-footer-handwriting">
        WEAR
        <br />
        THE
        <br />
        UNKNOWN
      </div>
    </footer>
  );
}

export default Footer;
