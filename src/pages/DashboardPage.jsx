import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAnalyticsLoading, setAnalyticsSuccess, setAnalyticsFailure } from "../redux/jobSlice.js";
import { jobApi } from "../services/api.js";
import { DashboardLayout } from "../layouts/DashboardLayout.jsx";
import { AnalyticsCharts } from "../components/AnalyticsCharts.jsx";
import { StatCardSkeleton, ChartSkeleton } from "../components/Skeletons.jsx";
import { useToast } from "../components/Toast.jsx";
import { UpcomingInterviews } from "../components/UpcomingInterviews.jsx";
import {
  Briefcase,
  CalendarDays,
  XCircle,
  Award,
  ChevronRight,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";

export const DashboardPage = () => {
  const { analytics, analyticsLoading, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    dispatch(setAnalyticsLoading());
    try {
      const res = await jobApi.getAnalytics();
      if (res.success) {
        dispatch(setAnalyticsSuccess(res.analytics));
      } else {
        dispatch(setAnalyticsFailure(res.message || "Failed loading analytics data"));
      }
    } catch (err) {
      dispatch(setAnalyticsFailure(err.message || "Network loading error"));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  // Handle manual reload on errors
  const handleRetry = () => {
    fetchDashboardData();
  };

  // Safe variables extracts
  const counts = analytics?.counts || {
    Total: 0,
    Applied: 0,
    "Online Assessment": 0,
    "Interview Scheduled": 0,
    Rejected: 0,
    "Offer Received": 0,
    Selected: 0,
  };

  const monthlyTimeline = analytics?.monthly || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-2xl p-6 lg:p-8 text-white shadow-md shadow-blue-500/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight">
              Hello, {user?.name || "Job Hunter"}! 👋
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Track, organize, and inspect all active applications from a unified, modern interface. Keep pushing forward!
            </p>
          </div>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer border border-transparent"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </Link>
        </motion.div>

        {/* Dashboard Error alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Could not load analytics metrics. {error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded hover:bg-red-200 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Cards Container */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsLoading ? (
            Array.from({ length: 4 }).map((_, idx) => <StatCardSkeleton key={idx} />)
          ) : (
            <>
              {/* Card 1: Total Apps */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Total Inbound
                  </span>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                    {counts.Total || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Submitted applications</p>
                </div>
              </div>

              {/* Card 2: Interviews Appended */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Interviews
                  </span>
                  <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                    {counts["Interview Scheduled"] || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Schedules programmed</p>
                </div>
              </div>

              {/* Card 3: Cuts / Rejections */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Rejections
                  </span>
                  <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                    {counts.Rejected || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Cut or archive metrics</p>
                </div>
              </div>

              {/* Card 4: Offer Received */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Offers
                  </span>
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                    {(counts["Offer Received"] || 0) + (counts["Selected"] || 0)}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Offers and selection logs</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts block */}
        <div className="pt-2">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => <ChartSkeleton key={idx} />)}
            </div>
          ) : (
            <AnalyticsCharts counts={counts} monthly={monthlyTimeline} />
          )}
        </div>

        {/* Upcoming Interviews & Notification Log Panel */}
        {!analyticsLoading && (
          <div className="pt-2">
            <UpcomingInterviews />
          </div>
        )}

        {/* SaaS Dashboard Status list banner */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-base">State Metrics Matrix</h3>
              <p className="text-xs text-slate-400">Numerical representation of all application segments</p>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              Browse Applications
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Applied", count: counts.Applied, color: "bg-blue-500" },
              { label: "Assessment", count: counts["Online Assessment"], color: "bg-amber-500" },
              { label: "Interview Scheduled", count: counts["Interview Scheduled"], color: "bg-violet-500" },
              { label: "Rejected", count: counts.Rejected, color: "bg-red-500" },
              { label: "Offer Received", count: counts["Offer Received"], color: "bg-emerald-500" },
              { label: "Selected", count: counts.Selected, color: "bg-cyan-500" },
            ].map((st, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-full uppercase tracking-wider">
                    {st.label}
                  </span>
                </div>
                <span className="text-base font-extrabold text-slate-750">{st.count || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
