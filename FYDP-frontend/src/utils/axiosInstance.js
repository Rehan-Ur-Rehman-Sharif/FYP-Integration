import axios from "axios";

// Skip ngrok free-tier interstitial HTML on API calls (otherwise login shows raw HTML errors).
const NGROK_SKIP_HEADER = "ngrok-skip-browser-warning";

const axiosInstance = axios.create({
  headers: { [NGROK_SKIP_HEADER]: "true" },
});

// Attach access token to every request automatically
axiosInstance.interceptors.request.use((config) => {
  config.headers[NGROK_SKIP_HEADER] = "true";
  try {
    const token = JSON.parse(localStorage.getItem("currentUser"))?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

// On 401, try to refresh the access token once then retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isExpired =
      error.response?.status === 401 &&
      !original._retry;

    if (!isExpired) return Promise.reject(error);

    original._retry = true;

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
      const { data } = await axios.post("/api/token/refresh/", {
        refresh: currentUser.refresh,
      });

      // Save new access token
      currentUser.token = data.access;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Retry original request with new token
      original.headers.Authorization = `Bearer ${data.access}`;
      return axiosInstance(original);
    } catch {
      // Refresh also failed — clear session and redirect to login
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;
