import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FolderSearch } from "lucide-react";
import { motion } from "motion/react";

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" id="notformatted-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6 flex flex-col items-center"
      >
        <div className="p-4 bg-blue-50 text-blue-600 rounded-full h-20 w-20 flex items-center justify-center">
          <FolderSearch className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">404</h1>
          <h2 className="text-lg font-extrabold text-slate-700">Record Not Located</h2>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            The page, form, or dashboard path you specified couldn't be resolved in our pipeline registry.
          </p>
        </div>

        <div className="pt-2 w-full">
          <Link
            to="/dashboard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 text-sm border border-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
