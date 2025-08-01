import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Book {
  book_id: number;
  title: string;
  category_name: string | null;
}

const BooksTestPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    axios.get<Book[]>("http://localhost:5000/books")
      .then(res => setBooks(res.data))
      .catch(err => console.error("Error fetching books:", err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Database Test: Books</h1>
      {books.length > 0 ? (
        <ul>
          {books.map(book => (
            <li key={book.book_id}>
              {book.title} — <em>{book.category_name || "No Category"}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading or no data found...</p>
      )}
    </div>
  );
};

export default BooksTestPage;
