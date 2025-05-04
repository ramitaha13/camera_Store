import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { firestore } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Camera, ArrowRight, Check, X, Info } from "lucide-react";

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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

  // Camera types mapping
  const cameraTypes = [
    { value: "DSLR", label: "מצלמת DSLR" },
    { value: "Mirrorless", label: "מצלמה ללא מראה" },
    { value: "Compact", label: "מצלמה קומפקטית" },
    { value: "Action", label: "מצלמת אקשן" },
  ];

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    // Fetch product data based on productId
    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        const productRef = doc(firestore, "Products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const data = productSnap.data();

          // Ensure features array has 4 elements
          const features = data.features || [];
          while (features.length < 4) {
            features.push("");
          }

          setProductData({
            name: data.name || "",
            type: data.type || "",
            typeHebrew: data.typeHebrew || "",
            price: data.price ? data.price.toString() : "",
            megapixels: data.megapixels ? data.megapixels.toString() : "",
            rating: data.rating ? data.rating.toString() : "5.0",
            features: features,
            description: data.description || "",
            imageUrl: data.imageUrl || "",
          });

          // Set image preview if image exists
          if (data.imageUrl) {
            setImagePreview(data.imageUrl);
          }
        } else {
          setErrorMessage("המוצר לא נמצא");
          setTimeout(() => {
            navigate("/managerAdmin");
          }, 2000);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setErrorMessage("אירעה שגיאה בטעינת המוצר");
      } finally {
        setIsFetching(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({
      ...productData,
      [name]: value,
    });

    // Auto-fill typeHebrew based on type selection
    if (name === "type") {
      const selectedType = cameraTypes.find((type) => type.value === value);
      if (selectedType) {
        setProductData((prev) => ({
          ...prev,
          typeHebrew: selectedType.label,
        }));
      }
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
      formData.append("upload_preset", "rami123"); // Using the same upload preset

      // Upload to Cloudinary
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
    navigate("/managerAdmin");
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

      // Check if there's a new image to upload
      let imageUrl = productData.imageUrl;
      if (imageFile) {
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
      }

      // Convert price and megapixels to numbers
      const formattedData = {
        ...productData,
        price: parseFloat(productData.price),
        megapixels: parseFloat(productData.megapixels),
        rating: parseFloat(productData.rating),
        features: productData.features.filter(
          (feature) => feature.trim() !== ""
        ),
        imageUrl: imageUrl,
        updatedAt: new Date(),
      };

      // Update the document in Firestore
      const productRef = doc(firestore, "Products", productId);
      await updateDoc(productRef, formattedData);

      setSuccessMessage("המוצר עודכן בהצלחה!");

      // Redirect after a delay
      setTimeout(() => {
        navigate("/managerAdmin");
      }, 2000);
    } catch (error) {
      console.error("Error updating product:", error);
      setErrorMessage(error.message || "אירעה שגיאה בעדכון המוצר");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div
        className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50"
        dir="rtl"
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-indigo-700">טוען את פרטי המוצר...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-indigo-900">עריכת מוצר</h1>
            <p className="text-gray-600 mt-1">עדכן את פרטי המוצר</p>
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
                  <select
                    id="type"
                    name="type"
                    value={productData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">בחר סוג מצלמה</option>
                    {cameraTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      מחיר (USD) <span className="text-red-500">*</span>
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
                    ניתן לשמור את המוצר עם התמונה הקיימת או להעלות תמונה חדשה
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg mb-4 flex items-start">
                  <Info size={20} className="text-indigo-500 ml-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-indigo-800 font-medium">
                      הערה חשובה
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      שינויים במוצר יופיעו מיד בקטלוג המוצרים. וודא שכל הפרטים
                      נכונים.
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
                    {isUploading ? "מעלה תמונה..." : "מעדכן מוצר..."}
                  </>
                ) : (
                  "שמור שינויים"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
