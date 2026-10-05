import React, { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================================================
   API
   Production:
   /api/... on same domain

   Local:
   Vite proxy sends /api to http://localhost:5000
========================================================= */

const API_BASE = "";

/* =========================================================
   TOKEN
========================================================= */

const TOKEN_KEY = "axiee_admin_token";

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     REMOVE PAGE SCROLL
  ======================================================= */

  useEffect(() => {
    const oldBodyOverflow = document.body.style.overflow;

    const oldHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldBodyOverflow;

      document.documentElement.style.overflow = oldHtmlOverflow;
    };
  }, []);

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Enter your admin email and password.");

      return;
    }

    try {
      setLoading(true);

      setError("");

      const loginURL = `${API_BASE}/api/admin-auth/login`;

      console.log("ADMIN LOGIN URL:", loginURL);

      const response = await fetch(loginURL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("ADMIN LOGIN JSON ERROR:", jsonError);

        throw new Error(
          `Server returned invalid response. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Login failed. Status: ${response.status}`,
        );
      }

      if (!data?.token) {
        throw new Error("Admin token was not returned by server.");
      }

      /* SAVE TOKEN */

      localStorage.setItem(TOKEN_KEY, data.token);

      /* REDIRECT */

      const requestedPath = location.state?.from?.pathname;

      const redirectTo =
        requestedPath === "/admin" || requestedPath === "/admin/dashboard"
          ? requestedPath
          : "/admin/dashboard";

      navigate(redirectTo, {
        replace: true,
      });
    } catch (loginError) {
      console.error("ADMIN LOGIN ERROR:", loginError);

      if (
        loginError instanceof TypeError &&
        loginError.message.toLowerCase().includes("fetch")
      ) {
        setError("Cannot connect to the server.");
      } else {
        setError(loginError?.message || "Incorrect email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="admin-login-page">
      {/* BACKGROUND */}

      <div className="admin-login-grid" />

      <div className="admin-login-glow admin-login-glow-one" />

      <div className="admin-login-glow admin-login-glow-two" />

      <div className="admin-login-background-text">UNBOUND</div>

      {/* CARD */}

      <section className="admin-login-card">
        {/* BRAND */}

        <div className="admin-login-brand">
          <div className="admin-login-logo">U</div>

          <div>
            <span>UNBOUND / CONTROL CENTER</span>

            <h1>ADMIN LOGIN</h1>
          </div>
        </div>

        {/* DESCRIPTION */}

        <p className="admin-login-description">
          Enter your administrator credentials to open the dashboard.
        </p>

        {/* SECURE */}

        <div className="admin-login-secure">
          <ShieldCheck size={15} />

          <span>SECURE ADMIN ACCESS</span>
        </div>

        {/* ERROR */}

        {error && <div className="admin-login-error">{error}</div>}

        {/* FORM */}

        <form onSubmit={handleSubmit} className="admin-login-form">
          {/* EMAIL */}

          <label className="admin-login-field">
            <span className="admin-login-label">EMAIL ADDRESS</span>

            <div className="admin-login-input-box">
              <Mail size={18} strokeWidth={1.7} />

              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </label>

          {/* PASSWORD */}

          <label className="admin-login-field">
            <span className="admin-login-label">PASSWORD</span>

            <div className="admin-login-input-box">
              <LockKeyhole size={18} strokeWidth={1.7} />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="admin-login-eye"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {/* BUTTON */}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "ENTER DASHBOARD"}
          </button>
        </form>

        {/* FOOTER */}

        <div className="admin-login-footer">
          <span>UNBOUND ADMIN</span>

          <span>CONTROL / 2026</span>
        </div>
      </section>

      <style>{`

        * {
          box-sizing: border-box;
        }

        .admin-login-page {
          position: fixed;
          inset: 0;

          width: 100%;
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          overflow: hidden;

          z-index: 999999;

          background: #070808;
          color: #ffffff;

          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
        }

        .admin-login-grid {
          position: absolute;
          inset: 0;

          background-image:
            linear-gradient(
              rgba(
                255,
                255,
                255,
                0.035
              ) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(
                255,
                255,
                255,
                0.035
              ) 1px,
              transparent 1px
            );

          background-size:
            55px 55px;

          pointer-events: none;
        }

        .admin-login-background-text {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(
              -50%,
              -50%
            );

          color:
            rgba(
              255,
              255,
              255,
              0.018
            );

          font-size:
            clamp(
              100px,
              20vw,
              330px
            );

          font-weight: 900;

          letter-spacing: -12px;

          white-space: nowrap;

          pointer-events: none;

          user-select: none;
        }

        .admin-login-glow {
          position: absolute;

          border-radius: 50%;

          filter:
            blur(120px);

          pointer-events: none;
        }

        .admin-login-glow-one {
          width: 320px;
          height: 320px;

          left: -130px;
          top: -120px;

          background:
            rgba(
              198,
              255,
              0,
              0.09
            );
        }

        .admin-login-glow-two {
          width: 320px;
          height: 320px;

          right: -130px;
          bottom: -120px;

          background:
            rgba(
              198,
              255,
              0,
              0.05
            );
        }

        .admin-login-card {
          position: relative;

          z-index: 10;

          width:
            min(
              470px,
              100%
            );

          padding: 36px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.11
            );

          border-radius: 18px;

          background:
            rgba(
              14,
              15,
              15,
              0.94
            );

          backdrop-filter:
            blur(24px);

          -webkit-backdrop-filter:
            blur(24px);

          box-shadow:
            0 40px 120px
            rgba(
              0,
              0,
              0,
              0.65
            );
        }

        .admin-login-brand {
          display: flex;

          align-items: center;

          gap: 16px;

          margin-bottom: 24px;
        }

        .admin-login-logo {
          width: 54px;
          height: 54px;

          display: flex;

          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 50%;

          background:
            #c6ff00;

          color:
            #080909;

          font-size: 23px;

          font-weight: 900;
        }

        .admin-login-brand span {
          display: block;

          margin-bottom: 5px;

          color:
            #c6ff00;

          font-size: 8px;

          font-weight: 800;

          letter-spacing: 2px;
        }

        .admin-login-brand h1 {
          margin: 0;

          font-size: 28px;

          line-height: 1;

          font-weight: 900;

          letter-spacing:
            -1.2px;
        }

        .admin-login-description {
          margin:
            0 0 18px;

          max-width: 370px;

          color:
            #8d9398;

          font-size: 12px;

          line-height: 1.7;
        }

        .admin-login-secure {
          display:
            inline-flex;

          align-items: center;

          gap: 7px;

          margin-bottom: 24px;

          color:
            #c6ff00;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            1.3px;
        }

        .admin-login-error {
          margin-bottom:
            18px;

          padding:
            12px 14px;

          border:
            1px solid
            rgba(
              255,
              80,
              80,
              0.28
            );

          border-radius:
            8px;

          background:
            rgba(
              255,
              80,
              80,
              0.08
            );

          color:
            #ff8585;

          font-size:
            11px;

          line-height:
            1.5;
        }

        .admin-login-form {
          width: 100%;
        }

        .admin-login-field {
          display: block;

          margin-bottom:
            18px;
        }

        .admin-login-label {
          display: block;

          margin-bottom:
            8px;

          color:
            #8d9398;

          font-size: 9px;

          font-weight: 800;

          letter-spacing:
            1.3px;
        }

        .admin-login-input-box {
          width: 100%;

          height: 53px;

          display: flex;

          align-items: center;

          gap: 11px;

          padding:
            0 14px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          border-radius:
            9px;

          background:
            #101212;

          color:
            #747a7f;

          transition:
            border-color
            0.2s ease;
        }

        .admin-login-input-box:focus-within {
          border-color:
            rgba(
              198,
              255,
              0,
              0.65
            );
        }

        .admin-login-input-box input {
          width: 100%;
          height: 100%;

          border: none;

          outline: none;

          background:
            transparent;

          color:
            #ffffff;

          font: inherit;

          font-size:
            13px;
        }

        .admin-login-input-box input::placeholder {
          color:
            #555b60;
        }

        .admin-login-eye {
          width: 32px;
          height: 32px;

          display: flex;

          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border: none;

          background:
            transparent;

          color:
            #747a7f;

          cursor:
            pointer;
        }

        .admin-login-eye:hover:not(:disabled) {
          color:
            #ffffff;
        }

        .admin-login-eye:disabled {
          opacity: 0.5;

          cursor:
            not-allowed;
        }

        .admin-login-submit {
          width: 100%;

          height: 54px;

          margin-top:
            5px;

          border: none;

          border-radius:
            9px;

          background:
            #c6ff00;

          color:
            #070808;

          font-size:
            10px;

          font-weight:
            900;

          letter-spacing:
            1.4px;

          cursor:
            pointer;

          transition:
            transform
            0.2s ease,
            opacity
            0.2s ease;
        }

        .admin-login-submit:hover:not(:disabled) {
          transform:
            translateY(-1px);
        }

        .admin-login-submit:disabled {
          opacity:
            0.55;

          cursor:
            wait;
        }

        .admin-login-footer {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 15px;

          margin-top:
            25px;

          padding-top:
            18px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          color:
            #50565a;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            1px;
        }

        @media (
          max-width: 520px
        ) {
          .admin-login-page {
            padding:
              14px;
          }

          .admin-login-card {
            padding:
              26px 20px;
          }

          .admin-login-brand h1 {
            font-size:
              24px;
          }

          .admin-login-background-text {
            letter-spacing:
              -6px;
          }
        }

      `}</style>
    </main>
  );
}

export default AdminLogin;
