import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
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

/* =========================================================
   API
========================================================= */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
/* =========================================================
   IMAGE URL
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  const value = String(image);

  // Already complete URL
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  // Current GridFS route
  if (
    value.startsWith("/api/catalog/images/")
  ) {
    return `${API_BASE}${value}`;
  }

  // Old GridFS route
  if (value.startsWith("/api/images/")) {
    const imageId = value.replace(
      "/api/images/",
      ""
    );

    return `${API_BASE}/api/catalog/images/${imageId}`;
  }

  return value;
};
/* =========================================================
   CHECK MONGODB ID
========================================================= */

const isMongoId = (value) => {
  return /^[a-f\d]{24}$/i.test(value || "");
};

/* =========================================================
   NORMALIZE PRODUCT DATA

   Supports:

   Backend sizes:
   [
     { size: "S", stock: 5 },
     { size: "M", stock: 3 }
   ]

   Old frontend sizes:
   ["S", "M", "L", "XL"]
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
          size: item.size,
          stock: Number(item.stock || 0),
        };
      })
    : [];

  const normalizedImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.map(getImageUrl).filter(Boolean)
      : Array.isArray(product.imageFiles) && product.imageFiles.length > 0
        ? product.imageFiles
            .map((file) =>
              getImageUrl(
                file?.url ||
                  (file?.fileId
                    ? `/api/catalog/images/${file.fileId}`
                    : ""),
              ),
            )
            .filter(Boolean)
        : product.image
          ? [getImageUrl(product.image)]
          : product.mainImage
            ? [getImageUrl(product.mainImage)]
            : [];

  const calculatedStock = normalizedSizes.reduce(
    (total, item) => total + Number(item.stock || 0),
    0,
  );

  return {
    ...product,

    id: product._id || product.id,

    image: normalizedImages[0] || "",

    mainImage: normalizedImages[0] || "",

    images: normalizedImages,

    price: Number(product.price || 0),

    sizes: normalizedSizes,

    totalStock:
      product.totalStock !== undefined
        ? Number(product.totalStock)
        : calculatedStock,

    colors: Array.isArray(product.colors)
      ? product.colors
      : product.color
        ? [product.color]
        : [],
  };
};

/* =========================================================
   PRODUCT DETAILS PAGE
========================================================= */

function ProductDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const pageRef = useRef(null);

  const mainImageRef = useRef(null);

  /* =========================================================
     STATE
  ========================================================= */

  const [product, setProduct] = useState(null);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [liked, setLiked] = useState(false);

  const [cartMessage, setCartMessage] = useState("");

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

        let loadedProduct = null;

        /* =====================================================
           MONGODB PRODUCT

           Example:
           /product/68d123456789123456789123
        ===================================================== */

        if (isMongoId(id)) {
          const response = await fetch(
  `${API_BASE}/api/catalog/products/${id}`
);

          if (!response.ok) {
            throw new Error("Product not found.");
          }

          const data = await response.json();

          loadedProduct = normalizeProduct(data.product);

          /* ===================================================
             RELATED PRODUCTS
          =================================================== */

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
            console.log("Related products could not load:", relatedError);
          }
        }

        /* =====================================================
           LOCAL PRODUCT FALLBACK

           Example:
           /product/track-2
        ===================================================== */

        if (!loadedProduct) {
          const localProduct = products.find(
            (item) => String(item.id) === String(id),
          );

          if (localProduct) {
            loadedProduct = normalizeProduct(localProduct);

            const relatedLocalProducts = products
              .filter(
                (item) =>
                  item.category === localProduct.category &&
                  item.id !== localProduct.id,
              )
              .slice(0, 4)
              .map(normalizeProduct);

            if (!cancelled) {
              setRelatedProducts(relatedLocalProducts);
            }
          }
        }

        /* =====================================================
           NOTHING FOUND
        ===================================================== */

        if (!loadedProduct) {
          throw new Error("Product not found.");
        }

        if (cancelled) return;

        setProduct(loadedProduct);

        /* =====================================================
           AUTO SELECT FIRST AVAILABLE SIZE
        ===================================================== */

        if (loadedProduct.sizes?.length > 0) {
          const availableSize = loadedProduct.sizes.find(
            (item) => Number(item.stock) > 0,
          );

          if (availableSize) {
            setSelectedSize(availableSize.size);
          }
        }
      } catch (loadError) {
        console.error("PRODUCT LOAD ERROR:", loadError);

        if (!cancelled) {
          setError(loadError.message || "Unable to load this product.");
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
     PAGE GSAP ANIMATION
  ========================================================= */

  useEffect(() => {
    if (!product || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pd-animate",
        {
          opacity: 0,
          y: 24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.07,
          ease: "power3.out",
        },
      );
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, [product]);

  /* =========================================================
     MAIN IMAGE GSAP
  ========================================================= */

  useEffect(() => {
    if (!mainImageRef.current) return;

    gsap.killTweensOf(mainImageRef.current);

    gsap.fromTo(
      mainImageRef.current,
      {
        opacity: 0,
        scale: 1.045,
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
     CURRENT SIZE
  ========================================================= */

  const currentSizeData = product?.sizes?.find(
    (item) => item.size === selectedSize,
  );

  const currentStock = Number(currentSizeData?.stock || 0);

  /* =========================================================
     STOCK
  ========================================================= */

  const hasStock =
    product?.sizes?.length > 0
      ? currentStock > 0
      : Number(product?.totalStock || 0) > 0;

  /* =========================================================
     PREVIOUS IMAGE
  ========================================================= */

  const previousImage = () => {
    if (images.length <= 1) return;

    setActiveImage((previous) => {
      return (previous - 1 + images.length) % images.length;
    });
  };

  /* =========================================================
     NEXT IMAGE
  ========================================================= */

  const nextImage = () => {
    if (images.length <= 1) return;

    setActiveImage((previous) => {
      return (previous + 1) % images.length;
    });
  };

  /* =========================================================
     QUANTITY -
  ========================================================= */

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  /* =========================================================
     QUANTITY +
  ========================================================= */

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
     CREATE CART ITEM
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
     ADD TO CART - MONGODB CART
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
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMessage("PLEASE SELECT A SIZE");

      return;
    }

    if (!hasStock) {
      setCartMessage("THIS SIZE IS OUT OF STOCK");

      return;
    }

    const item = createCartItem();

    localStorage.setItem("axiee-buy-now", JSON.stringify(item));

    navigate("/checkout");
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <main className="pd-state-page">
        <div className="pd-loader">
          <span>AXIEE</span>

          <div className="pd-loader-line">
            <div></div>
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
     PRODUCT PAGE
  ========================================================= */

  return (
    <main ref={pageRef} className="pd-page">
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <section className="pd-topbar pd-animate">
        <button type="button" className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} strokeWidth={1.4} />

          <span>BACK</span>
        </button>

        <div className="pd-breadcrumb">
          <Link to="/">AXIEE</Link>

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

      {/* =====================================================
          MAIN PRODUCT
      ===================================================== */}

      <section className="pd-main">
        {/* ===================================================
            LEFT PRODUCT GALLERY
        =================================================== */}

        <div className="pd-gallery pd-animate">
          {/* THUMBNAILS */}

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

          {/* MAIN IMAGE */}

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

            {/* IMAGE COUNT */}

            {images.length > 1 && (
              <div className="pd-image-number">
                <strong>{String(activeImage + 1).padStart(2, "0")}</strong>

                <span>/</span>

                <span>{String(images.length).padStart(2, "0")}</span>
              </div>
            )}

            {/* IMAGE ARROWS */}

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

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <aside className="pd-info pd-animate">
          {/* PRODUCT NAME */}

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

          {/* SHORT DESCRIPTION */}

          <p className="pd-short-description">
            {product.shortDescription ||
              product.description ||
              "Designed beyond convention. AXIEE contemporary streetwear built for modern movement."}
          </p>

          {/* PRODUCT META */}

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

          {/* =================================================
              SIZE
          ================================================= */}

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

                      {disabled && <span></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================
              QUANTITY
          ================================================= */}

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

          {/* =================================================
              CART / BUY
          ================================================= */}

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

          {/* =================================================
              PAYMENT
          ================================================= */}

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

          {/* =================================================
              SERVICES
          ================================================= */}

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

      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

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
                "AXIEE contemporary streetwear engineered for everyday movement, comfort and unconventional form."}
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

      {/* =====================================================
          RELATED PRODUCTS
      ===================================================== */}

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
                    <div className="pd-related-placeholder">AXIEE</div>
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
