import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "./cartStore";
import { payNow, verifyPayment } from "../api/api";
import loadRazorpayScript from "../utils/loadRazorpay";
import "./CheckoutPage.css";

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = useCartStore((state) => state.cartItems);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);

  useEffect(() => {
    const fromState = location.state?.shippingAddress;
    const fromStorage = sessionStorage.getItem("shippingAddress");
    const parsedStorage = fromStorage ? JSON.parse(fromStorage) : null;
    setShippingAddress(fromState || parsedStorage || null);
  }, [location.state]);

  const handlePayment = async () => {
    // Ensure shipping address is present (from state or session)
    let shippingToSend = shippingAddress;
    if (!shippingToSend) {
      const stored = sessionStorage.getItem("shippingAddress");
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed) {
        shippingToSend = parsed;
        setShippingAddress(parsed);
      } else {
        setError("Shipping address is required. Please add delivery details.");
        navigate("/payment");
        return;
      }
    }

    // Validate required fields before calling backend
    const requiredFields = ["name", "phone", "address", "pincode", "city", "state"];
    const missing = requiredFields.filter((key) => !shippingToSend?.[key]?.toString().trim());
    if (missing.length) {
      setError("Shipping address is required. Please add delivery details.");
      navigate("/payment");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay. Please try again.");
      }

      // ✅ Create order on backend (amount comes from backend)
      const orderData = await payNow(shippingToSend);
      const { orderId, razorpayOrderId, amount, currency, key } = orderData;

      if (!window.Razorpay) {
        throw new Error("Razorpay is not available");
      }

      const options = {
        key,
        amount,
        currency,
        name: "Japanee E-commerce",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,

        handler: async (response) => {
          try {
            // ✅ Verify payment on backend
            const verifyData = {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            await verifyPayment(verifyData);

            // ✅ Clear cart and navigate
            clearCart();
            navigate(`/orders/success/${orderId}`);
          } catch (err) {
            setError(err?.response?.data?.message || err.message || "Payment verification failed");
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled");
          },
        },

        // ✅ No contact prefill (prevents showing old number on shared laptop)
        prefill: {
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
        },

        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);

      // ✅ handle failed payments
      rzp.on("payment.failed", function () {
        setLoading(false);
        setError("Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err?.response?.data?.message || err.message || "An error occurred during payment");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
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
              <button onClick={() => navigate("/products")} className="btn-continue-shopping">
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
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

              {/* ✅ Show only actual cart total (backend will charge this) */}
              <div className="price-breakdown">
                <div className="price-row total">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button onClick={handlePayment} disabled={loading} className="btn-pay-now">
                {loading ? "Processing..." : `Pay Now (₹${totalAmount})`}
              </button>
            </>
          )}
        </div>

        <div className="payment-info">
          <h3>💳 Payment Details</h3>
          <div className="info-box">
            <p>
              <strong>Payment Gateway:</strong> Razorpay
            </p>
            <p>
              <strong>Security:</strong> PCI DSS Certified
            </p>
            <p>
              <strong>Accepted Methods:</strong> Cards, UPI, Wallets, Netbanking
            </p>
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
