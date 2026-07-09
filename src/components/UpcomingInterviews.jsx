import React, { useState, useEffect } from "react";
import { jobApi } from "../services/api.js";
import { useToast } from "./Toast.jsx";
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  BellOff,
  Loader2,
  ListRestart,
} from "lucide-react";
import { motion } from "motion/react";

export const UpcomingInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadInterviews = async () => {
    try {
      const res = await jobApi.list({});
      if (res.success && res.jobs) {
        const withInterviews = res.jobs.filter((j) => j.interviewDate);
        setInterviews(withInterviews);
      }
    } catch (err) {
      console.error("Error loading interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleToggleReminder = async (job, index) => {
    const originalStatus = job.reminderEnabled;
    const newStatus = !originalStatus;

    // Optimistic Update
    const updatedInterviews = [...interviews];
    updatedInterviews[index] = { ...job, reminderEnabled: newStatus };
    setInterviews(updatedInterviews);

    try {
      const res = await jobApi.update(job._id || job.id, {
        reminderEnabled: newStatus,
      });

      if (res.success) {
        toast(
          `Email reminders ${newStatus ? "enabled" : "disabled"} for ${job.company} interview.`,
          "success"
        );
      } else {
        updatedInterviews[index] = { ...job, reminderEnabled: originalStatus };
        setInterviews(updatedInterviews);
        toast("Failed to update reminder state.", "error");
      }
    } catch (err) {
      updatedInterviews[index] = { ...job, reminderEnabled: originalStatus };
      setInterviews(updatedInterviews);
      toast("Error synchronizing reminder status", "error");
    }
  };

  const formatCountdown = (dateStr) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return "Completed / Past";

    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `In ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
    return `In ${mins} minute${mins > 1 ? "s" : ""}`;
  };

  return (
    <div className="w-full" id="upcoming-interviews-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200/85 p-6 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              Interview Calendar &amp; Reminders
            </h3>
            <p className="text-xs text-slate-400">
              Keep track of active interview rounds. Automatic email reminders are sent 24h and 1h before each interview.
            </p>
          </div>
          <button
            onClick={loadInterviews}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            title="Reload Schedules"
          >
            <ListRestart className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Loading upcoming schedules...</span>
          </div>
        ) : interviews.length === 0 ? (
          <div className="py-12 text-center border border-slate-100 border-dashed rounded-xl bg-slate-50/20">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2.5 animate-pulse" />
            <p className="text-xs font-bold text-slate-500">No interviews scheduled yet</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
              Set any job's pipeline status to "Interview Scheduled" or check the "Schedule Interview" toggle inside the application form to schedule your calendar events.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {interviews.map((item, idx) => (
              <div
                key={item._id || item.id}
                className="p-4 border border-slate-150/80 hover:border-violet-200 rounded-xl bg-gradient-to-br from-white to-slate-50/10 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[9px] font-extrabold rounded-lg border border-violet-100 uppercase tracking-wider">
                      {item.interviewType || "Interview"}
                    </span>
                    <span className="text-xs font-semibold text-slate-450">•</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {formatCountdown(item.interviewDate)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                      {item.role}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                      at <strong className="font-bold text-slate-700">{item.company}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.interviewDate).toLocaleString()}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Reminder toggle only */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleReminder(item, idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border ${
                      item.reminderEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50"
                        : "bg-slate-50 text-slate-450 border-slate-200 hover:bg-slate-100"
                    }`}
                    title={item.reminderEnabled ? "Disable reminders" : "Enable reminders"}
                  >
                    {item.reminderEnabled ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reminders On</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Reminders Off</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
