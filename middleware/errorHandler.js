// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Log the complete error stack trace to your terminal for backend debugging
    console.error('❌ [Global Error Handler]:', err.stack || err.message);
  
    // If the response headers have already been sent, hand it off to default express handler
    if (res.headersSent) {
      return next(err);
    }
  
    // Set the error status (default to 500 Internal Server Error)
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected server error occurred.';
  
    // Return a standardized, clean JSON contract to the client
    res.status(statusCode).json({
      success: false,
      message: message,
      // Only include raw system details during local development; hide it in production!
      error: process.env.NODE_ENV === 'production' ? {} : err.message || err
    });
  };
  
  module.exports = errorHandler;