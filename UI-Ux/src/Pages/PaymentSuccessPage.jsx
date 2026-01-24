import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../api/api';
import './PaymentSuccessPage.css';

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
        const data = await getOrderById(orderId);
        setOrder(data.order || data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

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
            <button onClick={() => navigate('/orders/my')} className="btn-primary">
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = order?.items || [];
  const createdAt = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';

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
                <span className={`status status-${order.status?.toLowerCase()}`}>
                  {order.status || 'Processing'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Order Date</span>
                <span className="value">{createdAt}</span>
              </div>
              <div className="info-item">
                <span className="label">Total Amount</span>
                <span className="value amount">₹{order.totalAmount || 0}</span>
              </div>
            </div>

            {/* Order Items */}
            {items.length > 0 && (
              <div className="order-items">
                <h3>Order Items</h3>
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <h4>{item.product?.name || item.name || 'Product'}</h4>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-amount">
                        ₹{(item.product?.price || item.price || 0) * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="additional-info">
              <div className="info-section">
                <h4>📧 Confirmation Email</h4>
                <p>A confirmation email has been sent to your registered email address.</p>
              </div>
              <div className="info-section">
                <h4>🚚 Delivery</h4>
                <p>You will receive shipping updates via email and SMS.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={() => navigate('/orders/my')}
                className="btn-primary"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="btn-secondary"
              >
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
