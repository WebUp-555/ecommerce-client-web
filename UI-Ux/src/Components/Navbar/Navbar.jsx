import React, { useState, useEffect } from "react";
import { FaSignInAlt, FaHeart } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";

import "./Navbar.css";

const Navbar = () => {
  // Categories removed from navbar per request.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      setIsLoggedIn(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    window.location.href = "/signin";
  };

  return (
    <nav className="navbar bg-zinc-900">
      <div className="logo-container">
        <Link to="/" aria-label="Go to home">
          <button className="logo-btn">
            <img
              src="/logoo.png"
              alt="Japanee Logo"
              className="logo-image"
            />
          </button>
        </Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/" className={isActive("/") ? "active" : ""}>Home</Link></li>
        <li><Link to="/products" className={isActive("/products") ? "active" : ""}>Products</Link></li>
        <li><a href="/#about" onClick={(e) => handleSmoothScroll(e, 'about')}>About</a></li>
        <li><a href="/#services" onClick={(e) => handleSmoothScroll(e, 'services')}>Service</a></li>
        <li><a href="/#contact" onClick={(e) => handleSmoothScroll(e, 'contact')}>Contact Us</a></li>
        {isLoggedIn && (
          <li>
            <Link to="/wishlist" aria-label="View wishlist" className="wishlist-link">
              <FaHeart className="wishlist-icon" />
            </Link>
          </li>
        )}
        <li>
          <Link to="/cart" aria-label="View cart">
            <img
              src="/Cart.png"
              alt="Cart"
              className="cart-icon rounded-full"
            />
          </Link>
        </li>
        {/* Categories intentionally not displayed */}
      </ul>
      
      <div className="navbar-right">
        {!isLoggedIn && (
          <Link to="/signin">
            <button className="sign-in-btn">
              <FaSignInAlt style={{ marginRight: "8px" }} />
              Sign In
            </button>
          </Link>
        )}
        {isLoggedIn && <Sidebar />}
      </div>
    </nav>
  );
};

export default Navbar;
