import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Trash2,
  RefreshCw,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { firestore } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

const UserManagement = () => {
  // Users list state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Current user information
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Show add user form
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  // New user form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Get current user data from localStorage
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);

    // For simplicity, we're assuming this page is only accessible to admins
    // In a real app, you would check the user's role in Firestore
    setIsAdmin(true);

    // Load users list on component mount
    fetchUsers();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const usersRef = collection(firestore, "Users");
      const querySnapshot = await getDocs(usersRef);

      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("אירעה שגיאה בטעינת רשימת המשתמשים");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHome = () => {
    window.location.href = "/managerAdmin";
  };

  // Check if user already exists
  const checkUserExists = async (email) => {
    try {
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking user:", error);
      throw error;
    }
  };

  // Handle adding a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAddingUser(true);
    setError("");
    setSuccess("");

    try {
      // Validate form inputs
      if (!email || !password || !fullName || !phoneNumber) {
        setError("אנא מלא את כל השדות הנדרשים");
        setIsAddingUser(false);
        return;
      }

      // Check if user already exists
      const userExists = await checkUserExists(email);
      if (userExists) {
        setError("משתמש עם כתובת דוא״ל זו כבר קיים במערכת");
        setIsAddingUser(false);
        return;
      }

      // Generate a unique ID for the user
      const userId = Date.now().toString();

      // Save user data to Firestore
      await addDoc(collection(firestore, "Users"), {
        uid: userId,
        email: email,
        password: password, // Note: storing passwords in plain text is NOT secure!
        fullName: fullName,
        phoneNumber: phoneNumber,
        createdAt: new Date(),
        role: "user", // Default role
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
      setShowPassword(false);

      // Show success message
      setSuccess("המשתמש נוסף בהצלחה");

      // Refresh users list
      fetchUsers();

      // Hide add user form
      setShowAddUserForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error adding user:", error);
      setError("אירעה שגיאה בהוספת המשתמש");
    } finally {
      setIsAddingUser(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, docId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
      setDeleteLoading(true);
      try {
        // Delete user document from Firestore
        await deleteDoc(doc(firestore, "Users", docId));

        // Update users list
        fetchUsers();
        setSuccess("המשתמש נמחק בהצלחה");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("אירעה שגיאה במחיקת המשתמש");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-full shadow-md mb-5">
            <User className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-indigo-900">ניהול משתמשים</h1>
          <p className="text-indigo-600 mt-1">צפייה, הוספה ומחיקת משתמשים</p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={navigateToHome}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowRight size={18} className="ml-1" />
            <span>חזרה לדף הבית</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors ml-4"
            >
              <UserPlus size={18} className="ml-1" />
              <span>{showAddUserForm ? "ביטול" : "הוסף משתמש"}</span>
            </button>

            <button
              onClick={fetchUsers}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
              disabled={isLoading}
            >
              <RefreshCw
                size={18}
                className={`ml-1 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>רענן רשימה</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          {/* Notifications */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Add User Form */}
          {showAddUserForm && (
            <div className="mb-6 p-4 border border-indigo-100 rounded-lg bg-indigo-50">
              <h2 className="text-xl font-bold mb-4">הוסף משתמש חדש</h2>

              <form onSubmit={handleAddUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-right text-indigo-900 mb-1"
                    >
                      דוא"ל *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                      placeholder="הכנס את הדוא״ל"
                    />
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-right text-indigo-900 mb-1"
                    >
                      סיסמה *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                        placeholder="הכנס סיסמה"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Full Name Input */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-right text-indigo-900 mb-1"
                    >
                      שם מלא *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                      placeholder="הכנס שם מלא"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-right text-indigo-900 mb-1"
                    >
                      מספר טלפון *
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                      placeholder="הכנס מספר טלפון"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingUser}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors"
                  >
                    {isAddingUser ? (
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
                        <span>הוסף משתמש</span>
                        <ArrowLeft size={18} className="mr-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div>
            <h2 className="text-xl font-bold mb-4">רשימת משתמשים</h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">לא נמצאו משתמשים במערכת</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-indigo-50 text-indigo-800">
                      <th className="py-3 px-4 text-right">שם מלא</th>
                      <th className="py-3 px-4 text-right">דוא"ל</th>
                      <th className="py-3 px-4 text-right">טלפון</th>
                      <th className="py-3 px-4 text-right">תפקיד</th>
                      <th className="py-3 px-4 text-center">מחק</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{user.fullName}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{user.phoneNumber}</td>
                        <td className="py-3 px-4">
                          {user.role === "admin" ? (
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                              מנהל
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              משתמש רגיל
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteUser(user.uid, user.id)}
                            disabled={
                              user.uid === currentUserId ||
                              user.role === "admin"
                            }
                            className={`p-2 rounded-full transition-colors ${
                              user.uid === currentUserId ||
                              user.role === "admin"
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-red-500 hover:text-red-700 hover:bg-red-50"
                            }`}
                            title={
                              user.uid === currentUserId
                                ? "לא ניתן למחוק את המשתמש הנוכחי"
                                : user.role === "admin"
                                ? "לא ניתן למחוק מנהל"
                                : "מחק משתמש"
                            }
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
