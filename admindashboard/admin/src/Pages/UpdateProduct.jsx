import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/api.js';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product details (admin endpoint)
        const productRes = await api.get(`/admin/products/${id}`);
        const product = productRes.data?.product;
        
        if (product) {
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            stock: product.stock || '',
            category: product.category?._id || product.category || '',
          });
          
          // Set current image
          const raw = product.image;
          if (raw) {
            if (/^https?:\/\//i.test(raw)) {
              setCurrentImage(raw);
            } else {
              const base = API_BASE_URL.replace('/api/v1', '');
              setCurrentImage(raw.startsWith('/') ? base + raw : base + '/' + raw);
            }
          }
        }
        
        // Fetch categories (admin endpoint)
        const categoriesRes = await api.get(`/admin/categories`);
        setCategories(categoriesRes.data?.categories || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load product data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      submitData.append('category', formData.category);
      
      if (newImage) {
        submitData.append('image', newImage);
      }

      const response = await api.put(
        `/admin/updateproduct/${id}`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        alert('Product updated successfully!');
        navigate('/products');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="text-xl text-white">Loading product...</div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Edit Product</h1>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
          >
            ← Back to Products
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-zinc-800 rounded-xl p-6 shadow-lg">
          {/* Product Name */}
          <div className="mb-4">
            <label className="block text-white font-semibold mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-white font-semibold mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter product description"
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-white font-semibold mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Category</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              Product Image
            </label>
            
            {/* Current Image */}
            {(currentImage || imagePreview) && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">
                  {imagePreview ? 'New Image Preview:' : 'Current Image:'}
                </p>
                <div className="bg-zinc-700 rounded-lg p-4 inline-block">
                  <img
                    src={imagePreview || currentImage}
                    alt="Product"
                    className="max-w-xs max-h-64 object-contain rounded"
                  />
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
            />
            <p className="text-gray-400 text-sm mt-2">
              Leave empty to keep current image
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(234,21,56,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-zinc-700 text-white font-semibold rounded-xl hover:bg-zinc-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;