// src/components/Dashboard/Books/Modals/RowToolsModal.tsx
import React from "react";
import styles from "./RowToolsModal.module.css";
import type { Book } from "../Dash_BookInv"; // If Book interface is exported

interface Props {
  book: Book;
  onClose: () => void;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate?: (book: Book) => void;
}

const RowToolsModal: React.FC<Props> = ({
  book,
  onClose,
  onView,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Actions for "{book.title}"</h2>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => {
              onView(book);
              onClose();
            }}
          >
            👁 View
          </button>

          <button
            className={styles.actionBtn}
            onClick={() => {
              onEdit(book);
              onClose();
            }}
          >
            ✏ Edit
          </button>

          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this book?")) {
                onDelete(book);
                onClose();
              }
            }}
          >
            🗑 Delete
          </button>

          {onDuplicate && (
            <button
              className={styles.actionBtn}
              onClick={() => {
                onDuplicate(book);
                onClose();
              }}
            >
              📄 Duplicate
            </button>
          )}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default RowToolsModal;
