import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axiosInstance";

export default function UpdateDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: ""
  });
  const [initialEmail, setInitialEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showVerificationStep, setShowVerificationStep] = useState(false);
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

        const response = await api.get("/users/current-user");

        const userData = response.data?.data;
        setFormData({
          username: userData?.username || "",
          email: userData?.email || "",
          currentPassword: ""
        });
        setInitialEmail(userData?.email || "");
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

    const isEmailChanged = formData.email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
    if (isEmailChanged && !formData.currentPassword.trim()) {
      setError("Current password is required to change email");
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

      const payload = {
        username: formData.username,
        email: formData.email
      };

      if (isEmailChanged) {
        payload.currentPassword = formData.currentPassword;
      }

      const response = await api.put("/users/update-account", payload);

      if (response.data?.data?.requiresEmailVerification) {
        const pendingTarget = response.data?.data?.pendingEmail || formData.email;
        setPendingEmail(pendingTarget);
        setShowVerificationStep(true);
        setSuccess(response.data?.message || "Verification code sent to your new email.");
        return;
      }

      // Update localStorage with new user data
      const updatedUser = response.data?.data;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setInitialEmail(updatedUser?.email || "");
      }

      setFormData((prev) => ({ ...prev, currentPassword: "" }));

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

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{4}$/.test(verificationCode)) {
      setError("Please enter the 4-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/verify-email-update", {
        code: verificationCode.trim()
      });

      const updatedUser = response.data?.data;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setInitialEmail(updatedUser?.email || "");
        setFormData((prev) => ({ ...prev, email: updatedUser?.email || prev.email, currentPassword: "" }));
      }

      setShowVerificationStep(false);
      setPendingEmail("");
      setVerificationCode("");
      setSuccess("Email verified and account updated successfully! Redirecting...");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify email change");
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

          <div>
            <label className="block text-gray-300 mb-2">Current Password (required if changing email)</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter current password"
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

        {showVerificationStep && (
          <form onSubmit={handleVerifyEmailChange} className="space-y-4 mt-4 border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-300">
              Enter the 4-digit code sent to <span className="text-white font-medium">{pendingEmail}</span> to confirm your new email.
            </p>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 tracking-widest text-center"
              placeholder="____"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify New Email"}
            </button>
          </form>
        )}

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
