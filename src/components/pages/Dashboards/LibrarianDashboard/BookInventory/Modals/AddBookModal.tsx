import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AddBookModal.module.css";
import { X, Plus } from "lucide-react";

interface Props {
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
  onProceed: () => void; // Changed from onNext to onProceed
}

const NavigationButtons: React.FC<NavProps> = ({
  step,
  maxStep,
  loading,
  onBack,
  onProceed, // Updated prop name
}) => {
  return (
    <div className={styles.navButtons}>
      {step > 1 && (
        <button type="button" onClick={onBack} className={styles.backBtn}>
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onProceed} // Uses unified handler
        className={step < maxStep ? styles.nextBtn : styles.submitBtn}
        disabled={loading}
      >
        {loading ? "Adding..." : step < maxStep ? "Next" : "Add Book"}
      </button>
    </div>
  );
};

const AddBookModal: React.FC<Props> = ({ onClose, refreshBooks }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    numCopies: 1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [authorsList, setAuthorsList] = useState<Author[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // ✅ NEW: Add Author Modal State
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorBio, setNewAuthorBio] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get<Category[]>(
          "http://localhost:5000/categories"
        );
        setCategories(res.data);
        setFilteredCategories(
          res.data.filter(
            (c) => c.category_type.toLowerCase() === "fiction"
          )
        );
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

  // ✅ NEW: Add Author Function
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
        
        // Add the new author to current authors list and form
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
        // ✅ FIXED: Better validation for category - either ID is set OR search matches exactly
        const categoryValid = formData.category_id || 
          (categorySearch && filteredCategories.find(
            (cat) => cat.category_name.toLowerCase() === categorySearch.toLowerCase()
          ));
        return formData.category_type && categoryValid;
      case 3:
        return formData.authors.trim() && formData.numCopies > 0;
      default:
        return true;
    }
  };

  // 🎯 UNIFIED METHOD - handles Next, Submit, and Enter key (same as UpdateBookModal)
  const handleProceed = async () => {
    if (!validateStep()) {
      alert("⚠️ Please fill in all required fields before continuing.");
      return;
    }

    // If not on final step, go to next step
    if (step < 3) {
      setStep(prev => prev + 1);
      return;
    }

    // Final step - submit the form
    await submitForm();
  };

  const submitForm = async () => {
    // ✅ FIXED: Ensure category_id is set before submitting
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
      const response = await axios.post(
        "http://localhost:5000/books/add_book",
        {
          ...finalFormData,
          authors: finalFormData.authors.split(",").map((a) => a.trim()),
        }
      );

      console.log("Server response:", response.data);

      if (response.status === 201 && response.data.message) {
        alert(response.data.message);
      } else {
        alert("✅ Book added successfully!");
      }

      // Clear form after success
      setFormData({
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
        numCopies: 1,
      });

      // ✅ Refresh table in parent component
      refreshBooks();

      onClose();
    } catch (error: any) {
      console.error("❌ Error adding book:", error);
      alert(
        error.response?.data?.error ||
          "Failed to add book. Check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // 🎯 Enter key uses the same unified method (same as UpdateBookModal)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !showAddAuthor) {
      e.preventDefault();
      handleProceed(); // Uses the same unified method
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

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.modalCloseBtn}>
          <X size={20} />
        </button>
        <h2>Add New Book</h2>

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

        {/* ✅ NEW: Add Author Modal */}
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
                placeholder="Enter ISBN here"
                required
              />

              <label>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter Book Title"
                required
              />

              <label>Subtitle</label>
              <input
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Enter Book Subtitle"
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter Book Description"
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
                placeholder="Enter Publishing Company"
              />

              <label>Publication Year</label>
              <input
                name="publication_year"
                value={formData.publication_year}
                onChange={handleChange}
                placeholder="Enter Year Published"
              />

              <label>Edition</label>
              <input
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                placeholder="Enter Book Edition"
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
                  // Check if the typed value matches any category immediately
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
                placeholder="Select Book Genre"
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
                placeholder="Enter Book Language"
              />
            </>
          )}

          {/* Step 3: Authors & Copies */}
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

              <label>
                Number of Copies <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="numCopies"
                min="1"
                value={formData.numCopies}
                onChange={handleChange}
              />
            </>
          )}

          <NavigationButtons
            step={step}
            maxStep={3}
            loading={loading}
            onBack={handleBack}
            onProceed={handleProceed} // Uses unified handler
          />
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;