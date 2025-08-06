const express = require("express");
const router = express.Router();
const dbBookServer = require("../../db/bookServerDB");

router.get("/", (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search}%` : "%";

  const sql = `
    SELECT b.book_id, b.isbn, b.title, b.subtitle, b.publisher,
           b.publication_year, b.language, c.category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.category_id
    WHERE b.title LIKE ? OR b.isbn LIKE ?
    ORDER BY b.date_added DESC
    LIMIT ? OFFSET ?;
  `;

  dbBookServer.query(sql, [search, search, limit, offset], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
