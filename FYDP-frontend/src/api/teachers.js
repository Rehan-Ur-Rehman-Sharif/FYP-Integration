/**
 * Teacher-related API functions.
 */
import api from './index';

/** Return the full profile + taught courses of the authenticated teacher. */
export const getMyProfile = async () => {
  const { data } = await api.get('/teachers/me/');
  return data;
};

/** Start a new attendance session.
 *  @param {object} payload - { teacher, course, section, year, program?, session_type?,
 *                              require_rfid?, latitude?, longitude?, radius_meters? }
 */
export const startSession = async (payload) => {
  const { data } = await api.post('/attendance-sessions/', payload);
  return data;
};

/** Stop an active session. */
export const stopSession = async (sessionId) => {
  const { data } = await api.post(`/attendance-sessions/${sessionId}/stop/`);
  return data;
};

/** Get the base64 QR image + token for a session. */
export const getQRCode = async (sessionId) => {
  const { data } = await api.get(`/attendance-sessions/${sessionId}/qr/`);
  return data;
};

/** Get attendance records + statistics for a session. */
export const getSessionAttendance = async (sessionId) => {
  const { data } = await api.get(`/attendance-sessions/${sessionId}/attendance/`);
  return data;
};

/** List attendance sessions. */
export const listSessions = async (params = {}) => {
  const { data } = await api.get('/attendance-sessions/', { params });
  return data;
};

/** Submit an attendance update request on behalf of a teacher. */
export const submitAttendanceRequest = async (payload) => {
  const { data } = await api.post('/update-attendance-requests/', payload);
  return data;
};

/** List all teachers. */
export const listTeachers = async () => {
  const { data } = await api.get('/teachers/');
  return data;
};

/** List all courses (optionally filter by course_code query param). */
export const listCourses = async (params = {}) => {
  const { data } = await api.get('/courses/', { params });
  return data;
};
