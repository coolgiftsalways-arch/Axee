import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/globals.css";
import { installAdminFetch } from "./utils/adminFetch.js";

// Sends the admin login token with admin API calls.
installAdminFetch();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);