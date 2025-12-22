import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../Api/userApi';
import ErrorMessage from '../Components/ErrorMessage';

const SignIn = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if coming from logout
    const isLogout = searchParams.get('logout');
    
    if (isLogout === 'true') {
      console.log('Logout detected, clearing localStorage on main app');
      localStorage.clear();
      // Remove the query parameter
      window.history.replaceState({}, '', '/signin');
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        
        navigate('/', { replace: true });
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
    <div className="flex items-center justify-center h-screen bg-black text-white px-4">
      <div className="bg-zinc-900 bg-opacity-80 p-12 md:p-16 rounded-md w-full max-w-[450px] shadow-xl">
        
        <h1 className="text-3xl font-bold mb-8 text-center text-white">Sign In</h1>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          
          <input
            type="text"
            placeholder="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            autoComplete="username"
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-400 focus:outline-none"
            required
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            Remember me
          </label>
          <a href="#" className="hover:underline">Need help?</a>
        </div>

        <p className="mt-8 text-sm text-center text-gray-400">
          New to Japanee?{' '}
          <Link to="/signup" className="text-white hover:underline">
            Sign up now
          </Link>
        </p>

        <p className="text-xs text-center text-gray-500 mt-4 leading-5">
          This page is protected by Google reCAPTCHA to ensure you're not a bot.
        </p>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-red-500 hover:text-red-400 text-sm">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;