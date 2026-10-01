/* =========================================================
   UNBOUND API CONFIG
========================================================= */

const envApi = import.meta.env.VITE_API_URL?.trim() || "";

/*
  DEVELOPMENT
  ---------------------------------------------------------
  localhost:5173  -> localhost:5000
  192.168.x.x:5173 -> 192.168.x.x:5000

  PRODUCTION
  ---------------------------------------------------------
  Same domain, so API_BASE becomes "" and requests use:
  /api/cart
  /api/products
*/

const developmentApi = import.meta.env.DEV
  ? `http://${window.location.hostname}:5000`
  : "";

export const API_BASE = (envApi || developmentApi).replace(/\/+$/, "");

/* =========================================================
   BUILD API URL
========================================================= */

export function apiUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE}${cleanPath}`;
}

console.log("🌐 UNBOUND API:", API_BASE || "same-domain");
