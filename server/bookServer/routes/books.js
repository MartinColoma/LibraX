// routes/books.js
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
const generateLogId = () => Math.floor(1000000000 + Math.random() * 9000000000);
const generateBarcode = () => Math.floor(10000000 + Math.random() * 90000000);
// ======== Utility: Generate Copy ID based on Book ID ========
const generateCopyIdForBook = async (bookId) => {
  const rows = await query(
    "SELECT copy_id FROM book_copies WHERE book_id = ? ORDER BY copy_id DESC LIMIT 1",
    [bookId]
  );

  let nextNumber = 1;
  if (rows.length > 0) {
    const lastCopyId = rows[0].copy_id;
    const lastNumber = parseInt(String(lastCopyId).slice(-3), 10);
    nextNumber = lastNumber + 1;
  }

  return `${bookId}${String(nextNumber).padStart(3, "0")}`;
};

const generateUniqueId = async (generator, table, column) => {
  for (let i = 0; i < 10; i++) {
    const id = generator();
    const rows = await query(`SELECT ${column} FROM ${table} WHERE ${column} = ?`, [id]);
    if (rows.length === 0) return id;
  }
  throw new Error(`Could not generate unique ${column} after 10 attempts`);
};

// GET /books – return Book ID, Title, Category, Language, Quantity
// routes/books.js
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search ? `%${req.query.search}%` : "%";

    // Paginated query
    const sql = `
      SELECT 
        b.book_id,
        b.title,
        c.category_name,
        b.language,
        COUNT(bc.copy_id) AS quantity,
        b.date_added
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.category_id
      LEFT JOIN book_copies bc ON b.book_id = bc.book_id
      WHERE b.title LIKE ?
      GROUP BY b.book_id, b.title, c.category_name, b.language, b.date_added
      ORDER BY b.date_added DESC
      LIMIT ? OFFSET ?
    `;

    const results = await query(sql, [search, limit, offset]);

    // Total count query (without limit/offset)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM books b
      WHERE b.title LIKE ?
    `;
    const countResult = await query(countSql, [search]);

    // Send both paginated data & total count
    res.json({
      books: results,
      total: countResult[0].total
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// ======== POST Add Book ========
router.post("/add_book", async (req, res) => {
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
    const cleanedAuthors = authors.map((a) => a && a.trim()).filter(Boolean);
    if (cleanedAuthors.length > 0) {
      for (const authorName of cleanedAuthors) {
        const existing = await query("SELECT author_id FROM authors WHERE name = ?", [authorName]);
        let authorId;
        if (existing.length === 0) {
          const result = await query("INSERT INTO authors (name) VALUES (?)", [authorName]);
          authorId = result.insertId;
        } else {
          authorId = existing[0].author_id;
        }
        await query("INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)", [bookId, authorId]);
      }
    }

    // 4️⃣ Insert Book Copies + Logs
    for (let i = 0; i < numCopies; i++) {
      const copyId = await generateCopyIdForBook(bookId);
      const barcode = generateBarcode();

      await query(
        "INSERT INTO book_copies (copy_id, book_id, barcode, status, book_condition, location) VALUES (?, ?, ?, 'Available', 'New', 'Main Shelf')",
        [copyId, bookId, barcode]
      );

      const logId = await generateUniqueId(generateLogId, "inventory_logs", "log_id");
      await query(
        "INSERT INTO inventory_logs (log_id, copy_id, action, performed_by) VALUES (?, ?, 'Added', 'Librarian')",
        [logId, copyId]
      );
    }

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

// ======== PUT Update Book ========
router.put("/update_book/:book_id", async (req, res) => {
  const { book_id } = req.params;
  const {
    isbn, title, subtitle, description, publisher,
    publication_year, edition, language, category_id
  } = req.body;

  if (!isbn || !title) {
    return res.status(400).json({ error: "ISBN and Title are required." });
  }

  try {
    const result = await query(
      `UPDATE books
       SET isbn = ?, title = ?, subtitle = ?, description = ?, publisher = ?, 
           publication_year = ?, edition = ?, category_id = ?, language = ?
       WHERE book_id = ?`,
      [
        isbn,
        title,
        subtitle || null,
        description || null,
        publisher || null,
        publication_year || null,
        edition || null,
        category_id || null,
        language || "English",
        book_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "✅ Book updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating book:", error);
    res.status(500).json({ error: "Failed to update book", details: error.message });
  }
});

// ======== DELETE Book ========
router.delete("/delete_book/:book_id", async (req, res) => {
  const { book_id } = req.params;

  try {
    await query(`DELETE FROM inventory_logs WHERE copy_id IN (SELECT copy_id FROM book_copies WHERE book_id = ?)`, [book_id]);
    await query(`DELETE FROM book_copies WHERE book_id = ?`, [book_id]);
    await query(`DELETE FROM book_authors WHERE book_id = ?`, [book_id]);
    const result = await query(`DELETE FROM books WHERE book_id = ?`, [book_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "✅ Book deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book", details: error.message });
  }
});
// Bulk delete books and related data safely
router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    // Delete inventory logs for copies of these books
    await query(
      `DELETE FROM inventory_logs WHERE copy_id IN (
        SELECT copy_id FROM book_copies WHERE book_id IN (?)
      )`,
      [ids]
    );

    // Delete book copies
    await query(`DELETE FROM book_copies WHERE book_id IN (?)`, [ids]);

    // Delete book-author relations
    await query(`DELETE FROM book_authors WHERE book_id IN (?)`, [ids]);

    // Delete books
    const result = await query(`DELETE FROM books WHERE book_id IN (?)`, [ids]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No books found to delete." });
    }

    res.json({ message: "✅ Books deleted successfully!", deletedCount: result.affectedRows });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ message: "Server error during bulk delete." });
  }
});
// Add this route to your books.js file

// ======== GET Single Book with Details ========
router.get("/:book_id", async (req, res) => {
  const { book_id } = req.params;

  try {
    // Get book details with category info
    const bookSql = `
      SELECT 
        b.book_id,
        b.isbn,
        b.title,
        b.subtitle,
        b.description,
        b.publisher,
        b.publication_year,
        b.edition,
        b.language,
        b.category_id,
        c.category_name,
        c.category_type
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.category_id
      WHERE b.book_id = ?
    `;
    
    const bookResult = await query(bookSql, [book_id]);
    
    if (bookResult.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get authors for this book
    const authorsSql = `
      SELECT a.author_id, a.name
      FROM authors a
      INNER JOIN book_authors ba ON a.author_id = ba.author_id
      WHERE ba.book_id = ?
    `;
    
    const authorsResult = await query(authorsSql, [book_id]);
    
    // Get number of copies
    const copiesSql = `
      SELECT COUNT(*) as copy_count
      FROM book_copies
      WHERE book_id = ?
    `;
    
    const copiesResult = await query(copiesSql, [book_id]);

    const book = {
      ...bookResult[0],
      authors: authorsResult.map(author => author.name),
      copy_count: copiesResult[0].copy_count
    };

    res.json(book);
  } catch (error) {
    console.error("❌ Error fetching book details:", error);
    res.status(500).json({ error: "Failed to fetch book details", details: error.message });
  }
});

// ======== PUT Update Book (Enhanced) ========
router.put("/update_book/:book_id", async (req, res) => {
  const { book_id } = req.params;
  const {
    isbn, title, subtitle, description, publisher,
    publication_year, edition, language, category_id,
    authors = []
  } = req.body;

  if (!isbn || !title) {
    return res.status(400).json({ error: "ISBN and Title are required." });
  }

  try {
    // Update book details
    const result = await query(
      `UPDATE books
       SET isbn = ?, title = ?, subtitle = ?, description = ?, publisher = ?, 
           publication_year = ?, edition = ?, category_id = ?, language = ?
       WHERE book_id = ?`,
      [
        isbn,
        title,
        subtitle || null,
        description || null,
        publisher || null,
        publication_year || null,
        edition || null,
        category_id || null,
        language || "English",
        book_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Update authors if provided
    if (authors.length > 0) {
      // Remove existing author associations
      await query("DELETE FROM book_authors WHERE book_id = ?", [book_id]);

      // Process and add new authors
      const cleanedAuthors = authors.map((a) => a && a.trim()).filter(Boolean);
      
      for (const authorName of cleanedAuthors) {
        const existing = await query("SELECT author_id FROM authors WHERE name = ?", [authorName]);
        let authorId;
        
        if (existing.length === 0) {
          const result = await query("INSERT INTO authors (name) VALUES (?)", [authorName]);
          authorId = result.insertId;
        } else {
          authorId = existing[0].author_id;
        }
        
        await query("INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)", [book_id, authorId]);
      }
    }

    res.json({ message: "✅ Book updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating book:", error);
    res.status(500).json({ error: "Failed to update book", details: error.message });
  }
});
// ======== Test Route ========
router.get("/test", (req, res) => {
  res.json({
    message: "✅ Books route is working!",
    sampleBookId: generateBookId(),
    sampleCopyId: "Example in /add_book",
    sampleLogId: generateLogId(),
    sampleBarcode: generateBarcode(),
  });
});

module.exports = router;
