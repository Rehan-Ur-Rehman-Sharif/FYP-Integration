/**
 * Admin (Management) API functions.
 */
import api from './index';

/** Return the authenticated management user's profile. */
export const getMyProfile = async () => {
  const { data } = await api.get('/management/me/');
  return data;
};

/** List all students (optionally filter by year/dept/section). */
export const listStudents = async (params = {}) => {
  const { data } = await api.get('/students/', { params });
  return data;
};

/** List all teachers. */
export const listTeachers = async () => {
  const { data } = await api.get('/teachers/');
  return data;
};

/** List all courses. */
export const listCourses = async () => {
  const { data } = await api.get('/courses/');
  return data;
};

/** List attendance update requests.
 *  Pass `{ status: 'pending' }` to show only pending requests.
 */
export const listAttendanceRequests = async (params = {}) => {
  const { data } = await api.get('/update-attendance-requests/', { params });
  return data;
};

/** Approve an attendance update request. */
export const approveAttendanceRequest = async (id) => {
  const { data } = await api.post(`/update-attendance-requests/${id}/approve/`);
  return data;
};

/** Reject an attendance update request. */
export const rejectAttendanceRequest = async (id) => {
  const { data } = await api.post(`/update-attendance-requests/${id}/reject/`);
  return data;
};
