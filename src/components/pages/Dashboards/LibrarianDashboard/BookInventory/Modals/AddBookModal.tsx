import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./AddBookModal.module.css";
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
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
          {loading ? "Adding..." : "Add Book"}
        </button>
      )}
    </div>
  );
};

const AddBookModal: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    numCopies: 1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [authorsList, setAuthorsList] = useState<Author[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get<Category[]>(
          "http://localhost:5000/categories"
        );
        setCategories(res.data);
        setFilteredCategories(
          res.data.filter((c) => c.category_type.toLowerCase() === "fiction")
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
        c.category_type.toLowerCase() === formData.category_type.toLowerCase()
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


  const validateStep = (stepToCheck = step) => {
    switch (stepToCheck) {
      case 1:
        return formData.isbn.trim() && formData.title.trim();
      case 2:
        return formData.category_type && (formData.category_id || categorySearch);
      case 3:
        return formData.authors.trim() && formData.numCopies > 0;
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

    setLoading(true);
    try {
        const response = await axios.post("http://localhost:5000/add_book", {
        ...formData,
        authors: formData.authors.split(",").map((a) => a.trim()),
        });

        // ✅ Check server response
        console.log("Server response:", response.data);

        if (response.status === 201 && response.data.message) {
        alert(response.data.message);
        } else {
        alert("✅ Book added successfully!");
        }

        // ✅ Clear form after success
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

        onClose();
    } catch (error: any) {
        console.error("❌ Error adding book:", error);
        alert(error.response?.data?.error || "Failed to add book. Check the console for details.");
    } finally {
        setLoading(false);
    }
    };


  // ✅ Pressing Enter now triggers Next/Submit button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextBtnRef.current?.click();
    }
  };

  const handleCategoryBlur = () => {
    const match = filteredCategories.find(
      (cat) => cat.category_name.toLowerCase() === categorySearch.toLowerCase()
    );
    if (match) {
      setFormData({ ...formData, category_id: match.category_id.toString() });
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
                    (c) => c.category_id.toString() === formData.category_id
                  )?.category_name || categorySearch
                }
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setFormData({ ...formData, category_id: "" });
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
                    <option key={cat.category_id} value={cat.category_name} />
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

          {/* Step 3: Authors & Copies */}
          {step === 3 && (
            <>
              <label>
                Authors <span className={styles.required}>*</span>
              </label>
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
                  <option key={author.author_id} value={author.author_name} />
                ))}
              </datalist>

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
            onNext={handleNext}
            nextBtnRef={nextBtnRef}
          />
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
