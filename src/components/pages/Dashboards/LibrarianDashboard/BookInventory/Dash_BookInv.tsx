  import React, { useEffect, useState } from "react";
  import { Eye, Edit, Trash2 } from "lucide-react";
  import { useNavigate } from "react-router-dom";
  import Sidebar from "../NavBar/DashNavBar";
  import "./Dash_BookInv.css";
  import usePageMeta from "../../../../../hooks/usePageMeta";
  import BookRowModal from "./Modals/BookRowModal";
  import AddBookModal from "./Modals/AddBookModal";
  import RowToolsModal from "./Modals/RowToolsModal";

  export interface Book {
    book_id: number;
    title: string;
    category_name?: string;
    language?: string;
    quantity: number;
  }

  const Dash_BookInv: React.FC = () => {
    usePageMeta("Dashboard - Book Inventory", "HoKLibrary 128x128.png");
    const navigate = useNavigate();

    useEffect(() => {
      if (!sessionStorage.getItem("staff_name")) {
        navigate("/login", { replace: true });
      }
    }, [navigate]);

    const [books, setBooks] = useState<Book[]>([]);
    const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // Row tools modal
    const [rowToolsBook, setRowToolsBook] = useState<Book | null>(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const allSelected =
      displayedBooks.length > 0 &&
      displayedBooks.every((book) => selectedIds.includes(book.book_id));

    // Pagination
    const [offset, setOffset] = useState(0);
    const [limit] = useState(5);
    const [allLoaded, setAllLoaded] = useState(false);

    // Sidebar collapse
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
      sessionStorage.getItem("sidebarCollapsed") === "true"
    );
  const [totalBooks, setTotalBooks] = useState(0); // track total DB rows

  const fetchBooks = async (newOffset: number, reset = false) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/books?limit=${limit}&offset=${newOffset}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();

      setTotalBooks(data.total || 0); // store DB row count

      if (reset) {
        setBooks(data.books);
        setDisplayedBooks(data.books);
        setAllLoaded(data.books.length < limit);
        setSelectedIds([]);
      } else {
        setBooks((prev) => [...prev, ...data.books]);
        setDisplayedBooks((prev) => [...prev, ...data.books]);
        if (data.books.length < limit) setAllLoaded(true);
      }
    } catch (error) {
      console.error("❌ Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };


    useEffect(() => {
      setOffset(0);
      fetchBooks(0, true);
    }, []);

    useEffect(() => {
      const delayDebounce = setTimeout(() => {
        setOffset(0);
        setAllLoaded(false);
        fetchBooks(0, true);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleShowMore = () => {
      const nextOffset = offset + limit;
      setOffset(nextOffset);
      fetchBooks(nextOffset, false);
    };

    const handleShowLess = () => {
      setOffset(0);
      setAllLoaded(false);
      fetchBooks(0, true);
    };

    const toggleSelectAll = () => {
      if (allSelected) {
        setSelectedIds([]);
      } else {
        setSelectedIds(displayedBooks.map((b) => b.book_id));
      }
    };

    const toggleSelectRow = (id: number) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    useEffect(() => {
      const handleStorageChange = () => {
        setSidebarCollapsed(sessionStorage.getItem("sidebarCollapsed") === "true");
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Actions
    const handleView = (book: Book) => {
      setSelectedBook(book);
    };

    const handleEdit = async (book: Book) => {
      const updatedTitle = prompt("Enter new title:", book.title);
      if (!updatedTitle) return;

      try {
        const res = await fetch(
          `http://localhost:5000/books/update_book/${book.book_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...book, title: updatedTitle }),
          }
        );

        if (res.ok) {
          alert("✅ Book updated successfully!");
          fetchBooks(0, true);
        } else {
          const errData = await res.json();
          alert(`❌ Failed to update book: ${errData.error}`);
        }
      } catch (error) {
        console.error("Update error:", error);
      }
    };

    const handleDelete = async (book: Book) => {
      if (!window.confirm(`Are you sure you want to delete "${book.title}"?`))
        return;

      try {
        const res = await fetch(
          `http://localhost:5000/books/delete_book/${book.book_id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          alert("🗑️ Book deleted successfully!");
          setBooks((prev) => prev.filter((b) => b.book_id !== book.book_id));
          setDisplayedBooks((prev) => prev.filter((b) => b.book_id !== book.book_id));
          fetchBooks(0, true);
        } else {
          const errData = await res.json();
          alert(`❌ Failed to delete book: ${errData.error}`);
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    };
// Add this inside your Dash_BookInv component (near other handlers)

const handleBulkDelete = async () => {
  if (selectedIds.length === 0) return;

  if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected book(s)?`)) return;

  try {
    setLoading(true);
    const res = await fetch("http://localhost:5000/books/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (res.ok) {
      alert("🗑️ Selected books deleted successfully!");
      // Refresh books and clear selection
      setSelectedIds([]);
      fetchBooks(0, true);
    } else {
      const errData = await res.json();
      alert(`❌ Bulk delete failed: ${errData.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Bulk delete error:", error);
    alert("❌ Server error during bulk delete.");
  } finally {
    setLoading(false);
  }
};

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

          <div className="filter-container">
            <div className="filter-left">
              <input
                type="text"
                placeholder="Search by title..."
                className="search-box"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-right">
              {selectedIds.length > 0 && (
                <button
                  className="delete-btn"
                  onClick={handleBulkDelete}
                  disabled={loading}
                  title="Delete selected books"
                >
                  Delete Selected
                </button>
              )}
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                + Add Book
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading && books.length === 0 ? (
              <p className="loading-text">Loading books...</p>
            ) : (
              <table className="book-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Book ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Language</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBooks.length > 0 ? (
                    displayedBooks.map((book) => (
                      <tr
                        key={book.book_id}
                        className="clickable-row"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== "INPUT") {
                            setSelectedBook(book);
                          }
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(book.book_id)}
                            onChange={() => toggleSelectRow(book.book_id)}
                          />
                        </td>
                        <td>{book.book_id}</td>
                        <td>{book.title}</td>
                        <td>{book.category_name || "-"}</td>
                        <td>{book.language || "-"}</td>
                        <td>{book.quantity}</td>
                        <td className="action-buttons">
                          <button
                            className="action-btn view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(book);
                            }}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(book);
                            }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete-row-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(book);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>
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
          <div className="show-more-container">
            {allLoaded ? (
              displayedBooks.length > limit && (
                <button
                  className="show-more-btn"
                  onClick={handleShowLess}
                  disabled={loading}
                >
                  Show Less
                </button>
              )
            ) : (
              totalBooks > displayedBooks.length && (
                <button
                  className="show-more-btn"
                  onClick={handleShowMore}
                  disabled={loading}
                >
                  Show More
                </button>
              )
            )}
          </div>

          {selectedBook && (
            <BookRowModal
              book={selectedBook}
              onClose={() => setSelectedBook(null)}
            />
          )}

          {rowToolsBook && (
            <RowToolsModal
              book={rowToolsBook}
              onClose={() => setRowToolsBook(null)}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {showAddModal && (
            <AddBookModal
              onClose={() => setShowAddModal(false)}
              refreshBooks={() => fetchBooks(0, true)}
            />
          )}
        </main>
      </div>
    );
  };

  export default Dash_BookInv;
