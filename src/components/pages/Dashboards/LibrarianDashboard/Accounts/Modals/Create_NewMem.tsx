import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './Create_NewMem.module.css';
import { X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

interface Props {
  onClose: () => void;
}

const CreateNewMemberModal: React.FC<Props> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    studentId: '',
    nfcUid: '',
    status: 'Active',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/users/member', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        student_id: formData.studentId,
        nfc_uid: formData.nfcUid,
        status: formData.status,
        password: formData.password, // ✅ included for manual login fallback
      });

      alert(response.data.message || 'Member created successfully!');

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        studentId: '',
        nfcUid: '',
        status: 'Active',
        password: '',
      });

      onClose();
    } catch (error: any) {
      if (error.response) {
        alert(error.response.data.error || 'Failed to create member');
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
        <h2 className={styles.modalTitle}>Register New Member</h2>

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
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Student ID</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="University-issued ID"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>NFC UID</label>
              <input
                type="text"
                name="nfcUid"
                value={formData.nfcUid}
                onChange={handleChange}
                placeholder="Scan or enter NFC UID"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* ✅ Password Field with Show/Hide Toggle */}
          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter secure password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Member'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateNewMemberModal;
