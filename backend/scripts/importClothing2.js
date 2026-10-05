import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";
import unzipper from "unzipper";

import Product from "../models/Product.js";

/* =========================================================
   ENV / PATHS
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const ZIP_PATH = path.join(
  __dirname,
  "../imports/CLOTHING 2.zip"
);

/* =========================================================
   IMPORT SETTINGS
========================================================= */

const DEFAULT_STOCK_PER_SIZE = 10;

/*
  Default prices.

  You can change individual prices later with your
  existing updateTrackPantPrices.js script.
*/

const CATEGORY_PRICES = {
  HOODIES: 1599,
  JACKETS: 1999,
  "T-SHIRTS": 1299,
  SHIRTS: 1499,
  SWEATSHIRTS: 1499,
  SHORTS: 1299,
  PANTS: 1699,
};

/* =========================================================
   DEFAULT SIZES
========================================================= */

const DEFAULT_TOP_SIZES = [
  {
    size: "S",
    stock: DEFAULT_STOCK_PER_SIZE,
  },
  {
    size: "M",
    stock: DEFAULT_STOCK_PER_SIZE,
  },
  {
    size: "L",
    stock: DEFAULT_STOCK_PER_SIZE,
  },
  {
    size: "XL",
    stock: DEFAULT_STOCK_PER_SIZE,
  },
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ");

const normalizeName = (value = "") =>
  normalizeText(value)
    .toLowerCase();

const escapeRegex = (value = "") =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

/* =========================================================
   IMAGE TYPE
========================================================= */

const getContentType = (fileName = "") => {
  const extension =
    path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".webp":
      return "image/webp";

    case ".gif":
      return "image/gif";

    default:
      return "application/octet-stream";
  }
};

const isImageFile = (fileName = "") => {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(
    fileName
  );
};

/* =========================================================
   CATEGORY MAPPING

   ZIP examples:

   weekday/Hoodies/...
   weekday/Jackets/...
   weekday/Shirts/...
   weekday/oversized t shirts full sleevs/...
========================================================= */

const getCategory = (
  zipCategory = ""
) => {
  const value = normalizeName(
    zipCategory
  );

  if (
    value === "hoodies" ||
    value === "hoodie"
  ) {
    return "HOODIES";
  }

  if (
    value === "jackets" ||
    value === "jacket"
  ) {
    return "JACKETS";
  }

  if (
    value === "shirts" ||
    value === "shirt"
  ) {
    return "SHIRTS";
  }

  if (
    value.includes("t shirt") ||
    value.includes("t-shirt") ||
    value.includes("tshirts") ||
    value.includes("oversized")
  ) {
    return "T-SHIRTS";
  }

  if (
    value.includes("sweatshirt")
  ) {
    return "SWEATSHIRTS";
  }

  if (
    value.includes("short")
  ) {
    return "SHORTS";
  }

  if (
    value.includes("pant") ||
    value.includes("jogger") ||
    value.includes("trouser")
  ) {
    return "PANTS";
  }

  /*
    Unknown category:
    turn folder name into uppercase category
  */

  return normalizeText(
    zipCategory
  ).toUpperCase();
};

/* =========================================================
   PRICE
========================================================= */

const getPriceForCategory = (
  category
) => {
  return (
    CATEGORY_PRICES[category] ||
    1499
  );
};

/* =========================================================
   DESCRIPTION
========================================================= */

const createDescription = (
  productName,
  category
) => {
  return `${productName} from the UNBOUND ${category.toLowerCase()} collection. Designed with a contemporary streetwear silhouette, everyday comfort and statement styling.`;
};

/* =========================================================
   GRIDFS URL
========================================================= */

const gridFsImageUrl = (
  fileId
) => {
  return `/api/catalog/images/${String(
    fileId
  )}`;
};

/* =========================================================
   DELETE GRIDFS FILES

   Used only if a product fails midway.
========================================================= */

const deleteUploadedFiles =
  async (
    bucket,
    fileIds = []
  ) => {
    for (
      const fileId
      of fileIds
    ) {
      try {
        await bucket.delete(
          fileId
        );
      } catch {
        // Ignore cleanup errors.
      }
    }
  };

/* =========================================================
   UPLOAD ZIP ENTRY TO GRIDFS
========================================================= */

const uploadEntryToGridFS =
  async ({
    bucket,
    entry,
    productName,
    category,
    order,
  }) => {
    return new Promise(
      (resolve, reject) => {
        const originalFileName =
          path.basename(
            entry.path
          );

        const uploadStream =
          bucket.openUploadStream(
            originalFileName,
            {
              metadata: {
                contentType:
                  getContentType(
                    originalFileName
                  ),

                productName,

                category,

                order,

                source:
                  "CLOTHING 2.zip",

                importedAt:
                  new Date(),
              },
            }
          );

        uploadStream.on(
          "error",
          reject
        );

        uploadStream.on(
          "finish",
          () => {
            resolve(
              uploadStream.id
            );
          }
        );

        entry
          .stream()
          .on(
            "error",
            reject
          )
          .pipe(
            uploadStream
          );
      }
    );
  };

/* =========================================================
   MAIN
========================================================= */

const run = async () => {
  let created = 0;
  let duplicates = 0;
  let skipped = 0;
  let failed = 0;
  let uploadedImageCount = 0;

  try {
    /* =====================================================
       MONGODB URI
    ===================================================== */

    const mongoUri =
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB URL is missing from backend/.env"
      );
    }

    /* =====================================================
       CONNECT
    ===================================================== */

    console.log("");
    console.log(
      "🔌 Connecting to MongoDB..."
    );

    await mongoose.connect(
      mongoUri
    );

    console.log(
      "✅ MongoDB connected"
    );

    /* =====================================================
       GRIDFS
    ===================================================== */

    const db =
      mongoose.connection.db;

    const bucket =
      new mongoose.mongo.GridFSBucket(
        db,
        {
          bucketName:
            "productImages",
        }
      );

    /* =====================================================
       OPEN ZIP
    ===================================================== */

    console.log("");
    console.log(
      `📦 ZIP: ${ZIP_PATH}`
    );

    const zip =
      await unzipper.Open.file(
        ZIP_PATH
      );

    console.log(
      `📁 ZIP entries: ${zip.files.length}`
    );

    /* =====================================================
       GROUP FILES BY PRODUCT
    ===================================================== */

    const productMap =
      new Map();

    for (
      const entry
      of zip.files
    ) {
      if (
        entry.type !==
        "File"
      ) {
        continue;
      }

      if (
        !isImageFile(
          entry.path
        )
      ) {
        continue;
      }

      /*
        Expected:

        weekday/
          category/
            product/
              image.png
      */

      const parts =
        String(entry.path)
          .split("/")
          .filter(Boolean);

      if (
        parts.length < 4
      ) {
        console.log(
          `⚠️ Invalid ZIP path: ${entry.path}`
        );

        continue;
      }

      const rootFolder =
        parts[0];

      const zipCategory =
        parts[1];

      const productName =
        normalizeText(
          parts[2]
        );

      if (
        normalizeName(
          rootFolder
        ) !==
        "weekday"
      ) {
        continue;
      }

      if (!productName) {
        continue;
      }

      const category =
        getCategory(
          zipCategory
        );

      const key =
        `${normalizeName(
          category
        )}::${normalizeName(
          productName
        )}`;

      if (
        !productMap.has(
          key
        )
      ) {
        productMap.set(
          key,
          {
            productName,
            category,
            zipCategory,
            entries: [],
          }
        );
      }

      productMap
        .get(key)
        .entries.push(
          entry
        );
    }

    /* =====================================================
       SUMMARY BEFORE IMPORT
    ===================================================== */

    console.log("");
    console.log(
      "=============================================="
    );

    console.log(
      `📦 Products detected: ${productMap.size}`
    );

    console.log(
      "=============================================="
    );

    console.log("");

    /* =====================================================
       IMPORT PRODUCTS
    ===================================================== */

    for (
      const productData
      of productMap.values()
    ) {
      const {
        productName,
        category,
        entries,
      } = productData;

      let uploadedFileIds =
        [];

      try {
        console.log(
          "----------------------------------------------"
        );

        console.log(
          `👕 ${productName}`
        );

        console.log(
          `   Category: ${category}`
        );

        console.log(
          `   Images: ${entries.length}`
        );

        /* =================================================
           DUPLICATE CHECK

           Exact product name, case-insensitive.
        ================================================= */

        const existingProduct =
          await Product.findOne({
            name: {
              $regex:
                `^${escapeRegex(
                  productName
                )}$`,
              $options:
                "i",
            },
          })
            .select(
              "_id name category"
            )
            .lean();

        if (
          existingProduct
        ) {
          duplicates++;

          console.log(
            `⚠️ DUPLICATE SKIPPED`
          );

          console.log(
            `   Existing: ${existingProduct.name}`
          );

          console.log("");

          continue;
        }

        if (
          entries.length ===
          0
        ) {
          skipped++;

          console.log(
            "⚠️ No images - skipped"
          );

          console.log("");

          continue;
        }

        /* =================================================
           SORT IMAGES BY FILE NAME

           Screenshot timestamps naturally stay
           in sequence.
        ================================================= */

        entries.sort(
          (a, b) =>
            String(a.path).localeCompare(
              String(b.path),
              undefined,
              {
                numeric: true,
                sensitivity:
                  "base",
              }
            )
        );

        const imageFiles = [];
        const imageIds = [];
        const images = [];

        /* =================================================
           UPLOAD IMAGES TO EXISTING GRIDFS
        ================================================= */

        for (
          let index = 0;
          index <
          entries.length;
          index++
        ) {
          const entry =
            entries[index];

          const fileId =
            await uploadEntryToGridFS({
              bucket,
              entry,
              productName,
              category,
              order: index,
            });

          uploadedFileIds.push(
            fileId
          );

          imageIds.push(
            fileId
          );

          const url =
            gridFsImageUrl(
              fileId
            );

          images.push(
            url
          );

          imageFiles.push({
            fileId,
            url,
            order: index,
          });

          uploadedImageCount++;

          console.log(
            `   ✅ Image ${
              index + 1
            }/${entries.length}: ${fileId}`
          );
        }

        /* =================================================
           PRODUCT DATA
        ================================================= */

        const price =
          getPriceForCategory(
            category
          );

        const totalStock =
          DEFAULT_TOP_SIZES.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.stock ||
                  0
              ),
            0
          );

        const product =
          new Product({
            name:
              productName,

            category,

            price,

            oldPrice: 0,

            description:
              createDescription(
                productName,
                category
              ),

            shortDescription:
              "",

            /* =============================================
               YOUR EXISTING GRIDFS IMAGE LOGIC
            ============================================= */

            images,

            image:
              images[0] ||
              "",

            mainImage:
              images[0] ||
              "",

            imageId:
              imageIds[0] ||
              null,

            imageIds,

            imageFiles,

            /* =============================================
               PRODUCT DETAILS
            ============================================= */

            colors: [],

            sizes:
              DEFAULT_TOP_SIZES.map(
                (item) => ({
                  ...item,
                })
              ),

            fit: "",

            material: "",

            style: "",

            gender:
              "UNISEX",

            totalStock,

            featured:
              false,

            bestSeller:
              false,

            /*
              Do not invent customer reviews.
            */

            rating: 0,

            reviewCount: 0,

            soldCount: 0,

            keywords: [
              category.toLowerCase(),
              "unbound",
            ],

            source:
              "clothing-2-import",

            isActive:
              true,
          });

        /* =================================================
           SAVE

           Your Product pre-save hook will generate slug
           and calculate totalStock.
        ================================================= */

        await product.save();

        created++;

        console.log("");
        console.log(
          `✅ IMPORTED: ${productName}`
        );

        console.log(
          `   MongoDB ID: ${product._id}`
        );

        console.log(
          `   Category: ${category}`
        );

        console.log(
          `   Price: ₹${price}`
        );

        console.log(
          `   GridFS images: ${images.length}`
        );

        console.log(
          `   Main image: ${images[0]}`
        );

        console.log("");
      } catch (error) {
        failed++;

        console.error(
          ""
        );

        console.error(
          `❌ FAILED: ${productName}`
        );

        console.error(
          `   ${error.message}`
        );

        /*
          If product creation fails after images
          were uploaded, remove those orphaned
          GridFS images.
        */

        if (
          uploadedFileIds.length >
          0
        ) {
          console.log(
            "   🧹 Cleaning uploaded images..."
          );

          await deleteUploadedFiles(
            bucket,
            uploadedFileIds
          );
        }

        console.log("");
      }
    }

    /* =====================================================
       FINAL REPORT
    ===================================================== */

    console.log("");
    console.log(
      "=============================================="
    );

    console.log(
      "       CLOTHING 2 IMPORT COMPLETE"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `📦 Products detected: ${productMap.size}`
    );

    console.log(
      `✅ New products: ${created}`
    );

    console.log(
      `🖼 Images uploaded: ${uploadedImageCount}`
    );

    console.log(
      `⚠️ Duplicates skipped: ${duplicates}`
    );

    console.log(
      `⚠️ Other skipped: ${skipped}`
    );

    console.log(
      `❌ Failed: ${failed}`
    );

    console.log(
      "=============================================="
    );

    /* =====================================================
       DISCONNECT
    ===================================================== */

    await mongoose.disconnect();

    console.log("");
    console.log(
      "✅ MongoDB disconnected"
    );

    process.exit(
      failed > 0 ? 1 : 0
    );
  } catch (error) {
    console.error("");
    console.error(
      "❌ CLOTHING 2 IMPORT FAILED:"
    );

    console.error(
      error
    );

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
};

/* =========================================================
   RUN
========================================================= */

run();