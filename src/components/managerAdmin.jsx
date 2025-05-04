import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  LogOut,
  Camera,
  Package,
  Home,
  Menu,
  X,
  Edit,
  Trash2,
  Eye,
  Check,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Wrench,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ManagerAdmin = () => {
  const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState("");
  const [statusUpdateError, setStatusUpdateError] = useState("");

  useEffect(() => {
    // Get user from localStorage
    const user = localStorage.getItem("user");

    if (!user) {
      // Redirect to login if no user found
      window.location.href = "/";
      return;
    }

    setCurrentUser(user);

    // Fetch users from Firestore
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(firestore, "Users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        setIsLoadingUsers(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setIsLoadingUsers(false);
      }
    };

    // Fetch products from Firestore
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(firestore, "Products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort products by newest first
        productsList.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });

        setProducts(productsList);
        setIsLoadingProducts(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsLoadingProducts(false);
      }
    };

    // Fetch bookings from Firestore
    const fetchBookings = async () => {
      try {
        const bookingsCollection = collection(firestore, "Bookings");
        const bookingsSnapshot = await getDocs(bookingsCollection);
        const bookingsList = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort bookings by newest first
        bookingsList.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });

        setBookings(bookingsList);
        setIsLoadingBookings(false);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setIsLoadingBookings(false);
      }
    };

    fetchUsers();
    fetchProducts();
    fetchBookings();
  }, []);

  const navigateToAddProduct = () => {
    window.location.href = "/addnewproduct";
  };

  const navigateToEditProduct = (productId) => {
    window.location.href = `/editproduct/${productId}`;
  };

  const navigateToViewProduct = (productId) => {
    // Open the product in a new tab on the home page
    window.open(`/view-product/${productId}`, "_blank");
  };

  // New function to navigate to the bookingsList page
  const navigateToBookingsList = () => {
    window.location.href = "/bookingsList";
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק מוצר זה?")) {
      setIsDeleting(true);
      setDeleteError("");
      setDeleteSuccess("");

      try {
        // Delete the product from Firestore
        await deleteDoc(doc(firestore, "Products", productId));

        // Update the products list
        setProducts(products.filter((product) => product.id !== productId));
        setDeleteSuccess("המוצר נמחק בהצלחה");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess("");
        }, 3000);
      } catch (error) {
        console.error("Error deleting product:", error);
        setDeleteError("אירעה שגיאה במחיקת המוצר");

        // Clear error message after 3 seconds
        setTimeout(() => {
          setDeleteError("");
        }, 3000);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק הזמנה זו?")) {
      setIsDeleting(true);
      setDeleteError("");
      setDeleteSuccess("");

      try {
        // Delete the booking from Firestore
        await deleteDoc(doc(firestore, "Bookings", bookingId));

        // Update the bookings list
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
        setDeleteSuccess("ההזמנה נמחקה בהצלחה");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess("");
        }, 3000);
      } catch (error) {
        console.error("Error deleting booking:", error);
        setDeleteError("אירעה שגיאה במחיקת ההזמנה");

        // Clear error message after 3 seconds
        setTimeout(() => {
          setDeleteError("");
        }, 3000);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      setStatusUpdateSuccess("");
      setStatusUpdateError("");

      // Update the booking status in Firestore
      const bookingRef = doc(firestore, "Bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
      });

      // Update the bookings list
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      setStatusUpdateSuccess(
        `סטטוס ההזמנה עודכן ל-${getStatusInHebrew(newStatus)}`
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusUpdateSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error updating booking status:", error);
      setStatusUpdateError("אירעה שגיאה בעדכון סטטוס ההזמנה");

      // Clear error message after 3 seconds
      setTimeout(() => {
        setStatusUpdateError("");
      }, 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Format date function for readability
  const formatDate = (timestamp) => {
    if (!timestamp) return "לא זמין";

    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color for display
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "completed":
        return "text-blue-600";
      case "pending":
      default:
        return "text-yellow-600";
    }
  };

  // Get status icon for display
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-green-600" />;
      case "rejected":
        return <XCircle size={16} className="text-red-600" />;
      case "completed":
        return <Check size={16} className="text-blue-600" />;
      case "pending":
      default:
        return <AlertCircle size={16} className="text-yellow-600" />;
    }
  };

  // Get status in Hebrew for display
  const getStatusInHebrew = (status) => {
    switch (status) {
      case "approved":
        return "מאושר";
      case "rejected":
        return "נדחה";
      case "completed":
        return "הושלם";
      case "pending":
      default:
        return "ממתין";
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 flex flex-col md:flex-row"
      dir="rtl"
    >
      {/* Mobile menu button */}
      <div className="md:hidden bg-indigo-800 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">דף ניהול</h2>
        <button onClick={toggleSidebar} className="text-white">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-indigo-800 text-white w-full md:w-64 flex-shrink-0 md:flex flex-col ${
          sidebarOpen ? "flex" : "hidden"
        }`}
      >
        <div className="p-5 border-b border-indigo-700 hidden md:block">
          <h2 className="text-xl font-bold">דף ניהול</h2>
          <p className="text-indigo-300 text-sm mt-1">{currentUser}</p>
        </div>

        <nav className="flex-1 p-5">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSidebarOpen(false);
                }}
                className={`flex items-center space-x-2 w-full p-2 rounded ${
                  activeTab === "dashboard"
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <Home size={20} className="ml-2" />
                <span>דף הבית</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("products");
                  setSidebarOpen(false);
                }}
                className={`flex items-center space-x-2 w-full p-2 rounded ${
                  activeTab === "products"
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <Camera size={20} className="ml-2" />
                <span>מוצרים</span>
              </button>
            </li>
            <li>
              <button
                onClick={navigateToBookingsList}
                className={`flex items-center space-x-2 w-full p-2 rounded hover:bg-indigo-700`}
              >
                <Package size={20} className="ml-2" />
                <span>הזמנות</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-5 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="flex items-center text-white hover:text-indigo-300 transition-colors"
          >
            <LogOut size={20} className="ml-2" />
            <span>התנתקות</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
              ברוך הבא לדף הניהול
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-2">משתמשים</h2>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                  {users.length}
                </p>
                <p className="text-sm md:text-base text-gray-500 mt-2">
                  סך הכל משתמשים רשומים
                </p>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-2">מוצרים</h2>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                  {products.length}
                </p>
                <p className="text-sm md:text-base text-gray-500 mt-2">
                  סך הכל מוצרים
                </p>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-2">הזמנות</h2>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                  {bookings.length}
                </p>
                <p className="text-sm md:text-base text-gray-500 mt-2">
                  סך הכל הזמנות
                </p>
              </div>
            </div>

            {/* Recent Users */}
            <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  משתמשים
                </h3>
              </div>

              {isLoadingUsers ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          אימייל
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          סיסמה
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-500">
                              {user.password || "לא צוין"}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {users.length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="px-4 md:px-6 py-4 text-center text-sm text-gray-500"
                          >
                            לא נמצאו משתמשים
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  הזמנות אחרונות
                </h3>
              </div>

              {isLoadingBookings ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          שם לקוח
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          מצלמה
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          תאריך
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          סטטוס
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.email}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {booking.cameraName || "לא צוין"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.cameraCount > 1 &&
                                `כמות: ${booking.cameraCount}`}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {booking.date}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.time}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div
                              className={`text-sm flex items-center ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              <span className="mr-1">
                                {getStatusInHebrew(booking.status)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {bookings.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 md:px-6 py-4 text-center text-sm text-gray-500"
                          >
                            לא נמצאו הזמנות
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
              ניהול מוצרים
            </h1>

            {deleteSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 mb-4 rounded-lg flex items-center">
                <div className="bg-green-100 p-2 rounded-full ml-3">
                  <Check size={16} className="text-green-600" />
                </div>
                <span>{deleteSuccess}</span>
              </div>
            )}

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded-lg flex items-center">
                <div className="bg-red-100 p-2 rounded-full ml-3">
                  <X size={16} className="text-red-600" />
                </div>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <p className="text-gray-600 mb-3 md:mb-0">
                  פה תוכל לנהל את המוצרים שלך
                </p>
                <button
                  onClick={navigateToAddProduct}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  הוסף מוצר חדש
                </button>
              </div>

              {isLoadingProducts ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          תמונה
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          שם המוצר
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          סוג
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          מחיר
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          נוסף בתאריך
                        </th>
                        <th
                          scope="col"
                          className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <img
                              src={
                                product.imageUrl ||
                                "/src/assets/placeholder.png"
                              }
                              alt={product.name}
                              className="h-14 w-14 rounded-md object-cover"
                              onError={(e) => {
                                e.target.src = "/src/assets/placeholder.png";
                              }}
                            />
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.megapixels} MP
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-500">
                              {product.typeHebrew || "לא צוין"}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-indigo-700">
                              ₪{Math.round(product.price * 3.7)}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-xs text-gray-500">
                              {formatDate(product.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  navigateToViewProduct(product.id)
                                }
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors mr-1"
                                title="צפה במוצר"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  navigateToEditProduct(product.id)
                                }
                                className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors mr-1"
                                title="ערוך מוצר"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="מחק מוצר"
                                disabled={isDeleting}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-indigo-50 p-8 rounded-lg text-center">
                  <Camera size={48} className="mx-auto text-indigo-500 mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    אין מוצרים עדיין
                  </h3>
                  <p className="text-gray-600 mb-4">
                    התחל להוסיף מוצרים לחנות שלך
                  </p>
                  <button
                    onClick={navigateToAddProduct}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    הוסף מוצר ראשון
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
              ניהול הזמנות
            </h1>
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <p className="text-gray-600 mb-3 md:mb-0">
                  עקוב אחר ההזמנות של הלקוחות שלך
                </p>
                <div className="flex space-x-2">
                  <button className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors mr-2">
                    סנן
                  </button>
                  <button className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors">
                    ייצא
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50 p-8 rounded-lg text-center">
                <Package size={48} className="mx-auto text-indigo-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  אין הזמנות עדיין
                </h3>
                <p className="text-gray-600">הזמנות חדשות יופיעו כאן</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerAdmin;
