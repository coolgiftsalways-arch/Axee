/* =========================================================
   ADMIN FETCH

   The backend now requires the admin login token on admin
   API routes. Instead of editing every admin page, this adds
   "Authorization: Bearer <token>" to every /api request made
   while the admin panel is open.

   If the session has expired, the admin is sent back to the
   login page.
========================================================= */

export const ADMIN_TOKEN_KEY = "axiee_admin_token";

const isAdminPage = () => window.location.pathname.startsWith("/admin");

const readToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const isApiUrl = (input) => {
  try {
    const raw = typeof input === "string" ? input : input?.url || String(input);
    const url = new URL(raw, window.location.origin);

    return url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/admin-auth/login");
  } catch {
    return false;
  }
};

export function installAdminFetch() {
  if (typeof window === "undefined" || window.__axieeAdminFetchInstalled) {
    return;
  }

  window.__axieeAdminFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const token = readToken();

    if (!token || !isAdminPage() || !isApiUrl(input)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init.headers || (input instanceof Request ? input.headers : undefined),
    );

    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await originalFetch(input, { ...init, headers });

    if (response.status === 401 && !window.location.pathname.startsWith("/admin/login")) {
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        /* ignore */
      }

      window.location.assign("/admin/login");
    }

    return response;
  };
}

export default installAdminFetch;
