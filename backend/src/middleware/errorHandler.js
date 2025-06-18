// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Handle null/undefined errors
  if (!err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }

  let error = { ...err };
  error.message = err?.message || 'Server Error';

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err?.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err?.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err?.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err?.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};