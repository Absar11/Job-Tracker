import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./redux/store.js";
import { startAuthAction, authActionSuccess, logout } from "./redux/authSlice.js";
import { authApi } from "./services/api.js";
import { ToastProvider, useToast } from "./components/Toast.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

// Pages import
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { JobsListPage } from "./pages/JobsListPage.jsx";
import { CreateJobPage } from "./pages/CreateJobPage.jsx";
import { EditJobPage } from "./pages/EditJobPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const { toast } = useToast();

  // Validate active login session on load / token refresh
  useEffect(() => {
    const checkSession = async () => {
      if (token && !isAuthenticated) {
        dispatch(startAuthAction());
      }
      if (token) {
        try {
          const res = await authApi.getProfile();
          if (res.success) {
            dispatch(authActionSuccess({ user: res.user, token }));
          } else {
            dispatch(logout());
          }
        } catch (err) {
          console.error("Session check skipped or failed:", err);
        }
      }
    };

    checkSession();
  }, [dispatch, token]);

  // Global listener for unauthorized (401) events from the custom Fetch client
  useEffect(() => {
    const handleUnauthorizedOnAPI = () => {
      dispatch(logout());
      toast("Your active logging session has expired. Please sign in again.", "error");
    };

    window.addEventListener("unauthorized-access", handleUnauthorizedOnAPI);
    return () => {
      window.removeEventListener("unauthorized-access", handleUnauthorizedOnAPI);
    };
  }, [dispatch, toast]);

  return (
    <Router>
      <Routes>
        {/* Public authentication gateways */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Root redirect handles default landing */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />

        {/* Protected general portals */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <ProtectedRoute>
              <CreateJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/edit"
          element={
            <ProtectedRoute>
              <EditJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Provider>
  );
}
