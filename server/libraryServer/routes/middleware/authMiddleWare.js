// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = "super_secret_key_change_this"; // Move to .env in production

function verifyToken(req, res, next) {
  const token = req.cookies.auth_token; // read token from cookie

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
