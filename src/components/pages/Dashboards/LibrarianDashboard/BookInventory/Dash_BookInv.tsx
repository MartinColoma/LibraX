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
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [offset, setOffset] = useState(0);
  const [limit] = useState(5);
  const [allLoaded, setAllLoaded] = useState(false);

  // ✅ Track sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    sessionStorage.getItem("sidebarCollapsed") === "true"
  );

  // ✅ Fetch books from backend
  const fetchBooks = async (newOffset: number, reset = false) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/books?limit=${limit}&offset=${newOffset}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();

      if (reset) {
        setBooks(data);
        setDisplayedBooks(data);
        setAllLoaded(data.length < limit); // if fewer than limit, all loaded
      } else {
        setBooks((prev) => [...prev, ...data]);
        setDisplayedBooks((prev) => [...prev, ...data]);
        if (data.length < limit) setAllLoaded(true);
      }
    } catch (error) {
      console.error("❌ Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial fetch
  useEffect(() => {
    setOffset(0);
    fetchBooks(0, true);
  }, []);

  // ✅ Fetch books on search change (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setOffset(0);
      setAllLoaded(false);
      fetchBooks(0, true);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // ✅ Show more books incrementally
  const handleShowMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchBooks(nextOffset, false);
  };

  // ✅ Show less → Reset to first batch
  const handleShowLess = () => {
    setOffset(0);
    setAllLoaded(false);
    fetchBooks(0, true);
  };

  // ✅ Sidebar collapse listener
  useEffect(() => {
    const handleStorageChange = () => {
      setSidebarCollapsed(sessionStorage.getItem("sidebarCollapsed") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="page-layout">
      <Sidebar
        onCollapse={(state: boolean) => {
          setSidebarCollapsed(state);
          sessionStorage.setItem("sidebarCollapsed", String(state));
          window.dispatchEvent(new Event("storage"));
        }}
      />

      <main
        className="main-content"
        style={{
          marginLeft: sidebarCollapsed ? "85px" : "240px",
          transition: "margin 0.3s ease",
        }}
      >
        <div className="header-section">
          <h1 className="title-header">Book Inventory</h1>
        </div>

        {/* ✅ Filter container */}
        <div className="filter-container">
          <input
            type="text"
            placeholder="Search by title or ISBN..."
            className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            + Add Book
          </button>
        </div>

        <div className="table-container">
          {loading && books.length === 0 ? (
            <p className="loading-text">Loading books...</p>
          ) : (
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
                {displayedBooks.length > 0 ? (
                  displayedBooks.map((book) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>
                      No books found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {loading && books.length > 0 && (
            <p className="loading-text">Loading...</p>
          )}
        </div>

        {/* ✅ Show More / Show Less */}
        <div className="show-more-container">
          {allLoaded ? (
            <button
              className="show-more-btn"
              onClick={handleShowLess}
              disabled={loading}
            >
              Show Less
            </button>
          ) : (
            <button
              className="show-more-btn"
              onClick={handleShowMore}
              disabled={loading}
            >
              Show More
            </button>
          )}
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
