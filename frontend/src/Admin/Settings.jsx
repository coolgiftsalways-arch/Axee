import React, { useState } from "react";

import "../AdminCss/admin-pages.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("General");

  const tabs = ["General", "Store Info", "Payment", "Email", "Social Media"];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Settings</h1>

          <p>Manage your store configuration.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "admin-settings-tab-active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "General" && (
          <div className="admin-settings-section">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Store Name</label>

                <input type="text" defaultValue="AXIEE" />
              </div>

              <div className="admin-form-group">
                <label>Store Email</label>

                <input type="email" defaultValue="admin@axiee.com" />
              </div>

              <div className="admin-form-group">
                <label>Store Phone</label>

                <input type="text" defaultValue="+91 98765 43210" />
              </div>

              <div className="admin-form-group">
                <label>Currency</label>

                <select defaultValue="INR">
                  <option value="INR">INR - Indian Rupee</option>

                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              <div className="admin-form-group admin-form-full">
                <label>Store Address</label>

                <textarea rows="4" defaultValue="Mumbai, Maharashtra, India" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Store Info" && (
          <div className="admin-settings-section">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Business Name</label>
                <input defaultValue="AXIEE Fashion" />
              </div>

              <div className="admin-form-group">
                <label>GST Number</label>
                <input placeholder="Enter GST number" />
              </div>

              <div className="admin-form-group admin-form-full">
                <label>About Store</label>

                <textarea rows="5" placeholder="Write about AXIEE..." />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Payment" && (
          <div className="admin-settings-section">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Razorpay Key ID</label>
                <input placeholder="rzp_live_xxxxx" />
              </div>

              <div className="admin-form-group">
                <label>Razorpay Secret</label>
                <input type="password" placeholder="••••••••••••" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Email" && (
          <div className="admin-settings-section">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>SMTP Email</label>
                <input type="email" />
              </div>

              <div className="admin-form-group">
                <label>SMTP Password</label>
                <input type="password" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Social Media" && (
          <div className="admin-settings-section">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Instagram</label>
                <input placeholder="Instagram URL" />
              </div>

              <div className="admin-form-group">
                <label>YouTube</label>
                <input placeholder="YouTube URL" />
              </div>

              <div className="admin-form-group">
                <label>Facebook</label>
                <input placeholder="Facebook URL" />
              </div>
            </div>
          </div>
        )}

        <div className="admin-settings-save">
          <button className="admin-primary-button">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
