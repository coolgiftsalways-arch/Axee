import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  ImagePlus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "../AdminCss/admin-pages.css";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   EMPTY PRODUCT
========================================================= */

const EMPTY_PRODUCT = {
  sku: "",
  name: "",
  category: "",
  price: "",
  oldPrice: "",

  shortDescription: "",
  description: "",

  colors: "",
  fit: "",
  material: "",
  style: "",
  gender: "UNISEX",

  featured: false,
  bestSeller: false,
  isActive: true,

  rating: "4.5",
  reviewCount: "0",
  soldCount: "0",

  keywords: "",

  sizes: [
    {
      size: "S",
      stock: 0,
    },
    {
      size: "M",
      stock: 0,
    },
    {
      size: "L",
      stock: 0,
    },
    {
      size: "XL",
      stock: 0,
    },
  ],
};

/* =========================================================
   HELPERS
========================================================= */

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

/* =========================================================
   IMAGE RESOLVER
========================================================= */

const resolveImage = (value) => {
  if (!value) {
    return "";
  }

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

  if (value.startsWith("/api/images/")) {
    value = value.replace("/api/images/", "/api/catalog/images/");
  }

  if (value.startsWith("api/images/")) {
    value = `/${value.replace("api/images/", "api/catalog/images/")}`;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/api/") || value.startsWith("/uploads/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("api/") || value.startsWith("uploads/")) {
    return `${API_BASE}/${value}`;
  }

  return value;
};

/* =========================================================
   STORE IMAGE VALUE

   Preview can use a full backend URL, but MongoDB should
   keep stable /api/catalog/images/:id paths.
========================================================= */

const toStoredImageValue = (value) => {
  if (!value) {
    return "";
  }

  let text = String(value).trim().replace(/\\/g, "/");

  if (!text) {
    return "";
  }

  if (text.startsWith(`${API_BASE}/api/`)) {
    text = text.slice(API_BASE.length);
  }

  if (text.startsWith("/api/images/")) {
    text = text.replace("/api/images/", "/api/catalog/images/");
  }

  return text;
};

/* =========================================================
   GET PRODUCT IMAGES
========================================================= */

const getProductImages = (product) => {
  /* NEW FORMAT */

  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images.map(resolveImage).filter(Boolean);
  }

  /* OLD GRIDFS FORMAT */

  if (Array.isArray(product?.imageFiles) && product.imageFiles.length > 0) {
    return [...product.imageFiles]
      .sort((a, b) => safeNumber(a?.order) - safeNumber(b?.order))
      .map((item) => {
        const fileId = item?.fileId || item?._id || item?.id;

        if (fileId) {
          return `${API_BASE}/api/catalog/images/${String(fileId)}`;
        }

        return resolveImage(item);
      })
      .filter(Boolean);
  }

  /* OLD IDS */

  if (Array.isArray(product?.imageIds) && product.imageIds.length > 0) {
    return product.imageIds.map(
      (id) => `${API_BASE}/api/catalog/images/${String(id)}`,
    );
  }

  /* SINGLE IMAGE */

  const singleImage = product?.image || product?.mainImage;

  return singleImage ? [resolveImage(singleImage)] : [];
};

/* =========================================================
   STOCK
========================================================= */

const getStock = (product) => {
  if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
    return product.sizes.reduce(
      (total, item) => total + safeNumber(item?.stock),
      0,
    );
  }

  return safeNumber(product?.totalStock ?? product?.stock);
};

/* =========================================================
   STATUS
========================================================= */

const getStatus = (product) => {
  if (product?.isActive === false) {
    return "Inactive";
  }

  const stock = getStock(product);

  if (stock <= 0) {
    return "Out of Stock";
  }

  if (stock <= 15) {
    return "Low Stock";
  }

  return "Active";
};

/* =========================================================
   COMPONENT
========================================================= */

const Products = () => {
  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     MAIN FILTER
  ======================================================= */

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("ALL");

  /* =======================================================
     MODAL
  ======================================================= */

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState("");

  const [form, setForm] = useState({
    ...EMPTY_PRODUCT,
  });

  const [imageItems, setImageItems] = useState([]);

  const [saving, setSaving] = useState(false);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_BASE}/api/products?includeInactive=true`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (loadError) {
      console.error("PRODUCT LOAD ERROR:", loadError);

      setProducts([]);

      setError(loadError?.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* =======================================================
     MAIN PRODUCT CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const values = products
      .map((product) =>
        String(product?.category || "")
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean);

    return ["ALL", ...Array.from(new Set(values)).sort()];
  }, [products]);

  /* =======================================================
     MAIN PRODUCT FILTER
  ======================================================= */

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const productCategory = String(product?.category || "")
        .trim()
        .toUpperCase();

      const categoryOk = category === "ALL" || productCategory === category;

      const searchOk =
        !query ||
        String(product?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(product?.sku || "")
          .toLowerCase()
          .includes(query) ||
        productCategory.toLowerCase().includes(query);

      return categoryOk && searchOk;
    });
  }, [products, search, category]);

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  const openCreate = () => {
    setEditingId("");

    setForm({
      ...EMPTY_PRODUCT,

      sizes: EMPTY_PRODUCT.sizes.map((item) => ({
        ...item,
      })),
    });

    setImageItems([]);

    setModalOpen(true);
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEdit = (product) => {
    setEditingId(String(product?._id || product?.id || ""));

    setForm({
      sku: product?.sku || "",

      name: product?.name || "",

      category: product?.category || "",

      price: product?.price ?? "",

      oldPrice: product?.oldPrice ?? "",

      shortDescription: product?.shortDescription || "",

      description: product?.description || "",

      colors: Array.isArray(product?.colors) ? product.colors.join(", ") : "",

      fit: product?.fit || "",

      material: product?.material || "",

      style: product?.style || "",

      gender: product?.gender || "UNISEX",

      featured: Boolean(product?.featured),

      bestSeller: Boolean(product?.bestSeller),

      isActive: product?.isActive !== false,

      rating: product?.rating ?? 0,

      reviewCount: product?.reviewCount ?? 0,

      soldCount: product?.soldCount ?? 0,

      keywords: Array.isArray(product?.keywords)
        ? product.keywords.join(", ")
        : "",

      sizes: Array.isArray(product?.sizes)
        ? product.sizes.map((item) => ({
            size: item?.size || "",

            stock: safeNumber(item?.stock),
          }))
        : [],
    });

    setImageItems(
      getProductImages(product).map((image, index) => ({
        id: `existing-${index}-${image}`,

        type: "existing",

        value: toStoredImageValue(image),

        preview: image,
      })),
    );

    setModalOpen(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    imageItems.forEach((item) => {
      if (item.type === "new" && item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

    setModalOpen(false);

    setEditingId("");

    setImageItems([]);
  };

  /* =======================================================
     FIELD
  ======================================================= */

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  };

  /* =======================================================
     SIZES
  ======================================================= */

  const addSize = () => {
    setForm((current) => ({
      ...current,

      sizes: [
        ...current.sizes,

        {
          size: "",
          stock: 0,
        },
      ],
    }));
  };

  const updateSize = (index, field, value) => {
    setForm((current) => ({
      ...current,

      sizes: current.sizes.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,

              [field]:
                field === "stock" ? Math.max(0, safeNumber(value)) : value,
            }
          : item,
      ),
    }));
  };

  const removeSize = (index) => {
    setForm((current) => ({
      ...current,

      sizes: current.sizes.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  /* =======================================================
     ADD PRODUCT IMAGES
  ======================================================= */

  const addImages = (event) => {
    const files = Array.from(event.target.files || []);

    const newItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,

      type: "new",

      file,

      preview: URL.createObjectURL(file),
    }));

    setImageItems((current) => [...current, ...newItems]);

    event.target.value = "";
  };

  /* =======================================================
     MOVE IMAGE
  ======================================================= */

  const moveImage = (from, to) => {
    if (to < 0 || to >= imageItems.length) {
      return;
    }

    setImageItems((current) => {
      const next = [...current];

      const [item] = next.splice(from, 1);

      next.splice(to, 0, item);

      return next;
    });
  };

  /* =======================================================
     MAKE IMAGE MAIN
  ======================================================= */

  const makeMainImage = (index) => {
    if (index === 0) {
      return;
    }

    setImageItems((current) => {
      const next = [...current];

      const [item] = next.splice(index, 1);

      next.unshift(item);

      return next;
    });
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (index) => {
    setImageItems((current) => {
      const item = current[index];

      if (item?.type === "new" && item?.preview) {
        URL.revokeObjectURL(item.preview);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  /* =======================================================
     SAVE SINGLE PRODUCT
  ======================================================= */

  const saveProduct = async () => {
    if (!form.name.trim()) {
      alert("Enter product name.");

      return;
    }

    if (!form.category.trim()) {
      alert("Enter product category.");

      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      /* PRODUCT FIELDS */

      const fields = {
        sku: form.sku,

        name: form.name,

        category: form.category,

        price: form.price,

        oldPrice: form.oldPrice,

        shortDescription: form.shortDescription,

        description: form.description,

        colors: form.colors,

        fit: form.fit,

        material: form.material,

        style: form.style,

        gender: form.gender,

        featured: String(form.featured),

        bestSeller: String(form.bestSeller),

        isActive: String(form.isActive),

        rating: form.rating,

        reviewCount: form.reviewCount,

        soldCount: form.soldCount,

        keywords: form.keywords,

        sizes: JSON.stringify(form.sizes),
      };

      Object.entries(fields).forEach(([key, value]) => {
        data.append(key, value ?? "");
      });

      /* NEW IMAGES */

      const newItems = imageItems.filter((item) => item.type === "new");

      newItems.forEach((item) => {
        data.append("images", item.file);
      });

      /* IMAGE ORDER */

      const imagePlan = imageItems.map((item) => {
        if (item.type === "existing") {
          return {
            type: "existing",

            value: item.value,
          };
        }

        return {
          type: "new",

          index: newItems.indexOf(item),
        };
      });

      data.append("imagePlan", JSON.stringify(imagePlan));

      /* REQUEST */

      const url = editingId
        ? `${API_BASE}/api/products/${editingId}`
        : `${API_BASE}/api/products`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "Could not save product.",
        );
      }

      await loadProducts();

      closeModal();
    } catch (saveError) {
      console.error("SAVE PRODUCT ERROR:", saveError);

      alert(saveError?.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const deleteProduct = async (product) => {
    const id = product?._id || product?.id;

    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis will remove it from MongoDB and your website.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Delete failed.");
      }

      setProducts((current) =>
        current.filter((item) => String(item?._id || item?.id) !== String(id)),
      );
    } catch (deleteError) {
      console.error("DELETE ERROR:", deleteError);

      alert(deleteError?.message || "Unable to delete product.");
    }
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="admin-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="admin-page-header">
        <div>
          <h1>Products</h1>

          <p>Manage MongoDB products, images and inventory.</p>
        </div>

        <div className="admin-product-header-buttons">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadProducts}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="admin-primary-button"
            onClick={openCreate}
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* =================================================
          PRODUCT CARD
      ================================================= */}

      <div className="admin-card">
        {/* =================================================
            MAIN PRODUCT FILTER
        ================================================= */}

        <div className="admin-products-toolbar">
          <div className="admin-search-box">
            <Search size={17} />

            <input
              type="text"
              value={search}
              placeholder="Search products / SKU..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="admin-product-category-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <span className="admin-products-total">
            {visibleProducts.length} PRODUCTS
          </span>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="admin-product-state">Loading products...</div>
        )}

        {/* ERROR */}

        {error && (
          <div className="admin-product-state admin-product-state-error">
            {error}
          </div>
        )}

        {/* =================================================
            REAL PRODUCTS TABLE
        ================================================= */}

        {!loading && !error && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>

                  <th>SKU</th>

                  <th>Product Name</th>

                  <th>Category</th>

                  <th>Price</th>

                  <th>Stock</th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product, index) => {
                  const images = getProductImages(product);

                  const status = getStatus(product);

                  return (
                    <tr key={product?._id || product?.id}>
                      {/* IMAGE */}

                      <td>
                        <div className="admin-product-real-image">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={product.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </div>
                      </td>

                      {/* SKU */}

                      <td>
                        <span className="admin-product-sku">
                          {product?.sku || "—"}
                        </span>
                      </td>

                      {/* NAME */}

                      <td>
                        <strong>{product.name}</strong>
                      </td>

                      {/* CATEGORY */}

                      <td>{product.category}</td>

                      {/* PRICE */}

                      <td>
                        ₹{safeNumber(product.price).toLocaleString("en-IN")}
                      </td>

                      {/* STOCK */}

                      <td>{getStock(product)}</td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`admin-status ${
                            status === "Active"
                              ? "admin-status-active"
                              : "admin-status-pending"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            title="Edit product"
                            onClick={() => openEdit(product)}
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-action-button admin-delete-button"
                            title="Delete product"
                            onClick={() => deleteProduct(product)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="admin-product-empty">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="admin-product-modal-overlay">
          <div className="admin-product-modal">
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="admin-product-modal-header">
              <div>
                <span>{editingId ? "EDIT PRODUCT" : "ADD PRODUCT"}</span>

                <h2>{editingId ? form.name : "Create Product"}</h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            {/* =================================================
                SINGLE PRODUCT
            ================================================= */}

            <div className="admin-product-modal-body">
              {/* =========================================
                    PRODUCT INFORMATION
                ========================================= */}

              <section className="admin-product-form-section">
                <h3>Product Information</h3>

                <div className="admin-product-form-grid">
                  <label>
                    <span>SKU</span>

                    <input
                      value={form.sku}
                      placeholder="JEAN-001"
                      onChange={(event) => setField("sku", event.target.value)}
                    />
                  </label>

                  <label className="wide">
                    <span>Product Name</span>

                    <input
                      value={form.name}
                      onChange={(event) => setField("name", event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Category</span>

                    <input
                      value={form.category}
                      placeholder="JEANS"
                      onChange={(event) =>
                        setField("category", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Price ₹</span>

                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        setField("price", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Old Price ₹</span>

                    <input
                      type="number"
                      min="0"
                      value={form.oldPrice}
                      onChange={(event) =>
                        setField("oldPrice", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Gender</span>

                    <select
                      value={form.gender}
                      onChange={(event) =>
                        setField("gender", event.target.value)
                      }
                    >
                      <option value="UNISEX">UNISEX</option>

                      <option value="MEN">MEN</option>

                      <option value="WOMEN">WOMEN</option>
                    </select>
                  </label>

                  <label>
                    <span>Colors</span>

                    <input
                      value={form.colors}
                      placeholder="Black, Grey"
                      onChange={(event) =>
                        setField("colors", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Fit</span>

                    <input
                      value={form.fit}
                      placeholder="OVERSIZED"
                      onChange={(event) => setField("fit", event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Material</span>

                    <input
                      value={form.material}
                      onChange={(event) =>
                        setField("material", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Style</span>

                    <input
                      value={form.style}
                      onChange={(event) =>
                        setField("style", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Rating</span>

                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={(event) =>
                        setField("rating", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Reviews</span>

                    <input
                      type="number"
                      min="0"
                      value={form.reviewCount}
                      onChange={(event) =>
                        setField("reviewCount", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Sold Count</span>

                    <input
                      type="number"
                      min="0"
                      value={form.soldCount}
                      onChange={(event) =>
                        setField("soldCount", event.target.value)
                      }
                    />
                  </label>

                  <label className="wide">
                    <span>Keywords</span>

                    <input
                      value={form.keywords}
                      placeholder="denim, baggy, streetwear"
                      onChange={(event) =>
                        setField("keywords", event.target.value)
                      }
                    />
                  </label>

                  <label className="wide">
                    <span>Short Description</span>

                    <textarea
                      rows="3"
                      value={form.shortDescription}
                      onChange={(event) =>
                        setField("shortDescription", event.target.value)
                      }
                    />
                  </label>

                  <label className="full">
                    <span>Full Description</span>

                    <textarea
                      rows="5"
                      value={form.description}
                      onChange={(event) =>
                        setField("description", event.target.value)
                      }
                    />
                  </label>
                </div>
              </section>

              {/* =========================================
                    IMAGES
                ========================================= */}

              <section className="admin-product-form-section">
                <div className="admin-product-section-heading">
                  <div>
                    <h3>Product Images</h3>

                    <p>Image 01 is the main website image.</p>
                  </div>

                  <label className="admin-product-upload-images">
                    <ImagePlus size={16} />
                    Add Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={addImages}
                    />
                  </label>
                </div>

                <div className="admin-product-image-grid">
                  {imageItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={
                        index === 0
                          ? "admin-product-image-edit main"
                          : "admin-product-image-edit"
                      }
                    >
                      <div>
                        <img src={item.preview} alt={`Product ${index + 1}`} />

                        <span>
                          {index === 0
                            ? "MAIN"
                            : String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="admin-product-image-edit-actions">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveImage(index, index - 1)}
                        >
                          <ArrowLeft size={14} />
                        </button>

                        {index === 0 ? (
                          <span>MAIN</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makeMainImage(index)}
                          >
                            MAIN
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={index === imageItems.length - 1}
                          onClick={() => moveImage(index, index + 1)}
                        >
                          <ArrowRight size={14} />
                        </button>

                        <button
                          type="button"
                          className="remove"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* =========================================
                    SIZE / STOCK
                ========================================= */}

              <section className="admin-product-form-section">
                <div className="admin-product-section-heading">
                  <div>
                    <h3>Sizes & Stock</h3>

                    <p>
                      Total website stock is calculated from the size stock.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={addSize}
                  >
                    <Plus size={15} />
                    Add Size
                  </button>
                </div>

                <div className="admin-product-sizes">
                  {form.sizes.map((size, index) => (
                    <div key={index}>
                      <input
                        value={size.size}
                        placeholder="Size"
                        onChange={(event) =>
                          updateSize(index, "size", event.target.value)
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        value={size.stock}
                        placeholder="Stock"
                        onChange={(event) =>
                          updateSize(index, "stock", event.target.value)
                        }
                      />

                      <button type="button" onClick={() => removeSize(index)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* =========================================
                    FLAGS
                ========================================= */}

              <section className="admin-product-form-section">
                <div className="admin-product-switches">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setField("isActive", event.target.checked)
                      }
                    />
                    Active
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        setField("featured", event.target.checked)
                      }
                    />
                    Featured
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={form.bestSeller}
                      onChange={(event) =>
                        setField("bestSeller", event.target.checked)
                      }
                    />
                    Best Seller
                  </label>
                </div>
              </section>
            </div>

            {/* =================================================
                SINGLE PRODUCT FOOTER
            ================================================= */}

            <div className="admin-product-modal-footer">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-primary-button"
                disabled={saving}
                onClick={saveProduct}
              >
                <Save size={16} />

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
