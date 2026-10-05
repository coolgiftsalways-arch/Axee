import mongoose from "mongoose";
import dotenv from "dotenv";
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
  console.error("❌ MongoDB connection string missing.");
  process.exit(1);
}

/*
  FIRST RUN:
  true = PREVIEW ONLY

  AFTER CHECKING:
  false = actually update MongoDB
*/
const DRY_RUN = false;

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ");

const escapeRegex = (value = "") =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const hasWord = (
  text = "",
  keyword = "",
) => {
  const regex = new RegExp(
    `(^|[^a-z0-9])${escapeRegex(
      keyword.toLowerCase(),
    )}([^a-z0-9]|$)`,
    "i",
  );

  return regex.test(
    normalize(text),
  );
};

/* =========================================================
   COLOR DETECTION

   Uses whole-word matching.

   Example:
   "embroidered" will NOT match "red"
   "structured" will NOT match "red"
========================================================= */

const detectColor = (
  product,
) => {
  const name =
    normalize(product.name);

  /*
    More specific colors FIRST.
  */

  const colors = [
    ["navy blue", "Navy Blue"],
    ["light blue", "Light Blue"],
    ["dark blue", "Dark Blue"],
    ["sky blue", "Sky Blue"],
    ["washed blue", "Washed Blue"],

    ["light grey", "Light Grey"],
    ["light gray", "Light Grey"],
    ["dark grey", "Dark Grey"],
    ["dark gray", "Dark Grey"],

    ["dark green", "Dark Green"],
    ["light green", "Light Green"],
    ["forest green", "Forest Green"],
    ["olive green", "Olive Green"],

    ["dark brown", "Dark Brown"],
    ["light brown", "Light Brown"],

    ["off white", "Off White"],
    ["off-white", "Off White"],

    ["washed black", "Washed Black"],
    ["vintage black", "Vintage Black"],

    ["camo", "Camo Green"],
    ["camouflage", "Camo Green"],

    ["charcoal", "Charcoal"],
    ["burgundy", "Burgundy"],
    ["maroon", "Maroon"],
    ["khaki", "Khaki"],
    ["beige", "Beige"],
    ["cream", "Cream"],
    ["indigo", "Indigo"],
    ["olive", "Olive"],

    ["black", "Black"],
    ["white", "White"],
    ["grey", "Grey"],
    ["gray", "Grey"],
    ["navy", "Navy"],
    ["blue", "Blue"],
    ["brown", "Brown"],
    ["green", "Green"],
    ["red", "Red"],
    ["orange", "Orange"],
    ["yellow", "Yellow"],
    ["pink", "Pink"],
    ["purple", "Purple"],
  ];

  for (
    const [
      keyword,
      output,
    ] of colors
  ) {
    /*
      Multi-word values use normal contains check.
      Single words use boundary matching.
    */

    if (
      keyword.includes(" ")
    ) {
      if (
        name.includes(keyword)
      ) {
        return output;
      }
    } else if (
      hasWord(name, keyword)
    ) {
      return output;
    }
  }

  return "Assorted";
};

/* =========================================================
   FIT DETECTION
========================================================= */

const detectFit = (
  product,
) => {
  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  /*
    More specific fits first.
  */

  if (
    name.includes(
      "super baggy",
    )
  ) {
    return "Super Baggy Fit";
  }

  if (
    hasWord(
      name,
      "baggy",
    )
  ) {
    return "Baggy Fit";
  }

  if (
    name.includes(
      "oversized",
    ) ||
    name.includes(
      "oversize",
    )
  ) {
    return "Oversized Fit";
  }

  if (
    hasWord(
      name,
      "boxy",
    )
  ) {
    return "Boxy Fit";
  }

  if (
    name.includes(
      "relaxed fit",
    ) ||
    hasWord(
      name,
      "relaxed",
    )
  ) {
    return "Relaxed Fit";
  }

  if (
    name.includes(
      "regular fit",
    )
  ) {
    return "Regular Fit";
  }

  if (
    name.includes(
      "slim fit",
    ) ||
    hasWord(
      name,
      "slim",
    )
  ) {
    return "Slim Fit";
  }

  if (
    name.includes(
      "straight fit",
    ) ||
    name.includes(
      "straight-fit",
    ) ||
    name.includes(
      "straight leg",
    )
  ) {
    return "Straight Fit";
  }

  if (
    name.includes(
      "wide leg",
    )
  ) {
    return "Wide Leg";
  }

  if (
    name.includes(
      "loose fit",
    ) ||
    hasWord(
      name,
      "loose",
    )
  ) {
    return "Loose Fit";
  }

  if (
    hasWord(
      name,
      "cropped",
    )
  ) {
    return "Cropped Fit";
  }

  if (
    hasWord(
      name,
      "balloon",
    )
  ) {
    return "Balloon Fit";
  }

  /*
    Category defaults
  */

  if (
    category.includes(
      "track pant",
    ) ||
    category.includes(
      "trackpants",
    )
  ) {
    return "Regular Fit";
  }

  if (
    category === "pants"
  ) {
    return "Regular Fit";
  }

  if (
    category.includes(
      "hoodie",
    ) ||
    category.includes(
      "sweatshirt",
    )
  ) {
    return "Relaxed Fit";
  }

  if (
    category.includes(
      "jacket",
    )
  ) {
    return "Regular Fit";
  }

  if (
    category.includes(
      "shirt",
    )
  ) {
    return "Regular Fit";
  }

  if (
    category.includes(
      "t shirt",
    ) ||
    category.includes(
      "tshirt",
    ) ||
    category.includes(
      "tee",
    )
  ) {
    return "Regular Fit";
  }

  if (
    category.includes(
      "short",
    )
  ) {
    return "Regular Fit";
  }

  return "Regular Fit";
};

/* =========================================================
   MATERIAL DETECTION
========================================================= */

const detectMaterial = (
  product,
) => {
  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  /*
    Specific materials first
  */

  if (
    name.includes(
      "faux leather",
    ) ||
    hasWord(name, "pu")
  ) {
    return "Faux Leather";
  }

  if (
    hasWord(
      name,
      "leather",
    )
  ) {
    return "Leather";
  }

  if (
    hasWord(
      name,
      "suede",
    ) ||
    name.includes(
      "faux suede",
    )
  ) {
    return "Faux Suede";
  }

  if (
    hasWord(
      name,
      "denim",
    ) ||
    category.includes(
      "jeans",
    )
  ) {
    return "Denim";
  }

  if (
    hasWord(
      name,
      "fleece",
    )
  ) {
    return "Fleece";
  }

  if (
    hasWord(
      name,
      "linen",
    ) ||
    name.includes(
      "linen blend",
    )
  ) {
    return "Linen Blend";
  }

  if (
    hasWord(
      name,
      "corduroy",
    )
  ) {
    return "Corduroy";
  }

  if (
    hasWord(
      name,
      "nylon",
    )
  ) {
    return "Nylon";
  }

  if (
    hasWord(
      name,
      "polyester",
    )
  ) {
    return "Polyester";
  }

  if (
    hasWord(
      name,
      "crochet",
    )
  ) {
    return "Crochet Knit";
  }

  if (
    hasWord(
      name,
      "knitted",
    ) ||
    hasWord(
      name,
      "knit",
    )
  ) {
    return "Knitted Fabric";
  }

  if (
    hasWord(
      name,
      "cotton",
    )
  ) {
    return "Cotton";
  }

  if (
    hasWord(
      name,
      "satin",
    )
  ) {
    return "Satin";
  }

  if (
    category.includes(
      "t shirt",
    ) ||
    category.includes(
      "tshirt",
    ) ||
    category.includes(
      "tee",
    )
  ) {
    return "Cotton";
  }

  if (
    category.includes(
      "hoodie",
    ) ||
    category.includes(
      "sweatshirt",
    )
  ) {
    return "Cotton Blend";
  }

  if (
    category.includes(
      "track pant",
    ) ||
    category.includes(
      "trackpants",
    ) ||
    category === "pants"
  ) {
    return "Cotton Blend";
  }

  if (
    category.includes(
      "short",
    )
  ) {
    return "Cotton Blend";
  }

  if (
    category.includes(
      "shirt",
    )
  ) {
    return "Cotton Blend";
  }

  if (
    category.includes(
      "jacket",
    )
  ) {
    return "Polyester Blend";
  }

  return "Cotton Blend";
};

/* =========================================================
   GENDER DETECTION

   Fix:
   "Men Puffer Jacket" -> MEN
   "Men Regular Fit Track Pants" -> MEN
========================================================= */

const detectGender = (
  product,
) => {
  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  /*
    UNISEX explicitly stated
  */

  if (
    hasWord(
      name,
      "unisex",
    )
  ) {
    return "UNISEX";
  }

  /*
    WOMEN
  */

  if (
    hasWord(
      name,
      "women",
    ) ||
    hasWord(
      name,
      "woman",
    ) ||
    hasWord(
      name,
      "womens",
    ) ||
    name.includes(
      "women's",
    ) ||
    hasWord(
      name,
      "female",
    )
  ) {
    return "WOMEN";
  }

  /*
    MEN

    Handles:
    Men Jacket
    Men's Jacket
    Mens Jacket
    Man Jacket
  */

  if (
    hasWord(
      name,
      "men",
    ) ||
    hasWord(
      name,
      "mens",
    ) ||
    name.includes(
      "men's",
    ) ||
    hasWord(
      name,
      "man",
    ) ||
    hasWord(
      name,
      "male",
    )
  ) {
    return "MEN";
  }

  /*
    Category can sometimes carry gender
  */

  if (
    category.includes(
      "women",
    )
  ) {
    return "WOMEN";
  }

  if (
    category.includes(
      "men",
    )
  ) {
    return "MEN";
  }

  /*
    No clear gender information.
  */

  return "UNISEX";
};

/* =========================================================
   SAFE EXISTING VALUE
========================================================= */

const cleanExisting = (
  value,
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

/* =========================================================
   RUN
========================================================= */

const run = async () => {
  try {
    console.log(
      "==============================================",
    );

    console.log(
      "UNBOUND PRODUCT DETAILS FILLER V2",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `Dry run: ${DRY_RUN}`,
    );

    console.log("");

    await mongoose.connect(
      MONGO_URI,
    );

    console.log(
      "✅ MongoDB connected",
    );

    const products =
      await Product.find({});

    console.log(
      `📦 Products found: ${products.length}`,
    );

    let wouldUpdate = 0;
    let unchanged = 0;

    const stats = {
      MEN: 0,
      WOMEN: 0,
      UNISEX: 0,
    };

    for (
      const product
      of products
    ) {
      /*
        IMPORTANT:
        Existing values are preserved.
        We only automatically fill fields
        that are currently blank.
      */

      const currentColor =
        cleanExisting(
          product.color,
        );

      const currentFit =
        cleanExisting(
          product.fit,
        );

      const currentMaterial =
        cleanExisting(
          product.material,
        );

      const currentGender =
        cleanExisting(
          product.gender,
        );

      const detectedColor =
        detectColor(
          product,
        );

      const detectedFit =
        detectFit(
          product,
        );

      const detectedMaterial =
        detectMaterial(
          product,
        );

      const detectedGender =
        detectGender(
          product,
        );

      /*
        If the field is empty, fill it.

        For gender:
        Many schemas already default to UNISEX.
        We allow explicit MEN/WOMEN detection
        to correct that default.
      */

      const newColor =
        currentColor ||
        detectedColor;

      const newFit =
        currentFit ||
        detectedFit;

      const newMaterial =
        currentMaterial ||
        detectedMaterial;

      let newGender =
        currentGender;

      if (
        !currentGender
      ) {
        newGender =
          detectedGender;
      } else if (
        currentGender.toUpperCase() ===
          "UNISEX" &&
        detectedGender !==
          "UNISEX"
      ) {
        /*
          Correct automatic/default UNISEX
          when product name clearly says
          Men or Women.
        */

        newGender =
          detectedGender;
      }

      const genderKey =
        String(
          newGender ||
            "UNISEX",
        ).toUpperCase();

      if (
        stats[genderKey] !==
        undefined
      ) {
        stats[genderKey] += 1;
      }

      const same =
        currentColor ===
          newColor &&
        currentFit ===
          newFit &&
        currentMaterial ===
          newMaterial &&
        currentGender ===
          newGender;

      if (same) {
        console.log(
          `➖ SAME: ${product.name}`,
        );

        unchanged += 1;

        continue;
      }

      console.log("");

      console.log(
        `${
          DRY_RUN
            ? "🔎"
            : "✅"
        } ${product.name}`,
      );

      if (
        currentColor !==
        newColor
      ) {
        console.log(
          `   COLOR: ${currentColor || "—"} → ${newColor}`,
        );
      }

      if (
        currentFit !==
        newFit
      ) {
        console.log(
          `   FIT: ${currentFit || "—"} → ${newFit}`,
        );
      }

      if (
        currentMaterial !==
        newMaterial
      ) {
        console.log(
          `   MATERIAL: ${currentMaterial || "—"} → ${newMaterial}`,
        );
      }

      if (
        currentGender !==
        newGender
      ) {
        console.log(
          `   GENDER: ${currentGender || "—"} → ${newGender}`,
        );
      }

      if (!DRY_RUN) {
        product.color =
          newColor;

        product.fit =
          newFit;

        product.material =
          newMaterial;

        product.gender =
          newGender;

        await product.save();
      }

      wouldUpdate += 1;
    }

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      "GENDER COUNTS",
    );

    console.log(
      "==============================================",
    );

    console.log(
      `MEN: ${stats.MEN}`,
    );

    console.log(
      `WOMEN: ${stats.WOMEN}`,
    );

    console.log(
      `UNISEX: ${stats.UNISEX}`,
    );

    console.log("");
    console.log(
      "==============================================",
    );

    console.log(
      `Products: ${products.length}`,
    );

    console.log(
      `${
        DRY_RUN
          ? "Would update"
          : "Updated"
      }: ${wouldUpdate}`,
    );

    console.log(
      `Already correct: ${unchanged}`,
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

      console.log("");
      console.log(
        "Check COLOR / FIT / MATERIAL / GENDER.",
      );

      console.log("");
      console.log(
        "If correct, change:",
      );

      console.log(
        "const DRY_RUN = true;",
      );

      console.log(
        "to:",
      );

      console.log(
        "const DRY_RUN = false;",
      );

      console.log(
        "and run again.",
      );
    } else {
      console.log("");
      console.log(
        "✅ Product details updated successfully.",
      );
    }
  } catch (error) {
    console.error(
      "❌ Product details update failed:",
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