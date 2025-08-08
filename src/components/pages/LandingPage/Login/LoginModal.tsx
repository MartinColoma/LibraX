import React, { useState, useRef, useEffect } from "react"; // ✅ added useRef, useEffect
import ReactDOM from "react-dom";
import axios from "axios";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import styles from "./LoginModal.module.css";

interface Props {
  onClose: () => void;
}

const LoginPage: React.FC<Props> = ({ onClose }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null); // ✅ create ref for email input

  // ✅ Auto-focus first input on modal open
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5001/auth",
        {
          email: formData.email.trim(),
          password: formData.password.trim(),
        },
        { withCredentials: true }
      );

      const staff = response.data.staff;
      const displayName =
        staff?.full_name || staff?.username || staff?.email || "Unknown User";

      sessionStorage.setItem("staff_name", displayName);
      window.location.href = "/librarian/dashboard/home";
    } catch (error: any) {
      if (error.response) {
        // Server responded with a status code
        if (error.response.status === 401) {
          setErrors((prev) => ({
            ...prev,
            password: "Invalid email or password",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            password: "Login failed. Try again.",
          }));
        }
      } else if (error.request) {
        // No response from server — likely connection error
        alert("Unable to connect to the server. Please check your network or try again later.");
        setIsLoading(false);
      } else {
        // Something else happened while setting up the request
        console.error("Axios error:", error.message);
        alert("An unexpected error occurred.");
      }
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
        <button className={styles.modalCloseBtn} onClick={onClose}>
          <X size={18} />
        </button>
        <h2 className={styles.modalTitle}>Staff Login</h2>

        <form onSubmit={handleSubmit} className={styles.modalLoginForm}>
          {/* Email Field */}
          <div className={styles.formGroup}>
            <label>Email:</label>
            {errors.email && <div className={styles.formError}>{errors.email}</div>}
            <input
              ref={emailInputRef} // ✅ focus on this input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label>Password:</label>
            {errors.password && (
              <div className={styles.formError}>{errors.password}</div>
            )}
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
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
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default LoginPage;
