import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ArrowRight,
  Check,
  Info,
  X,
  Camera,
  MapPin,
  Wrench,
  Tag,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BookingAll = () => {
  // For the camera data
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    location: "",
    cameraCount: "1", // Changed to string instead of number
    includeAssembly: false,
    comments: "",
    cameraId: "", // To store which camera is being booked
    cameraName: "", // To store the camera name for reference
    imageUrl: "", // Added to store the camera image URL
  });

  // State for managing form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Get URL parameters and navigation
  const location = useLocation();
  const navigate = useNavigate();

  // Get today's date as the minimum date for the date picker
  const today = new Date().toISOString().split("T")[0];

  // Extract camera ID from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cameraId = queryParams.get("cameraId");

    if (cameraId) {
      fetchCameraDetails(cameraId);
      setFormData((prev) => ({
        ...prev,
        cameraId: cameraId,
      }));
    }
  }, [location]);

  // Calculate the discounted price
  const calculateDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return null;
    return (price - (price * discount) / 100).toFixed(2);
  };

  // Fetch camera details from Firestore
  const fetchCameraDetails = async (cameraId) => {
    setLoadingCamera(true);
    setCameraError("");

    try {
      const cameraRef = doc(firestore, "Products", cameraId);
      const cameraSnap = await getDoc(cameraRef);

      if (cameraSnap.exists()) {
        const cameraData = {
          id: cameraSnap.id,
          ...cameraSnap.data(),
        };
        setSelectedCamera(cameraData);

        // Update form data with camera details including the imageUrl
        setFormData((prev) => ({
          ...prev,
          cameraName: cameraData.name,
          imageUrl: cameraData.imageUrl || "", // Add the image URL to form data
        }));
      } else {
        setCameraError("המצלמה המבוקשת לא נמצאה");
      }
    } catch (error) {
      console.error("Error fetching camera details:", error);
      setCameraError("אירעה שגיאה בטעינת פרטי המצלמה");
    } finally {
      setLoadingCamera(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox separately
    if (type === "checkbox") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
      }));
      return;
    }

    // Handle camera count specially
    if (name === "cameraCount") {
      // Allow empty string (when deleting) or valid numbers 1-10
      if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 10)) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
      return;
    }

    // Handle other input types
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Basic validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.date ||
      !formData.time ||
      !formData.location
    ) {
      setErrorMessage("אנא מלא את כל שדות החובה");
      setIsSubmitting(false);
      return;
    }

    // Ensure camera count is valid before submission
    if (!formData.cameraCount || parseInt(formData.cameraCount) < 1) {
      setFormData((prev) => ({
        ...prev,
        cameraCount: "1",
      }));
    }

    try {
      // Add booking to Firestore with all data including imageUrl
      await addDoc(collection(firestore, "Bookings"), {
        ...formData,
        cameraCount: formData.cameraCount || "1", // Ensure it's never empty
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Show success message
      setSuccessMessage(
        "ההזמנה נשלחה בהצלחה! ניצור איתך קשר בהקדם. מעביר לדף הבית בעוד 5 שניות..."
      );
      setCountingDown(true);

      // Reset form but keep camera-related fields
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        location: "",
        cameraCount: "1", // Reset to string "1" instead of number 1
        includeAssembly: false,
        comments: "",
        cameraId: formData.cameraId, // Keep the camera ID
        cameraName: formData.cameraName, // Keep the camera name
        imageUrl: formData.imageUrl, // Keep the image URL
      });

      // Scroll to top to show the success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Set timeout to redirect to home page after 5 seconds
      setTimeout(() => {
        navigateToHome();
      }, 5000);
    } catch (error) {
      console.error("Error submitting booking:", error);
      setErrorMessage("אירעה שגיאה בשליחת ההזמנה. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate back to home page
  const navigateToHome = () => {
    navigate("/");
  };

  // State to track countdown visibility
  const [countingDown, setCountingDown] = useState(false);

  // Sale Label Component for the detail view
  const SaleLabel = ({ discount }) => {
    if (!discount || discount <= 0) return null;

    return (
      <div className="inline-flex items-center bg-red-500 text-white py-1 px-2 rounded-lg shadow-md mr-2">
        <Tag size={14} className="ml-1" />
        <span className="font-bold">{discount}%- הנחה</span>
      </div>
    );
  };

  // Display the price with discount if available
  const PriceDisplay = ({ price, discount }) => {
    const discountedPrice = calculateDiscountedPrice(price, discount);

    if (!discountedPrice) {
      return (
        <span className="font-medium text-indigo-900">
          {Math.round(price * 3.7)} ₪
        </span>
      );
    }

    return (
      <div>
        <span className="font-medium text-indigo-900">
          {Math.round(discountedPrice * 3.7)} ₪
        </span>
        <span className="text-xs text-gray-500 line-through mr-2">
          ₪ {Math.round(price * 3.7)}
        </span>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50"
      dir="rtl"
    >
      {/* Add custom animations to CSS */}
      <style>{`
        @keyframes pulseDiscount {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .discount-badge {
          animation: pulseDiscount 2s infinite;
        }
        
        @keyframes countdown {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        
        .animate-countdown {
          animation: countdown 5s linear forwards;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Back button */}
        <button
          onClick={navigateToHome}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowRight size={20} className="ml-2" />
          <span>חזרה לדף הראשי</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gray-50 p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-indigo-900">הזמנת מצלמה</h1>
            <p className="text-gray-600 mt-1">
              מלא את הפרטים הבאים כדי להזמין את המצלמה שלך
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="m-4 sm:m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <div className="bg-green-100 p-2 rounded-full ml-3">
                <Check size={20} className="text-green-600" />
              </div>
              <div className="flex-grow">
                <p className="text-green-800 font-medium">{successMessage}</p>
                {countingDown && (
                  <div className="w-full bg-green-200 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full animate-countdown"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <div className="bg-red-100 p-2 rounded-full ml-3">
                <X size={20} className="text-red-600" />
              </div>
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          {/* Selected camera details */}
          {loadingCamera ? (
            <div className="m-4 sm:m-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : selectedCamera ? (
            <div className="m-4 sm:m-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex flex-col sm:flex-row items-center">
                <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex justify-center relative">
                  {/* Sale Label on the image */}
                  {selectedCamera.discount > 0 && (
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white py-0.5 px-1.5 rounded text-xs font-bold discount-badge">
                      {selectedCamera.discount}%- הנחה
                    </div>
                  )}
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden shadow-md">
                    <img
                      src={
                        selectedCamera.imageUrl || "/src/assets/placeholder.png"
                      }
                      alt={selectedCamera.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = "/src/assets/placeholder.png";
                      }}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-3/4 text-center sm:text-right pr-4">
                  <div className="space-y-1">
                    <p className="font-medium text-indigo-900">
                      <span className="font-bold">שם: </span>
                      {selectedCamera.name}
                    </p>
                    <p className="font-medium text-indigo-900">
                      <span className="font-bold">סוג: </span>
                      {selectedCamera.typeHebrew}
                    </p>
                    <p className="font-medium text-indigo-900">
                      <span className="font-bold">מגה פיקסל: </span>
                      {selectedCamera.megapixels}
                    </p>
                    <p className="font-medium text-indigo-900">
                      <span className="font-bold">מחיר: </span>
                      <PriceDisplay
                        price={selectedCamera.price}
                        discount={selectedCamera.discount}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : cameraError ? (
            <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <div className="bg-red-100 p-2 rounded-full ml-3">
                <X size={20} className="text-red-600" />
              </div>
              <span className="text-red-800">{cameraError}</span>
            </div>
          ) : (
            <div className="m-4 sm:m-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <div className="bg-blue-100 p-2 rounded-full ml-3">
                <Info size={20} className="text-blue-600" />
              </div>
              <span className="text-blue-800">
                לא נבחרה מצלמה ספציפית. אנא חזור לדף הראשי ובחר מצלמה.
              </span>
            </div>
          )}

          {/* Booking form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                <User className="ml-2" size={20} />
                פרטים אישיים
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    שם מלא <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="ישראל ישראלי"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    דוא"ל <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="example@example.com"
                      required
                    />
                    <Mail
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    טלפון <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="05X-XXXXXXX"
                      required
                    />
                    <Phone
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                <Calendar className="ml-2" size={20} />
                פרטי ההזמנה
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    תאריך <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={today}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <Calendar
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    שעה <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">בחר שעה</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                    </select>
                    <Clock
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>

                {/* Location field */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    מיקום <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="כתובת מלאה למשלוח"
                      required
                    />
                    <MapPin
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>

                {/* Camera Count - Allow empty field for editing */}
                <div>
                  <label
                    htmlFor="cameraCount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    מספר מצלמות
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="cameraCount"
                      name="cameraCount"
                      value={formData.cameraCount}
                      onChange={handleInputChange}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1"
                    />
                    <Camera
                      size={18}
                      className="absolute right-3 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>

                {/* Include Assembly */}
                <div className="md:col-span-2">
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="includeAssembly"
                      name="includeAssembly"
                      checked={formData.includeAssembly}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex items-center">
                      <Wrench size={18} className="text-indigo-500 ml-2" />
                      <label
                        htmlFor="includeAssembly"
                        className="font-medium text-gray-700"
                      >
                        כולל הרכבה (תוספת תשלום)
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 mr-8">
                    סמן את האפשרות אם ברצונך שנרכיב את המצלמה עבורך
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="comments"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    הערות נוספות
                  </label>
                  <textarea
                    id="comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="הוסף הערות או בקשות מיוחדות כאן"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Information section */}
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex items-start">
              <Info size={20} className="text-indigo-500 ml-2 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-800 font-medium">מידע חשוב</p>
                <ul className="text-xs text-indigo-700 mt-1 list-disc list-inside space-y-1">
                  <li>שעות קבלה: ימים א'-ה' 09:00-17:00</li>
                  <li>ביטול הזמנה אפשרי עד 24 שעות לפני המועד</li>
                  <li>שירות הרכבה כרוך תוספת בתשלום </li>
                </ul>
              </div>
            </div>

            {/* Submit button */}
            <div className="border-t border-gray-200 pt-6 flex justify-end">
              <button
                type="button"
                onClick={navigateToHome}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg ml-3 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 ml-2"
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
                    שולח...
                  </>
                ) : (
                  "שלח הזמנה"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingAll;
