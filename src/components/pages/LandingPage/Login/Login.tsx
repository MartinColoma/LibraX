import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import "./Login.css";
import libraryImage from "../../../images/library_cover.png";
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
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

  const checkEmailExists = async (email: string) => {
    if (!email || errors.email) return;
    setCheckingEmail(true);
    try {
      const response = await axios.get("http://localhost:5001/auth/check-email", {
        params: { email },
      });
      if (!response.data.exists) {
        setErrors((prev) => ({ ...prev, email: "Email not registered" }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmailBlur = () => {
    checkEmailExists(formData.email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || checkingEmail || !validateForm()) return;
    if (errors.email) return;

    setIsLoading(true);

    try {
      console.log("🔐 Attempting login with email:", formData.email);

      const response = await axios.post(
        "http://localhost:5001/auth/login",
        {
          email: formData.email.trim(),
          password: formData.password.trim(),
        },
        { withCredentials: true }
      );

      console.log("✅ Login response received:", response.data);

      const user = response.data.user;

      if (!user) {
        console.error("❌ No user object in response");
        alert("Login failed: Invalid response from server");
        return;
      }

      console.log("👤 User data:", {
        user_type: user.user_type,
        role: user.role,
        full_name: user.full_name,
      });

      const displayName =
        user?.full_name || user?.username || user?.email || "Unknown User";

      // Store user info in sessionStorage
      try {
        sessionStorage.setItem("user_name", displayName);
        sessionStorage.setItem("user_role", user.role || "");
        sessionStorage.setItem("user_type", user.user_type || "");
        console.log("💾 User data stored in sessionStorage");
      } catch (storageError) {
        console.error("❌ SessionStorage error:", storageError);
      }


      if (user.user_type === "staff") {
        if (user.role === "Librarian") {
            navigate('/librarian/dashboard/home')

        } else if (user.role === "Admin") {
            navigate('/')
        } else {
            navigate('/')
        }
      } else if (user.user_type === "member") {
            navigate('/member/dashboard/home');
      }


      // Verify cookie was set by making a test request
      setTimeout(async () => {
        try {
          console.log("🔍 Verifying authentication cookie...");
          const verifyResponse = await axios.get(
            "http://localhost:5001/auth/verify",
            {
              withCredentials: true,
            }
          );
          console.log("✅ Cookie verification successful:", verifyResponse.data);

        } catch (verifyError: any) {
          console.error(
            "❌ Cookie verification failed:",
            verifyError.response?.data || verifyError.message
          );
          
          // If verify endpoint doesn't exist, just redirect anyway
          if (verifyError.response?.status === 404) {
            console.log("⚠️ Verify endpoint not found, redirecting anyway...");
          } else {
            alert(
              "Login succeeded but session verification failed. This might be a CORS issue. Check the console for details."
            );
          }
        }
      }, 150);
    } catch (error: any) {
      console.error("❌ Login error:", error);

      if (error.response?.status === 401) {
        setErrors((prev) => ({
          ...prev,
          password: "Incorrect email or password",
        }));
      } else if (error.request) {
        alert(
          "Unable to connect to the server. Please check:\n" +
            "1. Backend is running on port 5001\n" +
            "2. Network connection is stable\n" +
            "3. CORS is properly configured"
        );
      } else {
        alert("Unexpected error occurred: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormInvalid =
    !formData.email ||
    !!errors.email ||
    !formData.password ||
    formData.password.length < 6;

  return (
    <div className="pageContainer">
      <div className="modalContent">
        <div className="modalBody">
          {/* Left - Image Section */}
          <div className="imageSection">
            <img src={libraryImage} alt="Library" className="libraryImage" />
            <div className="imageOverlay">
              <h3 className="welcomeText">Welcome to</h3>
              <h2 className="libraryTitle">LibraX</h2>
              <p className="librarySubtitle">Portal Access</p>
            </div>
          </div>

          {/* Right - Form Section */}
          <div className="formSection">
            <h2 className="modalTitle">Login</h2>
            <form onSubmit={handleSubmit} className="modalLoginForm">
              <div className="formGroup">
                <label>Email</label>
                {errors.email && <div className="formError">{errors.email}</div>}
                <input
                  ref={emailInputRef}
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  disabled={isLoading}
                />
                {checkingEmail && (
                  <small>Checking email existence...</small>
                )}
              </div>

              <div className="formGroup">
                <label>Password</label>
                {errors.password && (
                  <div className="formError">{errors.password}</div>
                )}
                <div className="passwordInputContainer">
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
                    className="eyeBtn"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btnPrimary"
                disabled={isLoading || checkingEmail || isFormInvalid}
              >
                {isLoading ? (
                  <span className="loadingSpinner">
                    <Loader2 size={18} className="animateSpin" /> Signing In...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;