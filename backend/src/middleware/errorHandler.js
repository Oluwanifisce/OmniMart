/**
 * Global error handling middleware for Express application.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      error: `Duplicate field value entered: ${field} '${err.keyValue[field]}' already exists.`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Data validation error',
      details: messages,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource identifier format: ${err.value}`,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
