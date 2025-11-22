import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import React from "react";

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
