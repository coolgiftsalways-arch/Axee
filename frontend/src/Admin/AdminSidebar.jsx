import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers3,
  Users,
  TicketPercent,
  GalleryHorizontalEnd,
  Image,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import "../AdminCss/admin-sidebar.css";

const AdminSidebar = ({ sidebarOpen, closeSidebar }) => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: Package,
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: Layers3,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: Users,
    },
    {
      name: "Coupons",
      path: "/admin/coupons",
      icon: TicketPercent,
    },
    {
      name: "Sliders",
      path: "/admin/sliders",
      icon: GalleryHorizontalEnd,
    },
    {
      name: "Banners",
      path: "/admin/banners",
      icon: Image,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
    >
      <div className="admin-sidebar-header">
        <div>
          <h1>AXIEE</h1>
          <span>ADMIN PANEL</span>
        </div>

        <button className="admin-sidebar-close" onClick={closeSidebar}>
          <X size={21} />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "admin-nav-active" : ""}`
              }
            >
              <Icon size={19} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-logout-button">
          <LogOut size={19} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
