import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* =========================================================
   ENV
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

/* =========================================================
   REQUIRED ENV

   OLD_MONGODB_URL=old cluster connection string
   NEW_MONGODB_URL=new cluster connection string
========================================================= */

const OLD_MONGODB_URL =
  process.env.OLD_MONGODB_URL;

const NEW_MONGODB_URL =
  process.env.NEW_MONGODB_URL;

/* =========================================================
   SETTINGS
========================================================= */

const BATCH_SIZE = 500;

/* =========================================================
   COPY ONE COLLECTION
========================================================= */

async function copyCollection({
  sourceDb,
  targetDb,
  collectionName,
}) {
  console.log("");
  console.log(
    `📦 Copying collection: ${collectionName}`
  );

  const sourceCollection =
    sourceDb.collection(
      collectionName
    );

  const targetCollection =
    targetDb.collection(
      collectionName
    );

  const total =
    await sourceCollection.countDocuments();

  console.log(
    `   Documents: ${total}`
  );

  if (total === 0) {
    console.log(
      "   ℹ️ Empty collection"
    );
    return;
  }

  const cursor =
    sourceCollection.find({});

  let batch = [];
  let copied = 0;

  while (
    await cursor.hasNext()
  ) {
    const doc =
      await cursor.next();

    batch.push(doc);

    if (
      batch.length >=
      BATCH_SIZE
    ) {
      try {
        await targetCollection.insertMany(
          batch,
          {
            ordered: false,
          }
        );
      } catch (error) {
        /*
          If duplicates already exist, continue.
        */

        if (
          error?.code !== 11000 &&
          !error?.writeErrors
        ) {
          throw error;
        }
      }

      copied += batch.length;

      console.log(
        `   ✅ Copied ${copied}/${total}`
      );

      batch = [];
    }
  }

  /* =====================================================
     FINAL SMALL BATCH
  ===================================================== */

  if (
    batch.length > 0
  ) {
    try {
      await targetCollection.insertMany(
        batch,
        {
          ordered: false,
        }
      );
    } catch (error) {
      if (
        error?.code !== 11000 &&
        !error?.writeErrors
      ) {
        throw error;
      }
    }

    copied += batch.length;

    console.log(
      `   ✅ Copied ${copied}/${total}`
    );
  }

  /* =====================================================
     COPY INDEXES
  ===================================================== */

  try {
    const indexes =
      await sourceCollection.indexes();

    for (
      const index
      of indexes
    ) {
      if (
        index.name === "_id_"
      ) {
        continue;
      }

      try {
        await targetCollection.createIndex(
          index.key,
          {
            name:
              index.name,

            unique:
              index.unique ||
              false,

            sparse:
              index.sparse ||
              false,

            expireAfterSeconds:
              index.expireAfterSeconds,
          }
        );
      } catch (error) {
        console.log(
          `   ⚠️ Index skipped: ${index.name}`
        );
      }
    }
  } catch (error) {
    console.log(
      `   ⚠️ Could not copy indexes for ${collectionName}`
    );
  }

  console.log(
    `   ✅ Finished: ${collectionName}`
  );
}

/* =========================================================
   MAIN
========================================================= */

async function run() {
  let oldConnection;
  let newConnection;

  try {
    if (!OLD_MONGODB_URL) {
      throw new Error(
        "OLD_MONGODB_URL is missing from backend/.env"
      );
    }

    if (!NEW_MONGODB_URL) {
      throw new Error(
        "NEW_MONGODB_URL is missing from backend/.env"
      );
    }

    console.log("");
    console.log(
      "=============================================="
    );

    console.log(
      "        MONGODB DATABASE MIGRATION"
    );

    console.log(
      "=============================================="
    );

    /* =====================================================
       CONNECT OLD DATABASE
    ===================================================== */

    console.log("");
    console.log(
      "🔌 Connecting to OLD MongoDB..."
    );

    oldConnection =
      await mongoose
        .createConnection(
          OLD_MONGODB_URL
        )
        .asPromise();

    console.log(
      "✅ OLD MongoDB connected"
    );

    /* =====================================================
       CONNECT NEW DATABASE
    ===================================================== */

    console.log("");
    console.log(
      "🔌 Connecting to NEW MongoDB..."
    );

    newConnection =
      await mongoose
        .createConnection(
          NEW_MONGODB_URL
        )
        .asPromise();

    console.log(
      "✅ NEW MongoDB connected"
    );

    const sourceDb =
      oldConnection.db;

    const targetDb =
      newConnection.db;

    console.log("");
    console.log(
      `📁 OLD database: ${sourceDb.databaseName}`
    );

    console.log(
      `📁 NEW database: ${targetDb.databaseName}`
    );

    /* =====================================================
       GET COLLECTIONS
    ===================================================== */

    const collections =
      await sourceDb
        .listCollections()
        .toArray();

    const collectionNames =
      collections
        .map(
          (item) =>
            item.name
        )
        .filter(
          (name) =>
            !name.startsWith(
              "system."
            )
        );

    console.log("");
    console.log(
      `📦 Collections found: ${collectionNames.length}`
    );

    collectionNames.forEach(
      (name) => {
        console.log(
          `   - ${name}`
        );
      }
    );

    /* =====================================================
       COPY ALL COLLECTIONS
    ===================================================== */

    for (
      const collectionName
      of collectionNames
    ) {
      await copyCollection({
        sourceDb,
        targetDb,
        collectionName,
      });
    }

    /* =====================================================
       VERIFY COUNTS
    ===================================================== */

    console.log("");
    console.log(
      "=============================================="
    );

    console.log(
      "             VERIFYING"
    );

    console.log(
      "=============================================="
    );

    let mismatches = 0;

    for (
      const collectionName
      of collectionNames
    ) {
      const oldCount =
        await sourceDb
          .collection(
            collectionName
          )
          .countDocuments();

      const newCount =
        await targetDb
          .collection(
            collectionName
          )
          .countDocuments();

      const match =
        oldCount ===
        newCount;

      if (!match) {
        mismatches++;
      }

      console.log(
        `${match ? "✅" : "⚠️"} ${collectionName}: OLD=${oldCount} NEW=${newCount}`
      );
    }

    console.log("");
    console.log(
      "=============================================="
    );

    if (
      mismatches === 0
    ) {
      console.log(
        "✅ DATABASE MIGRATION COMPLETE"
      );
    } else {
      console.log(
        `⚠️ Migration completed with ${mismatches} count mismatch(es)`
      );
    }

    console.log(
      "=============================================="
    );

    await oldConnection.close();

    await newConnection.close();

    console.log("");
    console.log(
      "✅ Both MongoDB connections closed"
    );

    process.exit(
      mismatches === 0
        ? 0
        : 1
    );
  } catch (error) {
    console.error("");
    console.error(
      "❌ DATABASE MIGRATION FAILED"
    );

    console.error(
      error
    );

    try {
      if (
        oldConnection
      ) {
        await oldConnection.close();
      }
    } catch {}

    try {
      if (
        newConnection
      ) {
        await newConnection.close();
      }
    } catch {}

    process.exit(1);
  }
}

/* =========================================================
   RUN
========================================================= */

run();