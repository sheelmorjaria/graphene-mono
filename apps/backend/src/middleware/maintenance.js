// Maintenance mode middleware
export const checkMaintenance = (req, res, next) => {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  // Allow health checks during maintenance
  if (req.path === '/api/health') {
    return next();
  }
  
  // Allow admin access during maintenance
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  if (isMaintenanceMode) {
    return res.status(503).json({
      success: false,
      error: 'System is under maintenance. Please try again later.',
      maintenanceMode: true
    });
  }
  
  next();
};