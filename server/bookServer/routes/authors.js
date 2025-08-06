const express = require("express");
const router = express.Router();
const db = require("../../db/bookServerDB");

// 1️⃣ Get all authors (for dropdown)
router.get("/", (req, res) => {
  db.query(
    "SELECT author_id, name AS author_name FROM authors ORDER BY name ASC",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch authors" });
      res.json(results);
    }
  );
});

// 2️⃣ Search authors by name (for autocomplete)
router.get("/search", (req, res) => {
  const search = req.query.q || "";
  db.query(
    "SELECT author_id, name AS author_name FROM authors WHERE name LIKE ? ORDER BY name ASC",
    [`%${search}%`],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to search authors" });
      res.json(results);
    }
  );
});

module.exports = router;
