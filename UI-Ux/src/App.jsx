import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './Pages/Home';
import SignIn from './Pages/SignIn';
import SignUp from './Pages/signup';
import Products from './Pages/Products';
import ProductDetails from './Pages/ProductsDetails';
import CartPage from './Pages/cartPage';
import PaymentPage from './Pages/PaymentPage';
import CheckoutPage from './Pages/CheckoutPage';
import PaymentSuccessPage from './Pages/PaymentSuccessPage';
import MyOrdersPage from './Pages/MyOrdersPage';
import MyOrderDetailsPage from './Pages/MyOrderDetailsPage';
import PrivateRoute from './utils/PrivateRoute';
import ForgotPassword from './Pages/ForgotPassword';
import ChangePassword from './Pages/ChangePassword';
import UpdateDetails from './Pages/UpdateDetails';
import Wishlist from './Pages/Wishlist';
import CustomTShirts from './Pages/CustomTShirts';
import BulkOrders from './Pages/BulkOrders';
import ArtistCollaborations from './Pages/ArtistCollaborations';
import { useCartStore } from './Pages/cartStore';

function App() {
  const initializeCart = useCartStore((state) => state.initializeCart);
  const reinitializeAfterLogin = useCartStore((state) => state.reinitializeAfterLogin);

  useEffect(() => {
    initializeCart();
    
    // Listen for auth-ready event (dispatched after login/logout)
    const handleAuthReady = () => {
      // Small delay to ensure localStorage is fully committed
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          reinitializeAfterLogin();
        } else {
          // User logged out - clear cart
          useCartStore.setState({ cartItems: [], totalAmount: 0, error: null });
        }
      }, 100);
    };
    
    window.addEventListener('auth-ready', handleAuthReady);
    return () => window.removeEventListener('auth-ready', handleAuthReady);
  }, [initializeCart, reinitializeAfterLogin]);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const hideNavbarOnRoutes = ['/signin', '/signup'];
  const shouldShowNavbar = !hideNavbarOnRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        {/* Public Routes - MUST BE FIRST */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/update-details" element={<UpdateDetails />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/services/custom-tshirts" 
          element={
            <PrivateRoute>
              <CustomTShirts />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/services/bulk-orders" 
          element={
            <PrivateRoute>
              <BulkOrders />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/services/artist-collaborations" 
          element={
            <PrivateRoute>
              <ArtistCollaborations />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/product/:id" 
          element={
            <PrivateRoute>
              <ProductDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/cart" 
          element={
            <PrivateRoute>
              <CartPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <PrivateRoute>
              <CheckoutPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders/success/:orderId" 
          element={
            <PrivateRoute>
              <PaymentSuccessPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders/my" 
          element={
            <PrivateRoute>
              <MyOrdersPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders/my/:id" 
          element={
            <PrivateRoute>
              <MyOrderDetailsPage />
            </PrivateRoute>
          } 
        />

        {/* Catch all - redirect to signin */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
}

export default App;