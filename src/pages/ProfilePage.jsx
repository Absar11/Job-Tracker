import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfileSuccess } from "../redux/authSlice.js";
import { authApi } from "../services/api.js";
import { DashboardLayout } from "../layouts/DashboardLayout.jsx";
import { useToast } from "../components/Toast.jsx";
import { User, Image, Shield, Mail, FileCheck } from "lucide-react";
import { motion } from "motion/react";
import { ResumeManager } from "../components/ResumeManager.jsx";

export const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      toast("User full name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name, avatar });
      if (res.success) {
        dispatch(updateProfileSuccess(res.user));
        toast("Profile details updated successfully!", "success");
      } else {
        toast(res.message || "Failed to update profile", "error");
      }
    } catch (err) {
      toast(err.message || "Server error saving updates", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6" id="profile-page-container">
        <div>
          <h2 className="text-xl font-bold text-slate-850 tracking-tight">Your Profile Account</h2>
          <p className="text-xs text-slate-400">Configure personal visual identity and details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card left: Visual Avatar summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm text-center space-y-4"
          >
            <div className="mx-auto w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-3xl uppercase overflow-hidden shadow-sm shadow-blue-500/5">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user?.name || "U").charAt(0)
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{user?.name}</h3>
              <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 gap-2.5 text-left text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Role Group: <strong className="font-semibold text-slate-800">{user?.role}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">Email verified</span>
              </div>
            </div>
          </motion.div>

          {/* Card right: Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white border border-slate-205 p-6 rounded-2xl shadow-sm"
          >
            <h3 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Account Settings
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Email Address (Immutable)
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium outline-none cursor-not-allowed"
                  disabled
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  Email is locked to maintain unique keys.
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-105 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Avatar Url */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Avatar URL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Image className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-105 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Form Action save */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10 inline-flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-t-white border-blue-500 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Resume Management Block */}
        <div className="pt-4">
          <ResumeManager />
        </div>
      </div>
    </DashboardLayout>
  );
};
