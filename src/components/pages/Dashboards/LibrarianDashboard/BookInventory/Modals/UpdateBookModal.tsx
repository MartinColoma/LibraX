import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./UpdateBookModal.module.css";
import { X, Plus, Minus } from "lucide-react";

interface Book {
  book_id: number;
  title: string;
  category_name?: string;
  language?: string;
  quantity: number;
}

interface BookDetails {
  book_id: number;
  isbn: string;
  title: string;
  subtitle?: string;
  description?: string;
  publisher?: string;
  publication_year?: string;
  edition?: string;
  language: string;
  category_id?: number;
  category_name?: string;
  category_type?: string;
  authors: string[];
  copy_count: number;
  available_copies: number;
  borrowed_copies: number;
  unavailable_copies: number;
}

interface Props {
  bookToEdit: Book;
  onClose: () => void;
  refreshBooks: () => void;
}

interface Category {
  category_id: number;
  category_name: string;
  category_type: string;
}

interface Author {
  author_id: number;
  author_name: string;
}

interface CopyManagementResult {
  success: boolean;
  message: string;
  book_id: string;
  action: string;
  quantity: number;
  new_copy_count: number;
}

const UpdateBookModal: React.FC<Props> = ({ bookToEdit, onClose, refreshBooks }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    subtitle: "",
    description: "",
    publisher: "",
    publication_year: "",
    edition: "",
    language: "English",
    category_id: "",
    category_type: "fiction",
    authors: "",
  });

  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authorsList, setAuthorsList] = useState<Author[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Add Author Modal State
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorBio, setNewAuthorBio] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);

  // Copy Management State - CHANGED: Now tracks pending changes instead of applying immediately
  const [copyQuantity, setCopyQuantity] = useState(1);
  const [copyChanges, setCopyChanges] = useState<{
    action: 'increase' | 'decrease' | null;
    quantity: number;
  }>({
    action: null,
    quantity: 0
  });

  // Load book details when component mounts
  useEffect(() => {
    const loadBookDetails = async () => {
      try {
        setLoadingDetails(true);
        const response = await axios.get<BookDetails>(
          `http://localhost:5000/books/${bookToEdit.book_id}`
        );
        
        const bookDetails = response.data;
        setBookDetails(bookDetails);
        
        setFormData({
          isbn: bookDetails.isbn || "",
          title: bookDetails.title || "",
          subtitle: bookDetails.subtitle || "",
          description: bookDetails.description || "",
          publisher: bookDetails.publisher || "",
          publication_year: bookDetails.publication_year || "",
          edition: bookDetails.edition || "",
          language: bookDetails.language || "English",
          category_id: bookDetails.category_id?.toString() || "",
          category_type: bookDetails.category_type || "fiction",
          authors: bookDetails.authors.join(", "),
        });

        // Set category search if category exists
        if (bookDetails.category_name) {
          setCategorySearch(bookDetails.category_name);
        }

      } catch (error) {
        console.error("❌ Failed to load book details:", error);
        alert("Failed to load book details. Please try again.");
        onClose();
      } finally {
        setLoadingDetails(false);
      }
    };

    loadBookDetails();
  }, [bookToEdit.book_id, onClose]);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get<Category[]>(
          "http://localhost:5000/categories"
        );
        setCategories(res.data);
      } catch (error) {
        console.error("❌ Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Filter categories by type whenever category_type changes
  useEffect(() => {
    const filtered = categories.filter(
      (c) =>
        c.category_type.toLowerCase() ===
        formData.category_type.toLowerCase()
    );
    setFilteredCategories(filtered);
  }, [formData.category_type, categories]);

  // Live author search
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await axios.get<Author[]>(
          `http://localhost:5000/authors/search?q=${authorSearch}`
        );
        setAuthorsList(res.data);
      } catch (error) {
        console.error("❌ Failed to fetch authors:", error);
      }
    };
    if (authorSearch.trim().length > 0) fetchAuthors();
    else setAuthorsList([]);
  }, [authorSearch]);

  // CHANGED: Copy Management Functions - Now just track pending changes
  const handleCopyChange = (action: 'increase' | 'decrease') => {
    if (copyQuantity <= 0) {
      alert("⚠️ Please enter a valid quantity.");
      return;
    }

    // Check if trying to decrease more than available
    if (action === 'decrease' && bookDetails && copyQuantity > bookDetails.available_copies) {
      alert(`⚠️ Cannot remove ${copyQuantity} copies. Only ${bookDetails.available_copies} available copies.`);
      return;
    }

    setCopyChanges({ action, quantity: copyQuantity });
    alert(`📝 Copy change recorded: ${action} ${copyQuantity} cop${copyQuantity === 1 ? 'y' : 'ies'}. Click "Update Book" to apply all changes.`);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Reset category fields whenever category type changes
    if (name === "category_type") {
      setFormData({
        ...formData,
        category_type: value,
        category_id: "",
      });
      setCategorySearch("");
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // Add Author Function
  const handleAddAuthor = async () => {
    if (!newAuthorName.trim()) {
      alert("⚠️ Please enter an author name.");
      return;
    }

    setAddingAuthor(true);
    try {
      const response = await axios.post("http://localhost:5000/authors/add_author", {
        name: newAuthorName.trim(),
        biography: newAuthorBio.trim() || null,
      });

      if (response.status === 201) {
        alert(`✅ Author "${newAuthorName}" added successfully!`);
        
        // Add the new author to current authors list
        const currentAuthors = formData.authors ? formData.authors + ", " : "";
        setFormData({
          ...formData,
          authors: currentAuthors + newAuthorName.trim(),
        });

        // Reset add author form
        setNewAuthorName("");
        setNewAuthorBio("");
        setShowAddAuthor(false);
      }
    } catch (error: any) {
      console.error("❌ Error adding author:", error);
      alert(
        error.response?.data?.error ||
          "Failed to add author. Check the console for details."
      );
    } finally {
      setAddingAuthor(false);
    }
  };

  const validateStep = (stepToCheck = step) => {
    switch (stepToCheck) {
      case 1:
        return formData.isbn.trim() && formData.title.trim();
      case 2:
        const categoryValid = formData.category_id || 
          (categorySearch && filteredCategories.find(
            (cat) => cat.category_name.toLowerCase() === categorySearch.toLowerCase()
          ));
        return formData.category_type && categoryValid;
      case 3:
        return formData.authors.trim();
      case 4:
        return true; // Copy management step is always valid
      default:
        return true;
    }
  };

  // 🎯 UNIFIED METHOD - handles Next, Submit, and Enter key
  const handleProceed = async () => {
    if (!validateStep()) {
      alert("⚠️ Please fill in all required fields before continuing.");
      return;
    }

    // If not on final step, go to next step
    if (step < 4) {
      setStep(prev => prev + 1);
      return;
    }

    // Final step - submit the form
    await submitForm();
  };

  // CHANGED: submitForm now handles both book updates AND copy management
  const submitForm = async () => {
    // Ensure category_id is set before submitting
    let finalFormData = { ...formData };
    if (!formData.category_id && categorySearch) {
      const match = filteredCategories.find(
        (cat) => cat.category_name.toLowerCase() === categorySearch.toLowerCase()
      );
      if (match) {
        finalFormData.category_id = match.category_id.toString();
      } else {
        alert("⚠️ Please select a valid category from the dropdown.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1️⃣ First, update the book information
      const bookUpdateResponse = await axios.put(
        `http://localhost:5000/books/update_book/${bookToEdit.book_id}`,
        {
          ...finalFormData,
          authors: finalFormData.authors.split(",").map((a) => a.trim()).filter(Boolean),
        }
      );

      console.log("Book update response:", bookUpdateResponse.data);

      if (bookUpdateResponse.status !== 200) {
        throw new Error("Failed to update book information");
      }

      // 2️⃣ Then, handle copy management if there are pending changes
      if (copyChanges.action && copyChanges.quantity > 0) {
        const copyResponse = await axios.put<CopyManagementResult>(
          `http://localhost:5000/books/${bookToEdit.book_id}/copies`,
          {
            action: copyChanges.action,
            quantity: copyChanges.quantity
          }
        );

        console.log("Copy management response:", copyResponse.data);

        if (!copyResponse.data.success) {
          throw new Error(copyResponse.data.message || "Failed to update copies");
        }
      }

      // 3️⃣ Success - show appropriate message
      let successMessage = "✅ Book information updated successfully!";
      if (copyChanges.action && copyChanges.quantity > 0) {
        successMessage += ` Also ${copyChanges.action}d ${copyChanges.quantity} cop${copyChanges.quantity === 1 ? 'y' : 'ies'}.`;
      }

      alert(successMessage);
      refreshBooks();
      onClose();

    } catch (error: any) {
      console.error("❌ Error updating book:", error);
      alert(
        error.response?.data?.error ||
        error.message ||
        "Failed to update book. Check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setStep(prev => prev - 1);

  // 🎯 Enter key uses the same unified method
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !showAddAuthor && step < 4) {
      e.preventDefault();
      handleProceed();
    }
  };

  const handleCategoryBlur = () => {
    const match = filteredCategories.find(
      (cat) =>
        cat.category_name.toLowerCase() === categorySearch.toLowerCase()
    );
    if (match) {
      setFormData({
        ...formData,
        category_id: match.category_id.toString(),
      });
    } else {
      setFormData({ ...formData, category_id: "" });
    }
  };

  // CHANGED: Calculate predicted copy count for display
  const getPredictedCopyCount = () => {
    if (!bookDetails || !copyChanges.action) return bookDetails?.copy_count || 0;
    
    if (copyChanges.action === 'increase') {
      return bookDetails.copy_count + copyChanges.quantity;
    } else {
      return bookDetails.copy_count - copyChanges.quantity;
    }
  };

  const getPredictedAvailableCopies = () => {
    if (!bookDetails || !copyChanges.action) return bookDetails?.available_copies || 0;
    
    if (copyChanges.action === 'increase') {
      return bookDetails.available_copies + copyChanges.quantity;
    } else {
      return bookDetails.available_copies - copyChanges.quantity;
    }
  };

  if (loadingDetails) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <p className="loading-text">Loading book details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.modalCloseBtn}>
          <X size={20} />
        </button>
        <h2>Update Book: {bookToEdit.title}</h2>

        {/* Step Indicator */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
            1
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
            2
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
            3
          </div>
          <div className={`${styles.step} ${step >= 4 ? styles.active : ""}`}>
            4
          </div>
        </div>

        {/* Step Labels */}
        <div className={styles.stepLabels}>
          <span className={step === 1 ? styles.activeLabel : ""}>Basic Info</span>
          <span className={step === 2 ? styles.activeLabel : ""}>Category</span>
          <span className={step === 3 ? styles.activeLabel : ""}>Authors</span>
          <span className={step === 4 ? styles.activeLabel : ""}>Copies</span>
        </div>

        {/* Add Author Modal */}
        {showAddAuthor && (
          <div className={styles.addAuthorModal}>
            <h3>Add New Author</h3>
            <input
              type="text"
              placeholder="Author Name *"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
            />
            <textarea
              placeholder="Biography (optional)"
              value={newAuthorBio}
              onChange={(e) => setNewAuthorBio(e.target.value)}
              rows={3}
            />
            <div className={styles.addAuthorButtons}>
              <button
                type="button"
                onClick={() => setShowAddAuthor(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAuthor}
                disabled={addingAuthor}
                className={styles.addBtn}
              >
                {addingAuthor ? "Adding..." : "Add Author"}
              </button>
            </div>
          </div>
        )}

        <form onKeyDown={handleKeyDown}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <label>
                ISBN <span className={styles.required}>*</span>
              </label>
              <input
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                required
              />

              <label>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <label>Subtitle</label>
              <input
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </>
          )}

          {/* Step 2: Publication & Category */}
          {step === 2 && (
            <>
              <label>Publisher</label>
              <input
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
              />

              <label>Publication Year</label>
              <input
                name="publication_year"
                value={formData.publication_year}
                onChange={handleChange}
              />

              <label>Edition</label>
              <input
                name="edition"
                value={formData.edition}
                onChange={handleChange}
              />

              <label>
                Category Type <span className={styles.required}>*</span>
              </label>
              <select
                name="category_type"
                value={formData.category_type}
                onChange={handleChange}
              >
                <option value="fiction">Fiction</option>
                <option value="non-fiction">Non-Fiction</option>
                <option value="special">Special</option>
              </select>

              <label>
                Category <span className={styles.required}>*</span>
              </label>
              <input
                name="category_id"
                value={
                  filteredCategories.find(
                    (c) =>
                      c.category_id.toString() === formData.category_id
                  )?.category_name || categorySearch
                }
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  const match = filteredCategories.find(
                    (cat) =>
                      cat.category_name.toLowerCase() === e.target.value.toLowerCase()
                  );
                  if (match) {
                    setFormData({
                      ...formData,
                      category_id: match.category_id.toString(),
                    });
                  } else {
                    setFormData({ ...formData, category_id: "" });
                  }
                }}
                onBlur={handleCategoryBlur}
                list="categories"
              />
              <datalist id="categories">
                {filteredCategories
                  .filter((cat) =>
                    cat.category_name
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())
                  )
                  .map((cat) => (
                    <option
                      key={cat.category_id}
                      value={cat.category_name}
                    />
                  ))}
              </datalist>

              <label>Language</label>
              <input
                name="language"
                value={formData.language}
                onChange={handleChange}
              />
            </>
          )}

          {/* Step 3: Authors */}
          {step === 3 && (
            <>
              <div className={styles.authorFieldContainer}>
                <label>
                  Authors <span className={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddAuthor(true)}
                  className={styles.addAuthorBtn}
                  title="Add New Author"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className={styles.authorInputContainer}>
                <input
                  name="authors"
                  value={formData.authors}
                  onChange={(e) => {
                    handleChange(e);
                    setAuthorSearch(
                      e.target.value.split(",").pop()?.trim() || ""
                    );
                  }}
                  list="authors"
                />
                <datalist id="authors">
                  {authorsList.map((author) => (
                    <option
                      key={author.author_id}
                      value={author.author_name}
                    />
                  ))}
                </datalist>
              </div>
            </>
          )}

          {/* CHANGED: Step 4: Copy Management - Now shows pending changes */}
          {step === 4 && bookDetails && (
            <>
              <div className={styles.copyManagementSection}>
                <h3>📚 Copy Management</h3>
                
                {/* Copy Status Display */}
                <div className={styles.copyStatusGrid}>
                  <div className={styles.copyStatusCard}>
                    <h4>Current Total</h4>
                    <span className={styles.copyCount}>{bookDetails.copy_count}</span>
                  </div>
                  <div className={styles.copyStatusCard}>
                    <h4>Available</h4>
                    <span className={styles.copyCount}>{bookDetails.available_copies}</span>
                  </div>
                  <div className={styles.copyStatusCard}>
                    <h4>Borrowed</h4>
                    <span className={styles.copyCount}>{bookDetails.borrowed_copies}</span>
                  </div>
                  <div className={styles.copyStatusCard}>
                    <h4>Unavailable</h4>
                    <span className={styles.copyCount}>{bookDetails.unavailable_copies}</span>
                  </div>
                </div>

                {/* CHANGED: Show pending changes */}
                {copyChanges.action && (
                  <div className={styles.pendingChanges}>
                    <h4>📋 Pending Changes</h4>
                    <p>
                      Will <strong>{copyChanges.action}</strong> {copyChanges.quantity} cop{copyChanges.quantity === 1 ? 'y' : 'ies'}
                    </p>
                    <p>
                      New Total: <strong>{bookDetails.copy_count}</strong> → <strong>{getPredictedCopyCount()}</strong>
                    </p>
                    <p>
                      New Available: <strong>{bookDetails.available_copies}</strong> → <strong>{getPredictedAvailableCopies()}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setCopyChanges({ action: null, quantity: 0 })}
                      className={styles.clearChangesBtn}
                    >
                      Clear Changes
                    </button>
                  </div>
                )}

                {/* Copy Management Controls */}
                <div className={styles.copyControls}>
                  <label>Quantity to Add/Remove:</label>
                  <div className={styles.quantityControls}>
                    <input
                      type="number"
                      min="1"
                      value={copyQuantity}
                      onChange={(e) => setCopyQuantity(parseInt(e.target.value) || 1)}
                      className={styles.quantityInput}
                    />
                    
                    <div className={styles.copyActionButtons}>
                      <button
                        type="button"
                        onClick={() => handleCopyChange('increase')}
                        className={styles.increaseBtn}
                        title="Add Copies"
                      >
                        <Plus size={16} />
                        Add Copies
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleCopyChange('decrease')}
                        disabled={bookDetails.available_copies === 0}
                        className={styles.decreaseBtn}
                        title="Remove Available Copies"
                      >
                        <Minus size={16} />
                        Remove Copies
                      </button>
                    </div>
                  </div>
                  
                  {bookDetails.available_copies === 0 && (
                    <p className={styles.warningText}>
                      ⚠️ No available copies to remove. Only available copies can be removed.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 🎯 NAVIGATION BUTTONS */}
          <div className={styles.navButtons}>
            {step > 1 && (
              <button type="button" onClick={handleBack} className={styles.backBtn}>
                Back
              </button>
            )}
            
            <button
              type="button"
              onClick={handleProceed}
              className={step < 4 ? styles.nextBtn : styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Updating..." : step < 4 ? "Next" : "Update Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateBookModal;