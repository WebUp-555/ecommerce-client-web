import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../Api/userApi';
import ErrorMessage from '../Components/ErrorMessage';
import SuccessMessage from '../Components/SuccessMessage';

const SignIn = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if coming from logout
    const isLogout = searchParams.get('logout');
    
    if (isLogout === 'true') {
      console.log('Logout detected, clearing localStorage on main app');
      localStorage.clear();
      setSuccess('Logged out successfully.');
      // Remove the query parameter
      window.history.replaceState({}, '', '/signin');
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await loginUser(emailOrUsername, password);
      
      const userData = response.data.user;
      const accessToken = response.data.accessToken;
      
      // Only allow regular users to sign in here
      if (userData.role === 'admin') {
        setError('Admin accounts must sign in at the admin portal (http://localhost:5174/signin).');
        return;
      } else {
        // Only store for regular users
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Dispatch custom event to notify components that auth is ready
        window.dispatchEvent(new CustomEvent('auth-ready', { detail: { token: accessToken } }));

        setSuccess('Signed in successfully. Redirecting...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 900);
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      
      // If backend blocked admin login, give a friendlier message
      if (backendMessage.toLowerCase().includes('admin')) {
        setError('Admin accounts must use the admin portal at http://localhost:5174/signin.');
      } else {
      setError(backendMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8 text-white sm:py-12">
      <div className="w-full max-w-[470px] rounded-2xl border border-zinc-800/90 bg-zinc-900/85 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:p-10 md:p-12">
        <div className="mb-8 text-center">
          <p className="mb-2 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">Welcome Back</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sign In</h1>
          <p className="mt-2 text-sm text-zinc-400">Access your account to continue shopping premium picks.</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <SuccessMessage message={success} />
          <ErrorMessage message={error} />
          
          <input
            type="text"
            placeholder="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/95 px-4 py-3.5 text-white placeholder-zinc-400 transition-colors focus:border-red-500 focus:outline-none"
            required
          />
          <div className="relative">
            <input 
              placeholder="Password" 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-zinc-400">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            Remember me
          </label>
          <a href="#" className="hover:underline">Need help?</a>
        </div>

        <p className="mt-8 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-400">
          New to Japanee?{' '}
          <Link to="/signup" className="font-medium text-white hover:underline">
            Sign up now
          </Link>
        </p>

        <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
          This page is protected by Google reCAPTCHA to ensure you're not a bot.
        </p>

        <div className="mt-4 border-t border-zinc-800 pt-4 text-center">
          <Link to="/forgot-password" className="text-sm font-medium text-red-500 hover:text-red-400">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;