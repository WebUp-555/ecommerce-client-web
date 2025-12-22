import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCategory } from "../utils/api";

export default function AddCategory() {
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        alert("⚠️ Please login first!");
        navigate("/login");
        return;
      }

      const response = await addCategory({ name: categoryName });

      console.log("Category added:", response);
      setSuccess(true);
      alert("✅ Category Added Successfully!");
      setCategoryName("");
      
    } catch (err) {
      console.error("Error adding category:", err);
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error ||
                       err.message || 
                       "Failed to add category";
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
      <h2 className="text-2xl font-bold mb-4 text-white">Add New Category</h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-3 rounded mb-4">
          Category added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Category Name (e.g., T-Shirt, Hoodie)"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
          className="p-2 rounded bg-gray-800 text-white"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 py-2 px-4 rounded hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
        >
          {loading ? "Adding..." : "Add Category"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-800 rounded">
        <h3 className="text-lg font-semibold text-white mb-2">Common Categories:</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• T-Shirt</li>
          <li>• Hoodie</li>
          <li>• Jacket</li>
          <li>• Sweatshirt</li>
          <li>• Polo Shirt</li>
        </ul>
      </div>
    </div>
  );
}