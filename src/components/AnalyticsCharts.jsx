import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

// Register elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const AnalyticsCharts = ({ counts, monthly }) => {
  // 1. Status Distribution Doughnut Chart
  const statusLabels = [
    "Applied",
    "Online Assessment",
    "Interview Scheduled",
    "Rejected",
    "Offer Received",
    "Selected",
  ];

  const statusColors = [
    "#3b82f6", // Applied - Blue
    "#f59e0b", // Assessment - Amber
    "#8b5cf6", // Interview - Purple
    "#ef4444", // Rejected - Red
    "#10b981", // Offer - Emerald
    "#06b6d4", // Selected - Cyan
  ];

  const statusValues = statusLabels.map((lbl) => counts[lbl] || 0);
  const totalWithStatus = statusValues.reduce((a, b) => a + b, 0);

  const statusData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusColors,
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          font: { size: 11 },
          color: "#475569",
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
      },
    },
  };

  // 2. Monthly Timeline Bar Chart
  const lineLabels = monthly && monthly.length > 0 ? monthly.map((d) => d.label) : ["No Active Data"];
  const lineValues = monthly && monthly.length > 0 ? monthly.map((d) => d.count) : [0];

  const monthlyTimelineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Applications submitted",
        data: lineValues,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#3b82f6",
        borderWidth: 1.5,
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#64748b",
        },
        grid: {
          color: "rgba(241, 245, 249, 1)",
        },
      },
      x: {
        ticks: {
          color: "#64748b",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // 3. Interview vs Rejection ratio
  const interviewsCount = counts["Interview Scheduled"] || 0;
  const rejectionsCount = counts["Rejected"] || 0;
  const totalInteractions = interviewsCount + rejectionsCount;

  const ratioData = {
    labels: ["Interviews", "Rejections"],
    datasets: [
      {
        data: [interviewsCount, rejectionsCount],
        backgroundColor: ["rgba(139, 92, 246, 0.85)", "rgba(239, 68, 68, 0.85)"],
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  const ratioOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          font: { size: 11 },
          color: "#475569",
        },
      },
    },
  };

  if (totalWithStatus === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="text-slate-600 font-medium mb-1">No applications data exists to display charts</h3>
        <p className="text-slate-400 text-xs max-w-sm">
          Please add some job details with states like "Applied", "Interview Scheduled" or "Rejected" to populate analytics grids immediately.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-dashboard-container">
      {/* Chart 1: Monthly Timeline */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col h-[340px]">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800 text-base">Monthly Applications Trend</h3>
          <p className="text-xs text-slate-400">Application volumes submitted by month</p>
        </div>
        <div className="flex-1 relative">
          <Bar data={monthlyTimelineData} options={monthlyOptions} />
        </div>
      </div>

      {/* Chart 2: Status Distribution */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col h-[340px]">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800 text-base">Status Distribution</h3>
          <p className="text-xs text-slate-400">Total metrics allocated by active states</p>
        </div>
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full max-h-[220px]">
            <Doughnut data={statusData} options={statusOptions} />
          </div>
        </div>
      </div>

      {/* Chart 3: Interview vs Rejection Ratio */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col h-[340px]">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800 text-base">Interview vs Rejection Ratio</h3>
          <p className="text-xs text-slate-400">Direct comparison of interviewing status and cuts</p>
        </div>
        <div className="flex-1 relative flex items-center justify-center">
          {totalInteractions > 0 ? (
            <div className="w-full h-full max-h-[220px]">
              <Pie data={ratioData} options={ratioOptions} />
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-xl my-auto w-full">
              <span className="text-xs text-slate-400 block font-medium">Not Enough Data</span>
              <p className="text-[10px] text-slate-400 mt-1">
                Need at least 1 job with status "Interview Scheduled" or "Rejected" to draw ratio metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
