import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { Camera, ArrowRight, Check, X, Upload, Info } from "lucide-react";

const AddNewProduct = () => {
  const [currentUser, setCurrentUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Product form state
  const [productData, setProductData] = useState({
    name: "",
    type: "",
    typeHebrew: "",
    price: "",
    megapixels: "",
    rating: "5.0",
    features: ["", "", "", ""],
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For type field, also update typeHebrew to be the same value
    if (name === "type") {
      setProductData({
        ...productData,
        type: value,
        typeHebrew: value, // Set typeHebrew to be the same as type
      });
    } else {
      setProductData({
        ...productData,
        [name]: value,
      });
    }
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...productData.features];
    updatedFeatures[index] = value;
    setProductData({
      ...productData,
      features: updatedFeatures,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);

      // Create image preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Reset any error messages
      setErrorMessage("");
    } else if (file) {
      setErrorMessage("אנא בחר קובץ תמונה תקין");
    }
  };

  const uploadImageToCloudinary = async (file) => {
    if (!file) return null;

    setIsUploading(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "rami123"); // Using the same upload preset from your VideoUploader

      // Upload to Cloudinary (image upload endpoint)
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/drrpopjnm/image/upload", // Your Cloudinary cloud name
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("העלאת התמונה נכשלה");
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const navigateBack = () => {
    window.location.href = "/managerAdmin";
  };

  const clearImage = () => {
    setImageFile(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Clean up the object URL
      setImagePreview(null);
    }

    setProductData({
      ...productData,
      imageUrl: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validate form
      if (
        !productData.name ||
        !productData.price ||
        !productData.type ||
        !productData.description
      ) {
        throw new Error("אנא מלא את כל השדות החובה");
      }

      if (!imageFile) {
        throw new Error("אנא העלה תמונה למוצר");
      }

      let imageUrl = "";

      try {
        // Upload image to Cloudinary
        imageUrl = await uploadImageToCloudinary(imageFile);

        if (!imageUrl) {
          throw new Error("העלאת התמונה נכשלה");
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error("העלאת התמונה נכשלה. אנא נסה שוב.");
      }

      // Convert price and megapixels to numbers and add the Cloudinary image URL
      const formattedData = {
        ...productData,
        price: parseFloat(productData.price),
        megapixels: parseFloat(productData.megapixels),
        rating: parseFloat(productData.rating),
        features: productData.features.filter(
          (feature) => feature.trim() !== ""
        ),
        imageUrl: imageUrl, // Use the Cloudinary URL
        createdAt: new Date(),
      };

      // Save to Firestore
      await addDoc(collection(firestore, "Products"), formattedData);

      setSuccessMessage("המוצר נוסף בהצלחה!");

      // Reset form after successful submission
      setProductData({
        name: "",
        type: "",
        typeHebrew: "",
        price: "",
        megapixels: "",
        rating: "5.0",
        features: ["", "", "", ""],
        description: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);

      // Redirect after a delay
      setTimeout(() => {
        window.location.href = "/managerAdmin";
      }, 2000);
    } catch (error) {
      console.error("Error adding product:", error);
      setErrorMessage(error.message || "אירעה שגיאה בהוספת המוצר");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Back button */}
        <button
          onClick={navigateBack}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowRight size={20} className="ml-2" />
          <span>חזרה לדף הניהול</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-indigo-900">
              הוספת מוצר חדש
            </h1>
            <p className="text-gray-600 mt-1">
              מלא את הפרטים כדי להוסיף מצלמה חדשה למערכת
            </p>
          </div>

          {successMessage && (
            <div className="m-4 sm:m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <div className="bg-green-100 p-2 rounded-full ml-3">
                <Check size={20} className="text-green-600" />
              </div>
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <div className="bg-red-100 p-2 rounded-full ml-3">
                <X size={20} className="text-red-600" />
              </div>
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Basic Info */}
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-4">
                  מידע בסיסי
                </h2>

                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    שם המוצר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="לדוגמה: DSLR Pro X5"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    סוג מצלמה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={productData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="הכנס סוג מצלמה"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      מחיר <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={productData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="לדוגמה: 1299.99"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="megapixels"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      מגה פיקסל <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="megapixels"
                      name="megapixels"
                      value={productData.megapixels}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="לדוגמה: 24.2"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="rating"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    דירוג (1-5)
                  </label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    value={productData.rating}
                    onChange={handleInputChange}
                    step="0.1"
                    min="1"
                    max="5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="לדוגמה: 4.8"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    תיאור המוצר <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={productData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="תיאור מפורט של המצלמה..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Right column - Features and Image */}
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-4">
                  תכונות ותמונה
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מאפיינים עיקריים <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    הוסף עד 4 מאפיינים עיקריים של המצלמה
                  </p>

                  {productData.features.map((feature, index) => (
                    <div key={index} className="mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) =>
                          handleFeatureChange(index, e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={`מאפיין ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תמונת המוצר <span className="text-red-500">*</span>
                  </label>

                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div>
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="mx-auto h-32 w-auto object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            הסר תמונה
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                            >
                              <span>העלה תמונה</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                            <p className="pr-1">או גרור לכאן</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG עד 5MB
                          </p>
                          <div className="flex justify-center mt-4">
                            <Camera size={40} className="text-gray-300" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    התמונה תועלה לשרת Cloudinary ושמורה בבסיס הנתונים
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg mb-4 flex items-start">
                  <Info size={20} className="text-indigo-500 ml-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-indigo-800 font-medium">
                      הערה חשובה
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      מוצרים חדשים יופיעו מיד בקטלוג המוצרים ויהיו זמינים
                      לרכישה. וודא שכל הפרטים נכונים.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6 flex justify-end">
              <button
                type="button"
                onClick={navigateBack}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg ml-3 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                {isLoading || isUploading ? (
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
                    {isUploading ? "מעלה תמונה..." : "מוסיף מוצר..."}
                  </>
                ) : (
                  "הוסף מוצר"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;
