import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import {
  LogOut,
  Camera,
  Package,
  Home,
  Menu,
  X,
  User,
  Mail,
  Phone,
  ArrowRight,
  Check,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  Filter,
  Search,
  Trash,
  Edit,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BookingsList = () => {
  // State for bookings data
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for filtering and sorting
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // State for expanded booking details
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // State for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  // State for image modal
  const [selectedImage, setSelectedImage] = useState(null);

  // Navigation
  const navigate = useNavigate();

  // Fetch bookings from Firestore
  useEffect(() => {
    // Get user from localStorage
    const user = localStorage.getItem("user");

    if (!user) {
      // Redirect to login if no user found
      window.location.href = "/";
      return;
    }

    setCurrentUser(user);

    fetchBookings();
  }, [sortField, sortDirection, filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      let bookingsQuery = collection(firestore, "Bookings");

      // Apply filtering if not "all"
      if (filterStatus !== "all") {
        bookingsQuery = query(
          bookingsQuery,
          where("status", "==", filterStatus)
        );
      }

      // Apply sorting
      bookingsQuery = query(bookingsQuery, orderBy(sortField, sortDirection));

      const querySnapshot = await getDocs(bookingsQuery);

      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("אירעה שגיאה בטעינת ההזמנות. אנא נסה שוב מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle status update
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(firestore, "Bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
      });

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
      setError("אירעה שגיאה בעדכון סטטוס ההזמנה.");
    }
  };

  // Handle booking deletion
  const deleteBooking = async (bookingId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק הזמנה זו?")) {
      try {
        const bookingRef = doc(firestore, "Bookings", bookingId);
        await deleteDoc(bookingRef);

        // Update local state
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
      } catch (error) {
        console.error("Error deleting booking:", error);
        setError("אירעה שגיאה במחיקת ההזמנה.");
      }
    }
  };

  // Handle search filtering
  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();

    // If search query exists, filter by it
    if (searchQuery) {
      return (
        booking.fullName?.toLowerCase().includes(searchLower) ||
        booking.email?.toLowerCase().includes(searchLower) ||
        booking.phone?.includes(searchQuery) ||
        booking.location?.toLowerCase().includes(searchLower) ||
        booking.cameraName?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Navigate to home page
  const navigateToHome = () => {
    navigate("/");
  };

  // Navigate to manager admin dashboard
  const navigateToManagerAdmin = () => {
    navigate("/manageradmin");
  };

  // Navigate to products management
  const navigateToProducts = () => {
    navigate("/manageradmin");
    // You might need to pass state to tell ManagerAdmin to show products tab
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            ממתין
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            מאושר
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            בוטל
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            הושלם
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    if (typeof date === "string") {
      return date;
    }

    try {
      return new Date(date).toLocaleDateString("he-IL");
    } catch (error) {
      return "תאריך לא תקין";
    }
  };

  // Open image modal
  const openImageModal = (imageUrl, e) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex flex-col md:flex-row"
      dir="rtl"
    >
      {/* Mobile menu button */}
      <div className="md:hidden bg-indigo-800 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">ניהול הזמנות</h2>
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
                onClick={navigateToManagerAdmin}
                className="flex items-center space-x-2 w-full p-2 rounded hover:bg-indigo-700"
              >
                <Home size={20} className="ml-2" />
                <span>דף הבית</span>
              </button>
            </li>
            <li>
              <button
                onClick={navigateToProducts}
                className="flex items-center space-x-2 w-full p-2 rounded hover:bg-indigo-700"
              >
                <Camera size={20} className="ml-2" />
                <span>מוצרים</span>
              </button>
            </li>
            <li>
              <button className="flex items-center space-x-2 w-full p-2 rounded bg-indigo-700">
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
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <div className="bg-red-100 p-2 rounded-full ml-3">
                <X size={20} className="text-red-600" />
              </div>
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Filter and search bar */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="w-full md:w-auto mb-4 md:mb-0 flex flex-col sm:flex-row items-center">
                <div className="flex items-center mb-3 sm:mb-0 sm:ml-4">
                  <Filter size={18} className="text-indigo-500 ml-2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="pending">ממתין</option>
                    <option value="approved">מאושר</option>
                    <option value="completed">הושלם</option>
                    <option value="cancelled">בוטל</option>
                  </select>
                </div>

                <div className="flex items-center w-full sm:w-auto">
                  <div className="relative w-full">
                    <Search
                      size={18}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="חיפוש לפי שם, אימייל, טלפון..."
                      className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={fetchBookings}
                className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <RefreshCw size={16} className="ml-2" />
                רענן
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  לא נמצאו הזמנות התואמות את החיפוש
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          תאריך הזמנה
                          {sortField === "createdAt" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("fullName")}
                      >
                        <div className="flex items-center">
                          שם הלקוח
                          {sortField === "fullName" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        פרטי התקשרות
                      </th>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center">
                          תאריך הזמנה
                          {sortField === "date" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        מצלמה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        תמונה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        סטטוס
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <React.Fragment key={booking.id}>
                        <tr
                          className={`hover:bg-gray-50 ${
                            expandedBookingId === booking.id
                              ? "bg-indigo-50"
                              : ""
                          }`}
                          onClick={() =>
                            setExpandedBookingId(
                              expandedBookingId === booking.id
                                ? null
                                : booking.id
                            )
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.createdAt
                              ? formatDate(booking.createdAt)
                              : "לא צוין"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                <User size={16} className="text-indigo-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.fullName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Mail
                                  size={14}
                                  className="ml-1 text-gray-500"
                                />
                                {booking.email}
                              </div>
                              <div className="flex items-center mt-1">
                                <Phone
                                  size={14}
                                  className="ml-1 text-gray-500"
                                />
                                {booking.phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar
                                  size={14}
                                  className="ml-1 text-gray-500"
                                />
                                {booking.date}
                              </div>
                              <div className="flex items-center mt-1">
                                <Clock
                                  size={14}
                                  className="ml-1 text-gray-500"
                                />
                                {booking.time}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Camera
                                size={14}
                                className="ml-1 text-gray-500"
                              />
                              {booking.cameraName || "לא צוין"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {booking.imageUrl ? (
                              <button
                                className="bg-indigo-100 p-2 rounded-lg hover:bg-indigo-200 transition-colors"
                                onClick={(e) =>
                                  openImageModal(booking.imageUrl, e)
                                }
                              >
                                <ImageIcon
                                  size={16}
                                  className="text-indigo-600"
                                />
                              </button>
                            ) : (
                              <div className="text-gray-400">אין תמונה</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBooking(booking.id);
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="מחק הזמנה"
                              >
                                <Trash size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedBookingId(booking.id);
                                }}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="הצג פרטים נוספים"
                              >
                                {expandedBookingId === booking.id ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedBookingId === booking.id && (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 bg-indigo-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-medium text-indigo-900 mb-2">
                                    פרטי הזמנה נוספים
                                  </h3>
                                  <div className="space-y-2">
                                    <div className="flex items-start">
                                      <MapPin
                                        size={16}
                                        className="ml-2 mt-1 text-gray-500"
                                      />
                                      <div>
                                        <p className="text-sm font-medium">
                                          מיקום:
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          {booking.location}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start">
                                      <Camera
                                        size={16}
                                        className="ml-2 mt-1 text-gray-500"
                                      />
                                      <div>
                                        <p className="text-sm font-medium">
                                          מספר מצלמות:
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          {booking.cameraCount || 1}
                                        </p>
                                      </div>
                                    </div>

                                    {booking.includeAssembly && (
                                      <div className="flex items-center">
                                        <Wrench
                                          size={16}
                                          className="ml-2 text-indigo-500"
                                        />
                                        <p className="text-sm text-indigo-700">
                                          כולל הרכבה
                                        </p>
                                      </div>
                                    )}

                                    {booking.comments && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium">
                                          הערות:
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1 bg-white p-2 rounded border border-gray-200">
                                          {booking.comments}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-medium text-indigo-900 mb-2">
                                    עדכון סטטוס
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(
                                          booking.id,
                                          "pending"
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-md text-sm ${
                                        booking.status === "pending"
                                          ? "bg-yellow-200 text-yellow-800"
                                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                      }`}
                                    >
                                      ממתין
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(
                                          booking.id,
                                          "approved"
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-md text-sm ${
                                        booking.status === "approved"
                                          ? "bg-green-200 text-green-800"
                                          : "bg-green-100 text-green-700 hover:bg-green-200"
                                      }`}
                                    >
                                      מאושר
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(
                                          booking.id,
                                          "completed"
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-md text-sm ${
                                        booking.status === "completed"
                                          ? "bg-blue-200 text-blue-800"
                                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      }`}
                                    >
                                      הושלם
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(
                                          booking.id,
                                          "cancelled"
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-md text-sm ${
                                        booking.status === "cancelled"
                                          ? "bg-red-200 text-red-800"
                                          : "bg-red-100 text-red-700 hover:bg-red-200"
                                      }`}
                                    >
                                      בוטל
                                    </button>
                                  </div>

                                  {/* Image display in expanded view */}
                                  {booking.imageUrl && (
                                    <div className="mt-4">
                                      <h3 className="font-medium text-indigo-900 mb-2">
                                        תמונה
                                      </h3>
                                      <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                                        <img
                                          src={booking.imageUrl}
                                          alt="תמונת ההזמנה"
                                          className="w-full max-h-64 object-contain"
                                          onClick={(e) =>
                                            openImageModal(booking.imageUrl, e)
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative bg-white rounded-lg p-2 max-w-4xl max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1"
              onClick={closeImageModal}
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="מצלמה"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;
