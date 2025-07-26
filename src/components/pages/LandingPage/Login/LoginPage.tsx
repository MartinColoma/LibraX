import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import usePageMeta from '../../../../hooks/usePageMeta';

const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  usePageMeta("HOK - Login", "HoKLibrary 128x128.png");

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API

      if (formData.email === 'admin@example.com' && formData.password === 'admin123') {
        navigate('/librarian/dashboard'); // Adjust route as needed
      } else {
        setErrors(prev => ({
          ...prev,
          password: 'Invalid credentials. Please try again.'
        }));
      }

    } catch {
      setErrors(prev => ({
        ...prev,
        password: 'Login failed. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Back to home
  };

  return (
    <div className="staff-login-page">
      <div className="page-container">
        <div className="page-content">
          <div className="staff-login-container">
            {/* Logo Section */}
            <div className="staff-login-header">
              <div className="library-logo">
                <div className="library-books">
                  <div className="book"></div>
                  <div className="book"></div>
                  <div className="book"></div>
                  <div className="book"></div>
                  <div className="book"></div>
                </div>
                <h1 className="library-title">
                  <span className="hok">HoK</span><span className="library">Library</span>
                </h1>
                <p className="library-subtitle">Management System</p>
              </div>
            </div>

            {/* Divider */}
            <div className="vertical-divider"></div>

            {/* Login Form Section */}
            <div className="login-section">
              <h2 className="login-title">STAFF LOGIN</h2>

              <form onSubmit={handleSubmit} className="staff-login-form">
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="email" className="form-label">Email:</label>
                  {errors.email && <div className="form-error-inline">{errors.email}</div>}
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">Password:</label>
                  {errors.password && <div className="form-error-inline">{errors.password}</div>}
                </div>
                <div className="password-input-container-floating">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input with-floating-icon"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn-floating"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>




                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner">
                      <Loader2 size={20} className="animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    'Login'
                  )}
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary btn-large btn-full-width"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </form>
              {/* Demo Credentials */}
              {/* <div className={`demo-credentials`}>
                <p className={`demo-credentials-title`}>
                  Demo Credentials:
                </p>
                <p className={`demo-credentials-text`}>
                  Email: admin@example.com<br />
                  Password: password123
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
