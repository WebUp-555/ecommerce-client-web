import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/ProductStore';

export default function Products() {
  const navigate = useNavigate();
  const { products, fetchProducts, deleteProduct } = useProductStore();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    setDeleting(id);
    try {
      await deleteProduct(id);
      await loadProducts(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/updateproduct/${id}`);
  };

  const buildImageUrl = (product) => {
    const raw = product?.image || (Array.isArray(product?.images) ? product.images[0] : null);
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    return raw.startsWith('/') ? base + raw : base + '/' + raw;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-300">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <button
          onClick={() => navigate('/add-product')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          + Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by product name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:border-red-600 transition"
        />
      </div>

      {filteredProducts.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No products match your search</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No products found</p>
          <button
            onClick={() => navigate('/add-products')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const imageUrl = buildImageUrl(product);
            return (
              <div
                key={product._id}
                className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(234,21,56,0.4)] transition-all duration-300 hover:scale-105"
              >
                {/* Product Image */}
                <div className="h-48 bg-zinc-900 flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-gray-500 ${imageUrl ? 'hidden' : ''}`}>
                    No Image
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {product.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    {product.price && (
                      <span className="text-red-400 font-bold text-lg">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                    {product.stock !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stock > 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    )}
                  </div>

                  {product.category && (
                    <p className="text-xs text-gray-500 mb-3">
                      Category: {product.category.name || product.category}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product._id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      disabled={deleting === product._id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === product._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
