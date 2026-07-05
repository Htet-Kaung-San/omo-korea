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

/**
 * Middleware to restrict access to admin-only routes.
 * Must be used AFTER authenticateToken so that req.user is populated.
 * Looks up the student's is_admin flag from the database.
 */
function requireAdmin(req, res, next) {
  const supabase = require("../supabaseClient");

  const studentId = req.user?.student_id;
  if (!studentId) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Admin privileges required.",
    });
  }

  // Check admin status from database
  supabase
    .from("student")
    .select("is_admin")
    .eq("student_id", studentId)
    .single()
    .then(({ data, error }) => {
      if (error || !data || data.is_admin !== true) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: Admin privileges required.",
        });
      }
      next();
    })
    .catch(() => {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Admin privileges required.",
      });
    });
}

module.exports = { authenticateToken, requireAdmin };
