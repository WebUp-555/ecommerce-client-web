import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../utils/api.js';

export default function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin({ email, password });
      const token = res?.token;
      if (!token) {
        throw new Error('Login failed: token missing');
      }
      localStorage.setItem('token', token);
      // Minimal user payload for role checks in app
      localStorage.setItem('user', JSON.stringify({ role: 'admin', email }));
      // Notify app to re-evaluate admin state immediately
      window.dispatchEvent(new CustomEvent('admin-auth-ready', { detail: { token } }));
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Login failed';
      // Friendlier guidance for common cases
      if (msg.toLowerCase().includes('not an admin')) {
        setError('This account is not an admin. Use the user app to sign in.');
      } else if (msg.toLowerCase().includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center">Admin Sign In</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">Use your admin credentials to continue.</p>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-300">Email</label>
            <input
              type="email"
              className="w-full px-3 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <span className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-500">
          <a href="http://localhost:5173" className="hover:text-white">Back to main site</a>
        </div>
      </div>
    </div>
  );
}
