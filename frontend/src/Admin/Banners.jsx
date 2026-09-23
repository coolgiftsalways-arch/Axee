import React from "react";

import { Edit3, Plus, Trash2 } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Banners = () => {
  const banners = [
    {
      id: 1,
      title: "Summer Collection",
      location: "Home Page",
      link: "/shop",
      status: "Active",
    },
    {
      id: 2,
      title: "Flat 50% Off",
      location: "Shop Page",
      link: "/best-sellers",
      status: "Active",
    },
    {
      id: 3,
      title: "Premium Essentials",
      location: "Home Page",
      link: "/tshirts",
      status: "Active",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Banners</h1>

          <p>Manage promotional banners for your AXIEE store.</p>
        </div>

        <button className="admin-primary-button">
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      <div className="admin-content-grid">
        {banners.map((banner) => (
          <article className="admin-media-card" key={banner.id}>
            <div className="admin-banner-preview">
              <span>{banner.title}</span>
            </div>

            <div className="admin-media-content">
              <div>
                <h3>{banner.title}</h3>

                <p>{banner.location}</p>
              </div>

              <span className="admin-status admin-status-active">
                {banner.status}
              </span>
            </div>

            <div className="admin-media-footer">
              <span>{banner.link}</span>

              <div className="admin-table-actions">
                <button className="admin-action-button" title="Edit banner">
                  <Edit3 size={16} />
                </button>

                <button
                  className="admin-action-button admin-delete-button"
                  title="Delete banner"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Banners;
