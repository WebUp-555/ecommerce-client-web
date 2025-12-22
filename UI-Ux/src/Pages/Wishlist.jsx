import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../Api/catalogApi";
import { FaTrash, FaShoppingCart } from "react-icons/fa";
import { useCartStore } from "./cartStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

function buildImageUrl(product) {
  if (!product) return null;
  let raw = product.image;
  if (!raw && Array.isArray(product.images) && typeof product.images[0] === "string") {
    raw = product.images[0];
  }
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const clean = raw.startsWith("/") ? raw.slice(1) : raw;
  try {
    return new URL(clean, ORIGIN + "/").toString();
  } catch (_) {
    return ORIGIN + "/" + clean;
  }
}

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { addToCart } = useCartStore();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setWishlist(wishlist.filter(item => 
        (item.productId?._id || item.productId) !== productId
      ));
      setSuccessMessage("Removed from wishlist");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove from wishlist");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddToCart = async (item) => {
    const product = item.productId;
    if (!product) return;
    
    try {
      await addToCart(product, 1);
      setSuccessMessage("Added to cart");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to add to cart");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">My Wishlist</h1>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-600 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-900/50 border border-green-600 text-green-400 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="bg-zinc-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-xl mb-4">Your wishlist is empty</p>
            <button
              onClick={() => navigate("/products")}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const product = item.productId;
              if (!product) return null;
              
              const imageUrl = buildImageUrl(product);
              const productId = product._id || product;

              return (
                <div
                  key={item._id || productId}
                  className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(234,21,56,0.3)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <div
                    onClick={() => handleProductClick(productId)}
                    className="cursor-pointer"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name || "Product"}
                        className="w-full h-48 object-cover bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-zinc-900 text-gray-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      onClick={() => handleProductClick(productId)}
                      className="text-xl font-semibold text-white mb-2 cursor-pointer hover:text-red-400 transition"
                    >
                      {product.name}
                    </h3>
                    
                    {product.category && (
                      <p className="text-red-400 text-sm mb-2">
                        {product.category.name || product.category}
                      </p>
                    )}

                    <p className="text-2xl font-bold text-red-400 mb-4">
                      ₹{product.price?.toLocaleString()}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={product.stock < 1}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FaShoppingCart />
                        {product.stock < 1 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      
                      <button
                        onClick={() => handleRemove(productId)}
                        className="bg-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        aria-label="Remove from wishlist"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {item.addedAt && (
                      <p className="text-gray-500 text-xs mt-2">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
