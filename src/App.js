import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROLES } from "./constants/roles";
import { AuthContext } from "./context/AuthContext";
import AuthPage from "./pages/AuthPages/AuthPage";
import Header from "./components/Common/User/Header"; 
import HomePage from "./pages/UserPages/HomePage";
import ProductDetailPage from "./pages/UserPages/ProductDetailPage";
import CartPage from "./pages/UserPages/CartPage";
import CheckoutPage from "./pages/UserPages/CheckoutPage";
import SellerDashboard from "./pages/AdminPages/SellerDashboard";
import AdminDashboard from "./pages/AdminPages/AdminDashboard";
import UserOrdersPage from "./pages/UserPages/UserOrdersPage";
import UserProfilePage from './pages/UserPages/UserProfilePage';
import ShopPage from "./pages/UserPages/ShopPage";
import SellerProfilePage from "./pages/AdminPages/SellerProfilePage";
import SellerBulkUploadPage from './pages/AdminPages/SellerBulkUploadPage';
import AffiliateDashboardPage from "./pages/UserPages/AffiliateDashboardPage";

// Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;

  const userRole = user?.role?.toLowerCase();
  const rolesAllowed = allowedRoles.map(role => role.toLowerCase());

  if (!rolesAllowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
              <Header />
              <HomePage />
            </div>
          }
        />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route
          path="/unauthorized"
          element={
            <div style={{ padding: 20 }}>
              <h1>403 - Không có quyền!</h1>
            </div>
          }
        />
        <Route
          path="/product/:id"
          element={
            <div>
              <Header />
              <ProductDetailPage />
            </div>
          }
        />
        <Route
          path="/shop/:sellerId"
          element={
            <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
              <Header />
              <ShopPage />
            </div>
          }
        />

        {/* User Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={[ROLES.USER]}>
              <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
                <Header />
                <CartPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={[ROLES.USER]}>
              <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
                <Header />
                <CheckoutPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={[ROLES.USER]}>
              <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
                <Header />
                <UserOrdersPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.USER]}>
              <Header />
              <UserProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/affiliate" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.USER]}>
              <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
                <Header />
                <AffiliateDashboardPage />
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Seller Routes */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SELLER]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/profile"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SELLER]}>
              <SellerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/seller/bulk-upload" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.SELLER]}>
              <SellerBulkUploadPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback */}
        <Route
          path="*"
          element={
            <div style={{ padding: 20 }}>
              <h1>404 - Không tìm thấy trang</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;