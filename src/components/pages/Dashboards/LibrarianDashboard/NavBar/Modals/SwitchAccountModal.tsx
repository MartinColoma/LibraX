// src/components/modals/SwitchAccountModal.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import styles from './SwitchAccountModal.module.css';

interface Props {
  onClose: () => void;
}

const SwitchAccountModal: React.FC<Props> = ({ onClose }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Min 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(res => setTimeout(res, 1500));

      if (formData.email === 'admin@example.com' && formData.password === 'admin123') {
        window.location.href = '/librarian/dashboard/home';
      } else {
        setErrors(prev => ({
          ...prev,
          password: 'Invalid credentials'
        }));
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        password: 'Login failed. Try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormInvalid =
    !formData.email ||
    !/\S+@\S+\.\S+/.test(formData.email) ||
    !formData.password ||
    formData.password.length < 6;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.modalCloseBtn} onClick={onClose}><X size={18} /></button>
        <h2 className={styles.modalTitle}>Switch Account</h2>

        <form onSubmit={handleSubmit} className={styles.modalLoginForm}>
          <div className={styles.formGroup}>
            <label>Email:</label>
            {errors.email && <div className={styles.formError}>{errors.email}</div>}

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password:</label>
            {errors.password && <div className={styles.formError}>{errors.password}</div>}
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading || isFormInvalid}
          >
            {isLoading ? (
              <span className={styles.loadingSpinner}>
                <Loader2 size={16} className={styles.animateSpin} /> Signing In...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default SwitchAccountModal;
