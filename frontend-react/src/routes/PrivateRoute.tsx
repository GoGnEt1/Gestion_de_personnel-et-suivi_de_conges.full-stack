import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import React from "react";

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  // return children;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
