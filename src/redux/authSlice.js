import { createSlice } from "@reduxjs/toolkit";
import { getToken, setToken, removeToken } from "../services/api.js";

const initialState = {
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startAuthAction: (state) => {
      state.loading = true;
      state.error = null;
    },
    authActionSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      setToken(action.payload.token);
    },
    authActionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfileSuccess: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      removeToken();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  startAuthAction,
  authActionSuccess,
  authActionFailure,
  updateProfileSuccess,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
