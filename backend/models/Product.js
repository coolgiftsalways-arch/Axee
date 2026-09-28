import mongoose from "mongoose";

/* =========================================================
   SIZE
========================================================= */

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

/* =========================================================
   LEGACY / GRIDFS IMAGE INFO

   Keeps compatibility with your older MongoDB products.
========================================================= */

const imageFileSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    url: {
      type: String,
      default: "",
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
    strict: false,
  },
);

/* =========================================================
   PRODUCT
========================================================= */

const productSchema = new mongoose.Schema(
  {
    /* =====================================================
       SKU

       Used for bulk imports and duplicate detection.
    ===================================================== */

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      default: "",
    },

    shortDescription: {
      type: String,
      default: "",
    },

    /* =====================================================
       NEW STANDARD IMAGE ARRAY

       First image = website main image.
    ===================================================== */

    images: {
      type: [String],
      default: [],
    },

    /* =====================================================
       LEGACY IMAGE SUPPORT
    ===================================================== */

    image: {
      type: String,
      default: "",
    },

    mainImage: {
      type: String,
      default: "",
    },

    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    imageIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    imageFiles: {
      type: [imageFileSchema],
      default: [],
    },

    colors: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [sizeSchema],
      default: [],
    },

    fit: {
      type: String,
      default: "",
    },

    material: {
      type: String,
      default: "",
    },

    style: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      default: "UNISEX",
    },

    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    keywords: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      default: "admin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   SLUG HELPER
========================================================= */

const makeSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* =========================================================
   BEFORE SAVE
========================================================= */

productSchema.pre("save", function (next) {
  /* CATEGORY */

  if (this.category) {
    this.category = String(this.category).trim().toUpperCase();
  }

  /* SKU */

  if (this.sku) {
    this.sku = String(this.sku).trim().toUpperCase();
  }

  /* UNIQUE SLUG */

  if (this.isModified("name") || this.isModified("sku") || !this.slug) {
    const namePart = makeSlug(this.name);

    const uniquePart = this.sku
      ? makeSlug(this.sku)
      : String(this._id).slice(-8);

    this.slug = `${namePart}-${uniquePart}`;
  }

  /* TOTAL STOCK */

  if (Array.isArray(this.sizes) && this.sizes.length > 0) {
    this.totalStock = this.sizes.reduce(
      (total, item) => total + Number(item.stock || 0),
      0,
    );
  } else {
    this.totalStock = Math.max(0, Number(this.totalStock || 0));
  }

  /* MAIN IMAGE */

  if (Array.isArray(this.images) && this.images.length > 0) {
    this.image = this.images[0];

    this.mainImage = this.images[0];
  }

  next();
});

/* ========================================================= */

const Product = mongoose.model("Product", productSchema);

export default Product;
