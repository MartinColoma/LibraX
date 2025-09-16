import React from "react";
import styles from "./BookRowModal.module.css";

interface Book {
  book_id: number;
  title: string;
  subtitle?: string;
  publisher?: string;
  publication_year?: string;
  language?: string;
  category_name?: string;
}

interface Props {
  book: Book;
  onClose: () => void;
}

const BookRowModal: React.FC<Props> = ({ book, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{book.title}</h2>
        <p><strong>Subtitle:</strong> {book.subtitle || "N/A"}</p>
        <p><strong>Publisher:</strong> {book.publisher || "N/A"}</p>
        <p><strong>Year:</strong> {book.publication_year || "N/A"}</p>
        <p><strong>Language:</strong> {book.language || "N/A"}</p>
        <p><strong>Category:</strong> {book.category_name || "N/A"}</p>
        <button onClick={onClose} className={styles.closeBtn}>Close</button>
      </div>
    </div>
  );
};

export default BookRowModal;
