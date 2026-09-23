import React from "react";

import { Bell, Menu, Moon, Search, Sun, ChevronDown } from "lucide-react";

import "../AdminCss/admin-topbar.css";

const AdminTopbar = ({ toggleSidebar, darkMode, toggleTheme }) => {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button className="admin-menu-button" onClick={toggleSidebar}>
          <Menu size={22} />
        </button>

        <div className="admin-search">
          <Search size={18} />

          <input type="text" placeholder="Search here..." />
        </div>
      </div>

      <div className="admin-topbar-right">
        <button className="admin-icon-button" onClick={toggleTheme}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="admin-icon-button admin-notification-button">
          <Bell size={19} />

          <span className="admin-notification-dot">3</span>
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-profile-info">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>

          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
