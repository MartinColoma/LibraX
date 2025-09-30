const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbLibrary = require("../../db/libraryDB");

const JWT_SECRET = "super_secret_key_change_this"; // put in .env

function generateHistoryId() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
  dbLibrary.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database query error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];
    
    // Add logging for debugging
    console.log("User found:", {
      user_id: user.user_id,
      email: user.email,
      user_type: user.user_type,
      role: user.role,
      username: user.username
    });

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last_login
    const updateSql = `UPDATE users SET last_login = NOW() WHERE user_id = ?`;
    dbLibrary.query(updateSql, [user.user_id], (updateErr) => {
      if (updateErr) {
        console.error("Error updating last_login:", updateErr);
      }
    });

    // Insert login history
    const historyId = generateHistoryId();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;

    const insertHistory = `
      INSERT INTO login_history (history_id, user_id, user_type, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `;
    dbLibrary.query(insertHistory, [historyId, user.user_id, user.user_type, ip, userAgent], (histErr) => {
      if (histErr) {
        console.error("Error inserting login history:", histErr);
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        email: user.email, 
        role: user.role, 
        user_type: user.user_type 
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000
    });

    // Prepare user response
    delete user.password_hash;
    user.full_name = `${user.first_name} ${user.last_name}`.trim();

    console.log("Login successful, sending response:", {
      user_type: user.user_type,
      role: user.role,
      full_name: user.full_name
    });

    res.status(200).json({
      user: user,
      login_history_id: historyId
    });
  });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

// GET /auth/check-email?email=someone@example.com
router.get("/check-email", (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email query parameter required" });
  }

  const sql = `SELECT 1 FROM users WHERE email = ? LIMIT 1`;
  dbLibrary.query(sql, [email], (err, results) => {
    if (err) {
      console.error("DB error checking email existence:", err);
      return res.status(500).json({ error: "Database query error" });
    }

    res.json({ exists: results.length > 0 });
  });
});

module.exports = router;