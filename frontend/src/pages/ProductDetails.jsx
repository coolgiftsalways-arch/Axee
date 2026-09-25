import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import products from "../data/products";
import "../styles/productDetails.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   IMAGE URL
========================================================= */

const resolveImageUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/api/")) {
    return `${API_BASE}${value}`;
  }

  return value;
};

/* =========================================================
   MONGODB ID
========================================================= */

const isMongoId = (value) => {
  return /^[a-f\d]{24}$/i.test(value || "");
};

/* =========================================================
   SIZE CHARTS
========================================================= */

const TOP_SIZE_GUIDE = {
  label: "TOPS / OUTERWEAR",
  columns: [
    {
      key: "chest",
      label: "CHEST",
    },
    {
      key: "waist",
      label: "WAIST",
    },
    {
      key: "length",
      label: "LENGTH",
    },
  ],

  rows: [
    {
      size: "XS",
      chest: "34–36",
      waist: "28–30",
      length: "26",
    },
    {
      size: "S",
      chest: "36–38",
      waist: "30–32",
      length: "27",
    },
    {
      size: "M",
      chest: "38–40",
      waist: "32–34",
      length: "28",
    },
    {
      size: "L",
      chest: "40–42",
      waist: "34–36",
      length: "29",
    },
    {
      size: "XL",
      chest: "42–44",
      waist: "36–38",
      length: "30",
    },
    {
      size: "XXL",
      chest: "44–46",
      waist: "38–40",
      length: "31",
    },
  ],
};

const BOTTOM_SIZE_GUIDE = {
  label: "BOTTOMS / DENIM",

  columns: [
    {
      key: "waist",
      label: "WAIST",
    },
    {
      key: "hip",
      label: "HIP",
    },
    {
      key: "inseam",
      label: "INSEAM",
    },
  ],

  rows: [
    {
      size: "XS",
      waist: "26–28",
      hip: "34–36",
      inseam: "30",
    },
    {
      size: "S",
      waist: "28–30",
      hip: "36–38",
      inseam: "30",
    },
    {
      size: "M",
      waist: "30–32",
      hip: "38–40",
      inseam: "31",
    },
    {
      size: "L",
      waist: "32–34",
      hip: "40–42",
      inseam: "32",
    },
    {
      size: "XL",
      waist: "34–36",
      hip: "42–44",
      inseam: "32",
    },
    {
      size: "XXL",
      waist: "36–38",
      hip: "44–46",
      inseam: "32",
    },
  ],
};

const getSizeGuide = (product) => {
  const text = `
    ${product?.category || ""}
    ${product?.name || ""}
  `.toLowerCase();

  const isBottom =
    /(pant|pants|jean|jeans|cargo|trouser|trousers|short|shorts|bottom|denim)/.test(
      text,
    );

  return isBottom ? BOTTOM_SIZE_GUIDE : TOP_SIZE_GUIDE;
};

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

const normalizeProduct = (product) => {
  if (!product) return null;

  const normalizedSizes = Array.isArray(product.sizes)
    ? product.sizes.map((item) => {
        if (typeof item === "string") {
          return {
            size: item,
            stock: 99,
          };
        }

        return {
          size: item.size || item.label || item.name || "",
          stock: Number(
            item.stock ??
              item.quantity ??
              item.qty ??
              item.inventory ??
              item.available ??
              0,
          ),
        };
      })
    : [];

  const rawImages =
    product.images?.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const normalizedImages = rawImages.map(resolveImageUrl).filter(Boolean);

  const calculatedStock = normalizedSizes.reduce(
    (total, item) => total + Number(item.stock || 0),
    0,
  );

  return {
    ...product,

    id: product._id || product.id,

    image: normalizedImages[0] || resolveImageUrl(product.image),

    images: normalizedImages,

    price: Number(product.price || 0),

    sizes: normalizedSizes,

    totalStock:
      product.totalStock !== undefined
        ? Number(product.totalStock)
        : product.stock !== undefined
          ? Number(product.stock)
          : product.quantity !== undefined
            ? Number(product.quantity)
            : calculatedStock,

    colors: Array.isArray(product.colors)
      ? product.colors
      : product.color
        ? [product.color]
        : [],
  };
};

/* =========================================================
   PRODUCT DETAILS
========================================================= */

function ProductDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const pageRef = useRef(null);

  const mainImageRef = useRef(null);

  const [product, setProduct] = useState(null);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [liked, setLiked] = useState(false);

  const [cartMessage, setCartMessage] = useState("");

  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setRelatedProducts([]);
        setActiveImage(0);
        setSelectedSize("");
        setQuantity(1);
        setCartMessage("");
        setSizeChartOpen(false);

        let loadedProduct = null;

        /* MONGODB PRODUCT */

        if (isMongoId(id)) {
          const response = await fetch(
            `${API_BASE}/api/catalog/products/${id}`,
          );

          if (!response.ok) {
            throw new Error("Product not found.");
          }

          const data = await response.json();

          loadedProduct = normalizeProduct(data.product);

          /* RELATED PRODUCTS */

          try {
            const relatedResponse = await fetch(
              `${API_BASE}/api/catalog/products/${id}/related`,
            );

            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();

              if (!cancelled) {
                setRelatedProducts(
                  (relatedData.products || []).map(normalizeProduct),
                );
              }
            }
          } catch (relatedError) {
            console.log("Related products error:", relatedError);
          }
        }

        /* LOCAL FALLBACK */

        if (!loadedProduct) {
          const localProduct = products.find(
            (item) => String(item.id) === String(id),
          );

          if (localProduct) {
            loadedProduct = normalizeProduct(localProduct);

            const related = products
              .filter(
                (item) =>
                  item.category === localProduct.category &&
                  item.id !== localProduct.id,
              )
              .slice(0, 4)
              .map(normalizeProduct);

            if (!cancelled) {
              setRelatedProducts(related);
            }
          }
        }

        if (!loadedProduct) {
          throw new Error("Product not found.");
        }

        if (cancelled) return;

        setProduct(loadedProduct);

        /* AUTO SELECT FIRST AVAILABLE SIZE */

        if (loadedProduct.sizes?.length > 0) {
          const firstAvailable = loadedProduct.sizes.find(
            (item) => Number(item.stock) > 0,
          );

          if (firstAvailable) {
            setSelectedSize(firstAvailable.size);
          }
        }
      } catch (loadError) {
        console.error("PRODUCT LOAD ERROR:", loadError);

        if (!cancelled) {
          setError(loadError.message || "Unable to load product.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================================================
     PAGE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!product || !pageRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pd-animate",
        {
          opacity: 0,
          y: 22,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.06,
          ease: "power3.out",
        },
      );
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, [product]);

  /* =========================================================
     IMAGE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!mainImageRef.current) {
      return;
    }

    gsap.killTweensOf(mainImageRef.current);

    gsap.fromTo(
      mainImageRef.current,
      {
        opacity: 0,
        scale: 1.04,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: "power3.out",
      },
    );
  }, [activeImage]);

  /* =========================================================
     IMAGES
  ========================================================= */

  const images = useMemo(() => {
    return product?.images || [];
  }, [product]);

  /* =========================================================
     SIZE GUIDE
  ========================================================= */

  const sizeGuide = useMemo(() => getSizeGuide(product), [product]);

  /* =========================================================
     CURRENT SIZE
  ========================================================= */

  const currentSizeData = product?.sizes?.find(
    (item) => item.size === selectedSize,
  );

  const currentStock = Number(currentSizeData?.stock || 0);

  const hasStock =
    product?.sizes?.length > 0
      ? currentStock > 0
      : Number(product?.totalStock || 0) > 0;

  /* =========================================================
     IMAGE NAVIGATION
  ========================================================= */

  const previousImage = () => {
    if (images.length <= 1) return;

    setActiveImage(
      (previous) => (previous - 1 + images.length) % images.length,
    );
  };

  const nextImage = () => {
    if (images.length <= 1) return;

    setActiveImage((previous) => (previous + 1) % images.length);
  };

  /* =========================================================
     QUANTITY
  ========================================================= */

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  const increaseQuantity = () => {
    let maximum = 10;

    if (currentStock > 0) {
      maximum = currentStock;
    } else if (Number(product?.totalStock || 0) > 0) {
      maximum = Number(product.totalStock);
    }

    setQuantity((previous) => Math.min(maximum, previous + 1));
  };

  /* =========================================================
     CART ITEM
  ========================================================= */

  const createCartItem = () => {
    return {
      ...product,

      id: product._id || product.id,

      productId: product._id || product.id,

      image: images[0] || "",

      images,

      size: selectedSize,

      quantity,

      price: Number(product.price),
    };
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = async () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMessage("PLEASE SELECT A SIZE");

      return;
    }

    if (!hasStock) {
      setCartMessage("THIS SIZE IS OUT OF STOCK");

      return;
    }

    try {
      let cartId = localStorage.getItem("axiee-cart-id");

      if (!cartId) {
        cartId = crypto.randomUUID();

        localStorage.setItem("axiee-cart-id", cartId);
      }

      const productId = product._id || product.id;

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add to cart");
      }

      window.dispatchEvent(
        new CustomEvent("axiee-cart-updated", {
          detail: data.cart,
        }),
      );

      setCartMessage("ADDED TO CART");

      window.setTimeout(() => {
        setCartMessage("");
      }, 1800);
    } catch (cartError) {
      console.error("ADD TO CART ERROR:", cartError);

      setCartMessage("COULD NOT ADD TO CART");
    }
  };

  /* =========================================================
     BUY NOW
  ========================================================= */

  const buyNow = () => {
    if (!product) {
      setCartMessage("PRODUCT IS NOT READY");
      return;
    }

    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMessage("PLEASE SELECT A SIZE");
      return;
    }

    if (!hasStock) {
      setCartMessage("THIS SIZE IS OUT OF STOCK");
      return;
    }

    const item = createCartItem();

    /*
      Save a fallback copy in localStorage so refresh on the checkout
      page still keeps the Buy Now product.
    */
    localStorage.setItem("axiee-buy-now", JSON.stringify(item));

    /*
      Also pass the item directly through React Router state.
      This makes the Buy Now click immediate and avoids relying only
      on localStorage.
    */
    navigate("/checkout", {
      state: {
        checkoutMode: "buyNow",
        buyNowItem: item,
      },
    });
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="pd-state-page">
        <div className="pd-loader">
          <span>UNBOUND</span>

          <div className="pd-loader-line">
            <div />
          </div>

          <p>LOADING PRODUCT</p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !product) {
    return (
      <main className="pd-state-page">
        <div className="pd-error">
          <span>404 / PRODUCT</span>

          <h1>PRODUCT NOT FOUND</h1>

          <p>{error || "This product is currently unavailable."}</p>

          <Link to="/shop">RETURN TO SHOP</Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main ref={pageRef} className="pd-page">
      {/* TOPBAR */}

      <section className="pd-topbar pd-animate">
        <button type="button" className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} strokeWidth={1.4} />

          <span>BACK</span>
        </button>

        <div className="pd-breadcrumb">
          <Link to="/">UNBOUND</Link>

          <span>/</span>

          <Link to="/shop">SHOP</Link>

          <span>/</span>

          <strong>{product.name}</strong>
        </div>

        <span className="pd-product-code">
          PRODUCT /{" "}
          {String(product.id || "")
            .slice(-6)
            .toUpperCase()}
        </span>
      </section>

      {/* MAIN */}

      <section className="pd-main">
        {/* LEFT GALLERY */}

        <div className="pd-gallery pd-animate">
          {images.length > 0 && (
            <div className="pd-thumbnails">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    activeImage === index
                      ? "pd-thumbnail active"
                      : "pd-thumbnail"
                  }
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />

                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pd-main-image-box">
            {images.length > 0 ? (
              <img
                ref={mainImageRef}
                src={images[activeImage]}
                alt={product.name}
                className="pd-main-image"
                draggable="false"
              />
            ) : (
              <div className="pd-no-image">NO IMAGE</div>
            )}

            {images.length > 1 && (
              <div className="pd-image-number">
                <strong>{String(activeImage + 1).padStart(2, "0")}</strong>

                <span>/</span>

                <span>{String(images.length).padStart(2, "0")}</span>
              </div>
            )}

            {images.length > 1 && (
              <div className="pd-image-navigation">
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} strokeWidth={1.4} />
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={18} strokeWidth={1.4} />
                </button>
              </div>
            )}

            {product.featured && (
              <span className="pd-featured-tag">FEATURED</span>
            )}
          </div>
        </div>

        {/* RIGHT PRODUCT INFO */}

        <aside className="pd-info pd-animate">
          <div className="pd-info-top">
            <div>
              <span className="pd-category">{product.category}</span>

              <h1>{product.name}</h1>
            </div>

            <button
              type="button"
              className={liked ? "pd-heart active" : "pd-heart"}
              onClick={() => setLiked((previous) => !previous)}
              aria-label="Wishlist"
            >
              <Heart
                size={19}
                strokeWidth={1.35}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>

          {/* PRICE */}

          <div className="pd-price-row">
            <strong>₹{Number(product.price).toLocaleString("en-IN")}</strong>

            {Number(product.oldPrice || 0) > Number(product.price || 0) && (
              <del>₹{Number(product.oldPrice).toLocaleString("en-IN")}</del>
            )}
          </div>

          {/* DESCRIPTION */}

          <p className="pd-short-description">
            {product.shortDescription ||
              product.description ||
              "Designed beyond convention. Contemporary streetwear built for modern movement."}
          </p>

          {/* META */}

          <div className="pd-meta">
            <div>
              <span>COLOR</span>

              <strong>
                {product.colors?.[0]?.toUpperCase() ||
                  product.color?.toUpperCase() ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>FIT</span>

              <strong>{product.fit?.toUpperCase() || "—"}</strong>
            </div>

            <div>
              <span>MATERIAL</span>

              <strong>{product.material?.toUpperCase() || "—"}</strong>
            </div>

            <div>
              <span>GENDER</span>

              <strong>{product.gender || "UNISEX"}</strong>
            </div>
          </div>

          {/* =========================
              SIZE SELECTOR
          ========================== */}

          {product.sizes?.length > 0 && (
            <div className="pd-option-section">
              <div className="pd-option-heading">
                <span>SELECT SIZE</span>

                <small>
                  {selectedSize ? `${currentStock} IN STOCK` : "SELECT"}
                </small>
              </div>

              <div className="pd-sizes">
                {product.sizes.map((item) => {
                  const disabled = Number(item.stock) <= 0;

                  return (
                    <button
                      type="button"
                      key={item.size}
                      disabled={disabled}
                      className={selectedSize === item.size ? "active" : ""}
                      onClick={() => {
                        setSelectedSize(item.size);

                        setQuantity(1);

                        setCartMessage("");
                      }}
                    >
                      {item.size}

                      {disabled && <span />}
                    </button>
                  );
                })}
              </div>

              {/* =========================
                  SIZE CHART
              ========================== */}

              <div
                className={
                  sizeChartOpen ? "pd-size-chart open" : "pd-size-chart"
                }
              >
                <button
                  type="button"
                  className="pd-size-chart-toggle"
                  onClick={() => setSizeChartOpen((previous) => !previous)}
                  aria-expanded={sizeChartOpen}
                  aria-controls="pd-size-chart-panel"
                >
                  <div className="pd-size-chart-toggle-copy">
                    <span>SIZE CHART</span>

                    <small>{sizeGuide.label} / INCHES</small>
                  </div>

                  <div className="pd-size-chart-arrow">
                    <ChevronDown size={18} strokeWidth={1.5} />
                  </div>
                </button>

                <div
                  id="pd-size-chart-panel"
                  className={
                    sizeChartOpen
                      ? "pd-size-chart-panel open"
                      : "pd-size-chart-panel"
                  }
                >
                  <div className="pd-size-chart-inner">
                    <div className="pd-size-chart-top">
                      <div>
                        <span>SIZE GUIDE</span>

                        <h3>FIND YOUR PERFECT FIT</h3>
                      </div>

                      <p>All measurements are in inches.</p>
                    </div>

                    <div className="pd-size-chart-note">
                      <span>STANDARD BODY GUIDE</span>

                      <small>MEASUREMENTS IN INCHES</small>
                    </div>

                    <div className="pd-size-chart-table-wrap">
                      <table className="pd-size-chart-table">
                        <thead>
                          <tr>
                            <th>SIZE</th>

                            {sizeGuide.columns.map((column) => (
                              <th key={column.key}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {sizeGuide.rows.map((row) => (
                            <tr
                              key={row.size}
                              className={
                                selectedSize === row.size ? "active" : ""
                              }
                            >
                              <td>{row.size}</td>

                              {sizeGuide.columns.map((column) => (
                                <td key={`${row.size}-${column.key}`}>
                                  {row[column.key]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pd-size-chart-footer">
                      <span>FIT TIP</span>

                      <p>
                        If you are between two sizes, choose the larger size for
                        a relaxed streetwear fit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUANTITY */}

          <div className="pd-option-section">
            <div className="pd-option-heading">
              <span>QUANTITY</span>

              <small>MAX {currentStock || product.totalStock || 10}</small>
            </div>

            <div className="pd-quantity">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Minus size={15} strokeWidth={1.4} />
              </button>

              <strong>{String(quantity).padStart(2, "0")}</strong>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={currentStock > 0 && quantity >= currentStock}
              >
                <Plus size={15} strokeWidth={1.4} />
              </button>
            </div>
          </div>

          {/* MESSAGE */}

          {cartMessage && (
            <div className="pd-message">
              <Check size={13} strokeWidth={1.7} />

              <span>{cartMessage}</span>
            </div>
          )}

          {/* ACTION BUTTONS */}

          <div className="pd-actions">
            <button
              type="button"
              className="pd-add-cart"
              onClick={addToCart}
              disabled={!hasStock}
            >
              <ShoppingBag size={16} strokeWidth={1.4} />

              <span>{hasStock ? "ADD TO CART" : "OUT OF STOCK"}</span>
            </button>

            <button
              type="button"
              className="pd-buy-now"
              onClick={buyNow}
              disabled={!hasStock}
            >
              <span>BUY NOW</span>

              <ArrowRight size={16} strokeWidth={1.4} />
            </button>
          </div>

          {/* PAYMENT */}

          <div className="pd-payment-box">
            <div className="pd-payment-title">
              <CreditCard size={17} strokeWidth={1.35} />

              <div>
                <strong>SECURE CHECKOUT</strong>

                <span>PAYMENT OPTIONS AT CHECKOUT</span>
              </div>
            </div>

            <div className="pd-payment-methods">
              <span>UPI</span>

              <span>CARDS</span>

              <span>NET BANKING</span>

              <span>COD</span>
            </div>
          </div>

          {/* SERVICE */}

          <div className="pd-service-list">
            <div>
              <Truck size={17} strokeWidth={1.25} />

              <div>
                <strong>DELIVERY</strong>

                <span>SHIPPING CALCULATED AT CHECKOUT</span>
              </div>
            </div>

            <div>
              <ShieldCheck size={17} strokeWidth={1.25} />

              <div>
                <strong>SECURE PAYMENT</strong>

                <span>PROTECTED CHECKOUT</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* DETAILS */}

      <section className="pd-details pd-animate">
        <div className="pd-details-heading">
          <span>01 / PRODUCT INFORMATION</span>

          <h2>
            BUILT BEYOND
            <br />
            CONVENTION.
          </h2>
        </div>

        <div className="pd-details-content">
          <div>
            <span>DESCRIPTION</span>

            <p>
              {product.description ||
                product.shortDescription ||
                "Contemporary streetwear engineered for everyday movement, comfort and unconventional form."}
            </p>
          </div>

          <div className="pd-spec-list">
            <div>
              <span>CATEGORY</span>

              <strong>{product.category || "—"}</strong>
            </div>

            <div>
              <span>FIT</span>

              <strong>{product.fit || "—"}</strong>
            </div>

            <div>
              <span>STYLE</span>

              <strong>{product.style || "—"}</strong>
            </div>

            <div>
              <span>MATERIAL</span>

              <strong>{product.material || "—"}</strong>
            </div>

            <div>
              <span>GENDER</span>

              <strong>{product.gender || "UNISEX"}</strong>
            </div>

            <div>
              <span>STOCK</span>

              <strong>{product.totalStock || 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}

      {relatedProducts.length > 0 && (
        <section className="pd-related pd-animate">
          <div className="pd-related-heading">
            <div>
              <span>02 / DISCOVER</span>

              <h2>
                YOU MAY ALSO
                <br />
                LIKE
              </h2>
            </div>

            <Link to="/shop">
              VIEW ALL
              <ArrowRight size={14} strokeWidth={1.4} />
            </Link>
          </div>

          <div className="pd-related-grid">
            {relatedProducts.slice(0, 4).map((item, index) => (
              <Link
                key={item._id || item.id || index}
                to={`/product/${item._id || item.id}`}
                className="pd-related-card"
              >
                <div className="pd-related-image">
                  {item.images?.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="pd-related-placeholder">UNBOUND</div>
                  )}

                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>

                <div className="pd-related-info">
                  <div>
                    <h3>{item.name}</h3>

                    <p>{item.category}</p>
                  </div>

                  <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetails;
