import React from "react";

// Stat block load state
export const StatCardSkeleton = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-8 w-16 bg-slate-100 rounded" />
    </div>
  );
};

// Job item skeleton
export const JobRowSkeleton = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm animate-pulse flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 mt-1" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-slate-100 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="h-8 w-24 bg-slate-100 rounded-full" />
        <div className="h-8 w-20 bg-slate-100 rounded" />
      </div>
    </div>
  );
};

// Large dashboard diagram loaders
export const ChartSkeleton = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col h-[320px]">
      <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
      <div className="flex-1 w-full bg-slate-50 rounded-xl flex items-center justify-center">
        <div className="text-slate-200">Analyzing job applications metrics...</div>
      </div>
    </div>
  );
};

// General list placeholder
export const ListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <JobRowSkeleton key={idx} />
      ))}
    </div>
  );
};
