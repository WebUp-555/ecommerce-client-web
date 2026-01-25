import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyOrderById } from "../api/api";
import "./MyOrderDetailsPage.css";

function MyOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getMyOrderById(id);
        const payload = res?.data ? res.data : res;
        setOrder(payload?.order || null);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusLabel = (status) => status?.replace(/_/g, " ") || "pending payment";

  return (
    <div className="order-details-page">
      <div className="order-details-container">
        <div className="details-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <h1>Order Details</h1>
            <p>Track and view your order information</p>
          </div>
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        {loading && (
          <div className="loading-box">
            <div className="spinner" />
            <p>Loading order...</p>
          </div>
        )}

        {!loading && order && (
          <div className="order-layout">
            <section className="summary-card">
              <div className="summary-row">
                <span className="label">Order ID</span>
                <span className="value mono">#{order._id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="summary-row">
                <span className="label">Placed On</span>
                <span className="value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="summary-row">
                <span className="label">Status</span>
                <span className={`status-pill status-${order.status || "pending_payment"}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="summary-row">
                <span className="label">Total Paid</span>
                <span className="value amount">₹{order.amount || 0}</span>
              </div>
            </section>

            <section className="items-card">
              <div className="items-header">
                <h3>Items ({order.items?.length || 0})</h3>
              </div>
              <div className="items-list">
                {order.items?.map((item) => (
                  <div key={item.productId} className="item-row">
                    <div>
                      <p className="item-title">{item.title}</p>
                      <p className="item-meta">Qty: {item.quantity}</p>
                    </div>
                    <p className="item-price">₹{item.price}</p>
                  </div>
                ))}
                {!order.items?.length && <p className="item-empty">No items found.</p>}
              </div>
            </section>

            <section className="meta-card">
              <h3>Payment</h3>
              <div className="meta-grid">
                <div>
                  <p className="label">Transaction ID</p>
                  <p className="value mono small">
                    {order.razorpayPaymentId || order.paymentId || "Pending"}
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrderDetailsPage;
