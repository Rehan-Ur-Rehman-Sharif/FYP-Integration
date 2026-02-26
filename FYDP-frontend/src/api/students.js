/**
 * Student-related API functions.
 *
 * All requests are authenticated via the Axios interceptor in api/index.js.
 */
import api from './index';

/** Return the full profile + course attendance of the authenticated student. */
export const getMyProfile = async () => {
  const { data } = await api.get('/students/me/');
  return data;
};

/** Submit a QR scan to mark attendance.
 *  @param {string} qrToken  - the qr_code_token string from the scanned QR
 *  @param {number} studentId
 *  @param {number|null} latitude  - optional, from browser geolocation
 *  @param {number|null} longitude - optional, from browser geolocation
 */
export const submitQRScan = async (qrToken, studentId, latitude = null, longitude = null) => {
  const payload = { qr_token: qrToken, student_id: studentId };
  if (latitude !== null) payload.latitude = latitude;
  if (longitude !== null) payload.longitude = longitude;
  const { data } = await api.post('/attendance/qr-scan/', payload);
  return data;
};

/** List all students (admin use). Supports year/dept/section query params. */
export const listStudents = async (params = {}) => {
  const { data } = await api.get('/students/', { params });
  return data;
};
