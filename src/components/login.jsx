import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { firestore } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigateToHome = () => {
    window.location.href = "/home";
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("אנא מלא את כל השדות");
      setIsLoading(false);
      return;
    }

    try {
      // Create a query to check if a user with the provided email and password exists
      const usersRef = collection(firestore, "Users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Check if we found a match
      if (!querySnapshot.empty) {
        // User exists with the provided credentials
        console.log("Login successful!");

        // Save user email to local storage
        localStorage.setItem("user", email);

        // Redirect to managerAdmin page
        window.location.href = "/managerAdmin";
      } else {
        // No user found with these credentials
        setError("שם משתמש או סיסמה שגויים");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("אירעה שגיאה בתהליך ההתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Logo and Welcome Text */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-full shadow-md mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              <circle cx="12" cy="10" r="4"></circle>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-indigo-900">ברוכים הבאים</h1>
          <p className="text-indigo-600 mt-1">התחבר לחשבון שלך</p>
        </div>

        {/* Back Button */}
        <button
          onClick={navigateToHome}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowRight size={18} className="ml-1" />
          <span>חזרה</span>
        </button>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-right text-indigo-900 mb-2"
              >
                דוא"ל
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                placeholder="הכנס את הדוא״ל שלך"
              />
            </div>

            {/* Password Input */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-right text-indigo-900 mb-2"
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                  placeholder="הכנס את הסיסמה שלך"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-500" />
                  ) : (
                    <Eye size={20} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <span>התחבר</span>
                  <ArrowLeft size={18} className="mr-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
