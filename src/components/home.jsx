import React, { useState, useEffect, useRef } from "react";
import { firestore } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Camera,
  Film,
  Check,
  Star,
  Zap,
  Shield,
  Award,
  Maximize,
  Info,
  Calendar,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
} from "lucide-react";

const HebrewCameraShowcase = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [assembleMessage, setAssembleMessage] = useState("");
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for mobile expanded card
  const [expandedCardId, setExpandedCardId] = useState(null);
  // State for fullscreen image
  const [fullscreenImage, setFullscreenImage] = useState(null);
  // Refs for scroll animation sections
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  const detailsRef = useRef(null);
  const ctaRef = useRef(null);

  // Fetch cameras from Firestore when component mounts
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setIsLoading(true);
        const productsCollection = collection(firestore, "Products");
        const productsSnapshot = await getDocs(productsCollection);

        if (productsSnapshot.empty) {
          console.log("No products found in Firestore");
        }

        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort products by newest first (if createdAt is available)
        productsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });

        setCameras(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("אירעה שגיאה בטעינת המוצרים. אנא נסה שוב מאוחר יותר.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // Scroll animation observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-reveal");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, options);

    // Observe all elements with animation refs
    if (headerRef.current) observer.observe(headerRef.current);
    if (gridRef.current) observer.observe(gridRef.current);
    if (detailsRef.current) observer.observe(detailsRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    // Observe all camera cards
    document.querySelectorAll(".camera-card").forEach((card) => {
      observer.observe(card);
    });

    return () => {
      if (headerRef.current) observer.unobserve(headerRef.current);
      if (gridRef.current) observer.unobserve(gridRef.current);
      if (detailsRef.current) observer.unobserve(detailsRef.current);
      if (ctaRef.current) observer.unobserve(ctaRef.current);

      document.querySelectorAll(".camera-card").forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, [cameras, selectedCamera]);

  const handleAssemble = (camera) => {
    setAssembleMessage(`ערכת ההרכבה של ${camera.name} נוספה לסל הקניות שלך!`);
    setTimeout(() => {
      setAssembleMessage("");
    }, 4000);
  };

  // Toggle expanded card on mobile
  const toggleExpandCard = (cameraId, e) => {
    // Prevent event propagation
    e.stopPropagation();

    if (expandedCardId === cameraId) {
      setExpandedCardId(null); // Collapse if already expanded
    } else {
      setExpandedCardId(cameraId); // Expand the clicked camera
      setSelectedCamera(cameras.find((camera) => camera.id === cameraId)); // Also set as selected camera
    }
  };

  // Open image in fullscreen on mobile
  const openFullscreenImage = (imageUrl, cameraName, e) => {
    // Prevent event from bubbling up to parent elements
    e.stopPropagation();

    setFullscreenImage({
      url: imageUrl || "/src/assets/placeholder.png",
      name: cameraName,
    });

    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";
  };

  // Close fullscreen image modal
  const closeFullscreenImage = () => {
    setFullscreenImage(null);
    // Re-enable body scrolling
    document.body.style.overflow = "auto";
  };

  const getFeatureIcon = (feature) => {
    if (!feature) return <Award size={16} className="text-blue-500" />;

    if (feature.includes("חיישן") || feature.includes("פריים"))
      return <Maximize size={16} className="text-blue-500" />;
    if (feature.includes("וידאו") || feature.includes("fps"))
      return <Film size={16} className="text-purple-500" />;
    if (feature.includes("אטימה") || feature.includes("עמידה במים"))
      return <Shield size={16} className="text-green-500" />;
    if (feature.includes("ייצוב"))
      return <Zap size={16} className="text-amber-500" />;
    return <Award size={16} className="text-blue-500" />;
  };

  const RatingStars = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${
              i < Math.floor(rating) ? "text-amber-400" : "text-gray-300"
            } ${
              i === Math.floor(rating) && rating % 1 > 0 ? "text-amber-400" : ""
            }`}
            fill={i < Math.floor(rating) ? "currentColor" : "none"}
          />
        ))}
        <span className="mr-1 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  const navigateToBooking = (cameraId, e) => {
    // Prevent event propagation if there's an event
    if (e) {
      e.stopPropagation();
    }
    window.location.href = `/bookingAll?cameraId=${cameraId}`;
  };

  // Mobile expanded details component
  const MobileExpandedDetails = ({ camera }) => {
    if (!camera) return null;

    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mt-2 animate-slideDown">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Camera details in a grid */}
          <div>
            <p className="text-xs text-gray-500">תיאור:</p>
            <p className="text-sm text-indigo-900">
              {camera.description || "אין תיאור זמין"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">מגה פיקסל:</p>
            <p className="text-sm font-medium text-indigo-800">
              {camera.megapixels} MP
            </p>
          </div>
        </div>

        {/* Features section */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">מאפיינים:</p>
          <div className="flex flex-wrap gap-2">
            {camera.features && camera.features.length > 0 ? (
              camera.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {getFeatureIcon(feature)}
                  <span className="mr-1">{feature}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-600">אין מאפיינים זמינים</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">מחיר:</p>
            <p className="text-lg font-bold text-indigo-900">₪{camera.price}</p>
          </div>

          <button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            onClick={(e) => navigateToBooking(camera.id, e)}
          >
            <Calendar size={14} className="ml-1.5" />
            להזמין עכשיו
          </button>
        </div>
      </div>
    );
  };

  // Fullscreen Image Modal Component
  const FullscreenImageModal = ({ image, onClose }) => {
    if (!image) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors"
            onClick={onClose}
            aria-label="סגור"
          >
            <X size={24} />
          </button>

          {/* Camera name */}
          <div className="absolute top-4 left-4 right-16 z-10">
            <h3 className="text-white text-lg font-bold truncate">
              {image.name}
            </h3>
          </div>

          {/* Image container */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-full object-contain animate-scaleIn"
              onError={(e) => {
                e.target.src = "/src/assets/placeholder.png";
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 min-h-screen font-sans"
      dir="rtl"
    >
      {/* Add custom animations to CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        
        .animate-reveal {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.7s ease-out forwards;
        }
        
        .animate-glowPulse {
          animation: glowPulse 2s infinite;
        }
        
        .opacity-0 {
          opacity: 0;
        }
        
        .camera-card {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.5s ease-out;
        }
        
        .camera-card.animate-reveal {
          opacity: 1;
          transform: translateY(0);
        }
        
        .stagger-item {
          transition-delay: calc(var(--index) * 0.1s);
        }
      `}</style>

      {/* Fullscreen Image Modal */}
      <FullscreenImageModal
        image={fullscreenImage}
        onClose={closeFullscreenImage}
      />

      {/* Sticky navbar */}
      <div className="sticky top-0 z-40 bg-indigo-900/90 backdrop-blur-md border-b border-indigo-700/20 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Camera size={24} className="text-white mr-2" />
            <span className="text-white font-bold hidden sm:inline">
              קאמרה שופ
            </span>
          </div>

          <button
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg font-medium text-sm"
            onClick={navigateToLogin}
          >
            כניסה
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        <header
          ref={headerRef}
          className="mb-6 sm:mb-12 text-center opacity-0 py-12 sm:py-16"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-indigo-900 mb-2 sm:mb-3 bg-clip-text  bg-gradient-to-r from-indigo-600 to-purple-600">
            בנה את המצלמה המושלמת שלך
          </h1>
          <p className="text-indigo-700 max-w-2xl mx-auto text-sm sm:text-base">
            גלה את אוסף המצלמות האיכותיות שלנו והתאם אישית את ערכת ההרכבה
            לחוויית צילום מושלמת
          </p>
        </header>

        {assembleMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200 text-emerald-700 p-4 mb-8 rounded-lg flex items-center justify-between shadow-md animate-slideDown">
            <div className="flex items-center">
              <div className="bg-emerald-100 p-2 rounded-full ml-3">
                <Check size={20} className="text-emerald-600" />
              </div>
              <span className="font-medium">{assembleMessage}</span>
            </div>
            <button
              onClick={() => setAssembleMessage("")}
              className="text-emerald-500 hover:text-emerald-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-8 rounded-lg flex items-center shadow-md">
            <div className="bg-red-100 p-2 rounded-full ml-3">
              <X size={20} className="text-red-600" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* No products found */}
        {!isLoading && !error && cameras.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mb-8">
            <Camera size={48} className="mx-auto text-indigo-300 mb-4" />
            <h2 className="text-xl font-bold text-indigo-900 mb-2">
              אין מוצרים זמינים כרגע
            </h2>
            <p className="text-gray-600 mb-4">
              עדיין לא נוספו מוצרים למערכת או שהמוצרים לא נטענו כראוי.
            </p>
          </div>
        )}

        {/* Camera grid */}
        {!isLoading && !error && cameras.length > 0 && (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-12 opacity-0"
          >
            {cameras.map((camera, index) => (
              <div
                key={camera.id}
                className="camera-card relative"
                style={{ "--index": index }}
              >
                <div
                  className={`bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
                    selectedCamera?.id === camera.id
                      ? "ring-2 ring-indigo-500 shadow-lg animate-glowPulse"
                      : "shadow-md"
                  }`}
                  onClick={(e) => {
                    // For desktop: just set selected camera
                    if (window.innerWidth >= 640) {
                      // sm breakpoint is 640px
                      setSelectedCamera(camera);

                      // Scroll to details section if it exists
                      if (detailsRef.current) {
                        detailsRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    } else {
                      // For mobile: toggle expanded state
                      toggleExpandCard(camera.id, e);
                    }
                  }}
                >
                  {/* Mobile Card Layout (Horizontal) - visible only on small screens */}
                  <div className="flex sm:hidden w-full relative">
                    {/* Image side with zoom icon for fullscreen */}
                    <div className="relative w-1/3">
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent z-0"></div>
                      <img
                        src={camera.imageUrl || "/src/assets/placeholder.png"}
                        alt={camera.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/src/assets/placeholder.png";
                        }}
                        onClick={(e) =>
                          openFullscreenImage(camera.imageUrl, camera.name, e)
                        }
                      />
                      <button
                        className="absolute bottom-2 right-2 bg-white/70 hover:bg-white/90 p-1.5 rounded-full text-indigo-600 shadow-md transition-all duration-300"
                        onClick={(e) =>
                          openFullscreenImage(camera.imageUrl, camera.name, e)
                        }
                        aria-label="הגדל תמונה"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    {/* Content side */}
                    <div className="w-2/3 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-sm font-bold text-indigo-900 line-clamp-1">
                            {camera.name}
                          </h2>
                          <p className="text-xs font-medium text-indigo-600 mb-1">
                            {camera.typeHebrew}
                          </p>

                          <div className="flex items-center mb-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${
                                    i < Math.floor(camera.rating)
                                      ? "text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                  fill={
                                    i < Math.floor(camera.rating)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              ))}
                            </div>
                            <span className="mr-1 text-xs text-gray-600">
                              {camera.rating}
                            </span>
                          </div>
                        </div>

                        <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded">
                          {camera.megapixels} MP
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-1 mb-1.5">
                        <span className="text-sm font-bold text-indigo-900">
                          ₪{camera.price}
                        </span>
                        {camera.features && camera.features.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800">
                            <Zap size={10} className="ml-1" />
                            {camera.features[0].split(" ")[0]}...
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-1.5 px-3 rounded-lg flex items-center justify-center transition-colors text-xs font-medium flex-grow"
                          onClick={(e) => navigateToBooking(camera.id, e)}
                        >
                          <Calendar size={12} className="ml-1.5" />
                          להזמין
                        </button>

                        {/* Expand/collapse indicator */}
                        <button
                          onClick={(e) => toggleExpandCard(camera.id, e)}
                          className="ml-2 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-full text-indigo-700"
                        >
                          {expandedCardId === camera.id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Card Layout (Vertical) - hidden on small screens */}
                  <div className="hidden sm:block">
                    {/* Image with gradient overlay */}
                    <div className="relative overflow-hidden h-48 group">
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent z-0"></div>
                      <img
                        src={camera.imageUrl || "/src/assets/placeholder.png"}
                        alt={camera.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = "/src/assets/placeholder.png";
                        }}
                      />
                      <div className="absolute bottom-2 right-2 bg-indigo-600 text-white font-bold px-2 py-1 rounded text-sm">
                        {camera.megapixels} MP
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h2 className="text-xl font-bold text-indigo-900">
                            {camera.name}
                          </h2>
                          <p className="text-sm font-medium text-indigo-600">
                            {camera.typeHebrew}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <RatingStars rating={camera.rating} />
                        <span className="text-xl font-bold text-indigo-900">
                          ₪{camera.price}
                        </span>
                      </div>

                      <div className="mt-3 mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {camera.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {camera.features &&
                          camera.features.slice(0, 2).map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800"
                            >
                              {getFeatureIcon(feature)}
                              <span className="mr-1">{feature}</span>
                            </span>
                          ))}
                        {camera.features && camera.features.length > 2 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800">
                            +{camera.features.length - 2} נוספים
                          </span>
                        )}
                      </div>

                      <button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 font-medium"
                        onClick={(e) => navigateToBooking(camera.id, e)}
                      >
                        <Calendar size={16} className="ml-2" />
                        להזמין עכשיו
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile expanded details section */}
                {expandedCardId === camera.id && (
                  <div className="block sm:hidden mt-2 mb-4">
                    <MobileExpandedDetails camera={camera} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedCamera && (
          <div
            ref={detailsRef}
            className="hidden sm:block bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8 transition-all duration-300 opacity-0 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedCamera(null)}
              className="absolute top-4 left-4 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
              aria-label="סגור"
            >
              <X size={20} className="text-indigo-700" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image section */}
              <div className="relative h-48 sm:h-64 lg:h-full bg-gradient-to-br from-indigo-50 to-purple-50 order-1 lg:order-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10"></div>
                <img
                  src={selectedCamera.imageUrl || "/src/assets/placeholder.png"}
                  alt={selectedCamera.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/src/assets/placeholder.png";
                  }}
                />
              </div>

              {/* Content section */}
              <div className="p-4 sm:p-8 order-2 lg:order-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-indigo-900 mb-1">
                      {selectedCamera.name}
                    </h2>
                    <p className="text-sm sm:text-base text-indigo-600 font-medium mb-2">
                      {selectedCamera.typeHebrew}
                    </p>
                    <RatingStars rating={selectedCamera.rating} />
                  </div>
                  <div className="bg-indigo-100 text-indigo-700 font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-lg">
                    {selectedCamera.megapixels} MP
                  </div>
                </div>

                <div className="my-4 sm:my-6">
                  <p className="text-sm sm:text-base text-gray-700">
                    {selectedCamera.description}
                  </p>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold text-indigo-900 mb-2 sm:mb-3 text-sm sm:text-base">
                    מאפיינים עיקריים
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {selectedCamera.features &&
                      selectedCamera.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-indigo-50 p-2 rounded-lg"
                        >
                          <div className="bg-indigo-100 p-1.5 rounded-lg ml-2">
                            {getFeatureIcon(feature)}
                          </div>
                          <span className="text-xs sm:text-sm text-indigo-800">
                            {feature}
                          </span>
                        </div>
                      ))}

                    {(!selectedCamera.features ||
                      selectedCamera.features.length === 0) && (
                      <div className="flex items-center bg-indigo-50 p-2 rounded-lg">
                        <div className="bg-indigo-100 p-1.5 rounded-lg ml-2">
                          <Info size={16} className="text-indigo-500" />
                        </div>
                        <span className="text-xs sm:text-sm text-indigo-800">
                          אין מאפיינים זמינים
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-indigo-100 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                    <div className="mb-3 sm:mb-0">
                      <p className="text-gray-500 text-xs sm:text-sm">
                        מחיר כולל
                      </p>
                      <p className="text-xl sm:text-3xl font-bold text-indigo-900">
                        ₪{selectedCamera.price}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-4 sm:px-6 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm sm:w-auto"
                        onClick={() => navigateToBooking(selectedCamera.id)}
                      >
                        <Calendar size={16} className="ml-2" />
                        להזמין עכשיו
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 sm:p-4 flex items-start sm:items-center flex-wrap sm:flex-nowrap">
                    <Info
                      size={18}
                      className="text-indigo-500 ml-2 sm:ml-3 mt-1 sm:mt-0"
                    />
                    <p className="text-xs sm:text-sm text-indigo-700">
                      ערכת ההרכבה כוללת את כל הרכיבים הדרושים, כלים וחוברת
                      הוראות מפורטת. אחריות למשך 24 חודשים מתאריך הרכישה.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={ctaRef}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 sm:p-8 mb-6 sm:mb-8 text-white shadow-lg opacity-0 transform translate-y-10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-right">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                צריך עזרה בבחירת המצלמה הנכונה?
              </h2>
              <p className="max-w-xl opacity-90 text-sm sm:text-base">
                מומחי המצלמות שלנו מוכנים להדריך אותך בבחירת הציוד המושלם לצרכי
                הצילום שלך
              </p>
            </div>
            <button
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm sm:text-base w-full md:w-auto"
              onClick={() => (window.location.href = "tel:0537333343")}
            >
              <Phone size={18} className="inline-block ml-2" />
              דבר עם מומחה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HebrewCameraShowcase;
