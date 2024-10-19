// components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Optional loading state while checking authentication
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
