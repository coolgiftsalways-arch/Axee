import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
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

const productSchema = new mongoose.Schema(
  {
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
    },

    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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

    images: {
      type: [String],
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
    },

    soldCount: {
      type: Number,
      default: 0,
    },

    keywords: {
      type: [String],
      default: [],
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

/* ==========================================
   CREATE SLUG AUTOMATICALLY
========================================== */

productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* Calculate total stock from sizes */

  if (Array.isArray(this.sizes)) {
    this.totalStock = this.sizes.reduce(
      (total, item) => total + Number(item.stock || 0),
      0,
    );
  }

  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
