import React, { useEffect, useState } from "react";
import Sidebar from "../NavBar/DashNavBar";
import "./Dash_BookInv.css";
import usePageMeta from "../../../../../hooks/usePageMeta";
import BookRowModal from "./Modals/BookRowModal";
import AddBookModal from "./Modals/AddBookModal";

interface Book {
  book_id: number;
  isbn: string;
  title: string;
  subtitle?: string;
  publisher?: string;
  publication_year?: string;
  language?: string;
  category_name?: string;
}

const Dash_BookInv: React.FC = () => {
  usePageMeta("Dashboard - Book Inventory", "HoKLibrary 128x128.png");

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch book data from backend
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("http://localhost:5000/books");
        const data = await res.json();
        setBooks(data);
      } catch (error) {
        console.error("❌ Error fetching books:", error);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="header-section">
          <h1 className="title-header">Book Inventory</h1>
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            + Add Book
          </button>
        </div>

        <div className="table-container">
          <table className="book-table">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>ISBN</th>
                <th>Title</th>
                <th>Subtitle</th>
                <th>Publisher</th>
                <th>Year</th>
                <th>Language</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr
                  key={book.book_id}
                  onClick={() => setSelectedBook(book)}
                  className="clickable-row"
                >
                  <td>{book.book_id}</td>
                  <td>{book.isbn}</td>
                  <td>{book.title}</td>
                  <td>{book.subtitle || "-"}</td>
                  <td>{book.publisher || "-"}</td>
                  <td>{book.publication_year || "-"}</td>
                  <td>{book.language || "-"}</td>
                  <td>{book.category_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row Modal */}
        {selectedBook && (
          <BookRowModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        {/* Add Book Modal */}
        {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}
      </main>
    </div>
  );
};

export default Dash_BookInv;
