const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers['authorization'];
    
    // Check if the header exists and follows the 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 2. Extract the actual token string out of the header
    const token = authHeader.split(' ')[1];

    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the decoded payload (containing student_id) to the request object
    req.user = decoded;

    // 5. Pass control to the next controller function
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
      error: err.message,
    });
  }
};

module.exports = {
  verifyToken,
};