import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../Api/userApi';
import { FaBoxOpen, FaUserEdit, FaLock, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleChangePassword = () => {
    navigate('/change-password');
    setIsOpen(false);
  };

  const handleUpdateDetails = () => {
    navigate('/update-details');
    setIsOpen(false);
  };

  const handleMyOrders = () => {
    navigate('/orders/my');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // proceed to clear client state regardless
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Notify app that auth changed so UI updates immediately
      window.dispatchEvent(new CustomEvent('auth-ready', { detail: { token: null } }));
      navigate('/signin?logout=true');
      setIsOpen(false);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        className={`sidebar-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
        aria-label="Open account menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="account-icon"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="9" r="3" />
          <path d="M6.5 18.5c1.3-2 3.2-3 5.5-3s4.2 1 5.5 3" />
        </svg>
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={toggleSidebar}>
          ×
        </button>

        <div className="sidebar-content">
          <h2>Account Settings</h2>
          
          <ul className="sidebar-menu">
            <li onClick={handleMyOrders}>
              <span className="icon"><FaBoxOpen /></span>
              My Orders
            </li>
            <li onClick={handleUpdateDetails}>
              <span className="icon"><FaUserEdit /></span>
              Update Details
            </li>
            <li onClick={handleChangePassword}>
              <span className="icon"><FaLock /></span>
              Change Password
            </li>
            <li onClick={handleLogout} style={{ opacity: isLoggingOut ? 0.6 : 1, pointerEvents: isLoggingOut ? 'none' : 'auto' }}>
              <span className="icon"><FaSignOutAlt /></span>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </li>
          </ul>
        </div>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;
