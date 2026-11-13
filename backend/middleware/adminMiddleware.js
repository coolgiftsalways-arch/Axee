import { verifyAdminToken } from "../routes/adminAuthRoutes.js";

/* =========================================================
   REQUIRE ADMIN

   Protects admin-only API routes. The admin panel sends the
   token it got at login as:  Authorization: Bearer <token>
========================================================= */

export const requireAdmin = (req, res, next) => {
  try {
    const authorization = String(req.headers.authorization || "");

    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    const admin = verifyAdminToken(token);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin login required.",
      });
    }

    req.admin = admin;

    return next();
  } catch (error) {
    console.error("❌ ADMIN AUTH ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin authentication is not configured.",
    });
  }
};

export default requireAdmin;
