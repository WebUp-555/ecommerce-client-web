import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Products from "./Pages/Product.jsx";
import Users from "./Pages/User.jsx";
import Orders from "./Pages/Orders.jsx";
import AddProduct from "./Pages/AddProducts.jsx";
import AddCategory from './Pages/AddCategory';
import UpdateProduct from './Pages/UpdateProduct';
import Banners from "./Pages/Banners.jsx";
import AdminSignIn from "./Pages/AdminSignIn.jsx";

function AppRoutes() {
  const [isAdmin, setIsAdmin] = useState(null);
  const location = useLocation();

  // Re-evaluate admin status on route changes and on custom auth event
  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        setIsAdmin(Boolean(token && user?.role === 'admin'));
      } catch (_) {
        setIsAdmin(false);
      }
    };

    checkAdmin();

    const onAuthReady = () => checkAdmin();
    window.addEventListener('admin-auth-ready', onAuthReady);
    return () => window.removeEventListener('admin-auth-ready', onAuthReady);
  }, [location.pathname, location.key]);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Routes>
        <Route path="/signin" element={<AdminSignIn />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/add-category" element={<AddCategory />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/users" element={<Users />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/updateproduct/:id" element={<UpdateProduct />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}