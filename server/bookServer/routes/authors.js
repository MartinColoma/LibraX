const express = require("express");
const router = express.Router();
const db = require("../../db/bookServerDB");

// Helper function to generate unique author ID
const generateAuthorId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit random number
};

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

// 3️⃣ ✅ NEW: Add new author
router.post("/add_author", (req, res) => {
  const { name, biography } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Author name is required" });
  }

  // Check if author already exists (case-insensitive)
  db.query(
    "SELECT author_id FROM authors WHERE LOWER(name) = LOWER(?)",
    [name.trim()],
    (err, existingResults) => {
      if (err) {
        console.error("❌ Database error checking existing author:", err);
        return res.status(500).json({ error: "Database error checking existing author" });
      }

      if (existingResults.length > 0) {
        return res.status(409).json({ 
          error: `Author "${name.trim()}" already exists in the database` 
        });
      }

      // Generate unique author ID
      let authorId;
      const attemptInsert = (attempts = 0) => {
        if (attempts > 5) {
          return res.status(500).json({ error: "Failed to generate unique author ID" });
        }

        authorId = generateAuthorId();

        // Check if this ID already exists
        db.query(
          "SELECT author_id FROM authors WHERE author_id = ?",
          [authorId],
          (err, idCheckResults) => {
            if (err) {
              console.error("❌ Database error checking author ID:", err);
              return res.status(500).json({ error: "Database error checking author ID" });
            }

            if (idCheckResults.length > 0) {
              // ID exists, try again
              return attemptInsert(attempts + 1);
            }

            // ID is unique, proceed with insert
            db.query(
              "INSERT INTO authors (author_id, name, biography) VALUES (?, ?, ?)",
              [authorId, name.trim(), biography ? biography.trim() : null],
              (err, insertResults) => {
                if (err) {
                  console.error("❌ Database error adding author:", err);
                  return res.status(500).json({ error: "Failed to add author to database" });
                }

                console.log(`✅ Author added successfully: ID ${authorId}, Name: ${name.trim()}`);
                res.status(201).json({
                  message: `Author "${name.trim()}" added successfully`,
                  author: {
                    author_id: authorId,
                    name: name.trim(),
                    biography: biography ? biography.trim() : null
                  }
                });
              }
            );
          }
        );
      };

      attemptInsert();
    }
  );
});

module.exports = router;