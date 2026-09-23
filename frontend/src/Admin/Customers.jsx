import React, { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import "../AdminCss/admin-pages.css";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customers = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "+91 98765 43210",
      orders: 5,
      spent: "₹12,499",
      status: "Active",
      joinedDate: "12 Aug 2026",
      joinedTime: "11:42 AM",

      address: {
        house: "Flat 402, Galaxy Heights",
        locality: "Andheri East",
        landmark: "Near Metro Station",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400069",
        country: "India",
      },

      orderHistory: [
        {
          id: "#AX1001",
          date: "21 Sep 2026",
          time: "07:42 PM",
          status: "Delivered",
          paymentMethod: "UPI",
          paymentStatus: "Paid",
          total: "₹3,497",

          items: [
            {
              id: 1,
              name: "Oversized Black T-Shirt",
              category: "T-Shirts",
              size: "L",
              color: "Black",
              quantity: 2,
              price: "₹999",
              total: "₹1,998",
            },
            {
              id: 2,
              name: "Cargo Jeans",
              category: "Jeans",
              size: "32",
              color: "Charcoal",
              quantity: 1,
              price: "₹1,499",
              total: "₹1,499",
            },
          ],
        },
        {
          id: "#AX0944",
          date: "10 Sep 2026",
          time: "03:18 PM",
          status: "Delivered",
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Paid",
          total: "₹1,999",

          items: [
            {
              id: 1,
              name: "Classic Hoodie",
              category: "Hoodies",
              size: "M",
              color: "Grey",
              quantity: 1,
              price: "₹1,999",
              total: "₹1,999",
            },
          ],
        },
      ],
    },

    {
      id: 2,
      name: "Priya Mehta",
      email: "priya@gmail.com",
      phone: "+91 98123 45678",
      orders: 3,
      spent: "₹4,299",
      status: "Active",
      joinedDate: "20 Aug 2026",
      joinedTime: "02:16 PM",

      address: {
        house: "B-203, Green Residency",
        locality: "Powai",
        landmark: "Near Hiranandani Gardens",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400076",
        country: "India",
      },

      orderHistory: [
        {
          id: "#AX1002",
          date: "21 Sep 2026",
          time: "06:18 PM",
          status: "Processing",
          paymentMethod: "Razorpay",
          paymentStatus: "Paid",
          total: "₹1,299",

          items: [
            {
              id: 1,
              name: "White Crop T-Shirt",
              category: "T-Shirts",
              size: "S",
              color: "White",
              quantity: 1,
              price: "₹1,299",
              total: "₹1,299",
            },
          ],
        },
      ],
    },

    {
      id: 3,
      name: "Arjun Verma",
      email: "arjun@gmail.com",
      phone: "+91 98989 11223",
      orders: 8,
      spent: "₹18,999",
      status: "Active",
      joinedDate: "05 Jul 2026",
      joinedTime: "09:35 AM",

      address: {
        house: "House 21, Shanti Nagar",
        locality: "Malad West",
        landmark: "Near Infinity Mall",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400064",
        country: "India",
      },

      orderHistory: [
        {
          id: "#AX1003",
          date: "20 Sep 2026",
          time: "10:35 PM",
          status: "Shipped",
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Pending",
          total: "₹2,499",

          items: [
            {
              id: 1,
              name: "Denim Jacket",
              category: "Jackets",
              size: "XL",
              color: "Blue",
              quantity: 1,
              price: "₹2,499",
              total: "₹2,499",
            },
          ],
        },
      ],
    },

    {
      id: 4,
      name: "Sneha Kapoor",
      email: "sneha@gmail.com",
      phone: "+91 97654 32109",
      orders: 2,
      spent: "₹3,499",
      status: "Active",
      joinedDate: "01 Sep 2026",
      joinedTime: "05:48 PM",

      address: {
        house: "Flat 702, Ocean View",
        locality: "Bandra West",
        landmark: "Near Linking Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
        country: "India",
      },

      orderHistory: [
        {
          id: "#AX1004",
          date: "20 Sep 2026",
          time: "01:24 PM",
          status: "Pending",
          paymentMethod: "UPI",
          paymentStatus: "Paid",
          total: "₹999",

          items: [
            {
              id: 1,
              name: "Track Pants",
              category: "Track Pants",
              size: "M",
              color: "Black",
              quantity: 1,
              price: "₹999",
              total: "₹999",
            },
          ],
        },
      ],
    },

    {
      id: 5,
      name: "Karan Singh",
      email: "karan@gmail.com",
      phone: "+91 99876 12345",
      orders: 6,
      spent: "₹9,999",
      status: "Active",
      joinedDate: "18 Jul 2026",
      joinedTime: "12:12 PM",

      address: {
        house: "302, Silver Apartments",
        locality: "Borivali West",
        landmark: "Near Station Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400092",
        country: "India",
      },

      orderHistory: [
        {
          id: "#AX1005",
          date: "19 Sep 2026",
          time: "08:05 PM",
          status: "Delivered",
          paymentMethod: "Razorpay",
          paymentStatus: "Paid",
          total: "₹1,499",

          items: [
            {
              id: 1,
              name: "Co-Ord Set",
              category: "Co-Ord Sets",
              size: "L",
              color: "Beige",
              quantity: 1,
              price: "₹1,499",
              total: "₹1,499",
            },
          ],
        },
      ],
    },
  ];

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value) ||
        customer.phone.toLowerCase().includes(value)
      );
    });
  }, [searchTerm]);

  const openCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const closeCustomer = () => {
    setSelectedCustomer(null);
  };

  useEffect(() => {
    if (selectedCustomer) {
      document.body.classList.add("admin-drawer-open");
    } else {
      document.body.classList.remove("admin-drawer-open");
    }

    return () => {
      document.body.classList.remove("admin-drawer-open");
    };
  }, [selectedCustomer]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeCustomer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const getOrderStatusClass = (status) => {
    return `admin-status admin-status-${status
      .toLowerCase()
      .replaceAll(" ", "-")}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p>View and manage your AXIEE customers.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="admin-customer-name">
                      <div className="admin-customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <strong>{customer.name}</strong>
                    </div>
                  </td>

                  <td>{customer.email}</td>

                  <td>{customer.orders}</td>

                  <td>
                    <strong>{customer.spent}</strong>
                  </td>

                  <td>
                    <span className="admin-status admin-status-active">
                      {customer.status}
                    </span>
                  </td>

                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-action-button"
                        title="View customer"
                        onClick={() => openCustomer(customer)}
                      >
                        <Eye size={16} />
                      </button>

                      <a
                        href={`mailto:${customer.email}`}
                        className="admin-action-button"
                        title="Email customer"
                      >
                        <Mail size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty-table">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        aria-label="Close customer details"
        className={`admin-customer-drawer-overlay ${
          selectedCustomer ? "admin-customer-drawer-overlay-show" : ""
        }`}
        onClick={closeCustomer}
      />

      <aside
        className={`admin-customer-drawer ${
          selectedCustomer ? "admin-customer-drawer-open" : ""
        }`}
      >
        {selectedCustomer && (
          <>
            <div className="admin-customer-drawer-header">
              <div>
                <span className="admin-customer-drawer-label">
                  CUSTOMER DETAILS
                </span>

                <h2>Customer Profile</h2>
              </div>

              <button
                type="button"
                className="admin-customer-drawer-close"
                onClick={closeCustomer}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-customer-drawer-body">
              <section className="admin-customer-profile-card">
                <div className="admin-customer-profile-avatar">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>

                <div className="admin-customer-profile-main">
                  <h3>{selectedCustomer.name}</h3>

                  <p>AXIEE Customer</p>

                  <span className="admin-status admin-status-active">
                    {selectedCustomer.status}
                  </span>
                </div>
              </section>

              <section className="admin-customer-stat-grid">
                <div className="admin-customer-stat-box">
                  <ShoppingBag size={19} />

                  <span>Total Orders</span>

                  <strong>{selectedCustomer.orders}</strong>
                </div>

                <div className="admin-customer-stat-box">
                  <CreditCard size={19} />

                  <span>Total Spent</span>

                  <strong>{selectedCustomer.spent}</strong>
                </div>
              </section>

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading">
                  <UserRound size={18} />
                  <h3>Customer Information</h3>
                </div>

                <div className="admin-customer-info-grid">
                  <div className="admin-customer-info-item">
                    <span>Full Name</span>
                    <strong>{selectedCustomer.name}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Customer ID</span>

                    <strong>
                      AXC
                      {String(selectedCustomer.id).padStart(4, "0")}
                    </strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Email</span>
                    <strong>{selectedCustomer.email}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Phone Number</span>
                    <strong>{selectedCustomer.phone}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Joined Date</span>
                    <strong>{selectedCustomer.joinedDate}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Joined Time</span>
                    <strong>{selectedCustomer.joinedTime}</strong>
                  </div>
                </div>

                <div className="admin-customer-contact-buttons">
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="admin-customer-contact-button"
                  >
                    <Phone size={16} />
                    Call Customer
                  </a>

                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="admin-customer-contact-button"
                  >
                    <Mail size={16} />
                    Send Email
                  </a>
                </div>
              </section>

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading">
                  <MapPin size={18} />
                  <h3>Address & Location</h3>
                </div>

                <div className="admin-customer-address-card">
                  <strong>{selectedCustomer.address.house}</strong>

                  <p>{selectedCustomer.address.locality}</p>

                  <p>Landmark: {selectedCustomer.address.landmark}</p>

                  <p>
                    {selectedCustomer.address.city},{" "}
                    {selectedCustomer.address.state} -{" "}
                    {selectedCustomer.address.pincode}
                  </p>

                  <p>{selectedCustomer.address.country}</p>
                </div>

                <div className="admin-customer-info-grid admin-customer-address-grid">
                  <div className="admin-customer-info-item">
                    <span>City</span>

                    <strong>{selectedCustomer.address.city}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>State</span>

                    <strong>{selectedCustomer.address.state}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>PIN Code</span>

                    <strong>{selectedCustomer.address.pincode}</strong>
                  </div>

                  <div className="admin-customer-info-item">
                    <span>Country</span>

                    <strong>{selectedCustomer.address.country}</strong>
                  </div>
                </div>
              </section>

              <section className="admin-customer-detail-section">
                <div className="admin-customer-section-heading admin-customer-orders-heading">
                  <div>
                    <Package size={18} />

                    <h3>Order History</h3>
                  </div>

                  <span>{selectedCustomer.orderHistory.length} shown</span>
                </div>

                <div className="admin-customer-order-list">
                  {selectedCustomer.orderHistory.map((order) => (
                    <article
                      className="admin-customer-order-card"
                      key={order.id}
                    >
                      <div className="admin-customer-order-top">
                        <div>
                          <span>ORDER ID</span>
                          <strong>{order.id}</strong>
                        </div>

                        <span className={getOrderStatusClass(order.status)}>
                          {order.status}
                        </span>
                      </div>

                      <div className="admin-customer-order-datetime">
                        <div>
                          <CalendarDays size={15} />
                          <span>{order.date}</span>
                        </div>

                        <div>
                          <Clock3 size={15} />
                          <span>{order.time}</span>
                        </div>
                      </div>

                      <div className="admin-customer-order-products">
                        {order.items.map((item) => (
                          <div
                            className="admin-customer-order-product"
                            key={item.id}
                          >
                            <div className="admin-customer-order-product-image">
                              <Package size={19} />
                            </div>

                            <div className="admin-customer-order-product-main">
                              <strong>{item.name}</strong>

                              <span>{item.category}</span>

                              <div className="admin-customer-order-variants">
                                <span>
                                  Size: <strong>{item.size}</strong>
                                </span>

                                <span>
                                  Color: <strong>{item.color}</strong>
                                </span>

                                <span>
                                  Qty: <strong>{item.quantity}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="admin-customer-order-product-price">
                              <span>{item.price} each</span>

                              <strong>{item.total}</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="admin-customer-order-meta-grid">
                        <div>
                          <span>Payment Method</span>
                          <strong>{order.paymentMethod}</strong>
                        </div>

                        <div>
                          <span>Payment Status</span>

                          <strong
                            className={
                              order.paymentStatus === "Paid"
                                ? "admin-order-paid-text"
                                : ""
                            }
                          >
                            {order.paymentStatus}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-customer-order-address">
                        <MapPin size={16} />

                        <div>
                          <span>Delivery Address</span>

                          <strong>
                            {selectedCustomer.address.house},{" "}
                            {selectedCustomer.address.locality},{" "}
                            {selectedCustomer.address.city},{" "}
                            {selectedCustomer.address.state} -{" "}
                            {selectedCustomer.address.pincode}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-customer-order-total">
                        <span>Order Total</span>

                        <strong>{order.total}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default Customers;
