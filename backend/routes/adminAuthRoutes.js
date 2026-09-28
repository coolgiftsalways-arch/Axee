import express from "express";
import crypto from "node:crypto";

const router = express.Router();

/* =========================================================
   TOKEN SETTINGS

   12 HOURS
========================================================= */

const TOKEN_LIFETIME = 12 * 60 * 60 * 1000;

/* =========================================================
   BASE64 URL
========================================================= */

const encodeBase64Url = (value) => {
  return Buffer.from(value, "utf8").toString("base64url");
};

const decodeBase64Url = (value) => {
  return Buffer.from(value, "base64url").toString("utf8");
};

/* =========================================================
   SECRET
========================================================= */

const getTokenSecret = () => {
  const secret = String(process.env.ADMIN_TOKEN_SECRET || "").trim();

  if (!secret) {
    throw new Error("ADMIN_TOKEN_SECRET is missing in .env");
  }

  return secret;
};

/* =========================================================
   SIGNATURE
========================================================= */

const signPayload = (payload) => {
  return crypto
    .createHmac("sha256", getTokenSecret())
    .update(payload)
    .digest("base64url");
};

/* =========================================================
   SAFE COMPARE
========================================================= */

const safeCompare = (firstValue, secondValue) => {
  const first = Buffer.from(String(firstValue ?? ""));

  const second = Buffer.from(String(secondValue ?? ""));

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
};

/* =========================================================
   CREATE TOKEN
========================================================= */

const createAdminToken = (email) => {
  const now = Date.now();

  const tokenData = {
    role: "admin",

    email,

    issuedAt: now,

    expiresAt: now + TOKEN_LIFETIME,
  };

  const payload = encodeBase64Url(JSON.stringify(tokenData));

  const signature = signPayload(payload);

  return `${payload}.${signature}`;
};

/* =========================================================
   VERIFY TOKEN
========================================================= */

const verifyAdminToken = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  let decoded;

  try {
    decoded = JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }

  if (decoded?.role !== "admin") {
    return null;
  }

  if (!decoded?.expiresAt) {
    return null;
  }

  if (Date.now() > Number(decoded.expiresAt)) {
    return null;
  }

  return decoded;
};

/* =========================================================
   LOGIN

   POST /api/admin-auth/login
========================================================= */

router.post(
  "/login",

  async (req, res) => {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();

      const password = String(req.body?.password || "");

      /* ===============================================
         ENV CREDENTIALS
      =============================================== */

      const adminEmail = String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();

      const adminPassword = String(process.env.ADMIN_PASSWORD || "");

      /* ===============================================
         CONFIG CHECK
      =============================================== */

      if (!adminEmail || !adminPassword) {
        console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing from .env");

        return res.status(500).json({
          success: false,

          message: "Admin login is not configured.",
        });
      }

      /* ===============================================
         INPUT
      =============================================== */

      if (!email || !password) {
        return res.status(400).json({
          success: false,

          message: "Email and password are required.",
        });
      }

      /* ===============================================
         CHECK EMAIL + PASSWORD
      =============================================== */

      const validEmail = safeCompare(email, adminEmail);

      const validPassword = safeCompare(password, adminPassword);

      if (!validEmail || !validPassword) {
        return res.status(401).json({
          success: false,

          message: "Incorrect email or password.",
        });
      }

      /* ===============================================
         TOKEN
      =============================================== */

      const token = createAdminToken(adminEmail);

      return res.status(200).json({
        success: true,

        message: "Admin login successful.",

        token,

        admin: {
          email: adminEmail,

          role: "admin",
        },

        expiresAt: Date.now() + TOKEN_LIFETIME,
      });
    } catch (error) {
      console.error("❌ ADMIN LOGIN ERROR:", error);

      return res.status(500).json({
        success: false,

        message: "Admin login failed.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   VERIFY

   GET /api/admin-auth/verify
========================================================= */

router.get(
  "/verify",

  async (req, res) => {
    try {
      const authorization = String(req.headers.authorization || "");

      if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,

          message: "Admin token is missing.",
        });
      }

      const token = authorization.slice(7).trim();

      const admin = verifyAdminToken(token);

      if (!admin) {
        return res.status(401).json({
          success: false,

          message: "Admin session is invalid or expired.",
        });
      }

      return res.status(200).json({
        success: true,

        admin: {
          email: admin.email,

          role: admin.role,
        },

        expiresAt: admin.expiresAt,
      });
    } catch (error) {
      console.error("❌ ADMIN VERIFY ERROR:", error);

      return res.status(500).json({
        success: false,

        message: "Unable to verify admin login.",

        error: error.message,
      });
    }
  },
);

/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",

  (req, res) => {
    return res.status(200).json({
      success: true,

      message: "Admin logged out.",
    });
  },
);

/* =========================================================
   EXPORT
========================================================= */

export default router;
