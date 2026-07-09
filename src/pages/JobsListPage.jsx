import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  setJobsLoading,
  setJobsSuccess,
  setJobsFailure,
  updateFilters,
  resetFilters,
} from "../redux/jobSlice.js";
import { jobApi } from "../services/api.js";
import { DashboardLayout } from "../layouts/DashboardLayout.jsx";
import { ListSkeleton } from "../components/Skeletons.jsx";
import { useToast } from "../components/Toast.jsx";
import { JobStatus, JobType } from "../types.js";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Undo2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const JobsListPage = () => {
  const { jobs, pagination, filters, loading, error } = useSelector((state) => state.jobs);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Sync state search input on redux filter updates (e.g. on reset)
  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  const fetchJobs = async () => {
    dispatch(setJobsLoading());
    try {
      const res = await jobApi.list(filters);
      if (res.success) {
        dispatch(setJobsSuccess({ jobs: res.jobs, pagination: res.pagination }));
      } else {
        dispatch(setJobsFailure(res.message || "Failed loading jobs list"));
      }
    } catch (err) {
      dispatch(setJobsFailure(err.message || "Server connector error"));
    }
  };

  // Run fetch on mount & filter trigger variations
  useEffect(() => {
    fetchJobs();
  }, [dispatch, filters]);

  // Debounced/Submit Search handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(updateFilters({ search: searchTerm }));
  };

  const handleStatusFilter = (e) => {
    dispatch(updateFilters({ status: e.target.value }));
  };

  const handleSortFilter = (e) => {
    dispatch(updateFilters({ sort: e.target.value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      dispatch(updateFilters({ page: newPage }));
    }
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchTerm("");
    toast("Filters reset to default view.", "info");
  };

  const handleDeleteJob = async (id) => {
    try {
      const res = await jobApi.delete(id);
      if (res.success) {
        toast("Application deleted successfully.", "success");
        setDeleteConfirmId(null);
        fetchJobs(); // Trigger reload
      } else {
        toast(res.message || "Failed to delete application", "error");
      }
    } catch (err) {
      toast(err.message || "Server error executing deletion", "error");
    }
  };

  // Helper labels styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case JobStatus.APPLIED:
        return "bg-blue-50 text-blue-700 border-blue-100";
      case JobStatus.ASSESSMENT:
        return "bg-amber-50 text-amber-700 border-amber-100";
      case JobStatus.INTERVIEW_SCHEDULED:
        return "bg-violet-50 text-violet-700 border-violet-100";
      case JobStatus.REJECTED:
        return "bg-red-50 text-red-700 border-red-100";
      case JobStatus.OFFER_RECEIVED:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case JobStatus.SELECTED:
        return "bg-cyan-50 text-cyan-700 border-cyan-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" id="jobs-list-page-container">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-850 tracking-tight">Active Applications Directory</h2>
            <p className="text-xs text-slate-400">Search, filter, and modify individual pipeline records</p>
          </div>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </Link>
        </div>

        {/* Filters Panel Box */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-10 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Company, Role, or City..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-850 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-2">
              <select
                value={filters.status}
                onChange={handleStatusFilter}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-750 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white cursor-pointer"
              >
                <option value="">All Statuses</option>
                {Object.values(JobStatus).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Filters Sub Actions row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Active Config:
              </span>
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700">
                  Status: {filters.status}
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 border border-violet-100 text-violet-700">
                  Search: "{filters.search}"
                </span>
              )}
              {!filters.status && !filters.search ? (
                <span className="text-xs text-slate-450 font-medium">Displaying all items</span>
              ) : null}
            </div>

            {(filters.status || filters.search) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200/85 px-3 py-1.5 rounded-lg cursor-pointer transition-all border border-transparent whitespace-nowrap"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Reset Pipeline Filters
              </button>
            )}
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-205 text-red-800 rounded-xl text-sm font-medium flex items-center justify-between">
            <span>Problem loading records: {error}</span>
            <button
              onClick={fetchJobs}
              className="p-1 rounded bg-red-100 hover:bg-red-200 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-red-700" />
            </button>
          </div>
        )}

        {/* Jobs Lists Area */}
        <div className="space-y-4 font-normal text-slate-500">
          {loading ? (
            <ListSkeleton count={4} />
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
              <div className="bg-slate-155 p-4 rounded-full text-slate-400 mb-4 h-16 w-16 flex items-center justify-center">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg mb-1">No applications matched</h3>
              <p className="text-slate-455 text-xs mb-6 max-w-sm">
                We couldn't locate any matching career records for your query. Create a new record or adjust your search.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/jobs/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  Create Application
                </Link>
                {(filters.search || filters.status) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => {
                const jobId = job.id || job._id;
                const isConfirmingDelete = deleteConfirmId === jobId;
                return (
                  <motion.div
                    key={jobId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200/70 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    {/* Job Information */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-lg uppercase shrink-0 mt-0.5">
                        {job.company.companyName ? job.company.companyName.charAt(0) : job.company.charAt(0)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-base leading-tight truncate">
                            {job.role}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusBadgeClass(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <h5 className="font-semibold text-sm text-slate-500 truncate">
                          {job.company.companyName || job.company}
                        </h5>

                        {/* Metadata grid */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-400">
                          {job.location && (
                            <span className="flex items-center gap-1 font-medium truncate max-w-[150px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {job.location}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="flex items-center gap-1 font-medium">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {job.jobType}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center gap-1 font-medium">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {job.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {new Date(job.applicationDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Notes snippet */}
                        {job.notes && (
                          <div className="pt-2">
                            <p className="text-xs text-slate-450 bg-slate-50 rounded-lg p-2.5 border border-slate-100 line-clamp-1 italic max-w-2xl font-medium">
                              "{job.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-50 border border-slate-250 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Open application URL link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to={`/jobs/${jobId}/edit`}
                        className="p-2 bg-slate-50 border border-slate-250 text-blue-650 hover:text-blue-800 rounded-xl transition-all cursor-pointer"
                        title="Edit application details"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Confirmable trash button */}
                      <AnimatePresence mode="wait">
                        {isConfirmingDelete ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-red-50 border border-red-200/50 p-1 rounded-xl flex items-center gap-1.5 text-xs font-semibold"
                          >
                            <span className="text-red-700 pl-1.5 uppercase tracking-wide text-[10px]">Delete?</span>
                            <button
                              onClick={() => handleDeleteJob(jobId)}
                              className="px-2 py-1 bg-red-655 rounded-lg text-white font-bold cursor-pointer hover:bg-red-750 tracking-tight text-[10px]"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] border border-slate-200"
                            >
                              No
                            </button>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(jobId)}
                            className="p-2 bg-slate-50 border border-slate-250 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Remove application record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Pagination Footer */}
        {pagination.totalPages > 1 && !loading && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 bg-white p-4 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-450 font-medium">
              Showing page <strong className="font-bold text-slate-800">{pagination.currentPage}</strong> of{" "}
              <strong className="font-bold text-slate-800">{pagination.totalPages}</strong> (
              <strong className="font-bold text-slate-800">{pagination.totalItems}</strong> items)
            </span>
            <div className="inline-flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
