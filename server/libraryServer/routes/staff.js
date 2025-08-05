const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const dbLibrary = require("../../db/libraryDB");

// POST /staff - Create new staff account
router.post("/", async (req, res) => {
  try {
    const { fullName, email, password, role, phoneNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [first_name, ...rest] = fullName.split(" ");
    const last_name = rest.join(" ") || "";

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Prepare SQL statement (now includes phone_number)
    const sql = `
      INSERT INTO staff (first_name, last_name, email, username, phone_number, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      first_name,
      last_name,
      email,
      email.split("@")[0],      // username from email
      phoneNumber || null,      // save phone number or NULL if empty
      password_hash,
      role || "Librarian",
    ];

    // Execute insert
    dbLibrary.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create staff account" });
      }
      res.status(201).json({ message: "Staff account created successfully" });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
