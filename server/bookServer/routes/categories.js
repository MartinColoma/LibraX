const express = require("express");
const router = express.Router();
const db = require("../../db/bookServerDB");

// Return all categories with name and type
router.get("/", (req, res) => {
  const query = `
    SELECT 
      category_id, 
      category_name, 
      category_type
    FROM categories
    ORDER BY category_name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch categories:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
    res.json(results);
  });
});

module.exports = router;
