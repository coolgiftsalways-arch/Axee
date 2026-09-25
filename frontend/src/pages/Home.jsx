import React, { useLayoutEffect, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroSpace from "../assets/hero-space.png";
import heroMountain from "../assets/hero-mountain.png";
import heroModel from "../assets/hero-model.png";
import heroNeon from "../assets/hero-neon.png";
import heroFog from "../assets/hero-fog.png";

import products from "../data/products";

import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   PRODUCT SECTION CONFIG
========================================================= */

const sectionConfig = [
  {
    id: "tshirts",
    category: "T-SHIRTS",
    number: "01",
    eyebrow: "ESSENTIAL / FORM",
    title: "T-SHIRTS",
    subtitle: "Engineered silhouettes for everyday movement.",
    link: "/tshirts",
  },

  {
    id: "jeans",
    category: "JEANS",
    number: "02",
    eyebrow: "DENIM / DISTORTION",
    title: "JEANS",
    subtitle: "Oversized denim built beyond convention.",
    link: "/jeans",
  },

  {
    id: "trackpants",
    category: "TRACK PANTS",
    number: "03",
    eyebrow: "MOTION / SYSTEM",
    title: "TRACK PANTS",
    subtitle: "Utility forms designed for unrestricted movement.",
    link: "/track-pants",
  },

  {
    id: "shirts",
    category: "SHIRTS",
    number: "04",
    eyebrow: "STRUCTURE / LAYER",
    title: "SHIRTS",
    subtitle: "Dark tailoring reshaped for the next world.",
    link: "/shirts",
  },

  {
    id: "shorts",
    category: "SHORTS",
    number: "05",
    eyebrow: "UTILITY / SUMMER",
    title: "SHORTS",
    subtitle: "Reduced construction. Maximum movement.",
    link: "/shorts",
  },
];

/* =========================================================
   BUILD PRODUCT SECTIONS
========================================================= */

const productSections = sectionConfig.map((section) => ({
  ...section,

  products: products
    .filter(
      (product) =>
        String(product.category || "").toUpperCase() === section.category,
    )
    .slice(0, 4),
}));

/* =========================================================
   HELPERS
========================================================= */

const getProductId = (product) => {
  return String(product?._id || product?.id || product?.slug || "");
};

const getProductSizes = (product) => {
  if (!Array.isArray(product?.sizes)) {
    return [];
  }

  return product.sizes
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.size;
    })
    .filter(Boolean);
};

const getProductImage = (product) => {
  if (product?.image) {
    return product.image;
  }

  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images[0];
  }

  return "";
};

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  selectedSizes,
  setSelectedSizes,
  quantities,
  setQuantities,
}) {
  const navigate = useNavigate();

  const productId = getProductId(product);

  const sizes = getProductSizes(product);

  const productImage = getProductImage(product);

  const selectedSize = selectedSizes[productId];

  /* =======================================================
     QUANTITY STARTS FROM 0
  ======================================================= */

  const quantity = quantities[productId] ?? 0;

  const changeQuantity = (amount) => {
    setQuantities((previous) => {
      const currentQuantity = previous[productId] ?? 0;

      const nextQuantity = Math.min(
        10,

        Math.max(0, currentQuantity + amount),
      );

      return {
        ...previous,

        [productId]: nextQuantity,
      };
    });
  };

  /* =======================================================
     SELECT SIZE
  ======================================================= */

  const chooseSize = (size) => {
    setSelectedSizes((previous) => ({
      ...previous,

      [productId]: size,
    }));
  };

  /* =======================================================
     ADD TO CART - BACKEND CART
  ======================================================= */

  const addToCart = async () => {
    if (!productId) {
      alert("Product ID is missing.");

      return;
    }

    if (sizes.length === 0) {
      alert("Sizes are not configured for this product yet.");

      return;
    }

    if (!selectedSize) {
      alert("Please select a size first.");

      return;
    }

    if (quantity <= 0) {
      alert("Please select quantity first.");

      return;
    }

    try {
      let cartId = localStorage.getItem("axiee-cart-id");

      /* CREATE CART ID */

      if (!cartId) {
        cartId = crypto.randomUUID();

        localStorage.setItem("axiee-cart-id", cartId);
      }

      /* SEND TO BACKEND */

      const response = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          cartId,

          productId,

          size: selectedSize,

          quantity,

          name: product?.name || "UNBOUND Product",

          price: Number(product?.price || 0),

          image: productImage || "",

          category: product?.category || "",
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Unable to add to cart");
      }

      /* UPDATE NAVBAR */

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data?.cart || {
            items: [],
          },
        }),
      );

      alert(`${product.name} - Size ${selectedSize} added to cart`);
    } catch (error) {
      console.error("Add to cart error:", error);

      alert(error?.message || "Unable to add product to cart.");
    }
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const buyNow = () => {
    if (!productId) {
      alert("Product ID is missing.");

      return;
    }

    if (sizes.length === 0) {
      alert("Sizes are not configured for this product yet.");

      return;
    }

    if (!selectedSize) {
      alert("Please select a size first.");

      return;
    }

    if (quantity <= 0) {
      alert("Please select quantity first.");

      return;
    }

    const buyNowProduct = {
      ...product,

      id: productId,

      productId,

      image: productImage,

      size: selectedSize,

      quantity,

      price: Number(product?.price || 0),
    };

    localStorage.setItem(
      "axiee-buy-now",

      JSON.stringify(buyNowProduct),
    );

    navigate("/checkout");
  };

  /* =======================================================
     NO ID
  ======================================================= */

  if (!productId) {
    return null;
  }

  /* =======================================================
     CARD
  ======================================================= */

  return (
    <article className="ax-product-card">
      {/* ===============================================
          IMAGE
      =============================================== */}

      <Link
        to={`/product/${productId}`}
        className="ax-product-image-wrap"
        aria-label={`View ${product.name}`}
      >
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="ax-product-image"
          />
        ) : (
          <div
            className="ax-product-image"
            style={{
              display: "grid",

              placeItems: "center",

              background: "#111",

              color: "#777",
            }}
          >
            NO IMAGE
          </div>
        )}

        <div className="ax-product-smoke" />

        <span className="ax-product-index">
          AX / {productId.slice(0, 2).toUpperCase()}
        </span>

        <button
          type="button"
          className="ax-wishlist"
          aria-label="Add to wishlist"
          onClick={(event) => {
            event.preventDefault();

            event.stopPropagation();
          }}
        >
          ♡
        </button>

        <span className="ax-view-product">
          VIEW
          <span>↗</span>
        </span>
      </Link>

      {/* ===============================================
          PRODUCT INFO
      =============================================== */}

      <div className="ax-product-info">
        <div className="ax-product-heading">
          <div>
            <h3>{product.name}</h3>

            <p>₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
          </div>

          <Link
            to={`/product/${productId}`}
            className="ax-card-arrow"
            aria-label={`View ${product.name}`}
          >
            →
          </Link>
        </div>

        {/* ===============================================
            SIZE
        =============================================== */}

        {sizes.length > 0 && (
          <div className="ax-size-area">
            <span className="ax-size-label">SELECT SIZE</span>

            <div className="ax-size-list">
              {sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => chooseSize(size)}
                  className={
                    selectedSize === size ? "ax-size active" : "ax-size"
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===============================================
            QUANTITY
        =============================================== */}

        <div className="ax-quantity-area">
          <span className="ax-quantity-label">QUANTITY</span>

          <div className="ax-quantity-counter">
            <button
              type="button"
              className="ax-quantity-btn"
              onClick={() => changeQuantity(-1)}
              disabled={quantity <= 0}
              aria-label={`Decrease ${product.name} quantity`}
            >
              −
            </button>

            <span className="ax-quantity-number">{quantity}</span>

            <button
              type="button"
              className="ax-quantity-btn"
              onClick={() => changeQuantity(1)}
              disabled={quantity >= 10}
              aria-label={`Increase ${product.name} quantity`}
            >
              +
            </button>
          </div>
        </div>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div className="ax-product-actions">
          <button type="button" className="ax-add-cart" onClick={addToCart}>
            <span>ADD TO CART</span>

            <span>＋</span>
          </button>

          <button type="button" className="ax-buy-now" onClick={buyNow}>
            BUY NOW
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PRODUCT SECTION
========================================================= */

function ProductSection({
  section,
  selectedSizes,
  setSelectedSizes,
  quantities,
  setQuantities,
}) {
  return (
    <section className="ax-product-section" id={section.id}>
      <div className="ax-product-section-top">
        <div className="ax-product-section-meta">
          <span>{section.number} / COLLECTION</span>

          <p>{section.eyebrow}</p>
        </div>

        <div className="ax-product-section-title">
          <h2>{section.title}</h2>

          <p>{section.subtitle}</p>
        </div>

        <Link to={section.link || "/shop"} className="ax-view-all">
          VIEW ALL
          <span>↗</span>
        </Link>
      </div>

      <div className="ax-products-grid">
        {section.products.map((product) => {
          const productId = getProductId(product);

          return (
            <ProductCard
              key={productId}
              product={product}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              quantities={quantities}
              setQuantities={setQuantities}
            />
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home({
  startAnimation,
  heroComplete,
  heroAlreadyPlayed,
  onHeroComplete,
}) {
  const homeRef = useRef(null);

  const heroRef = useRef(null);

  const spaceRef = useRef(null);

  const unboundWrapRef = useRef(null);

  const unboundRef = useRef(null);

  const mountainRef = useRef(null);

  const modelRef = useRef(null);

  const neonRef = useRef(null);

  const fogBackRef = useRef(null);

  const fogFrontRef = useRef(null);

  const leftUIRef = useRef(null);

  const numbersRef = useRef(null);

  const exploreRef = useRef(null);

  const engineeredRef = useRef(null);

  const [selectedSizes, setSelectedSizes] = useState({});

  const [quantities, setQuantities] = useState({});

  /* =======================================================
     HERO INTRO
  ======================================================= */

  useLayoutEffect(() => {
    /* =====================================================
       RETURNING TO HOME
    ===================================================== */

    if (heroAlreadyPlayed && !startAnimation) {
      const ctx = gsap.context(
        () => {
          gsap.set(heroRef.current, {
            x: 0,
            y: 0,
          });

          gsap.set(spaceRef.current, {
            opacity: 1,
            scale: 1,
            yPercent: 0,
          });

          gsap.set(unboundWrapRef.current, {
            xPercent: 0,
            yPercent: 0,
            opacity: 1,
          });

          gsap.set(unboundRef.current, {
            filter: "blur(0px)",
          });

          gsap.set(mountainRef.current, {
            yPercent: 0,
            opacity: 1,
          });

          gsap.set(modelRef.current, {
            yPercent: 0,
            opacity: 1,
          });

          gsap.set(neonRef.current, {
            opacity: 1,
            scale: 1,
            rotation: 0,
          });

          gsap.set(fogBackRef.current, {
            opacity: 0.72,

            y: 0,

            scale: 1,
          });

          gsap.set(fogFrontRef.current, {
            opacity: 0.88,

            y: 0,

            yPercent: 0,

            scale: 1,
          });

          gsap.set(
            [
              leftUIRef.current,
              numbersRef.current,
              exploreRef.current,
              engineeredRef.current,
            ],
            {
              opacity: 1,
              y: 0,
            },
          );
        },

        homeRef,
      );

      return () => {
        ctx.revert();
      };
    }

    /* =====================================================
       LOADER NOT FINISHED
    ===================================================== */

    if (!startAnimation) {
      return;
    }

    /* =====================================================
       FIRST OPEN
    ===================================================== */

    const ctx = gsap.context(
      () => {
        gsap.killTweensOf([
          heroRef.current,
          spaceRef.current,
          unboundWrapRef.current,
          unboundRef.current,
          mountainRef.current,
          modelRef.current,
          neonRef.current,
          fogBackRef.current,
          fogFrontRef.current,
          leftUIRef.current,
          numbersRef.current,
          exploreRef.current,
          engineeredRef.current,
        ]);

        /* HERO */

        gsap.set(heroRef.current, {
          x: 0,
          y: 0,
        });

        /* SPACE */

        gsap.set(spaceRef.current, {
          opacity: 0,

          scale: 1.08,

          yPercent: 0,
        });

        /* UNBOUND */

        gsap.set(unboundWrapRef.current, {
          xPercent: 120,

          yPercent: 0,

          opacity: 0,
        });

        gsap.set(unboundRef.current, {
          filter: "blur(16px)",
        });

        /* MOUNTAIN */

        gsap.set(mountainRef.current, {
          yPercent: -120,

          opacity: 0,
        });

        /* MODEL */

        gsap.set(modelRef.current, {
          yPercent: -125,

          opacity: 0,
        });

        /* NEON */

        gsap.set(neonRef.current, {
          opacity: 0,

          scale: 0.65,

          rotation: -15,
        });

        /* BACK FOG */

        gsap.set(fogBackRef.current, {
          opacity: 0,

          y: 150,

          scale: 1.18,
        });

        /* FRONT FOG */

        gsap.set(fogFrontRef.current, {
          opacity: 0,

          y: 160,

          yPercent: 0,

          scale: 1.2,
        });

        /* FINAL UI */

        gsap.set(
          [
            leftUIRef.current,
            numbersRef.current,
            exploreRef.current,
            engineeredRef.current,
          ],
          {
            opacity: 0,

            y: 22,
          },
        );

        /* ===============================================
             TIMELINE
          =============================================== */

        const tl = gsap.timeline({
          defaults: {
            overwrite: "auto",
          },

          onComplete: () => {
            onHeroComplete?.();
          },
        });

        /* UNBOUND */

        tl.to(
          unboundWrapRef.current,
          {
            xPercent: 0,

            opacity: 1,

            duration: 1.25,

            ease: "expo.out",
          },

          0,
        );

        tl.to(
          unboundRef.current,
          {
            filter: "blur(0px)",

            duration: 0.9,

            ease: "power3.out",
          },

          0,
        );

        /* SPACE */

        tl.to(
          spaceRef.current,
          {
            opacity: 1,

            scale: 1,

            duration: 1.1,

            ease: "power3.out",
          },

          0.65,
        );

        /* MOUNTAIN */

        tl.to(
          mountainRef.current,
          {
            yPercent: 0,

            opacity: 1,

            duration: 0.9,

            ease: "expo.in",
          },

          1.65,
        );

        /* IMPACT */

        tl.to(heroRef.current, {
          x: -6,

          duration: 0.04,
        });

        tl.to(heroRef.current, {
          x: 6,

          duration: 0.04,
        });

        tl.to(heroRef.current, {
          x: -3,

          duration: 0.04,
        });

        tl.to(heroRef.current, {
          x: 2,

          duration: 0.04,
        });

        tl.to(heroRef.current, {
          x: 0,

          duration: 0.08,
        });

        /* BACK FOG */

        tl.to(
          fogBackRef.current,
          {
            y: 0,

            opacity: 0.72,

            scale: 1,

            duration: 0.7,

            ease: "power4.out",
          },

          "-=0.12",
        );

        /* MODEL */

        tl.to(
          modelRef.current,
          {
            yPercent: 0,

            opacity: 1,

            duration: 0.82,

            ease: "expo.in",
          },

          "-=0.08",
        );

        /* MODEL IMPACT */

        tl.to(heroRef.current, {
          y: 7,

          duration: 0.045,
        });

        tl.to(heroRef.current, {
          y: -4,

          duration: 0.045,
        });

        tl.to(heroRef.current, {
          y: 2,

          duration: 0.045,
        });

        tl.to(heroRef.current, {
          y: 0,

          duration: 0.08,
        });

        /* FRONT FOG */

        tl.to(
          fogFrontRef.current,
          {
            y: 0,

            opacity: 0.88,

            scale: 1,

            duration: 0.68,

            ease: "power4.out",
          },

          "-=0.13",
        );

        /* NEON */

        tl.to(
          neonRef.current,
          {
            opacity: 1,

            scale: 1,

            rotation: 0,

            duration: 0.9,

            ease: "expo.out",
          },

          "-=0.32",
        );

        /* FINAL UI */

        tl.to(
          [
            leftUIRef.current,
            numbersRef.current,
            exploreRef.current,
            engineeredRef.current,
          ],

          {
            opacity: 1,

            y: 0,

            duration: 0.65,

            stagger: 0.09,

            ease: "power3.out",
          },

          "-=0.2",
        );
      },

      homeRef,
    );

    return () => {
      ctx.revert();
    };
  }, [startAnimation, heroAlreadyPlayed, onHeroComplete]);

  /* =======================================================
     HERO SCROLL PARALLAX
  ======================================================= */

  useLayoutEffect(() => {
    if (!heroComplete) {
      return;
    }

    const ctx = gsap.context(
      () => {
        /* SPACE */

        gsap.to(spaceRef.current, {
          yPercent: 8,

          scale: 1.04,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "bottom top",

            scrub: 1.5,
          },
        });

        /* UNBOUND */

        gsap.to(unboundWrapRef.current, {
          yPercent: -7,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "bottom top",

            scrub: 1.2,
          },
        });

        /* MOUNTAIN */

        gsap.to(mountainRef.current, {
          yPercent: -17,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "bottom top",

            scrub: 1.25,
          },
        });

        /* MODEL */

        gsap.to(modelRef.current, {
          yPercent: -6,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "bottom top",

            scrub: 1.35,
          },
        });

        /* NEON */

        gsap.to(neonRef.current, {
          rotation: 7,

          scale: 1.05,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "bottom top",

            scrub: 1.3,
          },
        });

        /* FRONT FOG */

        gsap.to(fogFrontRef.current, {
          opacity: 0,

          yPercent: -7,

          ease: "none",

          scrollTrigger: {
            trigger: heroRef.current,

            start: "top top",

            end: "70% top",

            scrub: 1,
          },
        });

        ScrollTrigger.refresh();
      },

      homeRef,
    );

    return () => {
      ctx.revert();
    };
  }, [heroComplete]);

  /* =======================================================
     PRODUCT REVEAL
  ======================================================= */

  useLayoutEffect(() => {
    if (!heroComplete) {
      return;
    }

    const sections = gsap.utils.toArray(".ax-product-section");

    const tweens = [];

    sections.forEach((section) => {
      const heading = section.querySelector(".ax-product-section-top");

      const cards = section.querySelectorAll(".ax-product-card");

      if (heading) {
        const headingTween = gsap.fromTo(
          heading,

          {
            opacity: 0,

            y: 45,
          },

          {
            opacity: 1,

            y: 0,

            duration: 1,

            ease: "power3.out",

            scrollTrigger: {
              trigger: section,

              start: "top 82%",
            },
          },
        );

        tweens.push(headingTween);
      }

      if (cards.length) {
        const cardsTween = gsap.fromTo(
          cards,

          {
            opacity: 0,

            y: 70,
          },

          {
            opacity: 1,

            y: 0,

            duration: 1,

            stagger: 0.1,

            ease: "power3.out",

            scrollTrigger: {
              trigger: section,

              start: "top 72%",
            },
          },
        );

        tweens.push(cardsTween);
      }
    });

    ScrollTrigger.refresh();

    return () => {
      tweens.forEach((tween) => {
        tween?.scrollTrigger?.kill();

        tween?.kill();
      });
    };
  }, [heroComplete]);

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main ref={homeRef} className="ax-home">
      {/* =================================================
          HERO
      ================================================= */}

      <section ref={heroRef} className="ax-hero" id="home">
        {/* SPACE */}

        <img ref={spaceRef} src={heroSpace} className="hero-space" alt="" />

        {/* UNBOUND */}

        <div ref={unboundWrapRef} className="hero-unbound-wrapper">
          <h1 ref={unboundRef} className="hero-unbound">
            UNBOUND
          </h1>
        </div>

        {/* MOUNTAIN */}

        <img
          ref={mountainRef}
          src={heroMountain}
          className="hero-mountain"
          alt=""
        />

        {/* BACK FOG */}

        <img
          ref={fogBackRef}
          src={heroFog}
          className="hero-fog hero-fog-back"
          alt=""
        />

        {/* NEON */}

        <img ref={neonRef} src={heroNeon} className="hero-neon" alt="" />

        {/* MODEL */}

        <img
          ref={modelRef}
          src={heroModel}
          className="hero-model"
          alt="AXIEE Techwear"
        />

        {/* FRONT FOG */}

        <img
          ref={fogFrontRef}
          src={heroFog}
          className="hero-fog hero-fog-front"
          alt=""
        />

        {/* VIGNETTE */}

        <div className="hero-vignette" />

        {/* LEFT UI */}

        <div ref={leftUIRef} className="hero-left-ui">
          <span>AXIEE</span>

          <p>
            MORE
            <br />
            THAN
            <br />
            CLOTHES
          </p>
        </div>

        {/* SLIDE NUMBERS */}

        <div ref={numbersRef} className="hero-numbers" />

        {/* EXPLORE */}

        <a ref={exploreRef} href="#tshirts" className="hero-explore">
          EXPLORE DROP
          <span>→</span>
        </a>

        {/* ENGINEERED */}

        <div ref={engineeredRef} className="hero-engineered">
          <p>
            ENGINEERED
            <br />
            FOR WHAT&apos;S NEXT
          </p>

          <span>↓</span>
        </div>
      </section>

      {/* =================================================
          COLLECTION INTRO
      ================================================= */}

      <section className="ax-collection-intro">
        <div>
          <span>AXIEE / 2026</span>

          <h2>
            WEAR THE
            <br />
            UNKNOWN.
          </h2>
        </div>

        <p>
          CLOTHES /
          <br />
          CULTURE /
          <br />
          BEYOND
        </p>
      </section>

      {/* =================================================
          PRODUCT COLLECTIONS
      ================================================= */}

      <div className="ax-collections">
        {productSections.map((section) => (
          <ProductSection
            key={section.id}
            section={section}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            quantities={quantities}
            setQuantities={setQuantities}
          />
        ))}
      </div>
    </main>
  );
}

export default Home;
