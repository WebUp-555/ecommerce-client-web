import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyOrderById } from "../api/api";
import "./PaymentSuccessPage.css";

function PaymentSuccessPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getMyOrderById(orderId);

        // Normalize payload shapes: {data:{order}}, {order}, or raw order
        const normalizedOrder = data?.data?.order || data?.order || data;
        setOrder(normalizedOrder);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err?.response?.data?.message || err.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="error-box">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/orders/my")} className="btn-primary">
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = order?.items || [];
  const orderDate = formatDate(
    order?.createdAt ||
    order?.orderDate ||
    order?.paymentDate ||
    order?.payment?.createdAt ||
    order?.payment?.created_at ||
    order?.paidAt ||
    order?.updatedAt ||
    order?.timestamp
  );

  const derivedAmount = (() => {
    // Prefer customer totals
    if (order?.totalAmount != null) return order.totalAmount;
    if (order?.amount != null) return order.amount;
    if (order?.total != null) return order.total;
    if (order?.price != null) return order.price;
    // Razorpay style
    if (order?.payment?.amount != null) return order.payment.amount;
    if (order?.payment?.amountDue != null) return order.payment.amountDue;
    if (order?.payment?.amount_paid != null) return order.payment.amount_paid;
    // Snapshot totals
    const itemsTotal = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    return itemsTotal || 0;
  })();

  const formattedAmount = derivedAmount != null
    ? derivedAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 })
    : "₹0";

  const shipping = order?.shippingAddress;

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p className="success-message">Your order has been confirmed</p>
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="order-card">
            <div className="order-info-grid">
              <div className="info-item">
                <span className="label">Order ID</span>
                <span className="value">{order._id || orderId}</span>
              </div>

              <div className="info-item">
                <span className="label">Status</span>
                <span className={`status status-${(order.status || "paid").toLowerCase()}`}>
                  {order.status || "paid"}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Order Date</span>
                <span className="value">{orderDate === 'Invalid Date' ? 'Not available' : orderDate}</span>
              </div>

              <div className="info-item">
                <span className="label">Total Amount</span>
                {/* Show best-effort total amount */}
                <span className="value amount">{formattedAmount}</span>
              </div>
              <div className="info-item">
                <span className="label">Transaction ID</span>
                <span className="value mono small">{order.razorpayPaymentId || order.paymentId || "Not available"}</span>
              </div>
            </div>

            {shipping && (
              <div className="order-items mt-6">
                <h3>Delivery Details</h3>
                <div className="items-list">
                  <div className="order-item">
                    <div className="item-info">
                      <h4>{shipping.name || "Recipient"}</h4>
                      <p>{shipping.phone || "Phone not provided"}</p>
                      <p>{shipping.address || "Address not provided"}</p>
                      <p>{[shipping.city, shipping.state].filter(Boolean).join(", ") || "Location not provided"}</p>
                      <p>{shipping.pincode ? `Pincode: ${shipping.pincode}` : "Pincode not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {items.length > 0 && (
              <div className="order-items">
                <h3>Order Items</h3>

                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={item._id || index} className="order-item">
                      <div className="item-info">
                        {/* ✅ FIXED: use item.title (snapshot) */}
                        <h4>{item.title || "Product"}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: ₹{item.price}</p>
                      </div>

                      <div className="item-amount">
                        ₹{(item.price || 0) * (item.quantity || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={() => navigate("/orders/my")} className="btn-primary">
                View My Orders
              </button>
              <button onClick={() => navigate("/products")} className="btn-secondary">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
