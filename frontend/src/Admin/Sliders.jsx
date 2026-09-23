import React from "react";

import { Edit3, Plus, Trash2 } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Sliders = () => {
  const sliders = [
    {
      id: 1,
      title: "New Collection",
      subtitle: "Fall / Winter 2026",
      link: "/shop",
      status: "Active",
    },
    {
      id: 2,
      title: "Unbound",
      subtitle: "Explore the new AXIEE world",
      link: "/best-sellers",
      status: "Active",
    },
    {
      id: 3,
      title: "Street Essentials",
      subtitle: "Built for everyday movement",
      link: "/tshirts",
      status: "Active",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Sliders</h1>

          <p>Manage homepage hero sliders.</p>
        </div>

        <button className="admin-primary-button">
          <Plus size={18} />
          Add Slider
        </button>
      </div>

      <div className="admin-content-grid">
        {sliders.map((slider) => (
          <article className="admin-media-card" key={slider.id}>
            <div className="admin-slider-preview">
              <span>AXIEE</span>
            </div>

            <div className="admin-media-content">
              <div>
                <h3>{slider.title}</h3>
                <p>{slider.subtitle}</p>
              </div>

              <span className="admin-status admin-status-active">
                {slider.status}
              </span>
            </div>

            <div className="admin-media-footer">
              <span>{slider.link}</span>

              <div className="admin-table-actions">
                <button className="admin-action-button">
                  <Edit3 size={16} />
                </button>

                <button className="admin-action-button admin-delete-button">
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

export default Sliders;
