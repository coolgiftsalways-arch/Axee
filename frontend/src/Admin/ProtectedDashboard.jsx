import React, { useCallback, useEffect, useState } from "react";

import { Navigate, useLocation } from "react-router-dom";

/* =========================================================
   API
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   TOKEN
========================================================= */

const TOKEN_KEY = "axiee_admin_token";

/* =========================================================
   PROTECTED DASHBOARD
========================================================= */

function ProtectedDashboard({ children }) {
  const location = useLocation();

  const [checking, setChecking] = useState(true);

  const [authenticated, setAuthenticated] = useState(false);

  /* =======================================================
     VERIFY
  ======================================================= */

  const verifyAdmin = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    /* NO TOKEN */

    if (!token) {
      setAuthenticated(false);

      setChecking(false);

      return;
    }

    try {
      setChecking(true);

      const response = await fetch(`${API_BASE}/api/admin-auth/verify`, {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept: "application/json",

          Authorization: `Bearer ${token}`,
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.message || "Invalid admin session.");
      }

      setAuthenticated(true);
    } catch (error) {
      console.warn("ADMIN VERIFY:", error?.message);

      localStorage.removeItem(TOKEN_KEY);

      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  /* =======================================================
     RUN
  ======================================================= */

  useEffect(() => {
    verifyAdmin();
  }, [verifyAdmin]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (checking) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          background: "#0b0c0c",

          color: "#ffffff",

          fontFamily: "Inter, Arial, sans-serif",

          fontSize: "10px",

          fontWeight: "800",

          letterSpacing: "2px",
        }}
      >
        CHECKING ADMIN SESSION...
      </div>
    );
  }

  /* =======================================================
     NOT LOGGED IN
  ======================================================= */

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /* =======================================================
     AUTHENTICATED
  ======================================================= */

  return children;
}

export default ProtectedDashboard;
