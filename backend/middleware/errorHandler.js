// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log the complete error stack trace to your terminal for backend debugging
  console.error("❌ [Global Error Handler]:", err.stack || err.message);

  // If the response headers have already been sent, hand it off to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Set the error status (default to 500 Internal Server Error)
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "An unexpected server error occurred.";

  // PDF contract: { success, message, error: { status, code } }
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      status: statusCode,
      code: err.code || err.name || "INTERNAL_ERROR",
    },
  });
};

module.exports = errorHandler;