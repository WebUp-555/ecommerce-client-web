import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, verifyEmailCode, resendSignupCode } from "../Api/userApi.js";
import ErrorMessage from '../Components/ErrorMessage';

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await registerUser({ username, email, password });
      setStep('code');
      setSuccess("Account created successfully! We've sent a 4-digit code to your email.");
    } catch (err) {
      console.log('Error caught in component:', err);
      console.log('Error response:', err.response);
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        'Failed to create account. Please try again.';
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await verifyEmailCode(email, code.trim());
      navigate("/signin");
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid or expired code. Please try again.';
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendSignupCode(email);
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.message || 'Failed to resend code';
      setError(backendMessage);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white px-4">
      <div className="bg-zinc-900 bg-opacity-80 p-12 md:p-16 rounded-md w-full max-w-[450px] shadow-xl">
        {step === 'form' ? (
          <>
            <h1 className="text-3xl font-bold mb-8 text-center">Sign Up</h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <ErrorMessage message={error} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-red-600 hover:bg-red-700 transition-colors py-3 rounded font-semibold ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
            <p className="mt-8 text-sm text-center text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="text-white hover:underline">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-8 text-center">Verify Email</h1>
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4 text-center">
                {success}
              </div>
            )}
            <p className="text-gray-400 text-sm mb-6 text-center">We sent a 4-digit code to {email}. Enter it below to verify.</p>
            <form className="space-y-6" onSubmit={handleVerify}>
              <ErrorMessage message={error} />
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                placeholder="4-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-400 focus:outline-none tracking-widest text-center"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-red-600 hover:bg-red-700 transition-colors py-3 rounded font-semibold ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={handleResend} className="text-red-500 hover:text-red-400 text-sm">Resend Code</button>
            </div>
          </>
        )}

        <p className="text-xs text-center text-gray-500 mt-6 leading-5">
          This page is protected by Google reCAPTCHA to ensure you're not a bot.
        </p>
      </div>
    </div>
  );
};

export default SignUp;