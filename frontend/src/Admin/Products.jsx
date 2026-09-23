import React from "react";

import { Edit3, Plus, Search, Trash2 } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Products = () => {
  const products = [
    {
      id: 1,
      name: "Oversized T-Shirt",
      category: "T-Shirts",
      price: "₹999",
      stock: 50,
      status: "Active",
    },
    {
      id: 2,
      name: "Cargo Jeans",
      category: "Jeans",
      price: "₹1,499",
      stock: 30,
      status: "Active",
    },
    {
      id: 3,
      name: "Classic Hoodie",
      category: "Hoodies",
      price: "₹1,999",
      stock: 20,
      status: "Active",
    },
    {
      id: 4,
      name: "Track Pants",
      category: "Track Pants",
      price: "₹1,299",
      stock: 40,
      status: "Active",
    },
    {
      id: 5,
      name: "Denim Jacket",
      category: "Jackets",
      price: "₹2,499",
      stock: 15,
      status: "Low Stock",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your product inventory.</p>
        </div>

        <button className="admin-primary-button">
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={17} />

            <input type="text" placeholder="Search products..." />
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-image">
                      {String(product.id).padStart(2, "0")}
                    </div>
                  </td>

                  <td>
                    <strong>{product.name}</strong>
                  </td>

                  <td>{product.category}</td>

                  <td>{product.price}</td>

                  <td>{product.stock}</td>

                  <td>
                    <span
                      className={
                        product.status === "Active"
                          ? "admin-status admin-status-active"
                          : "admin-status admin-status-pending"
                      }
                    >
                      {product.status}
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

export default Products;
