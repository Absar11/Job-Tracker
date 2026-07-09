import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // If loading and we have token, we can show a nice full screen layout loading element
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center animate-pulse" id="auth-loading-screen">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-600 border-blue-105 animate-spin mb-4" />
        <span className="text-slate-500 font-semibold text-sm">Authenticating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If not matching roles, bounce back to safe user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
