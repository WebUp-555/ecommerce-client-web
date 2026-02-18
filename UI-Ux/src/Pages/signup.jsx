import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, verifyEmailCode, resendSignupCode } from "../Api/userApi.js";
import ErrorMessage from '../Components/ErrorMessage';
import SuccessMessage from '../Components/SuccessMessage';

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      navigate("/signin", { state: { success: "Account created and email verified successfully. Please sign in." } });
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 py-8 sm:py-12">
      <div className="w-full max-w-[470px] rounded-2xl border border-zinc-800/90 bg-zinc-900/85 p-8 sm:p-10 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        {step === 'form' ? (
          <>
            <div className="mb-8 text-center">
              <p className="mb-2 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">Create Account</p>
              <h1 className="text-3xl font-semibold tracking-tight">Sign Up</h1>
              <p className="mt-2 text-sm text-zinc-400">Join Japanee and start your premium shopping journey.</p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <ErrorMessage message={error} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/95 px-4 py-3.5 text-white placeholder-zinc-400 transition-colors focus:border-red-500 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/95 px-4 py-3.5 text-white placeholder-zinc-400 transition-colors focus:border-red-500 focus:outline-none"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/95 px-4 py-3.5 pr-12 text-white placeholder-zinc-400 transition-colors focus:border-red-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
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
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-lg bg-red-600 py-3.5 font-semibold transition-all hover:bg-red-700 hover:shadow-[0_10px_30px_rgba(220,38,38,0.35)] ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
            <p className="mt-8 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-400">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-white hover:underline">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="mb-2 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">Security Check</p>
              <h1 className="text-3xl font-semibold tracking-tight">Verify Email</h1>
            </div>
            {success && (
              <div className="mb-4">
                <SuccessMessage message={success} />
              </div>
            )}
            <p className="mb-6 text-center text-sm text-zinc-400">We sent a 4-digit code to {email}. Enter it below to verify.</p>
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/95 px-4 py-3.5 text-center tracking-[0.4em] text-white placeholder-zinc-400 transition-colors focus:border-red-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-lg bg-red-600 py-3.5 font-semibold transition-all hover:bg-red-700 hover:shadow-[0_10px_30px_rgba(220,38,38,0.35)] ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={handleResend} className="text-sm font-medium text-red-500 hover:text-red-400">Resend Code</button>
            </div>
          </>
        )}

        <p className="mt-7 border-t border-zinc-800 pt-5 text-center text-xs leading-5 text-zinc-500">
          This page is protected by Google reCAPTCHA to ensure you're not a bot.
        </p>
      </div>
    </div>
  );
};

export default SignUp;