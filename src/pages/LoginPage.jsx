import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startAuthAction, authActionSuccess, authActionFailure } from "../redux/authSlice.js";
import { authApi } from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import { Mail, Lock, LogIn, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, isAuthenticated, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast("Please enter both email and password.", "error");
      return;
    }

    dispatch(startAuthAction());
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        dispatch(authActionSuccess({ user: res.user, token: res.token }));
        toast(`Welcome back, ${res.user.name}!`, "success");
        navigate("/dashboard");
      } else {
        dispatch(authActionFailure(res.message || "Failed to log in"));
        toast(res.message || "Invalid credentials", "error");
      }
    } catch (err) {
      dispatch(authActionFailure(err.message || "Failed to connect to the server"));
      toast(err.message || "Login failed. Check your network.", "error");
    }
  };

  // Helper to quickly log in with demo credentials
  const fillCredentials = () => {
    setEmail("user@jobtracker.com");
    setPassword("user123");
    toast(`Preloaded demo user login keys! Click Sign In to execute.`, "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="login-page-root">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden p-8 lg:p-10"
      >
        {/* App Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20 mb-3 animate-pulse">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Tracker Pro</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Manage your career applications pipeline securely
          </p>
        </div>

        {/* Form error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl border border-transparent hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-white border-blue-500 animate-spin" />
            ) : (
              <>
                Sign In to Account
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Roles Credentials Fast Fills */}
        {/* <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-center text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">
            Demo Portal Developer Quick-Links
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => fillCredentials()}
              type="button"
              className="w-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2.5 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold cursor-pointer transition-all text-center"
            >
              🔑 Demo User profile
            </button>
          </div>
        </div> */}

        {/* Register option */}
        <div className="mt-8 text-center">
          <span className="text-xs text-slate-500 font-medium">New to Job Tracker Pro? </span>
          <Link
            to="/register"
            className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all inline-flex items-center gap-0.5 cursor-pointer"
          >
            Create free account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
