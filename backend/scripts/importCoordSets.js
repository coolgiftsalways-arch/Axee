import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Product from "../models/Product.js";

dotenv.config();

/* =========================================================
   CONFIG
========================================================= */

const MONGO_URI =
  process.env.MONGODB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URL missing.");
  process.exit(1);
}

const SOURCE_ROOT = path.resolve(
  "imports",
  "coord-sets",
);

const HOSTINGER_OUTPUT = path.resolve(
  "imports",
  "coord-hostinger-images",
);

const CATEGORY = "CO ORD SETS";

const DEFAULT_PRICE = 1499;
const DEFAULT_OLD_PRICE = 1999;

/*
  FIRST RUN:
  true = preview only

  AFTER CHECKING:
  false = actually import to MongoDB
*/
const DRY_RUN = false;

/* =========================================================
   IMAGE SETTINGS
========================================================= */

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

const isImage = (filename = "") =>
  IMAGE_EXTENSIONS.has(
    path.extname(filename).toLowerCase(),
  );

/* =========================================================
   HELPERS
========================================================= */

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getImagesRecursive = (folder) => {
  const result = [];

  const walk = (dir) => {
    const entries = fs.readdirSync(
      dir,
      {
        withFileTypes: true,
      },
    );

    for (const entry of entries) {
      const fullPath = path.join(
        dir,
        entry.name,
      );

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        isImage(entry.name)
      ) {
        result.push(fullPath);
      }
    }
  };

  walk(folder);

  return result.sort((a, b) =>
    a.localeCompare(
      b,
      undefined,
      {
        numeric: true,
      },
    ),
  );
};

/* =========================================================
   FIND PRODUCT ROOT

   Supports:
   imports/coord-sets/product1
   or
   imports/coord-sets/29 co-ord sets/product1
========================================================= */

const findProductRoot = (
  startFolder,
) => {
  let current =
    startFolder;

  for (
    let depth = 0;
    depth < 5;
    depth += 1
  ) {
    const entries =
      fs
        .readdirSync(
          current,
          {
            withFileTypes: true,
          },
        )
        .filter(
          (entry) =>
            !entry.name.startsWith("."),
        );

    const directories =
      entries.filter(
        (entry) =>
          entry.isDirectory(),
      );

    const files =
      entries.filter(
        (entry) =>
          entry.isFile(),
      );

    if (
      directories.length > 1
    ) {
      return current;
    }

    if (
      directories.length === 1 &&
      files.length === 0
    ) {
      current = path.join(
        current,
        directories[0].name,
      );

      continue;
    }

    return current;
  }

  return current;
};

/* =========================================================
   PREPARE CLEAN HOSTINGER IMAGE NAMES
========================================================= */

const prepareImages = (
  productFolder,
  productNumber,
) => {
  const sourceImages =
    getImagesRecursive(
      productFolder,
    );

  const mongoImages = [];

  sourceImages.forEach(
    (
      sourceImage,
      index,
    ) => {
      const extension =
        path
          .extname(
            sourceImage,
          )
          .toLowerCase();

      const safeName =
        `coord-${String(
          productNumber,
        ).padStart(
          3,
          "0",
        )}-${String(
          index + 1,
        ).padStart(
          2,
          "0",
        )}${extension}`;

      const destination =
        path.join(
          HOSTINGER_OUTPUT,
          safeName,
        );

      if (!DRY_RUN) {
        fs.copyFileSync(
          sourceImage,
          destination,
        );
      }

      mongoImages.push(
        `/product-images/${safeName}`,
      );
    },
  );

  return {
    sourceImages,
    mongoImages,
  };
};

/* =========================================================
   DEFAULT PRODUCT OBJECT
========================================================= */

const buildProductData = (
  productName,
  images,
) => ({
  name: productName,

  slug: slugify(
    productName,
  ),

  category: CATEGORY,

  price: DEFAULT_PRICE,

  oldPrice:
    DEFAULT_OLD_PRICE,

  description:
    `${productName} by UNBOUND. Contemporary streetwear co-ord set designed for everyday style and comfort.`,

  images,

  color: "",

  fit: "",

  material: "",

  gender: "UNISEX",

  colors: [],

  sizes: [
    {
      size: "S",
      stock: 50,
    },
    {
      size: "M",
      stock: 50,
    },
    {
      size: "L",
      stock: 50,
    },
    {
      size: "XL",
      stock: 50,
    },
  ],

  rating: 4.5,

  reviews: 80,
});

/* =========================================================
   RUN
========================================================= */

const run = async () => {
  try {
    console.log(
      "==============================================",
    );

    console.log(
      "UNBOUND CO-ORD SET IMPORTER",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `Dry run: ${DRY_RUN}`,
    );

    console.log(
      `Source: ${SOURCE_ROOT}`,
    );

    if (
      !fs.existsSync(
        SOURCE_ROOT,
      )
    ) {
      throw new Error(
        `Source folder not found: ${SOURCE_ROOT}`,
      );
    }

    if (!DRY_RUN) {
      fs.mkdirSync(
        HOSTINGER_OUTPUT,
        {
          recursive: true,
        },
      );
    }

    const productRoot =
      findProductRoot(
        SOURCE_ROOT,
      );

    console.log(
      `Product root: ${productRoot}`,
    );

    const productFolders =
      fs
        .readdirSync(
          productRoot,
          {
            withFileTypes: true,
          },
        )
        .filter(
          (entry) =>
            entry.isDirectory() &&
            !entry.name.startsWith("."),
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              numeric: true,
            },
          ),
        );

    console.log(
      `📦 Product folders found: ${productFolders.length}`,
    );

    console.log("");

    await mongoose.connect(
      MONGO_URI,
    );

    console.log(
      "✅ MongoDB connected",
    );

    let added = 0;
    let updated = 0;
    let noImages = 0;

    let productNumber = 0;

    for (
      const folderEntry
      of productFolders
    ) {
      productNumber += 1;

      const productName =
        folderEntry.name.trim();

      const productFolder =
        path.join(
          productRoot,
          folderEntry.name,
        );

      const {
        sourceImages,
        mongoImages,
      } = prepareImages(
        productFolder,
        productNumber,
      );

      if (
        sourceImages.length === 0
      ) {
        console.log(
          `❌ NO IMAGES: ${productName}`,
        );

        noImages += 1;
        continue;
      }

      const slug =
        slugify(
          productName,
        );

      const existing =
        await Product.findOne({
          category: CATEGORY,
          $or: [
            {
              name: productName,
            },
            {
              slug,
            },
          ],
        });

      const productData =
        buildProductData(
          productName,
          mongoImages,
        );

      console.log(
        `${existing ? "♻️" : "✅"} ${productName}`,
      );

      console.log(
        `   Images: ${mongoImages.length}`,
      );

      console.log(
        `   Price: ₹${DEFAULT_PRICE}`,
      );

      console.log(
        `   Category: ${CATEGORY}`,
      );

      if (DRY_RUN) {
        if (existing) {
          updated += 1;
        } else {
          added += 1;
        }

        continue;
      }

      if (existing) {
        existing.images =
          productData.images;

        if (
          !existing.price
        ) {
          existing.price =
            DEFAULT_PRICE;
        }

        if (
          !existing.oldPrice
        ) {
          existing.oldPrice =
            DEFAULT_OLD_PRICE;
        }

        if (
          !existing.description
        ) {
          existing.description =
            productData.description;
        }

        if (
          !existing.sizes ||
          existing.sizes.length ===
            0
        ) {
          existing.sizes =
            productData.sizes;
        }

        await existing.save();

        updated += 1;
      } else {
        await Product.create(
          productData,
        );

        added += 1;
      }
    }

    console.log("");

    console.log(
      "==============================================",
    );

    console.log(
      "RESULT",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `Products detected: ${productFolders.length}`,
    );

    console.log(
      `${
        DRY_RUN
          ? "Would add"
          : "Added"
      }: ${added}`,
    );

    console.log(
      `${
        DRY_RUN
          ? "Would update"
          : "Updated"
      }: ${updated}`,
    );

    console.log(
      `No images: ${noImages}`,
    );

    console.log(
      "==============================================",
    );

    if (DRY_RUN) {
      console.log("");
      console.log(
        "⚠️ DRY RUN ONLY",
      );

      console.log(
        "MongoDB was NOT changed.",
      );

      console.log(
        "Images were NOT copied.",
      );

      console.log("");
      console.log(
        "If the result looks correct, change:",
      );

      console.log(
        "const DRY_RUN = true;",
      );

      console.log("to:");

      console.log(
        "const DRY_RUN = false;",
      );

      console.log(
        "and run again.",
      );
    } else {
      console.log("");
      console.log(
        "✅ MongoDB import complete.",
      );

      console.log(
        `✅ Hostinger images ready at: ${HOSTINGER_OUTPUT}`,
      );
    }
  } catch (error) {
    console.error(
      "❌ Import failed:",
      error,
    );
  } finally {
    if (
      mongoose.connection
        .readyState !== 0
    ) {
      await mongoose.disconnect();
    }

    process.exit(0);
  }
};

run();