import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct, getAllCategories } from '../utils/api';

export default function AddProduct() {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image: null
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        setCategories(response?.categories || response?.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleImage = (e) => {
    setProduct({ ...product, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("category", product.category);
      formData.append("stock", product.stock || "10"); // Add stock field
      formData.append("image", product.image); // Backend expects 'image'

      // Debug: Log FormData contents
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const result = await addProduct(formData);
      console.log('Product added:', result);
      setSuccess(true);
      alert("✅ Product Added Successfully!");
      
      setProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        image: null
      });
      
      document.getElementById("imageInput").value = "";
      
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error ||
                       err.message || 
                       "Failed to add product";
      setError(errorMsg);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("⚠️ Session expired. Please login again!");
        navigate("/login");
      } else {
        alert("❌ " + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Add New Product</h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-3 rounded mb-4">
          Product added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-800 text-white"
        />
        
        <textarea
          name="description"
          placeholder="Description"
          value={product.description}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-800 text-white"
          rows="4"
        />
        
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={product.price}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-800 text-white"
        />
        
        <select
          name="category"
          value={product.category}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-800 text-white"
        >
          <option value="">Select Category</option>
          {Array.isArray(categories) && categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="stock"
          placeholder="Stock Quantity (optional)"
          value={product.stock}
          onChange={handleChange}
          className="p-2 rounded bg-gray-800 text-white"
        />
        
        <input
          id="imageInput"
          type="file"
          name="image"
          onChange={handleImage}
          accept="image/*"
          required
          className="p-2 rounded bg-gray-800 text-white"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 py-2 px-4 rounded hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

