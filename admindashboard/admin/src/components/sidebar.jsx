import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminLogout } from '../utils/api.js';

const Sidebar = () => {
  const location = useLocation();

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to logout?')) return;

    try {
      await adminLogout();
    } catch (err) {
      // Even if API fails, proceed to clear and redirect
      console.error('Admin logout API failed:', err?.response?.data || err.message);
    } finally {
      localStorage.clear();
      window.location.replace('/signin'); // stay within admin app on port 5174
    }
  };

  const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/products', label: 'Products' },
    { path: '/banners', label: 'Banners' },
    { path: '/add-product', label: 'Add Product' },
    { path: '/add-category', label: 'Add Category' }, // <-- Add this line
    { path: '/users', label: 'Users'},
    { path: '/orders', label: 'Orders' },
  
  ];

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Japanee Admin
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          id="sidebar-logout-btn"
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
