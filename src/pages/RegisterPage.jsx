import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startAuthAction, authActionSuccess, authActionFailure } from "../redux/authSlice.js";
import { authApi } from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import { User, Mail, Lock, ArrowLeft, ShieldAlert, ShieldCheck, Send, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const RESEND_COOLDOWN = 60; // seconds

export const RegisterPage = () => {
  // Step 1: form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");

  // Step control
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Step 2: OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);
  const cooldownRef = useRef(null);

  const { isAuthenticated, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // Auto-focus first OTP box when step changes to 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast("Please fill in all required fields.", "error");
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await authApi.sendOtp({ name, email, password, avatar });
      if (res.success) {
        toast(`OTP sent to ${email}! Check your inbox.`, "success");
        setStep(2);
        setOtp(["", "", "", "", "", ""]);
        setCooldown(RESEND_COOLDOWN);
      } else {
        toast(res.message || "Failed to send OTP.", "error");
      }
    } catch (err) {
      toast(err.message || "Network error. Try again.", "error");
    } finally {
      setSending(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      const res = await authApi.sendOtp({ name, email, password, avatar });
      if (res.success) {
        toast("New OTP sent to your email!", "success");
        setOtp(["", "", "", "", "", ""]);
        setCooldown(RESEND_COOLDOWN);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        toast(res.message || "Failed to resend OTP.", "error");
      }
    } catch (err) {
      toast(err.message || "Network error.", "error");
    } finally {
      setSending(false);
    }
  };

  // ── OTP digit input handling ──────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const next = [...otp];
    next[index] = value.slice(-1); // take only last digit
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP + Create Account ──────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast("Please enter the complete 6-digit OTP.", "error");
      return;
    }
    setVerifying(true);
    dispatch(startAuthAction());
    try {
      const res = await authApi.register({ email, otp: otpCode });
      if (res.success) {
        dispatch(authActionSuccess({ user: res.user, token: res.token }));
        toast(`Welcome, ${res.user.name}! Your account is ready. 🎉`, "success");
        navigate("/dashboard");
      } else {
        dispatch(authActionFailure(res.message || "Verification failed."));
        toast(res.message || "OTP verification failed.", "error");
      }
    } catch (err) {
      dispatch(authActionFailure(err.message));
      toast(err.message || "Server error. Please try again.", "error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="register-page-root">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          // ── STEP 1: Registration Form ─────────────────────────────────────────
          <motion.div
            key="step-form"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden p-8 lg:p-10"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Join Job Tracker Pro &amp; take charge of your applications</p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Developer"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@techcompany.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">Password (6+ characters)</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">Profile Photo URL (optional)</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
              >
                {sending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-t-white border-blue-400 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Verification Code
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-4 border-t border-slate-100">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        ) : (
          // ── STEP 2: OTP Verification ──────────────────────────────────────────
          <motion.div
            key="step-otp"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden p-8 lg:p-10"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-violet-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify Your Email</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                We sent a 6-digit code to <strong className="text-slate-700">{email}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">Check your inbox (and spam folder). Code expires in 10 min.</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Digit Boxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-13 text-center text-xl font-black border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-slate-800 bg-white"
                      style={{ height: "52px" }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || otp.join("").length < 6}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-violet-500/10 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {verifying ? (
                  <div className="w-5 h-5 rounded-full border-2 border-t-white border-violet-400 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify &amp; Create Account
                  </>
                )}
              </button>
            </form>

            {/* Resend + Back */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || sending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>

              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-medium transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Edit details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
