import { useEffect } from 'react';
import { useCartStore } from './cartStore';
import { useNavigate, Link } from "react-router-dom";

export default function CartPage() {
  const cartItems = useCartStore((state) => state.cartItems);
  const loading = useCartStore((state) => state.loading);
  const error = useCartStore((state) => state.error);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const clearError = useCartStore((state) => state.clearError);

  const navigate = useNavigate();

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = +(subtotal * 0.05).toFixed(2);
  const discount = subtotal > 1000 ? 100 : 0;
  const total = subtotal + shipping + tax - discount;

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-red-600 text-3xl font-bold mb-6">🛒 Your Cart</h1>

      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-600 text-white px-4 py-3 rounded">
          {error}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-xl mb-4">Your cart is empty</p>
          <Link to="/products">
            <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded text-white">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Left: Cart Items */}
          <div className="flex-1 bg-zinc-900 p-6 rounded-lg overflow-y-auto max-h-[600px]">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-800 p-4 rounded-lg flex gap-4"
                >
                  <div className="w-36 h-36 bg-white border border-gray-200 overflow-hidden rounded-lg shadow flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain bg-zinc-100"
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{item.name}</h2>
                    <p className="text-sm text-gray-400">
                      Stock: {item.stock} available
                    </p>
                    <p className="text-red-500 font-semibold mt-1">
                      ₹{item.price} × {item.quantity}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        disabled={loading}
                        className="bg-zinc-700 text-white px-2 rounded text-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        disabled={loading || item.quantity >= item.stock}
                        className="bg-zinc-700 text-white px-2 rounded text-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    {item.quantity >= item.stock && (
                      <p className="text-yellow-500 text-xs mt-1">Max stock reached</p>
                    )}

                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={loading}
                      className="mt-2 text-sm text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="flex-1 bg-zinc-900 p-6 rounded-lg h-fit">
            <h3 className="text-xl font-semibold mb-4 text-white">Order Summary</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Shipping: ₹{shipping}</p>
              <p>Tax (5%): ₹{tax}</p>
              <p>Discount: -₹{discount}</p>
              <hr className="my-2 border-gray-600" />
              <p className="text-lg text-white font-bold">Total: ₹{total.toFixed(2)}</p>
            </div>

            <Link to="/payment">
              <button
                disabled={loading}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
