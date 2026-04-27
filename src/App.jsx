import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import KitchenPage from "./pages/KitchenPage";
import LoginPage from "./pages/LoginPage";
import WaiterPage from "./pages/WaiterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import CheckoutPage from "./pages/CheckoutPage";
import PendingConfirmationPage from "./pages/PendingConfirmationPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/table/:tableId" element={<MenuPage />} />
        <Route path="/menu/:id" element={<MenuPage />} />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute role="kitchen">
              <KitchenPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pending-confirmation" element={<PendingConfirmationPage />} />

        <Route
          path="/waiter"
          element={
            <ProtectedRoute role="waiter">
              <WaiterPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute role="admin">
              <AdminPage defaultTab="analytics" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/waiters"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cashier"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscription"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
        <Route
          path="/super-admin/dashboard"
          element={<SuperAdminDashboard />}
        />
      </Routes>
    </Router>
  );
}

export default App;