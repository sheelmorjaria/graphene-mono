import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '../services/adminService';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  
  if (!isAdminAuthenticated()) {
    // Redirect to admin login page with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default AdminRoute;