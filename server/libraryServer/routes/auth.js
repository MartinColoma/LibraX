const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbLibrary = require("../../db/libraryDB");

const JWT_SECRET = "super_secret_key_change_this"; // Store in .env in production

function generateHistoryId() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// POST /auth - Staff login
router.post("/", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = `SELECT * FROM staff WHERE email = ? LIMIT 1`;
  dbLibrary.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const staff = results[0];
    const isMatch = await bcrypt.compare(password, staff.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 1️⃣ Update last_login
    const updateSql = `UPDATE staff SET last_login = NOW() WHERE staff_id = ?`;
    dbLibrary.query(updateSql, [staff.staff_id], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: "Failed to update last_login" });
      }

      // 2️⃣ Insert login history
      const historyId = generateHistoryId();
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || null;

      const insertHistory = `
        INSERT INTO login_history (history_id, staff_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `;

      dbLibrary.query(insertHistory, [historyId, staff.staff_id, ip, userAgent], (historyErr) => {
        if (historyErr) console.error("Login history insert error:", historyErr);

        // 3️⃣ Generate JWT
        const token = jwt.sign(
          { staff_id: staff.staff_id, email: staff.email, role: staff.role },
          JWT_SECRET,
          { expiresIn: "2h" }
        );

        // 4️⃣ Set HttpOnly Cookie
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: false, // set true if using HTTPS
          sameSite: "lax",
          maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        // 5️⃣ Return sanitized user info
        delete staff.password_hash;
        staff.last_login = new Date();
        staff.full_name = `${staff.first_name} ${staff.last_name}`.trim();

        res.status(200).json({
          message: "Login successful",
          staff,
          login_history_id: historyId
        });
      });
    });
  });
});

// POST /auth/logout - Clear cookie and logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: false, // set true if using HTTPS
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
