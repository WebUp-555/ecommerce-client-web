import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from './cartStore';
import { payNow, verifyPayment } from '../api/api';
import loadRazorpayScript from '../utils/loadRazorpay';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.cartItems);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate subtotal and tax
  const subtotal = totalAmount;
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const grandTotal = subtotal + tax;

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please try again.');
      }

      // Step 2: Create order on backend
      const orderData = await payNow();
      const { orderId, razorpayOrderId, amount, currency, key } = orderData;

      if (!window.Razorpay) {
        throw new Error('Razorpay is not available');
      }

      // Step 3: Open Razorpay modal
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Japanee E-commerce',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            setLoading(true);
            // Step 4: Verify payment on backend
            const verifyData = {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyResponse = await verifyPayment(verifyData);

            // Step 5: Clear cart and navigate to success
            clearCart();
            navigate(`/orders/success/${orderId}`);
          } catch (err) {
            setError(err.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Cart Summary */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>
          
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button 
                onClick={() => navigate('/products')}
                className="btn-continue-shopping"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="checkout-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-quantity">Qty: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      <p className="unit-price">₹{item.price}</p>
                      <p className="subtotal">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="price-row">
                  <span>GST (18%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="price-row total">
                  <span>Total Amount</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || cartItems.length === 0}
                className="btn-pay-now"
              >
                {loading ? 'Processing...' : `Pay Now (₹${grandTotal})`}
              </button>
            </>
          )}
        </div>

        {/* Payment Info Section */}
        <div className="payment-info">
          <h3>💳 Payment Details</h3>
          <div className="info-box">
            <p><strong>Payment Gateway:</strong> Razorpay</p>
            <p><strong>Security:</strong> PCI DSS Certified</p>
            <p><strong>Accepted Methods:</strong> Cards, UPI, Wallets, Netbanking</p>
          </div>
          <div className="info-box">
            <h4>🔒 Safe & Secure</h4>
            <ul>
              <li>No card details stored on our server</li>
              <li>End-to-end encrypted transactions</li>
              <li>Instant payment confirmation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
