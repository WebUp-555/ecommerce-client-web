import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UpdateDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Load current user data
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          navigate("/signin");
          return;
        }

        const response = await axios.get(
          "http://localhost:8000/api/v1/users/current-user",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const userData = response.data?.data;
        setFormData({
          username: userData?.username || "",
          email: userData?.email || ""
        });
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError("Failed to load user data");
      }
    };

    loadUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username.trim() || !formData.email.trim()) {
      setError("Username and email are required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Please login first");
        navigate("/signin");
        return;
      }

      const response = await axios.put(
        "http://localhost:8000/api/v1/users/update-account",
        {
          username: formData.username,
          email: formData.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update localStorage with new user data
      const updatedUser = response.data?.data;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setSuccess("Account details updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update account details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Update Account Details
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Details"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-red-500 hover:text-red-400 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
