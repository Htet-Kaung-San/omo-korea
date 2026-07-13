const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
      error: err.message,
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  console.error(`[API ERROR] ${req.method} ${req.url} ->`, err);

  let statusCode = err.statusCode || 500;
  
  if (err.code && !err.statusCode) {
      if (err.code === 'PGRST116') statusCode = 404;
      else if (err.code.startsWith('23')) statusCode = 400;
      else statusCode = 500;
  }

  let message = err.message || 'An unexpected database error occurred on the server';
  
  if (err.code === '23503') {
      message = 'Database integrity violation: A referenced record (Student or Post) does not exist.';
  } else if (err.code === '23505') {
      message = 'Database constraint violation: Data entry already exists.';
  }

  return res.status(statusCode).json({
      success: false,
      message: message,
      error: {
          status: statusCode,
          code: err.code || 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
  });
};

// ==========================================
// 🤝 COMBINED SINGLE EXPORT BLOCK
// ==========================================
module.exports = {
  verifyToken,
  globalErrorHandler
};