const BASE_URL = "/api";

export const getToken = () => {
  return localStorage.getItem("job_tracker_token");
};

export const setToken = (token) => {
  localStorage.setItem("job_tracker_token", token);
};

export const removeToken = () => {
  localStorage.removeItem("job_tracker_token");
};

// Generic response validator and header injector
export const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: text || "Network error occurred" };
  }

  if (!response.ok) {
    // If the token is invalid/expired, automatically sign out the user
    if (response.status === 401) {
      removeToken();
      // Dispatching standard reload event or let redux catch it
      window.dispatchEvent(new Event("unauthorized-access"));
    }
    throw new Error(data.message || `HTTP Error ${response.status}`);
  }

  return data;
};

// Authentication Requests
export const authApi = {
  login: async (body) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  sendOtp: async (body) => {
    return request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  register: async (body) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getProfile: async () => {
    return request("/auth/profile");
  },

  updateProfile: async (body) => {
    return request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  forgotPassword: async (body) => {
    return request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  resetPassword: async (body) => {
    return request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

// Job Management Requests
export const jobApi = {
  create: async (body) => {
    return request("/jobs", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  list: async (filters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.company) params.append("company", filters.company);
    if (filters.sort) params.append("sort", filters.sort);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/jobs${query}`);
  },

  getById: async (id) => {
    return request(`/jobs/${id}`);
  },

  update: async (id, body) => {
    return request(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete: async (id) => {
    return request(`/jobs/${id}`, {
      method: "DELETE",
    });
  },

  getAnalytics: async () => {
    return request("/jobs/analytics");
  },

  sendReminder: async (id) => {
    return request(`/jobs/${id}/send-reminder`, {
      method: "POST",
    });
  },
};

