import React, { useState } from "react";

import { Eye, Search, SlidersHorizontal, Download } from "lucide-react";

import "../AdminCss/admin-pages.css";

const Orders = () => {
  const [activeFilter, setActiveFilter] = useState("All Orders");

  const filters = [
    "All Orders",
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

 const orders = [
   {
     id: "#AX1001",
     customer: "Rahul Sharma",
     date: "21 Sep 2026",
     time: "07:42 PM",
     amount: "₹2,499",
     payment: "Paid",
     status: "Delivered",
   },
   {
     id: "#AX1002",
     customer: "Priya Mehta",
     date: "21 Sep 2026",
     time: "06:18 PM",
     amount: "₹1,299",
     payment: "Paid",
     status: "Processing",
   },
   {
     id: "#AX1003",
     customer: "Arjun Verma",
     date: "20 Sep 2026",
     time: "10:35 PM",
     amount: "₹3,499",
     payment: "COD",
     status: "Shipped",
   },
 ];

  const filteredOrders =
    activeFilter === "All Orders"
      ? orders
      : orders.filter((order) => order.status === activeFilter);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage and track all customer orders.</p>
        </div>

        <button className="admin-secondary-button">
          <Download size={17} />
          Export
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={17} />

            <input type="text" placeholder="Search orders..." />
          </div>

          <button className="admin-secondary-button">
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </div>

        <div className="admin-filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={activeFilter === filter ? "admin-filter-active" : ""}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                  </td>

                  <td>{order.customer}</td>

                  <td>{order.date}</td>

                  <td>{order.payment}</td>

                  <td>
                    <strong>{order.amount}</strong>
                  </td>

                  <td>
                    <span
                      className={`admin-status admin-status-${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    <button className="admin-action-button">
                      <Eye size={17} />
                    </button>
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

export default Orders;
