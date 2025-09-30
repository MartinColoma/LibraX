const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const dbLibrary = require("../../db/libraryDB");

// POST /members/create_acc - Create new member account
router.post("/create_acc", async (req, res) => {
  try {
    const { first_name, last_name, email, password, student_id, phone_number, nfc_uid, status } = req.body;

    if (!first_name || !last_name || !email || !password || !student_id) {
      return res.status(400).json({ error: "First name, last name, email, password, and student ID are required" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate member_id (simple example: M + timestamp)
    const member_id = "M" + Date.now();

    const sql = `
      INSERT INTO members (member_id, first_name, last_name, email, phone_number, student_id, nfc_uid, status, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      member_id,
      first_name,
      last_name,
      email,
      phone_number || null,
      student_id,
      nfc_uid || null,
      status || "Active",
      password_hash
    ];

    dbLibrary.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create member account" });
      }
      res.status(201).json({ 
        message: "Member account created successfully", 
        member_id 
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
