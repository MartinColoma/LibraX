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
    
    // Get number of copies with detailed status
    const copiesSql = `
      SELECT 
        COUNT(*) as copy_count,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_copies,
        SUM(CASE WHEN status = 'Borrowed' THEN 1 ELSE 0 END) as borrowed_copies,
        SUM(CASE WHEN status IN ('Lost', 'Damaged') THEN 1 ELSE 0 END) as unavailable_copies
      FROM book_copies
      WHERE book_id = ?
    `;
    
    const copiesResult = await query(copiesSql, [book_id]);

    const book = {
      ...bookResult[0],
      authors: authorsResult.map(author => author.name),
      copy_count: copiesResult[0].copy_count || 0,
      available_copies: copiesResult[0].available_copies || 0,
      borrowed_copies: copiesResult[0].borrowed_copies || 0,
      unavailable_copies: copiesResult[0].unavailable_copies || 0
    };

    res.json(book);
  } catch (error) {
    console.error("❌ Error fetching book details:", error);
    res.status(500).json({ error: "Failed to fetch book details", details: error.message });
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

// ======== 🎯 BOOK COPY MANAGEMENT ROUTES ========

// 🔸 Update Book Copies (Increase or Decrease)
router.put("/:book_id/copies", async (req, res) => {
  const { book_id } = req.params;
  const { action, quantity = 1 } = req.body;
  
  if (!action || !['increase', 'decrease'].includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action. Use "increase" or "decrease"' 
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({ 
      error: 'Quantity must be a positive number' 
    });
  }

  try {
    if (action === 'increase') {
      await increaseCopies(book_id, quantity);
    } else {
      await decreaseCopies(book_id, quantity);
    }
    
    // Get updated copy count
    const countResult = await query(
      'SELECT COUNT(*) as copy_count FROM book_copies WHERE book_id = ?',
      [book_id]
    );

    res.json({
      success: true,
      message: `Successfully ${action}d ${quantity} cop${quantity === 1 ? 'y' : 'ies'}`,
      book_id,
      action,
      quantity,
      new_copy_count: countResult[0].copy_count
    });

  } catch (error) {
    console.error('❌ Copy management error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update book copies' 
    });
  }
});

// 🔸 HELPER: Increase Copies
async function increaseCopies(bookId, quantity) {
  // Check if book exists
  const bookExists = await query(
    'SELECT book_id FROM books WHERE book_id = ?',
    [bookId]
  );

  if (bookExists.length === 0) {
    throw new Error(`Book with ID ${bookId} not found`);
  }

  // Get the current highest copy number
  const maxCopyResult = await query(`
    SELECT MAX(CAST(RIGHT(copy_id, 3) AS UNSIGNED)) as max_copy_num 
    FROM book_copies 
    WHERE book_id = ?
  `, [bookId]);

  let nextCopyNumber = 1;
  if (maxCopyResult[0].max_copy_num) {
    nextCopyNumber = maxCopyResult[0].max_copy_num + 1;
  }

  // Insert new copies
  for (let i = 0; i < quantity; i++) {
    const copyId = `${bookId}${String(nextCopyNumber).padStart(3, '0')}`;
    const barcode = Math.floor(Math.random() * 90000000) + 10000000;

    // Insert copy
    await query(`
      INSERT INTO book_copies (copy_id, book_id, barcode, status, book_condition, location) 
      VALUES (?, ?, ?, 'Available', 'New', 'Main Shelf')
    `, [copyId, bookId, barcode]);

    // Log the action
    const logId = Math.floor(Math.random() * 9000000000) + 1000000000;
    await query(`
      INSERT INTO inventory_logs (log_id, copy_id, action, performed_by) 
      VALUES (?, ?, 'Added', 'Librarian')
    `, [logId.toString(), copyId]);

    nextCopyNumber++;
  }
}

// 🔸 HELPER: Decrease Copies (FIXED VERSION)
async function decreaseCopies(bookId, quantity) {
  // Get available copies (only delete Available copies)
  const availableCopies = await query(`
    SELECT copy_id FROM book_copies 
    WHERE book_id = ? AND status = 'Available' 
    ORDER BY copy_id DESC
    LIMIT ?
  `, [bookId, quantity]);

  if (availableCopies.length < quantity) {
    throw new Error(
      `Cannot remove ${quantity} copies. Only ${availableCopies.length} available copies found. ` +
      `(Borrowed, Lost, or Damaged copies cannot be removed)`
    );
  }

  // Process each copy for removal
  for (const copy of availableCopies) {
    // First, log the removal action
    const logId = Math.floor(Math.random() * 9000000000) + 1000000000;
    await query(`
      INSERT INTO inventory_logs (log_id, copy_id, action, performed_by) 
      VALUES (?, ?, 'Removed', 'Librarian')
    `, [logId.toString(), copy.copy_id]);

    // OPTION 1: Delete inventory logs first (if you don't need history)
    // Uncomment the following lines if you want to delete logs:
    /*
    await query(
      'DELETE FROM inventory_logs WHERE copy_id = ?',
      [copy.copy_id]
    );
    */

    // OPTION 2: Update foreign key to allow NULL (RECOMMENDED)
    // This preserves the log history but removes the constraint
    // You would need to modify your database schema first:
    // ALTER TABLE inventory_logs MODIFY copy_id varchar(20) NULL;
    // Then update the logs to set copy_id to NULL:
    /*
    await query(
      'UPDATE inventory_logs SET copy_id = NULL WHERE copy_id = ?',
      [copy.copy_id]
    );
    */

    // For now, using OPTION 1 - Delete logs first
    await query(
      'DELETE FROM inventory_logs WHERE copy_id = ?',
      [copy.copy_id]
    );

    // Now delete the copy (this won't fail anymore)
    await query(
      'DELETE FROM book_copies WHERE copy_id = ?',
      [copy.copy_id]
    );
  }

  // Check if book still has any copies
  const remainingCopies = await query(
    'SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?',
    [bookId]
  );

  if (remainingCopies[0].count === 0) {
    console.warn(`⚠️ Warning: Book ${bookId} now has 0 copies!`);
  }
}

// 🔸 ALTERNATIVE: Decrease Copies with History Preservation
async function decreaseCopiesPreserveHistory(bookId, quantity) {
  // Get available copies (only delete Available copies)
  const availableCopies = await query(`
    SELECT copy_id FROM book_copies 
    WHERE book_id = ? AND status = 'Available' 
    ORDER BY copy_id DESC
    LIMIT ?
  `, [bookId, quantity]);

  if (availableCopies.length < quantity) {
    throw new Error(
      `Cannot remove ${quantity} copies. Only ${availableCopies.length} available copies found. ` +
      `(Borrowed, Lost, or Damaged copies cannot be removed)`
    );
  }

  // First, modify the foreign key constraint to allow cascading updates
  // You need to run this SQL command in your database:
  /*
  ALTER TABLE inventory_logs 
  DROP FOREIGN KEY inventory_logs_ibfk_1;
  
  ALTER TABLE inventory_logs 
  ADD CONSTRAINT inventory_logs_ibfk_1 
  FOREIGN KEY (copy_id) REFERENCES book_copies(copy_id) 
  ON DELETE SET NULL ON UPDATE CASCADE;
  */

  // Process each copy for removal
  for (const copy of availableCopies) {
    // Log the removal action
    const logId = Math.floor(Math.random() * 9000000000) + 1000000000;
    await query(`
      INSERT INTO inventory_logs (log_id, copy_id, action, performed_by) 
      VALUES (?, ?, 'Removed', 'Librarian')
    `, [logId.toString(), copy.copy_id]);

    // With the modified foreign key constraint, this will automatically
    // set copy_id to NULL in inventory_logs when the copy is deleted
    await query(
      'DELETE FROM book_copies WHERE copy_id = ?',
      [copy.copy_id]
    );
  }

  // Check if book still has any copies
  const remainingCopies = await query(
    'SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?',
    [bookId]
  );

  if (remainingCopies[0].count === 0) {
    console.warn(`⚠️ Warning: Book ${bookId} now has 0 copies!`);
  }
}

// 🔸 Get Book Copy Count
router.get("/:book_id/copies/count", async (req, res) => {
  const { book_id } = req.params;

  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_copies,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_copies,
        SUM(CASE WHEN status = 'Borrowed' THEN 1 ELSE 0 END) as borrowed_copies,
        SUM(CASE WHEN status IN ('Lost', 'Damaged') THEN 1 ELSE 0 END) as unavailable_copies
      FROM book_copies 
      WHERE book_id = ?
    `, [book_id]);

    if (result[0].total_copies === 0) {
      return res.status(404).json({ 
        error: 'No copies found for this book' 
      });
    }

    res.json({
      book_id,
      ...result[0]
    });

  } catch (error) {
    console.error('❌ Get copy count error:', error);
    res.status(500).json({ 
      error: 'Failed to get copy count' 
    });
  }
});

// 🔸 Get All Copies for a Book
router.get("/:book_id/copies", async (req, res) => {
  const { book_id } = req.params;

  try {
    const copies = await query(`
      SELECT 
        copy_id, 
        barcode, 
        status, 
        book_condition, 
        location, 
        date_added
      FROM book_copies 
      WHERE book_id = ? 
      ORDER BY copy_id ASC
    `, [book_id]);

    res.json({
      book_id,
      total_copies: copies.length,
      copies
    });

  } catch (error) {
    console.error('❌ Get copies error:', error);
    res.status(500).json({ 
      error: 'Failed to get book copies' 
    });
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