import React from "react";

import { Edit3, Plus, Trash2 } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Coupons = () => {
  const coupons = [
    {
      id: 1,
      code: "AXIEE10",
      discount: "10%",
      expiry: "30 Sep 2026",
      status: "Active",
    },
    {
      id: 2,
      code: "WELCOME20",
      discount: "20%",
      expiry: "15 Oct 2026",
      status: "Active",
    },
    {
      id: 3,
      code: "FREESHIP",
      discount: "Free Shipping",
      expiry: "31 Oct 2026",
      status: "Active",
    },
    {
      id: 4,
      code: "SUMMER15",
      discount: "15%",
      expiry: "10 Nov 2026",
      status: "Active",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Coupons</h1>

          <p>Manage discount codes and offers.</p>
        </div>

        <button className="admin-primary-button">
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <strong>{coupon.code}</strong>
                  </td>

                  <td>{coupon.discount}</td>

                  <td>{coupon.expiry}</td>

                  <td>
                    <span className="admin-status admin-status-active">
                      {coupon.status}
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

export default Coupons;
