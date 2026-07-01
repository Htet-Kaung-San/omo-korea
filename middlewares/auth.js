const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "hey-pnu-default-secret-key";

/**
 * Middleware to verify JWT tokens on protected routes.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: No session token provided.",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Session token is invalid or expired.",
      });
    }

    req.user = decoded; // Store decoded token parameters (e.g. { student_id })
    next();
  });
}

module.exports = authenticateToken;
