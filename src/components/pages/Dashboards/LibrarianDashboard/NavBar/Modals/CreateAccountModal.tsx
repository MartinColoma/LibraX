import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './CreateAccountModal.module.css';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const CreateAccountModal: React.FC<Props> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Librarian'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating Account:', formData);
    // TODO: Call your backend API here
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Create Librarian Account</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Full Name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Role
            <input
              type="text"
              name="role"
              value={formData.role}
              readOnly
            />
          </label>
          <button type="submit" className={styles.submitButton}>
            Create Account
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateAccountModal;
