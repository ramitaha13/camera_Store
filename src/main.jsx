import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Home from "./components/home.jsx";
import Login from "./components/login.jsx";
import ManagerAdmin from "./components/managerAdmin.jsx";
import Addnewproduct from "./components/addnewproduct.jsx";
import EditProduct from "./components/editProduct.jsx";
import BookingAll from "./components/bookingAll.jsx";
import BookingsList from "./components/bookingsList.jsx";
import Signup from "./components/signup.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/managerAdmin",
    element: (
      <ProtectedRoute>
        <ManagerAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: "/addnewproduct",
    element: (
      <ProtectedRoute>
        <Addnewproduct />
      </ProtectedRoute>
    ),
  },
  {
    path: "/editproduct/:productId",
    element: (
      <ProtectedRoute>
        <EditProduct />
      </ProtectedRoute>
    ),
  },
  {
    path: "/bookingAll",
    element: <BookingAll />,
  },
  {
    path: "/bookingsList",
    element: (
      <ProtectedRoute>
        <BookingsList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <ProtectedRoute>
        <Signup />
      </ProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
