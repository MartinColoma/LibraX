const express = require("express");
const router = express.Router();
const db = require("../../db/bookServerDB");

// ======== Utility: Promisified query ========
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// ======== ID Generators ========
const generateBookId = () => Math.floor(1000000000 + Math.random() * 9000000000);
const generateCopyId = () => Math.floor(1000000000 + Math.random() * 9000000000);
const generateLogId = () => Math.floor(1000000000 + Math.random() * 9000000000);
const generateBarcode = () => Math.floor(10000000 + Math.random() * 90000000);

const generateUniqueId = async (generator, table, column) => {
  for (let i = 0; i < 10; i++) {
    const id = generator();
    const rows = await query(`SELECT ${column} FROM ${table} WHERE ${column} = ?`, [id]);
    if (rows.length === 0) return id;
  }
  throw new Error(`Could not generate unique ${column} after 10 attempts`);
};

// ======== POST Route to Add Book ========
router.post("/", async (req, res) => {
  const {
    isbn, title, subtitle, description, publisher,
    publication_year, edition, language, category_id,
    authors = [], numCopies = 1
  } = req.body;

  if (!isbn || !title) {
    return res.status(400).json({ error: "ISBN and Title are required." });
  }

  try {
    // 1️⃣ Generate Book ID
    const bookId = await generateUniqueId(generateBookId, "books", "book_id");
    console.log("📚 Generated book ID:", bookId);

    // 2️⃣ Insert Book
    await query(
      `INSERT INTO books 
        (book_id, isbn, title, subtitle, description, publisher, publication_year, edition, category_id, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookId,
        isbn,
        title,
        subtitle || null,
        description || null,
        publisher || null,
        publication_year || null,
        edition || null,
        category_id || null,
        language || "English",
      ]
    );
    console.log("✅ Book inserted successfully with ID:", bookId);

    // 3️⃣ Process Authors
    const cleanedAuthors = authors
      .map((a) => a && a.trim())
      .filter(Boolean);

    if (cleanedAuthors.length === 0) {
      console.log("⚠️ No authors provided, skipping author processing");
    } else {
      for (let i = 0; i < cleanedAuthors.length; i++) {
        const authorName = cleanedAuthors[i];
        console.log(`👥 Processing author ${i + 1}/${cleanedAuthors.length}: "${authorName}"`);

        const existing = await query("SELECT author_id FROM authors WHERE name = ?", [authorName]);
        let authorId;

        if (existing.length === 0) {
          console.log(`➕ Creating new author: "${authorName}"`);
          const result = await query("INSERT INTO authors (name) VALUES (?)", [authorName]);
          authorId = result.insertId;
          console.log(`✅ Created author "${authorName}" with ID:`, authorId);
        } else {
          authorId = existing[0].author_id;
          console.log(`✅ Found existing author "${authorName}" with ID:`, authorId);
        }

        await query("INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)", [bookId, authorId]);
        console.log(`🔗 Linked author "${authorName}" to book ${bookId}`);
      }
    }

    // 4️⃣ Insert Book Copies + Logs
    for (let i = 0; i < numCopies; i++) {
      const copyId = await generateUniqueId(generateCopyId, "book_copies", "copy_id");
      const barcode = generateBarcode();

      await query(
        "INSERT INTO book_copies (copy_id, book_id, barcode, status, book_condition, location) VALUES (?, ?, ?, 'Available', 'New', 'Main Shelf')",
        [copyId, bookId, barcode]
      );
      console.log(`✅ Created copy ${i + 1} with ID:`, copyId, "and barcode:", barcode);

      const logId = await generateUniqueId(generateLogId, "inventory_logs", "log_id");
      await query(
        "INSERT INTO inventory_logs (log_id, copy_id, action, performed_by) VALUES (?, ?, 'Added', 'Librarian')",
        [logId, copyId]
      );
      console.log(`📝 Logged addition of copy ${i + 1} with Log ID:`, logId);
    }

    console.log("✅ All processing complete for book:", bookId);

    res.status(201).json({
      message: "✅ Book added successfully!",
      bookId,
      copiesCreated: numCopies,
    });
  } catch (error) {
    console.error("❌ Error in add book process:", error);
    res.status(500).json({ error: "Failed to add book", details: error.message });
  }
});

// ======== Test Route ========
router.get("/test", (req, res) => {
  console.log("🔍 TEST: /add_books/test route hit");
  res.json({
    message: "✅ Add books route is working!",
    sampleBookId: generateBookId(),
    sampleCopyId: generateCopyId(),
    sampleLogId: generateLogId(),
    sampleBarcode: generateBarcode(),
  });
});

module.exports = router;
