import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './CreateAccountModal.module.css';
import { X } from 'lucide-react';
import axios from 'axios';

interface Props {
  onClose: () => void;
}

const CreateAccountModal: React.FC<Props> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    role: 'Librarian',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-suggest username from email if empty
    if (name === 'email' && !formData.username) {
      setFormData(prev => ({ ...prev, username: value.split('@')[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Combine first + last name to match backend field "fullName"
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      const response = await axios.post('http://localhost:5001/staff', {
        fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber
      });


      alert(response.data.message || 'Staff account created successfully!');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phoneNumber: '',
        role: 'Librarian',
        password: ''
      });

      onClose(); // Close modal
    } catch (error: any) {
      if (error.response) {
        alert(error.response.data.error || 'Failed to create staff account');
      } else {
        alert('Error connecting to the server');
      }
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.modalCloseBtn}>
          <X size={20} />
        </button>
        <h2 className={styles.modalTitle}>Create Staff Account</h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Auto or edit"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="Librarian">Librarian</option>
                <option value="Assistant">Assistant</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter secure password"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateAccountModal;
