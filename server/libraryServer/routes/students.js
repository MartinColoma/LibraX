const express = require("express");
const router = express.Router();
const dbLibrary = require("../../db/libraryDB");

// Example GET route
router.get("/", (req, res) => {
  dbLibrary.query("SELECT * FROM students LIMIT 5", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

module.exports = router;
