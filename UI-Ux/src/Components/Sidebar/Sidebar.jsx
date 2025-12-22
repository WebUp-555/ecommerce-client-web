import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../Api/userApi';
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
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <span className="hamburger-icon">☰</span>
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={toggleSidebar}>
          ×
        </button>

        <div className="sidebar-content">
          <h2>Account Settings</h2>
          
          <ul className="sidebar-menu">
            <li onClick={handleUpdateDetails}>
              <span className="icon">👤</span>
              Update Details
            </li>
            <li onClick={handleChangePassword}>
              <span className="icon">🔒</span>
              Change Password
            </li>
            <li onClick={handleLogout} style={{ opacity: isLoggingOut ? 0.6 : 1, pointerEvents: isLoggingOut ? 'none' : 'auto' }}>
              <span className="icon">🚪</span>
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
