const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const dbLibrary = require("../../db/libraryDB");

// POST /users/staff - Create new staff account
router.post("/staff", async (req, res) => {
  try {
    const { fullName, email, password, role, phoneNumber, nfc_uid } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, email and password are required" });
    }

    const [first_name, ...rest] = fullName.split(" ");
    const last_name = rest.join(" ") || "";

    const password_hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (
        user_id, user_type, first_name, last_name, email, username,
        phone_number, password_hash, role, nfc_uid
      )
      VALUES (?, 'staff', ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const user_id = "U" + Date.now(); // or UUID
    const values = [
      user_id,
      first_name,
      last_name,
      email,
      email.split("@")[0], // username
      phoneNumber || null,
      password_hash,
      role || "Librarian",
      nfc_uid || null
    ];

    dbLibrary.query(sql, values, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create staff account" });
      }
      res.status(201).json({ message: "Staff account created", user_id });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/member - Create new member account
router.post("/member", async (req, res) => {
  try {
    const { first_name, last_name, email, password, student_id, phone_number, nfc_uid, status } = req.body;

    if (!first_name || !last_name || !email || !password || !student_id) {
      return res.status(400).json({ error: "First name, last name, email, password, and student ID are required" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (
        user_id, user_type, first_name, last_name, email, phone_number,
        student_id, role, password_hash, nfc_uid, status
      )
      VALUES (?, 'member', ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const user_id = "U" + Date.now(); // or UUID
    const values = [
      user_id,
      first_name,
      last_name,
      email,
      phone_number || null,
      student_id,
      role || "Student",
      password_hash,
      nfc_uid || null,
      status || "Active"
    ];

    dbLibrary.query(sql, values, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create member account" });
      }
      res.status(201).json({ message: "Member account created", user_id });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
