// src/utils/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // No token - go to signin
  if (!token || !user) {
    return <Navigate to="/signin" replace />;
  }

  // Has token - allow access
  return children;
};

export default PrivateRoute;