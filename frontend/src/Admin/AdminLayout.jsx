import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

import "../AdminCss/admin-layout.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("axiee-admin-theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("axiee-admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className={`admin-layout ${darkMode ? "admin-dark-mode" : ""}`}>
      <AdminSidebar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <div className="admin-main">
        <AdminTopbar
          toggleSidebar={toggleSidebar}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
