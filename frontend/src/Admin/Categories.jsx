import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Categories = () => {
  const categories = [
    {
      id: 1,
      name: "T-Shirts",
      products: 45,
      status: "Active",
    },
    {
      id: 2,
      name: "Shirts",
      products: 38,
      status: "Active",
    },
    {
      id: 3,
      name: "Hoodies",
      products: 22,
      status: "Active",
    },
    {
      id: 4,
      name: "Jeans",
      products: 28,
      status: "Active",
    },
    {
      id: 5,
      name: "Track Pants",
      products: 18,
      status: "Active",
    },
    {
      id: 6,
      name: "Shorts",
      products: 12,
      status: "Active",
    },
    {
      id: 7,
      name: "Jackets",
      products: 16,
      status: "Active",
    },
    {
      id: 8,
      name: "Co-Ord Sets",
      products: 10,
      status: "Active",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p>Manage your product categories.</p>
        </div>

        <button className="admin-primary-button">
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>

                  <td>{category.products}</td>

                  <td>
                    <span className="admin-status admin-status-active">
                      {category.status}
                    </span>
                  </td>

                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-button">
                        <Edit3 size={16} />
                      </button>

                      <button className="admin-action-button admin-delete-button">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;
