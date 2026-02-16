const STORAGE_KEY = "attendanceRequests";

// get all requests
export const getAttendanceRequests = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};

// add new request
export const addAttendanceRequest = (request) => {
  const existing = getAttendanceRequests();
  const updated = [...existing, request];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// clear (optional, for testing)
export const clearAttendanceRequests = () => {
  localStorage.removeItem(STORAGE_KEY);
};
