import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  jobs: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  },
  currentJob: null,
  analytics: null,
  filters: {
    search: "",
    status: "",
    company: "",
    sort: "newest",
    page: 1,
    limit: 10,
  },
  loading: false,
  analyticsLoading: false,
  error: null,
};

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setJobsLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setJobsSuccess: (state, action) => {
      state.loading = false;
      state.jobs = action.payload.jobs;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    setJobsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSingleJobSuccess: (state, action) => {
      state.currentJob = action.payload;
      state.loading = false;
      state.error = null;
    },
    setAnalyticsLoading: (state) => {
      state.analyticsLoading = true;
    },
    setAnalyticsSuccess: (state, action) => {
      state.analyticsLoading = false;
      state.analytics = action.payload;
    },
    setAnalyticsFailure: (state, action) => {
      state.analyticsLoading = false;
      state.error = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        // Reset to page 1 unless they specify page
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearJobError: (state) => {
      state.error = null;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
  },
});

export const {
  setJobsLoading,
  setJobsSuccess,
  setJobsFailure,
  setSingleJobSuccess,
  setAnalyticsLoading,
  setAnalyticsSuccess,
  setAnalyticsFailure,
  updateFilters,
  resetFilters,
  clearJobError,
  clearCurrentJob,
} = jobSlice.actions;

export default jobSlice.reducer;
