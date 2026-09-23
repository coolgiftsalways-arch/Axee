import React from "react";

import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../AdminCss/dashboard.css";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Orders",
      value: "1,248",
      change: "+12%",
      icon: ShoppingBag,
    },
    {
      title: "Total Products",
      value: "356",
      change: "+8%",
      icon: Package,
    },
    {
      title: "Total Customers",
      value: "892",
      change: "+15%",
      icon: Users,
    },
    {
      title: "Total Revenue",
      value: "₹4,52,300",
      change: "+18%",
      icon: IndianRupee,
    },
  ];

  const salesData = [
    { month: "Jan", sales: 14000 },
    { month: "Feb", sales: 21000 },
    { month: "Mar", sales: 18500 },
    { month: "Apr", sales: 27000 },
    { month: "May", sales: 42000 },
    { month: "Jun", sales: 35000 },
    { month: "Jul", sales: 31000 },
    { month: "Aug", sales: 45000 },
    { month: "Sep", sales: 42000 },
    { month: "Oct", sales: 58000 },
    { month: "Nov", sales: 47000 },
    { month: "Dec", sales: 64000 },
  ];

  const recentOrders = [
    {
      id: "#AX1001",
      customer: "Rahul Sharma",
      date: "21 Sep 2026",
      amount: "₹2,499",
      status: "Delivered",
    },
    {
      id: "#AX1002",
      customer: "Priya Mehta",
      date: "21 Sep 2026",
      amount: "₹1,299",
      status: "Processing",
    },
    {
      id: "#AX1003",
      customer: "Arjun Verma",
      date: "20 Sep 2026",
      amount: "₹3,499",
      status: "Shipped",
    },
    {
      id: "#AX1004",
      customer: "Sneha Kapoor",
      date: "20 Sep 2026",
      amount: "₹999",
      status: "Pending",
    },
    {
      id: "#AX1005",
      customer: "Karan Singh",
      date: "19 Sep 2026",
      amount: "₹1,499",
      status: "Delivered",
    },
  ];

  const getStatusClass = (status) => {
    return `admin-status admin-status-${status.toLowerCase()}`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading-row">
        <div>
          <h1>Dashboard</h1>

          <p>Welcome back. Here's what's happening with your AXIEE store.</p>
        </div>

        <button className="dashboard-date-button">
          <CalendarDays size={17} />

          <span>September 21, 2026</span>
        </button>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="dashboard-stat-card" key={stat.title}>
              <div className="dashboard-stat-icon">
                <Icon size={23} />
              </div>

              <div className="dashboard-stat-content">
                <p>{stat.title}</p>

                <div className="dashboard-stat-value-row">
                  <h2>{stat.value}</h2>

                  <span>
                    <TrendingUp size={14} />
                    {stat.change}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-middle-grid">
        <section className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Sales Overview</h2>
              <p>Store revenue performance</p>
            </div>

            <select>
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
            </select>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.32} />

                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" vertical={false} />

                <XAxis dataKey="month" tickLine={false} axisLine={false} />

                <YAxis tickLine={false} axisLine={false} />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#111827"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest customer orders</p>
            </div>

            <button className="dashboard-view-all">
              View All
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="dashboard-recent-orders">
            {recentOrders.map((order) => (
              <div className="dashboard-order-row" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <span>{order.customer}</span>
                </div>

                <div className="dashboard-order-date">{order.date}</div>

                <strong>{order.amount}</strong>

                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Top Products</h2>
              <p>Best performing products</p>
            </div>
          </div>

          <div className="dashboard-product-list">
            <div className="dashboard-product-item">
              <div className="dashboard-product-placeholder">01</div>

              <div>
                <strong>Oversized T-Shirt</strong>
                <span>124 sold</span>
              </div>

              <strong>₹1,999</strong>
            </div>

            <div className="dashboard-product-item">
              <div className="dashboard-product-placeholder">02</div>

              <div>
                <strong>Cargo Jeans</strong>
                <span>98 sold</span>
              </div>

              <strong>₹2,499</strong>
            </div>

            <div className="dashboard-product-item">
              <div className="dashboard-product-placeholder">03</div>

              <div>
                <strong>Classic Hoodie</strong>
                <span>83 sold</span>
              </div>

              <strong>₹2,999</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Store Performance</h2>
              <p>This month's performance</p>
            </div>
          </div>

          <div className="dashboard-performance">
            <div>
              <span>Conversion Rate</span>
              <strong>8.4%</strong>
            </div>

            <div>
              <span>Average Order</span>
              <strong>₹2,140</strong>
            </div>

            <div>
              <span>Returning Customers</span>
              <strong>34%</strong>
            </div>

            <div>
              <span>Products Sold</span>
              <strong>2,847</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
