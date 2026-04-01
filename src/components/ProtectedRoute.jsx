import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Only block access — do not redirect by role
  if (role && payload.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}