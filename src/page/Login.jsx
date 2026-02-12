import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../library/axios";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/User/AuthContext";
import UserContext from "../context/User/UserContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLogin = async () => {
    // Validate inputs
    if (!username || !password) {
      toast.error("Please fill in all fields", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/login", {
        EmployeeId: username,
        EmployeePassword: password,
      });

      // Check if login was successful
      if (
        response.data.status === "200" &&
        response.data.message === "Login successful"
      ) {
        // Store user data and token in localStorage
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem(
          "userData",
          JSON.stringify(response.data.employee)
        );
        login(response.data.token); // Update context state
        setUser(response.data.employee); // Update user context

        // Show success toast with custom styling
        toast.success(
          `🎉 Welcome back, ${response.data.employee.EmployeeName}!`,
          {
            position: "top-right",
            autoClose: 1000,
            onClose: () => {
              // Navigate after toast closes
              navigate("/dashboard");
            },
          }
        );
      } else {
        toast.error(response.data.message || "Login failed", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle different error scenarios
      let errorMessage = "An error occurred during login";
      let errorIcon = "❌";

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = "Invalid credentials";
          errorIcon = "🔒";
        } else if (error.response.status === 400) {
          errorMessage = "Invalid request format";
          errorIcon = "⚠️";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later";
          errorIcon = "🔧";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection";
        errorIcon = "🌐";
      }

      toast.error(`${errorIcon} ${errorMessage}`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#FEEDE2]">
      {/* Mobile Layout (smaller screens) */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-gray-200">
          {/* Header */}
          <div className="text-center mb-6">
            <img
              src="/icon-512.png"
              alt="ib-logo"
              className="w-30 p-2 h-40 mx-auto mb-2"
            />
            <h1 className="text-2xl font-bold text-[#Eb3241]">ABIS PRO CRM</h1>
            <p className="text-sm text-gray-600">Sign in to continue</p>
          </div>

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#Eb3241] focus:border-transparent transition-all"
                  placeholder="Enter your Employee ID"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#Eb3241] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#Eb3241] transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#Eb3241] text-white py-3 rounded-lg hover:bg-[#d12b39] disabled:opacity-80 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout (larger screens) */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Section - Branding */}
        <div className="flex-1 bg-[#005A9C] flex items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-white rounded-full"></div>
          </div>

          <div className="relative text-center text-white z-10 px-12">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-8">

                {/* Logo 1 */}
                <img
                  src="/ABIS1.jpg"
                  alt="Logo 1"
                  className="h-16 md:h-20 w-auto drop-shadow-2xl"
                />

                {/* Vertical Divider */}
                <div className="h-12 w-px bg-white/60"></div>

                {/* Logo 2 */}
                <img
                  src="/IB_logo.png"
                  alt="Logo 2"
                  className="h-16 md:h-20 w-auto drop-shadow-2xl"
                />

              </div>
            </div>

            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              AQUA CRM
            </h1>
            <p className="text-xl opacity-90 leading-relaxed max-w-md mx-auto">
              Streamline your customer relationships and boost productivity with
              our comprehensive CRM solution.
            </p>
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Advanced Analytics</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Real-time Collaboration</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Seamless Integration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 bg-[#E6F2FA] flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#005A9C] mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">Please sign in to your account</p>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Employee ID
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#99CBEA] focus:border-transparent focus:bg-white transition-all duration-200"
                    placeholder="Enter your Employee ID"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#99CBEA] focus:border-transparent focus:bg-white transition-all duration-200"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#99CBEA] transition-colors duration-200"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#99CBEA] text-white py-4 rounded-xl hover:bg-[#99CBEA] disabled:opacity-80 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
