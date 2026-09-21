import Product from "../models/Product.js";

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

export const getProducts = async (req, res) => {
  try {
    const { category, search, bestSeller, featured, sort, limit } = req.query;

    const filter = {
      isActive: true,
    };

    /* Category */

    if (category) {
      filter.category = category.toUpperCase();
    }

    /* Best seller */

    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    /* Featured */

    if (featured === "true") {
      filter.featured = true;
    }

    /* Search */

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          category: {
            $regex: search,
            $options: "i",
          },
        },

        {
          description: {
            $regex: search,
            $options: "i",
          },
        },

        {
          colors: {
            $regex: search,
            $options: "i",
          },
        },

        {
          fit: {
            $regex: search,
            $options: "i",
          },
        },

        {
          style: {
            $regex: search,
            $options: "i",
          },
        },

        {
          keywords: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    let sortOption = {
      createdAt: -1,
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

    if (limit) {
      query = query.limit(Number(limit));
    }

    const products = await query;

    res.status(200).json({
      success: true,

      count: products.length,

      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
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
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,

      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    res.status(500).json({
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

      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,

      product,
    });
  } catch (error) {
    console.error("GET PRODUCT BY SLUG ERROR:", error);

    res.status(500).json({
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    /*
      Find more products from same category
      but don't show current product.
    */

    const relatedProducts = await Product.find({
      _id: {
        $ne: product._id,
      },

      category: product.category,

      isActive: true,
    })
      .sort({
        soldCount: -1,
        createdAt: -1,
      })
      .limit(8);

    res.status(200).json({
      success: true,

      count: relatedProducts.length,

      products: relatedProducts,
    });
  } catch (error) {
    console.error("RELATED PRODUCTS ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Failed to get related products",

      error: error.message,
    });
  }
};

/* =========================================================
   GET BEST SELLERS
========================================================= */

export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
    })
      .sort({
        soldCount: -1,
      })
      .limit(8);

    res.status(200).json({
      success: true,

      count: products.length,

      products,
    });
  } catch (error) {
    console.error("BEST SELLERS ERROR:", error);

    res.status(500).json({
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
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,

      message: "Product created successfully",

      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    res.status(400).json({
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    Object.keys(req.body).forEach((key) => {
      product[key] = req.body[key];
    });

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,

      message: "Product updated successfully",

      product: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    res.status(400).json({
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,

      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Failed to delete product",

      error: error.message,
    });
  }
};
