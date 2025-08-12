import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./UpdateBookModal.module.css";
import { X, Plus } from "lucide-react";

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

interface NavProps {
  step: number;
  maxStep: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  nextBtnRef: React.RefObject<HTMLButtonElement>;
}

const NavigationButtons: React.FC<NavProps> = ({
  step,
  maxStep,
  loading,
  onBack,
  onNext,
  nextBtnRef,
}) => {
  return (
    <div className={styles.navButtons}>
      {step > 1 && (
        <button type="button" onClick={onBack} className={styles.backBtn}>
          Back
        </button>
      )}
      {step < maxStep ? (
        <button
          type="button"
          onClick={onNext}
          className={styles.nextBtn}
          ref={nextBtnRef}
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
          ref={nextBtnRef}
        >
          {loading ? "Updating..." : "Update Book"}
        </button>
      )}
    </div>
  );
};

const UpdateBookModal: React.FC<Props> = ({ bookToEdit, onClose, refreshBooks }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

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

  // Load book details when component mounts
  useEffect(() => {
    const loadBookDetails = async () => {
      try {
        setLoadingDetails(true);
        const response = await axios.get<BookDetails>(
          `http://localhost:5000/books/${bookToEdit.book_id}`
        );
        
        const bookDetails = response.data;
        
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
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      alert("⚠️ Please fill in all required fields before continuing.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      alert("⚠️ Please fill in all required fields before submitting.");
      return;
    }

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
      const response = await axios.put(
        `http://localhost:5000/books/update_book/${bookToEdit.book_id}`,
        {
          ...finalFormData,
          authors: finalFormData.authors.split(",").map((a) => a.trim()).filter(Boolean),
        }
      );

      console.log("Server response:", response.data);

      if (response.status === 200) {
        alert("✅ Book updated successfully!");
        refreshBooks();
        onClose();
      }
    } catch (error: any) {
      console.error("❌ Error updating book:", error);
      alert(
        error.response?.data?.error ||
          "Failed to update book. Check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  // Pressing Enter triggers Next/Submit button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !showAddAuthor) {
      e.preventDefault();
      nextBtnRef.current?.click();
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

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
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

          <NavigationButtons
            step={step}
            maxStep={3}
            loading={loading}
            onBack={handleBack}
            onNext={handleNext}
            nextBtnRef={nextBtnRef}
          />
        </form>
      </div>
    </div>
  );
};

export default UpdateBookModal;