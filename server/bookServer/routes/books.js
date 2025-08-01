const express = require("express");
const router = express.Router();
const dbBookServer = require("../../db/bookServerDB");

router.get("/", (req, res) => {
  const sql = `
    SELECT b.book_id, b.title, c.category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.category_id
    LIMIT 5;
  `;
  dbBookServer.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
