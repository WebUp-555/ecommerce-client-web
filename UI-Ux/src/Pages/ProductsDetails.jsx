import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, addToWishlist, removeFromWishlist, getWishlist } from "../Api/catalogApi";
import { useCartStore } from "./cartStore";
import { FaHeart, FaRegHeart } from "react-icons/fa";

// Build a stable origin (strip trailing /api/v1 if present)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

function buildImageUrl(product) {
  if (!product) return null;
  // Prefer single image field; fallback to first in images[] if it's a plain string
  let raw = product.image;
  if (!raw && Array.isArray(product.images) && typeof product.images[0] === "string") {
    raw = product.images[0];
  }
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // Already absolute (e.g. Cloudinary)
  // Normalize leading slash
  const clean = raw.startsWith("/") ? raw.slice(1) : raw;
  try {
    return new URL(clean, ORIGIN + "/").toString();
  } catch (_) {
    return ORIGIN + "/" + clean; // Fallback
  }
}

export default function ProductsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { addToCart, error: cartError, clearError } = useCartStore();

  useEffect(() => {
    (async () => {
      try {
        const p = await getProductById(id);
        if (!p) {
          setNotFound(true);
        }
        setProduct(p);
        
        // Check if product is in wishlist (with retry for fresh login)
        const token = localStorage.getItem('token');
        if (token && p) {
          const fetchWishlistWithRetry = async (retries = 2, delay = 500) => {
            for (let i = 0; i <= retries; i++) {
              try {
                const wishlist = await getWishlist();
                const inWishlist = wishlist.some(item => 
                  item.productId?._id === id || item.productId === id
                );
                setIsInWishlist(inWishlist);
                return; // Success, exit
              } catch (err) {
                // If unauthorized and we have retries left, wait and retry
                if (err.status === 401 && i < retries) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                } else if (i === retries) {
                  console.error('Failed to load wishlist after retries:', err);
                }
              }
            }
          };
          await fetchWishlistWithRetry();
        }
      } catch (e) {
        // Distinguish 404
        if (e.status === 404) setNotFound(true);
        setError(e?.response?.data?.message || e.message);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (cartError) {
      const timer = setTimeout(() => clearError(), 3000);
      return () => clearTimeout(timer);
    }
  }, [cartError, clearError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const imageUrl = useMemo(() => buildImageUrl(product), [product]);

  const handleAddToCart = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin?redirect=/products/' + id);
      return;
    }

    if (!product || product.stock < 1) return;

    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      setSuccessMessage("Product added to cart successfully!");
      setQuantity(1); // Reset quantity
    } catch (err) {
      // Error handled by store
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product?.stock || 0)) {
      setQuantity(newQty);
    }
  };

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin?redirect=/product/' + id);
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(id);
        setIsInWishlist(false);
        setSuccessMessage("Removed from wishlist");
      } else {
        await addToWishlist(id);
        setIsInWishlist(true);
        setSuccessMessage("Added to wishlist");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (error && !notFound) return <div className="p-6 text-red-500">{error}</div>;
  if (notFound) return <div className="p-6 text-white">Product not found.</div>;
  if (!product) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-900/50 border border-green-600 text-green-400 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Cart Error Message */}
        {cartError && (
          <div className="mb-4 bg-red-900/50 border border-red-600 text-red-400 px-4 py-3 rounded">
            {cartError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Image Section with Glow */}
          <div className="bg-zinc-800 rounded-2xl p-6 shadow-[0_0_30px_rgba(234,21,56,0.3)] hover:shadow-[0_0_40px_rgba(234,21,56,0.5)] transition-all duration-500 hover:scale-[1.02]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name || "Product image"}
                loading="lazy"
                className="w-full h-auto max-h-[500px] object-contain rounded-xl bg-zinc-900"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center rounded-xl bg-zinc-900 text-gray-400 text-sm">
                No image available
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="text-white space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {product.name}
                </h1>
                {product.category && (
                  <p className="text-red-400 text-sm mt-2 font-semibold tracking-wide">
                    {product.category.name || product.category}
                  </p>
                )}
              </div>
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="ml-4 p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-all duration-300 disabled:opacity-50"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isInWishlist ? (
                  <FaHeart className="text-red-500 text-2xl" />
                ) : (
                  <FaRegHeart className="text-gray-400 text-2xl hover:text-red-400" />
                )}
              </button>
            </div>

            {product.price && (
              <div className="bg-zinc-800 rounded-xl p-4 inline-block shadow-lg">
                <p className="text-3xl font-bold text-red-400">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-xl font-semibold mb-3 text-red-400">Description</h2>
              <p className="text-gray-300 leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>

            {product.stock !== undefined && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  product.stock > 0 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-300">Quantity:</span>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="bg-zinc-700 text-white px-3 py-1 rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 font-semibold">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="bg-zinc-700 text-white px-3 py-1 rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock < 1 || addingToCart}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(234,21,56,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {addingToCart ? 'Adding...' : product.stock < 1 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
