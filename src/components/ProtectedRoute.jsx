import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./UI";

export default function ProtectedRoute({ admin = false }) {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "ROLE_ADMIN") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
