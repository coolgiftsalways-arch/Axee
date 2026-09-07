import React, { useLayoutEffect, useRef, useState } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroSpace from "../assets/hero-space.png";
import heroMountain from "../assets/hero-mountain.png";
import heroModel from "../assets/hero-model.png";
import heroNeon from "../assets/hero-neon.png";
import heroFog from "../assets/hero-fog.png";

import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   PRODUCTS
========================================================= */

const productSections = [
  {
    id: "tshirts",
    number: "01",
    eyebrow: "ESSENTIAL / FORM",
    title: "T-SHIRTS",
    subtitle: "Engineered silhouettes for everyday movement.",
    products: [
      {
        id: "void-tee",
        name: "VOID TEE",
        price: 1499,
        image: "/products/tshirt-1.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "signal-tee",
        name: "SIGNAL TEE",
        price: 1699,
        image: "/products/tshirt-2.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "echo-tee",
        name: "ECHO TEE",
        price: 1599,
        image: "/products/tshirt-3.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "unknown-tee",
        name: "UNKNOWN TEE",
        price: 1899,
        image: "/products/tshirt-4.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
    ],
  },

  {
    id: "jeans",
    number: "02",
    eyebrow: "DENIM / DISTORTION",
    title: "JEANS",
    subtitle: "Oversized denim built beyond convention.",
    products: [
      {
        id: "shadow-denim",
        name: "SHADOW DENIM",
        price: 2899,
        image: "/products/jean-1.jpg",
        sizes: ["28", "30", "32", "34"],
      },
      {
        id: "void-denim",
        name: "VOID DENIM",
        price: 3199,
        image: "/products/jean-2.jpg",
        sizes: ["28", "30", "32", "34"],
      },
      {
        id: "fracture-jean",
        name: "FRACTURE JEAN",
        price: 3499,
        image: "/products/jean-3.jpg",
        sizes: ["28", "30", "32", "34"],
      },
      {
        id: "raw-denim",
        name: "RAW DENIM 01",
        price: 2999,
        image: "/products/jean-4.jpg",
        sizes: ["28", "30", "32", "34"],
      },
    ],
  },

  {
    id: "trackpants",
    number: "03",
    eyebrow: "MOTION / SYSTEM",
    title: "TRACK PANTS",
    subtitle: "Utility forms designed for unrestricted movement.",
    products: [
      {
        id: "motion-track",
        name: "MOTION TRACK",
        price: 2499,
        image: "/products/track-1.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "core-track",
        name: "CORE TRACK",
        price: 2699,
        image: "/products/track-2.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "terminal-track",
        name: "TERMINAL TRACK",
        price: 2899,
        image: "/products/track-3.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "phantom-track",
        name: "PHANTOM TRACK",
        price: 2999,
        image: "/products/track-4.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
    ],
  },

  {
    id: "shirts",
    number: "04",
    eyebrow: "STRUCTURE / LAYER",
    title: "SHIRTS",
    subtitle: "Dark tailoring reshaped for the next world.",
    products: [
      {
        id: "system-shirt",
        name: "SYSTEM SHIRT",
        price: 2199,
        image: "/products/shirt-1.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "signal-shirt",
        name: "SIGNAL SHIRT",
        price: 2399,
        image: "/products/shirt-2.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "shadow-shirt",
        name: "SHADOW SHIRT",
        price: 2599,
        image: "/products/shirt-3.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "frame-shirt",
        name: "FRAME SHIRT",
        price: 2299,
        image: "/products/shirt-4.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
    ],
  },

  {
    id: "shorts",
    number: "05",
    eyebrow: "UTILITY / SUMMER",
    title: "SHORTS",
    subtitle: "Reduced construction. Maximum movement.",
    products: [
      {
        id: "void-short",
        name: "VOID SHORT",
        price: 1799,
        image: "/products/short-1.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "cargo-short",
        name: "CARGO SHORT",
        price: 1999,
        image: "/products/short-2.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "motion-short",
        name: "MOTION SHORT",
        price: 1899,
        image: "/products/short-3.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
      {
        id: "utility-short",
        name: "UTILITY SHORT",
        price: 2199,
        image: "/products/short-4.jpg",
        sizes: ["S", "M", "L", "XL"],
      },
    ],
  },
];

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product, selectedSizes, setSelectedSizes }) {
  const selectedSize = selectedSizes[product.id];

  const chooseSize = (size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [product.id]: size,
    }));
  };

  const addToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }

    const oldCart = JSON.parse(localStorage.getItem("axiee-cart")) || [];

    const existingIndex = oldCart.findIndex(
      (item) => item.id === product.id && item.size === selectedSize,
    );

    let updatedCart;

    if (existingIndex >= 0) {
      updatedCart = [...oldCart];

      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + 1,
      };
    } else {
      updatedCart = [
        ...oldCart,
        {
          ...product,
          size: selectedSize,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem("axiee-cart", JSON.stringify(updatedCart));

    window.dispatchEvent(new Event("axiee-cart-updated"));

    alert(`${product.name} - Size ${selectedSize} added to cart`);
  };

  const buyNow = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }

    localStorage.setItem(
      "axiee-buy-now",
      JSON.stringify({
        ...product,
        size: selectedSize,
        quantity: 1,
      }),
    );

    window.location.href = "/checkout";
  };

  return (
    <article className="ax-product-card">
      {/* IMAGE */}

      <a
        href={`/product/${product.id}`}
        className="ax-product-image-wrap"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="ax-product-image"
        />

        <div className="ax-product-smoke" />

        <span className="ax-product-index">
          AX / {product.id.slice(0, 2).toUpperCase()}
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
      </a>

      {/* PRODUCT INFO */}

      <div className="ax-product-info">
        <div className="ax-product-heading">
          <div>
            <h3>{product.name}</h3>

            <p>₹{product.price.toLocaleString("en-IN")}</p>
          </div>

          <span className="ax-card-arrow">→</span>
        </div>

        {/* SIZES */}

        <div className="ax-size-area">
          <span className="ax-size-label">SELECT SIZE</span>

          <div className="ax-size-list">
            {product.sizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => chooseSize(size)}
                className={selectedSize === size ? "ax-size active" : "ax-size"}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* BUTTONS */}

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

function ProductSection({ section, selectedSizes, setSelectedSizes }) {
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

        <a href={`/shop?category=${section.id}`} className="ax-view-all">
          VIEW ALL
          <span>↗</span>
        </a>
      </div>

      <div className="ax-products-grid">
        {section.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
          />
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home({ startAnimation, heroComplete, onHeroComplete }) {
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

  /* ======================================================
     HERO INTRO
  ====================================================== */

  useLayoutEffect(() => {
    if (!startAnimation) {
      return;
    }

    const ctx = gsap.context(() => {
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

      gsap.set(heroRef.current, {
        x: 0,
        y: 0,
      });

      gsap.set(spaceRef.current, {
        opacity: 0,
        scale: 1.08,
        yPercent: 0,
      });

      gsap.set(unboundWrapRef.current, {
        xPercent: 120,
        yPercent: 0,
        opacity: 0,
      });

      gsap.set(unboundRef.current, {
        filter: "blur(16px)",
      });

      gsap.set(mountainRef.current, {
        yPercent: -120,
        opacity: 0,
      });

      gsap.set(modelRef.current, {
        yPercent: -125,
        opacity: 0,
      });

      gsap.set(neonRef.current, {
        opacity: 0,
        scale: 0.65,
        rotation: -15,
      });

      gsap.set(fogBackRef.current, {
        opacity: 0,
        y: 150,
        scale: 1.18,
      });

      gsap.set(fogFrontRef.current, {
        opacity: 0,
        y: 160,
        yPercent: 0,
        scale: 1.2,
      });

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

      /* FOG */

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
    }, homeRef);

    return () => {
      ctx.revert();
    };
  }, [startAnimation, onHeroComplete]);

  /* ======================================================
     HERO SCROLL PARALLAX
  ====================================================== */

  useLayoutEffect(() => {
    if (!heroComplete) {
      return;
    }

    const ctx = gsap.context(() => {
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
    }, homeRef);

    return () => {
      ctx.revert();
    };
  }, [heroComplete]);

  /* ======================================================
     PRODUCT REVEAL
  ====================================================== */

  useLayoutEffect(() => {
    if (!heroComplete) return;

    const sections = gsap.utils.toArray(".ax-product-section");

    const triggers = [];

    sections.forEach((section) => {
      const heading = section.querySelector(".ax-product-section-top");

      const cards = section.querySelectorAll(".ax-product-card");

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

      triggers.push(headingTween, cardsTween);
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((tween) => {
        tween?.scrollTrigger?.kill();
        tween?.kill();
      });
    };
  }, [heroComplete]);

  return (
    <main ref={homeRef} className="ax-home">
      {/* =================================================
          HERO
      ================================================= */}

      <section ref={heroRef} className="ax-hero" id="home">
        <img ref={spaceRef} src={heroSpace} className="hero-space" alt="" />

        <div ref={unboundWrapRef} className="hero-unbound-wrapper">
          <h1 ref={unboundRef} className="hero-unbound">
            UNBOUND
          </h1>
        </div>

        <img
          ref={mountainRef}
          src={heroMountain}
          className="hero-mountain"
          alt=""
        />

        <img
          ref={fogBackRef}
          src={heroFog}
          className="hero-fog hero-fog-back"
          alt=""
        />

        <img ref={neonRef} src={heroNeon} className="hero-neon" alt="" />

        <img
          ref={modelRef}
          src={heroModel}
          className="hero-model"
          alt="AXIEE Techwear"
        />

        <img
          ref={fogFrontRef}
          src={heroFog}
          className="hero-fog hero-fog-front"
          alt=""
        />

        <div className="hero-vignette" />

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

        <div ref={numbersRef} className="hero-numbers">
          <span className="active">01</span>

          <span>02</span>
          <span>03</span>
          <span>04</span>
          <span>05</span>
        </div>

        <a ref={exploreRef} href="#tshirts" className="hero-explore">
          EXPLORE DROP
          <span>→</span>
        </a>

        <div ref={engineeredRef} className="hero-engineered">
          <p>
            ENGINEERED
            <br />
            FOR WHAT'S NEXT
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
          PRODUCTS
      ================================================= */}

      <div className="ax-collections">
        {productSections.map((section) => (
          <ProductSection
            key={section.id}
            section={section}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
          />
        ))}
      </div>
    </main>
  );
}

export default Home;
