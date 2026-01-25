import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendForgotCode, resetPasswordWithCode } from "../Api/userApi.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=new password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (step === 1) {
      if (!formData.email) {
        setError("Email is required");
        return;
      }
      setLoading(true);
      try {
        await sendForgotCode(formData.email);
        setSuccess("We sent a 4-digit code to your email.");
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to send code");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!/^\d{4}$/.test(formData.code)) {
        setError("Please enter the 4-digit code");
        return;
      }
      setSuccess("Code verified. Please set a new password.");
      setStep(3);
    } else if (step === 3) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      setLoading(true);
      try {
        await resetPasswordWithCode(formData.email, formData.code.trim(), formData.newPassword);
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/signin"), 1500);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to reset password");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Reset Password</h2>

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
          {step === 1 && (
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your email"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-gray-300 mb-2">Enter 4-digit Code</label>
              <input
                type="tel"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/[^0-9]/g, '') })}
                required
                className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 tracking-widest text-center"
                placeholder="____"
              />
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 pr-12 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a3 3 0 004.24 4.24" />
                        <path d="M9.88 4.24A10.35 10.35 0 0121 12c-.8 1.46-1.97 2.73-3.36 3.68M6.61 6.61A10.34 10.34 0 003 12a10.34 10.34 0 003.95 4.9 10.12 10.12 0 005.07 1.4 10.25 10.25 0 004.48-1" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 pr-12 py-3 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a3 3 0 004.24 4.24" />
                        <path d="M9.88 4.24A10.35 10.35 0 0121 12c-.8 1.46-1.97 2.73-3.36 3.68M6.61 6.61A10.34 10.34 0 003 12a10.34 10.34 0 003.95 4.9 10.12 10.12 0 005.07 1.4 10.25 10.25 0 004.48-1" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? (step === 1 ? "Sending..." : step === 3 ? "Resetting..." : "...") : (step === 1 ? "Send Code" : step === 2 ? "Continue" : "Reset Password")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/signin")}
            className="text-red-500 hover:text-red-400 transition"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
