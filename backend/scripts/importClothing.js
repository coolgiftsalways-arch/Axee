import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import dotenv from "dotenv";
import mime from "mime-types";
import {
  MongoClient,
  GridFSBucket,
} from "mongodb";
import { fileURLToPath } from "url";

dotenv.config();

/* =========================================================
   PATHS
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZIP_PATH = path.join(
  __dirname,
  "../uploads/Clothing.zip"
);

/* =========================================================
   SETTINGS
========================================================= */

// true  = scan only
// false = upload to MongoDB
const DRY_RUN = false;

// Skip products already in MongoDB
const SKIP_DUPLICATES = true;

// MongoDB database name
const DB_NAME = "aixee";

// Existing collection used by your Track Pants importer
const PRODUCT_COLLECTION = "products";

// Existing GridFS bucket used by your Track Pants importer
const GRIDFS_BUCKET = "productImages";

// Do NOT import Track Pants
const SKIP_WORDS = [
  "track pant",
  "track pants",
  "trackpant",
  "trackpants",
];

/* =========================================================
   HELPERS
========================================================= */

function cleanText(text = "") {
  return String(text)
    .replace(/\\/g, "/")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text = "") {
  return cleanText(text)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function shouldSkip(text = "") {
  const value =
    String(text).toLowerCase();

  return SKIP_WORDS.some((word) =>
    value.includes(word)
  );
}

function isImage(filename = "") {
  const ext = path
    .extname(filename)
    .toLowerCase();

  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
    ".gif",
  ].includes(ext);
}

function isIgnoredFile(filename = "") {
  const value =
    filename.toLowerCase();

  return (
    value.includes("__macosx") ||
    value.includes(".ds_store") ||
    value.includes("thumbs.db")
  );
}

function removeExtension(filename = "") {
  return filename.replace(
    /\.[^/.]+$/,
    ""
  );
}

function escapeRegex(value = "") {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function createSlug(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   CATEGORY NORMALIZATION
========================================================= */

function normalizeCategory(
  category = ""
) {
  const value =
    category
      .toLowerCase()
      .trim();

  if (value === "tees") {
    return "T-Shirts";
  }

  if (
    value === "shirt" ||
    value === "shirts"
  ) {
    return "Shirts";
  }

  if (
    value === "co ord sets" ||
    value === "co ord sets shorts" ||
    value === "co-ord sets" ||
    value === "coord sets"
  ) {
    return "Co-ord Sets";
  }

  if (value === "hoodies") {
    return "Hoodies";
  }

  if (value === "jackets") {
    return "Jackets";
  }

  if (value === "pants") {
    return "Pants";
  }

  if (value === "shorts") {
    return "Shorts";
  }

  return titleCase(category);
}

/* =========================================================
   DEFAULT PRODUCT DATA
========================================================= */

function getDefaults(
  category = ""
) {
  const value =
    category.toLowerCase();

  /* T-SHIRTS */

  if (
    value.includes("t-shirt") ||
    value.includes("tshirt") ||
    value.includes("tee")
  ) {
    return {
      price: 1499,
      stock: 20,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* SHIRTS */

  if (
    value.includes("shirt")
  ) {
    return {
      price: 1999,
      stock: 20,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* HOODIES */

  if (
    value.includes("hoodie")
  ) {
    return {
      price: 2499,
      stock: 15,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* JACKETS */

  if (
    value.includes("jacket")
  ) {
    return {
      price: 2999,
      stock: 15,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* PANTS */

  if (
    value.includes("pant")
  ) {
    return {
      price: 2499,
      stock: 15,

      sizes: [
        "28",
        "30",
        "32",
        "34",
        "36",
      ],
    };
  }

  /* SHORTS */

  if (
    value.includes("short")
  ) {
    return {
      price: 1799,
      stock: 15,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* CO-ORD SETS */

  if (
    value.includes("co-ord") ||
    value.includes("coord")
  ) {
    return {
      price: 2999,
      stock: 15,

      sizes: [
        "S",
        "M",
        "L",
        "XL",
      ],
    };
  }

  /* DEFAULT */

  return {
    price: 1999,
    stock: 20,

    sizes: [
      "S",
      "M",
      "L",
      "XL",
    ],
  };
}

/* =========================================================
   ANALYZE ZIP PATH
========================================================= */

function analyzePath(zipPath) {
  let normalized =
    zipPath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

  let parts =
    normalized
      .split("/")
      .filter(Boolean);

  /*
    Remove root:

    Clothing/
  */

  if (
    parts.length > 0 &&
    parts[0]
      .toLowerCase()
      .trim() === "clothing"
  ) {
    parts =
      parts.slice(1);
  }

  const filename =
    parts[
      parts.length - 1
    ] || "";

  const folders =
    parts.slice(
      0,
      -1
    );

  let category =
    "Clothing";

  let productName =
    removeExtension(
      filename
    );

  /*
    Example:

    Hoodies/
      Core Zip Hoodie/
        image1.jpg
        image2.jpg
  */

  if (
    folders.length >= 2
  ) {
    category =
      folders[0];

    productName =
      folders[
        folders.length - 1
      ];
  }

  /*
    Example:

    Hoodies/
      Core Zip Hoodie.jpg
  */

  else if (
    folders.length === 1
  ) {
    category =
      folders[0];

    productName =
      removeExtension(
        filename
      )
        .replace(
          /\s*\(\d+\)$/i,
          ""
        )
        .replace(
          /\s+\d+$/i,
          ""
        );
  }

  return {
    category:
      titleCase(category),

    productName:
      titleCase(productName),
  };
}

/* =========================================================
   SCAN ZIP
========================================================= */

async function scanZip() {
  console.log("");
  console.log(
    "=============================="
  );
  console.log(
    "SCANNING CLOTHING ZIP"
  );
  console.log(
    "=============================="
  );

  if (
    !fs.existsSync(
      ZIP_PATH
    )
  ) {
    throw new Error(
      `Clothing.zip not found at:\n${ZIP_PATH}`
    );
  }

  const directory =
    await unzipper.Open.file(
      ZIP_PATH
    );

  console.log(
    `ZIP entries found: ${directory.files.length}`
  );

  const products =
    new Map();

  let imageCount = 0;

  let skippedTrackPantImages =
    0;

  for (
    const entry
    of directory.files
  ) {
    /*
      Ignore folders
    */

    if (
      entry.type !== "File"
    ) {
      continue;
    }

    const entryPath =
      entry.path;

    /*
      Ignore junk
    */

    if (
      isIgnoredFile(
        entryPath
      )
    ) {
      continue;
    }

    /*
      Images only
    */

    if (
      !isImage(
        entryPath
      )
    ) {
      continue;
    }

    imageCount++;

    /*
      Skip Track Pants
    */

    if (
      shouldSkip(
        entryPath
      )
    ) {
      skippedTrackPantImages++;

      console.log(
        `SKIP TRACK PANTS: ${entryPath}`
      );

      continue;
    }

    const {
      category,
      productName,
    } =
      analyzePath(
        entryPath
      );

    if (
      !productName
    ) {
      continue;
    }

    const key =
      `${category}|||${productName}`
        .toLowerCase();

    if (
      !products.has(
        key
      )
    ) {
      products.set(
        key,
        {
          name:
            productName,

          category,

          entries: [],
        }
      );
    }

    products
      .get(key)
      .entries
      .push(entry);
  }

  console.log("");
  console.log(
    "=============================="
  );
  console.log(
    "SCAN RESULT"
  );
  console.log(
    "=============================="
  );

  console.log(
    `Images found: ${imageCount}`
  );

  console.log(
    `Track Pant images skipped: ${skippedTrackPantImages}`
  );

  console.log(
    `Products detected: ${products.size}`
  );

  console.log("");

  for (
    const product
    of products.values()
  ) {
    console.log(
      `${normalizeCategory(
        product.category
      )} -> ${product.name} -> ${
        product.entries.length
      } images`
    );
  }

  console.log(
    "=============================="
  );

  return [
    ...products.values(),
  ];
}

/* =========================================================
   UPLOAD ONE IMAGE
========================================================= */

async function uploadImage(
  bucket,
  entry,
  productName,
  order
) {
  return new Promise(
    async (
      resolve,
      reject
    ) => {
      try {
        const originalName =
          path.basename(
            entry.path
          );

        const contentType =
          mime.lookup(
            originalName
          ) ||
          "application/octet-stream";

        const uniqueName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${originalName}`;

        const uploadStream =
          bucket.openUploadStream(
            uniqueName,
            {
              metadata: {
                productName,

                originalName,

                order,

                contentType,

                source:
                  "Clothing.zip",

                uploadedAt:
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
            const id =
              uploadStream.id
                .toString();

            resolve({
              /*
                Keep actual MongoDB ObjectId
              */
              fileId:
                uploadStream.id,

              /*
                String version for frontend
              */
              id,

              filename:
                uniqueName,

              originalName,

              contentType,

              url:
                `/api/images/${id}`,

              order,
            });
          }
        );

        const buffer =
          await entry.buffer();

        uploadStream.end(
          buffer
        );
      } catch (error) {
        reject(error);
      }
    }
  );
}

/* =========================================================
   MAIN IMPORT
========================================================= */

async function importClothing() {
  let client = null;

  try {
    console.log("");
    console.log(
      "=============================="
    );
    console.log(
      "AXEE CLOTHING IMPORTER"
    );
    console.log(
      "=============================="
    );

    /* =====================================================
       STEP 1 - SCAN ZIP
    ===================================================== */

    const products =
      await scanZip();

    if (
      !products.length
    ) {
      throw new Error(
        "No products detected inside Clothing.zip"
      );
    }

    /* =====================================================
       DRY RUN
    ===================================================== */

    if (DRY_RUN) {
      console.log("");
      console.log(
        "=============================="
      );
      console.log(
        "DRY RUN FINISHED"
      );
      console.log(
        "Nothing uploaded to MongoDB."
      );
      console.log(
        "=============================="
      );

      return;
    }

    /* =====================================================
       CHECK ENV
    ===================================================== */

    if (
      !process.env
        .MONGODB_URL
    ) {
      throw new Error(
        "MONGODB_URL missing from backend/.env"
      );
    }

    /* =====================================================
       CONNECT
    ===================================================== */

    console.log("");
    console.log(
      "Connecting to MongoDB..."
    );

    client =
      new MongoClient(
        process.env
          .MONGODB_URL
      );

    await client.connect();

    console.log(
      "MongoDB connected"
    );

    /* =====================================================
       DATABASE
    ===================================================== */

    const db =
      client.db(
        DB_NAME
      );

    console.log(
      `Database: ${DB_NAME}`
    );

    /* =====================================================
       PRODUCTS COLLECTION
    ===================================================== */

    const productCollection =
      db.collection(
        PRODUCT_COLLECTION
      );

    console.log(
      `Product collection: ${PRODUCT_COLLECTION}`
    );

    /* =====================================================
       GRIDFS
    ===================================================== */

    const bucket =
      new GridFSBucket(
        db,
        {
          bucketName:
            GRIDFS_BUCKET,
        }
      );

    console.log(
      `GridFS bucket: ${GRIDFS_BUCKET}`
    );

    /* =====================================================
       COUNTERS
    ===================================================== */

    let inserted = 0;

    let duplicates = 0;

    let uploadedImages = 0;

    let failed = 0;

    console.log("");
    console.log(
      "=============================="
    );
    console.log(
      "STARTING IMPORT"
    );
    console.log(
      "=============================="
    );

    /* =====================================================
       IMPORT PRODUCTS
    ===================================================== */

    for (
      const product
      of products
    ) {
      try {
        const category =
          normalizeCategory(
            product.category
          );

        console.log("");
        console.log(
          `Product: ${product.name}`
        );

        console.log(
          `Category: ${category}`
        );

        /* ================================================
           TRACK PANTS SAFETY
        ================================================= */

        if (
          shouldSkip(
            product.name
          ) ||
          shouldSkip(
            product.category
          )
        ) {
          console.log(
            "Track Pants skipped"
          );

          continue;
        }

        /* ================================================
           DUPLICATE CHECK
        ================================================= */

        if (
          SKIP_DUPLICATES
        ) {
          const existing =
            await productCollection
              .findOne(
                {
                  name: {
                    $regex:
                      `^${escapeRegex(
                        product.name
                      )}$`,

                    $options:
                      "i",
                  },
                }
              );

          if (
            existing
          ) {
            console.log(
              "Already exists - skipped"
            );

            duplicates++;

            continue;
          }
        }

        /* ================================================
           SORT IMAGES
        ================================================= */

        const sortedEntries =
          [
            ...product.entries,
          ].sort(
            (
              a,
              b
            ) =>
              path
                .basename(
                  a.path
                )
                .localeCompare(
                  path.basename(
                    b.path
                  ),
                  undefined,
                  {
                    numeric:
                      true,

                    sensitivity:
                      "base",
                  }
                )
          );

        /* ================================================
           UPLOAD IMAGES
        ================================================= */

        const imageFiles =
          [];

        for (
          let index = 0;
          index <
          sortedEntries.length;
          index++
        ) {
          const entry =
            sortedEntries[
              index
            ];

          console.log(
            `Uploading image ${
              index + 1
            }/${sortedEntries.length}`
          );

          const image =
            await uploadImage(
              bucket,
              entry,
              product.name,
              index
            );

          imageFiles.push(
            image
          );

          uploadedImages++;
        }

        /* ================================================
           DEFAULT PRODUCT VALUES
        ================================================= */

        const defaults =
          getDefaults(
            category
          );

        /* ================================================
           IMAGE URLs
        ================================================= */

        const imageUrls =
          imageFiles.map(
            (image) =>
              image.url
          );

        const firstImage =
          imageUrls[0] || "";

        /* ================================================
           PRODUCT DOCUMENT
        ================================================= */

        const document = {
          name:
            product.name,

          slug:
            createSlug(
              product.name
            ),

          category,

          brand:
            "UNBOUND",

          price:
            defaults.price,

          originalPrice:
            defaults.price,

          salePrice:
            defaults.price,

          stock:
            defaults.stock,

          sizes:
            defaults.sizes,

          colors:
            [],

          description:
            `${product.name} from the UNBOUND clothing collection.`,

          /*
            Same style used by your Track Pants products
          */

          image:
            firstImage,

          mainImage:
            firstImage,

          images:
            imageUrls,

          imageFiles,

          imageIds:
            imageFiles.map(
              (image) =>
                image.fileId
            ),

          isActive:
            true,

          active:
            true,

          featured:
            false,

          source:
            "clothing-zip",

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        };

        /* ================================================
           INSERT PRODUCT
        ================================================= */

        const result =
          await productCollection
            .insertOne(
              document
            );

        inserted++;

        console.log(
          `Product added: ${product.name}`
        );

        console.log(
          `MongoDB ID: ${result.insertedId}`
        );

        console.log(
          `Images: ${imageFiles.length}`
        );
      } catch (error) {
        failed++;

        console.error(
          `FAILED: ${product.name}`
        );

        console.error(
          error?.message ||
            error
        );
      }
    }

    /* =====================================================
       FINAL SUMMARY
    ===================================================== */

    console.log("");
    console.log(
      "=============================="
    );
    console.log(
      "IMPORT COMPLETE"
    );
    console.log(
      "=============================="
    );

    console.log(
      `Products added: ${inserted}`
    );

    console.log(
      `Duplicates skipped: ${duplicates}`
    );

    console.log(
      `Images uploaded: ${uploadedImages}`
    );

    console.log(
      `Failed: ${failed}`
    );

    console.log(
      "Track Pants were NOT imported."
    );

    console.log(
      `Database: ${DB_NAME}`
    );

    console.log(
      `Collection: ${PRODUCT_COLLECTION}`
    );

    console.log(
      `GridFS: ${GRIDFS_BUCKET}`
    );

    console.log(
      "=============================="
    );
  } catch (error) {
    console.error("");
    console.error(
      "=============================="
    );
    console.error(
      "IMPORT FAILED"
    );
    console.error(
      "=============================="
    );

    console.error(
      error?.message ||
        error
    );
  } finally {
    if (client) {
      try {
        await client.close();

        console.log(
          "MongoDB connection closed"
        );
      } catch (
        closeError
      ) {
        console.error(
          "Could not close MongoDB connection:",
          closeError?.message
        );
      }
    }
  }
}

/* =========================================================
   START
========================================================= */

importClothing();