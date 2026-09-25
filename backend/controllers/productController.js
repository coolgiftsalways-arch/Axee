import mongoose from "mongoose";
import Product from "../models/Product.js";

/* =========================================================
   HELPERS
========================================================= */

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================================================
   GET ALL PRODUCTS
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

    /*
      Normal shop request:
      show anything that is NOT explicitly inactive.

      Admin:
      ?includeInactive=true
      shows everything.
    */

    if (includeInactive !== "true") {
      filter.isActive = {
        $ne: false,
      };
    }

    /* =====================================================
       CATEGORY
    ===================================================== */

    if (category) {
      const categoryValue = escapeRegex(String(category).trim());

      filter.category = {
        $regex: `^${categoryValue}$`,

        $options: "i",
      };
    }

    /* =====================================================
       BEST SELLER
    ===================================================== */

    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    /* =====================================================
       FEATURED
    ===================================================== */

    if (featured === "true") {
      filter.featured = true;
    }

    /* =====================================================
       SEARCH
    ===================================================== */

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
          colors: {
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
          style: {
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
          keywords: {
            $regex: searchText,

            $options: "i",
          },
        },
      ];
    }

    /* =====================================================
       SORT
    ===================================================== */

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

    /* =====================================================
       QUERY
    ===================================================== */

    let query = Product.find(filter).sort(sortOption);

    if (limit) {
      const number = Number(limit);

      if (Number.isFinite(number) && number > 0) {
        query = query.limit(number);
      }
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
   GET SINGLE PRODUCT
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

    return res.status(200).json({
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

    return res.status(200).json({
      success: true,

      product,
    });
  } catch (error) {
    console.error("❌ GET PRODUCT BY SLUG ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to get product",

      error: error.message,
    });
  }
};

/* =========================================================
   GET RELATED PRODUCTS
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
        soldCount: -1,

        createdAt: -1,
      })
      .limit(8);

    return res.status(200).json({
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
        soldCount: -1,

        createdAt: -1,
      })
      .limit(8);

    return res.status(200).json({
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
    const body = {
      ...req.body,
    };

    if (body.category) {
      body.category = String(body.category).trim().toUpperCase();
    }

    if (body.name) {
      body.name = String(body.name).trim();
    }

    const product = await Product.create(body);

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
  }
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export const updateProduct = async (req, res) => {
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

    const body = {
      ...req.body,
    };

    if (body.category) {
      body.category = String(body.category).trim().toUpperCase();
    }

    if (body.name) {
      body.name = String(body.name).trim();
    }

    Object.keys(body).forEach((key) => {
      product[key] = body[key];
    });

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,

      message: "Product updated successfully",

      product: updatedProduct,
    });
  } catch (error) {
    console.error("❌ UPDATE PRODUCT ERROR:", error);

    return res.status(400).json({
      success: false,

      message: "Failed to update product",

      error: error.message,
    });
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

    await product.deleteOne();

    return res.status(200).json({
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
