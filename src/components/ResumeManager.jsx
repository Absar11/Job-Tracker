import React from "react";
import { FileText, Clock } from "lucide-react";

export const ResumeManager = () => {
  return (
    <div
      id="resume-manager-block"
      className="bg-white border border-slate-200/85 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[220px]"
    >
      <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
        <FileText className="w-7 h-7 text-violet-400" />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-base flex items-center justify-center gap-2">
          Resume Manager
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Resume upload &amp; management will be available in a future update. Stay tuned!
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
        <Clock className="w-3.5 h-3.5" />
        Coming Soon
      </span>
    </div>
  );
};
