import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../NavBar/DashNavBar";
import "./Dash_BookInv.css";
import usePageMeta from "../../../../../hooks/usePageMeta";
import BookRowModal from "./Modals/BookRowModal";
import AddBookModal from "./Modals/AddBookModal";
import UpdateBookModal from "./Modals/UpdateBookModal";
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
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Row tools modal
  const [rowToolsBook, setRowToolsBook] = useState<Book | null>(null);

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected =
    books.length > 0 &&
    books.every((book) => selectedIds.includes(book.book_id));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalBooks, setTotalBooks] = useState(0);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    sessionStorage.getItem("sidebarCollapsed") === "true"
  );

  // Calculate pagination values
  const totalPages = Math.ceil(totalBooks / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;

  const fetchBooks = async (page: number, search = searchQuery) => {
    try {
      setLoading(true);
      const pageOffset = (page - 1) * itemsPerPage;
      const res = await fetch(
        `http://localhost:5000/books?limit=${itemsPerPage}&offset=${pageOffset}&search=${encodeURIComponent(
          search
        )}&sortBy=book_id&sortOrder=DESC` // Add sorting by most recent first
      );
      const data = await res.json();

      setTotalBooks(data.total || 0);
      setBooks(data.books || []);
      setSelectedIds([]);
    } catch (error) {
      console.error("❌ Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchBooks(1);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setCurrentPage(1);
      fetchBooks(1, searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchBooks(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis logic
      if (currentPage <= 3) {
        // Show first 3 pages + ellipsis + last page
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show first page + ellipsis + last 3 pages
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Show first page + ellipsis + current page + ellipsis + last page
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    
    return pages;
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(books.map((b) => b.book_id));
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

  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);

  const handleEdit = (book: Book) => {
    setBookToEdit(book);
    setShowUpdateModal(true);
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
        // Refresh current page after deletion
        fetchBooks(currentPage);
      } else {
        const errData = await res.json();
        alert(`❌ Failed to delete book: ${errData.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
        setSelectedIds([]);
        fetchBooks(currentPage);
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
                Delete Row(s)
              </button>
            )}
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              + Add Book
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
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
                {books.length > 0 ? (
                  books.map((book) => (
                    <tr key={book.book_id} className="clickable-row">
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
        </div>

        {/* Pagination Controls */}
        {totalBooks > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {books.length > 0 ? offset + 1 : 0} to {Math.min(offset + itemsPerPage, totalBooks)} of {totalBooks} books
            </div>
            
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={handlePrevious}
                disabled={currentPage === 1 || loading}
                title="Previous page"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="page-numbers">
                {getPageNumbers().map((page, index) => (
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page as number)}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="pagination-btn"
                onClick={handleNext}
                disabled={currentPage === totalPages || loading}
                title="Next page"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

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
            refreshBooks={() => fetchBooks(currentPage)}
          />
        )}
        
        {showUpdateModal && bookToEdit && (
          <UpdateBookModal
            bookToEdit={bookToEdit}
            onClose={() => {
              setShowUpdateModal(false);
              setBookToEdit(null);
            }}
            refreshBooks={() => fetchBooks(currentPage)}
          />
        )}
      </main>
    </div>
  );
};

export default Dash_BookInv;