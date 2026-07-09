import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import {
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter Code & New Password
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) {
      toast("Please enter your registered email address.", "error");
      return;
    }

    setLoading(true);
    setErrorDetails("");
    try {
      const res = await authApi.forgotPassword({ email });
      if (res.success) {
        toast(`Verification email has been sent successfully to ${email}! Please check your inbox.`, "success");
        setCode(""); // Make sure they type the actual OTP they receive
        setStep(2);
      } else {
        setErrorDetails(res.message || "Failed to generate password reset request.");
        toast("Failed to dispatch password reset. See instructions below.", "error");
      }
    } catch (err) {
      const msg = err.message || "Email address is not registered or connection failed.";
      setErrorDetails(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      toast("Please fill in all verification fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast("Passwords do not match. Please re-enter.", "error");
      return;
    }

    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters long.", "error");
      return;
    }

    setLoading(true);
    setErrorDetails("");
    try {
      const res = await authApi.resetPassword({
        email,
        token: code,
        newPassword,
      });

      if (res.success) {
        toast("Your password has been successfully reset! Redirecting to login portal...", "success");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setErrorDetails(res.message || "Incorrect verification token or password format.");
        toast(res.message || "Incorrect verification token or password format.", "error");
      }
    } catch (err) {
      const msg = err.message || "Reset failed. Verification code may have expired.";
      setErrorDetails(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="forgot-password-page-root">
      <div className="w-full max-w-md transition-all duration-300">
        
        {/* Form container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden p-8 flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl mb-3">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {step === 1 ? "Reset Your Password" : "Verify Security Code"}
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xs leading-relaxed">
                {step === 1
                  ? "Enter your email address to receive a secure 6-digit access code"
                  : `We've dispatched a real verification code to your email address: ${email}`}
              </p>
            </div>

            {/* Error & Setup Guide Alert Box */}
            {errorDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-800 space-y-2 text-left"
              >
                <div className="flex items-center gap-2 font-extrabold text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Email Dispatch Connection Error</span>
                </div>
                <div className="leading-relaxed font-semibold whitespace-pre-line text-rose-900 pl-6">
                  {errorDetails}
                </div>
              </motion.div>
            )}

            {/* Step 1 Form */}
            {step === 1 ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Email Address
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Generate Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2 Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6-Digit Verification Token
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-850 text-sm font-bold tracking-widest focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] mt-1.5 font-medium leading-relaxed">
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-200/55 px-2 py-1.5 rounded inline-block w-full">
                      ✔️ <strong>Real Mail Dispatched:</strong> Check your real Gmail inbox for the 6-digit verification code.
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Account Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl cursor-pointer transition-colors text-xs text-center"
                  >
                    Back to Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      "Reset & Save Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Links Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Link
                to="/login"
                className="text-xs text-slate-500 hover:text-blue-600 font-bold hover:underline transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login Portal
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
