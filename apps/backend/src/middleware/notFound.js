// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  // errorHandler derives the response status from err.statusCode — without
  // this it re-statuses the response to 500 even though 404 was intended.
  error.statusCode = 404;
  next(error);
};