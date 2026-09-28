import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import mongoose from "mongoose";
import mime from "mime-types";

import Product from "../models/Product.js";

/* =========================================================
   HELPERS
========================================================= */

const cleanText = (value = "") => {
  return String(value ?? "").trim();
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value).trim().toLowerCase();

  return ["true", "1", "yes", "y", "active"].includes(text);
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  const parsed = parseJSON(value, null);

  if (Array.isArray(parsed)) {
    return parsed.map(cleanText).filter(Boolean);
  }

  return String(value)
    .split(/[,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

/* =========================================================
   SKU
========================================================= */

const createGeneratedSku = () => {
  return `AX-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
};

/* =========================================================
   SIZE NORMALIZER
========================================================= */

const normalizeSizes = (value) => {
  const parsed = parseJSON(value, value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return {
            size: cleanText(item),

            stock: 0,
          };
        }

        return {
          size: cleanText(item?.size || item?.label || item?.name),

          stock: Math.max(
            0,
            safeNumber(item?.stock ?? item?.quantity ?? item?.qty),
          ),
        };
      })
      .filter((item) => item.size);
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return parsed
      .split(/[,|;]/)
      .map((part) => {
        const [size, stock] = part.split(":");

        return {
          size: cleanText(size),

          stock: Math.max(0, safeNumber(stock)),
        };
      })
      .filter((item) => item.size);
  }

  return [];
};

/* =========================================================
   STOCK
========================================================= */

const calculateStock = (sizes, fallback = 0) => {
  if (Array.isArray(sizes) && sizes.length > 0) {
    return sizes.reduce(
      (total, item) => total + Math.max(0, safeNumber(item?.stock)),
      0,
    );
  }

  return Math.max(0, safeNumber(fallback));
};

/* =========================================================
   DATABASE
========================================================= */

const getDatabase = () => {
  return mongoose.connection.db;
};

/* =========================================================
   GRIDFS
========================================================= */

const getGridFSBucket = () => {
  const db = getDatabase();

  if (!db) {
    return null;
  }

  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: "productImages",
  });
};

const gridImageUrl = (id) => {
  return `/api/catalog/images/${String(id)}`;
};

/* =========================================================
   TEMP FILE CLEANUP
========================================================= */

const removeTempFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Ignore
  }
};

const cleanupProductFiles = async (req) => {
  if (!Array.isArray(req.files)) {
    return;
  }

  for (const file of req.files) {
    await removeTempFile(file.path);
  }
};

/* =========================================================
   UPLOAD IMAGE TO GRIDFS
========================================================= */

const uploadImageToGridFS = async (file) => {
  const bucket = getGridFSBucket();

  if (!bucket) {
    throw new Error("GridFS is unavailable");
  }

  const filename = file.originalname || path.basename(file.path);

  const contentType =
    file.mimetype || mime.lookup(filename) || "application/octet-stream";

  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      contentType,

      source: "admin-product",
    },
  });

  await pipeline(fs.createReadStream(file.path), uploadStream);

  return gridImageUrl(uploadStream.id);
};

/* =========================================================
   GRIDFS ID FROM ANY IMAGE URL

   Works with:

   /api/catalog/images/ID

   http://localhost:5000/api/catalog/images/ID
========================================================= */

const getGridFsIdFromUrl = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/\/api\/catalog\/images\/([a-f\d]{24})/i);

  return match?.[1] || "";
};

/* =========================================================
   NORMALIZE STORED IMAGE

   Browser/Admin can use:
   http://localhost:5000/api/catalog/images/ID

   MongoDB stores:
   /api/catalog/images/ID
========================================================= */

const normalizeStoredImage = (value) => {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  const gridId = getGridFsIdFromUrl(text);

  if (gridId) {
    return gridImageUrl(gridId);
  }

  if (text.startsWith("/api/images/")) {
    return text.replace("/api/images/", "/api/catalog/images/");
  }

  if (text.startsWith("api/images/")) {
    return `/${text.replace("api/images/", "api/catalog/images/")}`;
  }

  return text;
};

/* =========================================================
   IMAGE IDENTITY

   Prevents this:

   Old:
   /api/catalog/images/123

   New:
   http://localhost:5000/api/catalog/images/123

   from being treated as two different images.
========================================================= */

const imageIdentity = (value) => {
  const id = getGridFsIdFromUrl(value);

  if (id) {
    return `gridfs:${id}`;
  }

  return `url:${normalizeStoredImage(value)}`;
};

/* =========================================================
   DELETE GRIDFS IMAGE
========================================================= */

const deleteGridFsImage = async (value) => {
  const id = getGridFsIdFromUrl(value);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return;
  }

  const bucket = getGridFSBucket();

  if (!bucket) {
    return;
  }

  try {
    await bucket.delete(new mongoose.Types.ObjectId(id));
  } catch {
    // Already gone
  }
};

/* =========================================================
   BUILD IMAGE ARRAY

   IMAGE ORDER IS VERY IMPORTANT.

   Whatever order Admin sends becomes:

   product.images = [...]

   images[0] = MAIN WEBSITE IMAGE
========================================================= */

const buildProductImages = async (req, previousImages = []) => {
  const files = Array.isArray(req.files) ? req.files : [];

  /* ===============================================
       UPLOAD NEW IMAGES
    =============================================== */

  const uploadedUrls = [];

  for (const file of files) {
    const url = await uploadImageToGridFS(file);

    uploadedUrls.push(url);
  }

  /* ===============================================
       IMAGE PLAN FROM Products.jsx

       Example:

       [
         {
           type: "existing",
           value: "/api/catalog/images/..."
         },
         {
           type: "new",
           index: 0
         }
       ]
    =============================================== */

  const imagePlan = parseJSON(req.body?.imagePlan, null);

  if (Array.isArray(imagePlan)) {
    const finalImages = imagePlan
      .map((item) => {
        if (item?.type === "existing") {
          return normalizeStoredImage(item.value);
        }

        if (item?.type === "new") {
          return uploadedUrls[Number(item.index)] || "";
        }

        return "";
      })
      .filter(Boolean);

    return finalImages;
  }

  /* ===============================================
       NO IMAGE PLAN

       Keep old + new
    =============================================== */

  if (uploadedUrls.length > 0) {
    return [...previousImages.map(normalizeStoredImage), ...uploadedUrls];
  }

  return previousImages.map(normalizeStoredImage);
};

/* =========================================================
   NORMALIZE PRODUCT BODY
========================================================= */

const normalizeProductBody = (body = {}) => {
  const sizes = normalizeSizes(body.sizes);

  return {
    sku: cleanText(body.sku).toUpperCase() || createGeneratedSku(),

    name: cleanText(body.name),

    category: cleanText(body.category).toUpperCase(),

    price: Math.max(0, safeNumber(body.price, 0)),

    oldPrice: Math.max(0, safeNumber(body.oldPrice, 0)),

    shortDescription: cleanText(body.shortDescription),

    description: cleanText(body.description),

    colors: toStringArray(body.colors),

    sizes,

    fit: cleanText(body.fit),

    material: cleanText(body.material),

    style: cleanText(body.style),

    gender: cleanText(body.gender) || "UNISEX",

    totalStock: calculateStock(sizes, body.totalStock ?? body.stock),

    featured: toBoolean(body.featured),

    bestSeller: toBoolean(body.bestSeller),

    rating: Math.min(5, Math.max(0, safeNumber(body.rating))),

    reviewCount: Math.max(0, safeNumber(body.reviewCount)),

    soldCount: Math.max(0, safeNumber(body.soldCount)),

    keywords: toStringArray(body.keywords),

    isActive:
      body.isActive === undefined ? true : toBoolean(body.isActive, true),

    source: cleanText(body.source) || "admin",
  };
};

/* =========================================================
   GET PRODUCTS

   GET /api/products
========================================================= */

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      bestSeller,
      featured,
      sort,
      limit,
      includeInactive,
    } = req.query;

    const filter = {};

    /* ===============================================
         ACTIVE
      =============================================== */

    if (includeInactive !== "true") {
      filter.isActive = {
        $ne: false,
      };
    }

    /* ===============================================
         CATEGORY
      =============================================== */

    if (category) {
      filter.category = {
        $regex: `^${escapeRegex(String(category).trim())}$`,

        $options: "i",
      };
    }

    /* ===============================================
         BEST SELLER
      =============================================== */

    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    /* ===============================================
         FEATURED
      =============================================== */

    if (featured === "true") {
      filter.featured = true;
    }

    /* ===============================================
         SEARCH
      =============================================== */

    if (search) {
      const searchText = escapeRegex(search);

      filter.$or = [
        {
          name: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          sku: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          category: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          description: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          shortDescription: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          fit: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          material: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          style: {
            $regex: searchText,

            $options: "i",
          },
        },

        {
          keywords: {
            $regex: searchText,

            $options: "i",
          },
        },
      ];
    }

    /* ===============================================
         SORT
      =============================================== */

    let sortOption = {
      createdAt: -1,
      _id: -1,
    };

    if (sort === "price-low") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price-high") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "best-selling") {
      sortOption = {
        soldCount: -1,
      };
    }

    if (sort === "rating") {
      sortOption = {
        rating: -1,
      };
    }

    let query = Product.find(filter).sort(sortOption);

    /* ===============================================
         LIMIT
      =============================================== */

    const limitNumber = Number(limit);

    if (Number.isFinite(limitNumber) && limitNumber > 0) {
      query = query.limit(limitNumber);
    }

    const products = await query;

    return res.status(200).json({
      success: true,

      count: products.length,

      products,
    });
  } catch (error) {
    console.error("❌ GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get products",

      error: error.message,
    });
  }
};

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    return res.json({
      success: true,

      product,
    });
  } catch (error) {
    console.error("❌ GET PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get product",

      error: error.message,
    });
  }
};

/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,

      isActive: {
        $ne: false,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    return res.json({
      success: true,

      product,
    });
  } catch (error) {
    console.error("❌ GET SLUG ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get product",

      error: error.message,
    });
  }
};

/* =========================================================
   RELATED PRODUCTS
========================================================= */

export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    const relatedProducts = await Product.find({
      _id: {
        $ne: product._id,
      },

      category: product.category,

      isActive: {
        $ne: false,
      },
    })
      .sort({
        featured: -1,
        soldCount: -1,
        createdAt: -1,
      })
      .limit(8);

    return res.json({
      success: true,

      count: relatedProducts.length,

      products: relatedProducts,
    });
  } catch (error) {
    console.error("❌ RELATED PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get related products",

      error: error.message,
    });
  }
};

/* =========================================================
   BEST SELLERS
========================================================= */

export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: {
        $ne: false,
      },
    })
      .sort({
        bestSeller: -1,
        soldCount: -1,
        createdAt: -1,
      })
      .limit(8);

    return res.json({
      success: true,

      count: products.length,

      products,
    });
  } catch (error) {
    console.error("❌ BEST SELLERS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get best sellers",

      error: error.message,
    });
  }
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProduct = async (req, res) => {
  try {
    const payload = normalizeProductBody(req.body || {});

    /* ===============================================
         VALIDATE
      =============================================== */

    if (!payload.name) {
      return res.status(400).json({
        success: false,

        message: "Product name is required",
      });
    }

    if (!payload.category) {
      return res.status(400).json({
        success: false,

        message: "Category is required",
      });
    }

    /* ===============================================
         SKU DUPLICATE
      =============================================== */

    const duplicate = await Product.findOne({
      sku: payload.sku,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,

        message: `SKU ${payload.sku} already exists`,
      });
    }

    /* ===============================================
         IMAGES
      =============================================== */

    const images = await buildProductImages(req, []);

    payload.images = images;

    /*
        CRITICAL:

        images[0] is always main.
      */

    payload.image = images[0] || "";

    payload.mainImage = images[0] || "";

    /* ===============================================
         CREATE
      =============================================== */

    const product = await Product.create(payload);

    return res.status(201).json({
      success: true,

      message: "Product created successfully",

      product,
    });
  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);

    return res.status(400).json({
      success: false,

      message: "Failed to create product",

      error: error.message,
    });
  } finally {
    await cleanupProductFiles(req);
  }
};

/* =========================================================
   UPDATE PRODUCT

   THIS IS THE IMPORTANT MAIN-IMAGE PART.
========================================================= */

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    /* ===============================================
         ID
      =============================================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    /* ===============================================
         CURRENT PRODUCT
      =============================================== */

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    /* ===============================================
         OLD IMAGES
      =============================================== */

    const oldImages = Array.isArray(product.images) ? [...product.images] : [];

    /* ===============================================
         BODY

         Keep old values if field wasn't changed.
      =============================================== */

    const payload = normalizeProductBody({
      ...product.toObject(),

      ...req.body,
    });

    /* ===============================================
         DUPLICATE SKU
      =============================================== */

    const duplicate = await Product.findOne({
      sku: payload.sku,

      _id: {
        $ne: product._id,
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,

        message: `SKU ${payload.sku} already exists`,
      });
    }

    /* ===============================================
         NEW IMAGE ORDER

         Admin MAIN button moves an image to position 0.

         buildProductImages keeps that exact order.
      =============================================== */

    const images = await buildProductImages(req, oldImages);

    /* ===============================================
         UPDATE NORMAL FIELDS
      =============================================== */

    Object.assign(product, payload);

    /* ===============================================
         ⭐ MAIN IMAGE

         Example:

         Before:
         [
           image1,
           image2,
           image3,
           image4
         ]

         Click MAIN on image4.

         After:
         [
           image4,
           image1,
           image2,
           image3
         ]

         MongoDB:
         image = image4
         mainImage = image4
      =============================================== */

    product.images = images;

    product.image = images[0] || "";

    product.mainImage = images[0] || "";

    /* ===============================================
         SAVE
      =============================================== */

    const saved = await product.save();

    /* ===============================================
         DELETE ONLY IMAGES REMOVED FROM PRODUCT

         Reordering does NOT delete them.
      =============================================== */

    const newImageSet = new Set(images.map(imageIdentity));

    for (const oldImage of oldImages) {
      if (!newImageSet.has(imageIdentity(oldImage))) {
        await deleteGridFsImage(oldImage);
      }
    }

    return res.json({
      success: true,

      message: "Product updated successfully",

      product: saved,
    });
  } catch (error) {
    console.error("❌ UPDATE PRODUCT ERROR:", error);

    return res.status(400).json({
      success: false,

      message: "Failed to update product",

      error: error.message,
    });
  } finally {
    await cleanupProductFiles(req);
  }
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    /* ===============================================
         COLLECT ALL GRIDFS IMAGES
      =============================================== */

    const imagesToDelete = new Set();

    if (Array.isArray(product.images)) {
      product.images.forEach((item) => {
        if (item) {
          imagesToDelete.add(String(item));
        }
      });
    }

    if (product.image) {
      imagesToDelete.add(String(product.image));
    }

    if (product.mainImage) {
      imagesToDelete.add(String(product.mainImage));
    }

    if (Array.isArray(product.imageIds)) {
      product.imageIds.forEach((imageId) => {
        imagesToDelete.add(gridImageUrl(imageId));
      });
    }

    if (Array.isArray(product.imageFiles)) {
      product.imageFiles.forEach((item) => {
        if (item?.fileId) {
          imagesToDelete.add(gridImageUrl(item.fileId));
        }
      });
    }

    /* ===============================================
         DELETE PRODUCT
      =============================================== */

    await product.deleteOne();

    /* ===============================================
         DELETE GRIDFS FILES
      =============================================== */

    for (const image of imagesToDelete) {
      await deleteGridFsImage(image);
    }

    return res.json({
      success: true,

      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete product",

      error: error.message,
    });
  }
};
