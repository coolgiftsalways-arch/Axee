import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

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
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   COLLECTION CONFIG
========================================================= */

const sectionConfig = [
  {
    id: "tshirts",
    type: "tshirts",
    category: "T-SHIRTS",
    number: "01",
    eyebrow: "ESSENTIAL / FORM",
    title: "T-SHIRTS",
    subtitle: "Engineered silhouettes for everyday movement.",
    link: "/tshirts",
  },

  {
    id: "jeans",
    type: "jeans",
    category: "JEANS",
    number: "02",
    eyebrow: "DENIM / DISTORTION",
    title: "JEANS",
    subtitle: "Oversized denim built beyond convention.",
    link: "/jeans",
  },

  {
    id: "trackpants",
    type: "trackpants",
    category: "TRACK PANTS",
    number: "03",
    eyebrow: "MOTION / SYSTEM",
    title: "TRACK PANTS",
    subtitle: "Utility forms designed for unrestricted movement.",
    link: "/track-pants",
  },

  {
    id: "shirts",
    type: "shirts",
    category: "SHIRTS",
    number: "04",
    eyebrow: "STRUCTURE / LAYER",
    title: "SHIRTS",
    subtitle: "Dark tailoring reshaped for the next world.",
    link: "/shirts",
  },

  {
    id: "shorts",
    type: "shorts",
    category: "SHORTS",
    number: "05",
    eyebrow: "UTILITY / SUMMER",
    title: "SHORTS",
    subtitle: "Reduced construction. Maximum movement.",
    link: "/shorts",
  },

  {
    id: "hoodies",
    type: "hoodies",
    category: "HOODIES",
    number: "06",
    eyebrow: "HEAVY / LAYER",
    title: "HOODIES",
    subtitle: "Oversized layers engineered for the street.",
    link: "/hoodies",
  },

  {
    id: "coordsets",
    type: "coordsets",
    category: "CO-ORD SETS",
    number: "07",
    eyebrow: "MATCHED / SYSTEM",
    title: "CO-ORD SETS",
    subtitle: "Complete silhouettes designed as one system.",
    link: "/co-ord-sets",
  },

  {
    id: "jackets",
    type: "jackets",
    category: "JACKETS",
    number: "08",
    eyebrow: "OUTER / SHELL",
    title: "JACKETS",
    subtitle: "Outer layers built for movement beyond convention.",
    link: "/jackets",
  },
];

/* =========================================================
   GET PRODUCTS ARRAY
========================================================= */

const extractProducts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

/* =========================================================
   NORMALIZE
========================================================= */

const normalizeText = (value = "") => String(value).trim().toLowerCase();

/* =========================================================
   CATEGORY MATCH
========================================================= */

const matchCategory = (product, type) => {
  const category = normalizeText(product?.category);
  const name = normalizeText(product?.name);

  if (type === "tshirts") {
    return (
      category === "t-shirts" ||
      category === "tshirt" ||
      category === "tshirts" ||
      category === "t-shirt" ||
      category === "tees" ||
      category === "tee"
    );
  }

  if (type === "shirts") {
    return category === "shirts" || category === "shirt";
  }

  if (type === "hoodies") {
    return category === "hoodies" || category === "hoodie";
  }

  if (type === "shorts") {
    return category === "shorts" || category === "short";
  }

  if (type === "jackets") {
    return category === "jackets" || category === "jacket";
  }

  if (type === "coordsets") {
    return (
      category === "co-ord sets" ||
      category === "co ord sets" ||
      category === "coord sets" ||
      category === "co-ord set" ||
      category === "co ord set" ||
      category === "coordset" ||
      category === "coordsets"
    );
  }

  if (type === "jeans") {
    const directJeans =
      category === "jeans" || category === "jean" || category === "denim";

    const pantsCategory = category === "pants" || category === "pant";

    const denimName =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    return directJeans || (pantsCategory && denimName);
  }

  if (type === "trackpants") {
    const directTrack =
      category === "track pants" ||
      category === "track pant" ||
      category === "trackpants";

    const pantsCategory = category === "pants" || category === "pant";

    const isDenim =
      name.includes("jeans") || name.includes("jean") || name.includes("denim");

    const importedClothing = normalizeText(product?.source) === "clothing-zip";

    return directTrack || (pantsCategory && !isDenim && !importedClothing);
  }

  return false;
};

/* =========================================================
   PRODUCT ID
========================================================= */

const getProductId = (product) => {
  return String(product?._id || product?.id || product?.slug || "");
};

/* =========================================================
   SIZES
========================================================= */

const getProductSizes = (product) => {
  if (!Array.isArray(product?.sizes)) {
    return [];
  }

  return product.sizes
    .filter((item) => {
      if (typeof item === "string") {
        return true;
      }

      if (item?.stock !== undefined && item?.stock !== null) {
        return Number(item.stock) > 0;
      }

      return true;
    })
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.size;
    })
    .filter(Boolean);
};

/* =========================================================
   RESOLVE IMAGE
========================================================= */

const resolveImageValue = (imageValue) => {
  if (!imageValue) {
    return "";
  }

  let value = imageValue;

  /* MongoDB / GridFS */

  if (typeof value === "object") {
    const fileId = value?.fileId || value?._id || value?.id;

    if (fileId) {
      return `${API_BASE}/api/catalog/images/${String(fileId)}`;
    }

    value = value?.url || value?.src || value?.path || "";
  }

  value = String(value).trim().replace(/\\/g, "/");

  if (!value) {
    return "";
  }

  /* OLD API IMAGE PATH */

  if (value.startsWith("/api/images/")) {
    value = value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    value = `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  /* COMPLETE URL */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  /* BACKEND PATH */

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  /* FRONTEND PUBLIC */

  return value.startsWith("/") ? value : `/${value}`;
};

/* =========================================================
   MAIN IMAGE
========================================================= */

const getProductImage = (product) => {
  const firstImage =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images[0]
      : null;

  // IMPORTANT: images[0] is always the admin-selected MAIN image.
  const image = firstImage || product?.mainImage || product?.image || "";

  return resolveImageValue(image);
};

/* =========================================================
   HOVER IMAGE
========================================================= */

const getProductHoverImage = (product) => {
  // Keep the MongoDB image order first.
  const candidates = [
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.mainImage,
    product?.image,
  ];

  const images = candidates
    .map((item) => resolveImageValue(item))
    .filter(Boolean)
    .filter((image, index, allImages) => allImages.indexOf(image) === index);

  const mainImage = getProductImage(product);

  return images.find((image) => image !== mainImage) || "";
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

  const hoverImage = getProductHoverImage(product);

  const selectedSize = selectedSizes[productId];

  const quantity = quantities[productId] ?? 0;

  /* =======================================================
     QUANTITY
  ======================================================= */

  const changeQuantity = (amount) => {
    setQuantities((previous) => {
      const current = previous[productId] ?? 0;

      const next = Math.min(10, Math.max(0, current + amount));

      return {
        ...previous,
        [productId]: next,
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
     ADD TO CART
  ======================================================= */

  const addToCart = async () => {
    if (!productId) {
      alert("Product ID is missing.");

      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert("Please select a size first.");

      return;
    }

    if (quantity <= 0) {
      alert("Please select quantity first.");

      return;
    }

    try {
      let cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        cartId = crypto.randomUUID();

        localStorage.setItem("axiee-cart-id", cartId);
      }

      const response = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          cartId,

          productId,

          size: selectedSize || "ONE SIZE",

          quantity,

          name: product?.name || "UNBOUND Product",

          price: Number(product?.price || 0),

          image: productImage || "",

          category: product?.category || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to add to cart");
      }

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data?.cart,
        }),
      );

      alert(
        `${product.name}${
          selectedSize ? ` - Size ${selectedSize}` : ""
        } added to cart`,
      );
    } catch (error) {
      console.error("HOME ADD CART ERROR:", error);

      alert(error?.message || "Unable to add product to cart.");
    }
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const buyNow = () => {
    localStorage.removeItem("axiee-buy-now");

    navigate(`/product/${productId}`);
  };

  if (!productId) {
    return null;
  }

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
          <>
            <img
              src={productImage}
              alt={product.name}
              className="ax-product-image ax-home-main-image"
              loading="lazy"
              onError={(event) => {
                console.error(
                  "Product image failed:",
                  product.name,
                  productImage,
                );

                event.currentTarget.style.opacity = "0";
              }}
            />

            {hoverImage && (
              <img
                src={hoverImage}
                alt={`${product.name} alternate`}
                className="ax-product-image ax-home-hover-image"
                loading="lazy"
                onError={(event) => {
                  console.error(
                    "Hover image failed:",
                    product.name,
                    hoverImage,
                  );

                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </>
        ) : (
          <div className="ax-product-no-image">NO IMAGE</div>
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

          <Link to={`/product/${productId}`} className="ax-card-arrow">
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
                  className={
                    selectedSize === size ? "ax-size active" : "ax-size"
                  }
                  onClick={() => chooseSize(size)}
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
              disabled={quantity <= 0}
              onClick={() => changeQuantity(-1)}
            >
              −
            </button>

            <span className="ax-quantity-number">{quantity}</span>

            <button
              type="button"
              className="ax-quantity-btn"
              disabled={quantity >= 10}
              onClick={() => changeQuantity(1)}
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
      {/* ===============================================
          TITLE
      =============================================== */}

      <div className="ax-product-section-top">
        <div className="ax-product-section-meta">
          <span>{section.number} / COLLECTION</span>

          <p>{section.eyebrow}</p>
        </div>

        <div className="ax-product-section-title">
          <h2>{section.title}</h2>

          <p>{section.subtitle}</p>
        </div>
      </div>

      {/* ===============================================
          FOUR PRODUCTS
      =============================================== */}

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

      {/* ===============================================
          SMALL SHOP MORE
      =============================================== */}

      <div className="ax-shop-more-wrap">
        <Link
          to={section.link}
          className="ax-shop-more-btn"
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "auto",
            });
          }}
        >
          <span className="ax-shop-more-text">SHOP MORE {section.title}</span>

          <span className="ax-shop-more-arrow">→</span>
        </Link>
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

  const [catalogProducts, setCatalogProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);

  const [productsError, setProductsError] = useState("");

  const [selectedSizes, setSelectedSizes] = useState({});

  const [quantities, setQuantities] = useState({});

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await fetch(`${API_BASE}/api/catalog/products`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Unable to load products (${response.status})`);
        }

        const data = await response.json();

        const loadedProducts = extractProducts(data).filter(
          (product) => product?.isActive !== false,
        );

        if (!cancelled) {
          setCatalogProducts(loadedProducts);
        }
      } catch (error) {
        console.error("HOME PRODUCTS ERROR:", error);

        if (!cancelled) {
          setCatalogProducts([]);

          setProductsError(error?.message || "Unable to load products.");
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     4 PRODUCTS PER CATEGORY
  ======================================================= */

  const productSections = useMemo(() => {
    return sectionConfig.map((section) => ({
      ...section,

      products: catalogProducts
        .filter((product) => matchCategory(product, section.type))
        .slice(0, 4),
    }));
  }, [catalogProducts]);

  /* =======================================================
     HERO INTRO
  ======================================================= */

  useLayoutEffect(() => {
    if (heroAlreadyPlayed && !startAnimation) {
      const ctx = gsap.context(() => {
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
      }, homeRef);

      return () => {
        ctx.revert();
      };
    }

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
  }, [startAnimation, heroAlreadyPlayed, onHeroComplete]);

  /* =======================================================
     HERO PARALLAX
  ======================================================= */

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

  /* =======================================================
     PRODUCT ANIMATIONS
  ======================================================= */

  useLayoutEffect(() => {
    if (!heroComplete || catalogProducts.length === 0) {
      return;
    }

    const sections = gsap.utils.toArray(".ax-product-section");

    const animations = [];

    sections.forEach((section) => {
      const heading = section.querySelector(".ax-product-section-top");

      const cards = section.querySelectorAll(".ax-product-card");

      const shopButton = section.querySelector(".ax-shop-more-wrap");

      if (heading) {
        const animation = gsap.fromTo(
          heading,
          {
            opacity: 0,
            y: 28,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",

            scrollTrigger: {
              trigger: section,

              start: "top 86%",
            },
          },
        );

        animations.push(animation);
      }

      if (cards.length) {
        const animation = gsap.fromTo(
          cards,
          {
            opacity: 0,
            y: 45,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",

            scrollTrigger: {
              trigger: section,

              start: "top 78%",
            },
          },
        );

        animations.push(animation);
      }

      if (shopButton) {
        const animation = gsap.fromTo(
          shopButton,
          {
            opacity: 0,
            y: 15,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",

            scrollTrigger: {
              trigger: shopButton,

              start: "top 96%",
            },
          },
        );

        animations.push(animation);
      }
    });

    ScrollTrigger.refresh();

    return () => {
      animations.forEach((animation) => {
        animation?.scrollTrigger?.kill();

        animation?.kill();
      });
    };
  }, [heroComplete, catalogProducts.length]);

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main ref={homeRef} className="ax-home">
      {/* ===============================================
          HERO
      =============================================== */}

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

        <div ref={numbersRef} className="hero-numbers" />

        <a ref={exploreRef} href="#tshirts" className="hero-explore">
          EXPLORE DROP
          <span>→</span>
        </a>

        <div ref={engineeredRef} className="hero-engineered">
          <p>
            ENGINEERED
            <br />
            FOR WHAT&apos;S NEXT
          </p>

          <span>↓</span>
        </div>
      </section>

      {/* ===============================================
          SMALL WEAR THE UNKNOWN
      =============================================== */}

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

      {/* ===============================================
          PRODUCTS
      =============================================== */}

      {productsLoading && (
        <div className="ax-home-products-status">LOADING COLLECTION...</div>
      )}

      {!productsLoading && productsError && (
        <div className="ax-home-products-status error">{productsError}</div>
      )}

      {!productsLoading && !productsError && (
        <div className="ax-collections">
          {productSections.map((section) => {
            if (section.products.length === 0) {
              return null;
            }

            return (
              <ProductSection
                key={section.id}
                section={section}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                quantities={quantities}
                setQuantities={setQuantities}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Home;
