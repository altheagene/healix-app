// src/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthProvider";

export const ProtectedRoute: React.FC<{ redirectTo?: string }> = ({ redirectTo = "/login" }) => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
