/**
 * Authentication API functions.
 *
 * Successful login stores the JWT tokens and a `currentUser` blob in
 * localStorage so the rest of the app can use them without re-fetching.
 */
import api from './index';

const storeTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// ── Student ─────────────────────────────────────────────────────────────────

export const loginStudent = async (email, password) => {
  const { data } = await api.post('/auth/login/student/', { email, password });
  storeTokens(data.access, data.refresh);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      role: 'student',
      id: data.student_id,
      name: data.student_name,
      email: data.email,
    })
  );
  return data;
};

export const registerStudent = async (payload) => {
  const { data } = await api.post('/auth/register/student/', payload);
  return data;
};

// ── Teacher ──────────────────────────────────────────────────────────────────

export const loginTeacher = async (email, password) => {
  const { data } = await api.post('/auth/login/teacher/', { email, password });
  storeTokens(data.access, data.refresh);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      role: 'teacher',
      id: data.teacher_id,
      name: data.teacher_name,
      email: data.email,
    })
  );
  return data;
};

export const registerTeacher = async (payload) => {
  const { data } = await api.post('/auth/register/teacher/', payload);
  return data;
};

// ── Admin / Management ───────────────────────────────────────────────────────

export const loginAdmin = async (email, password) => {
  const { data } = await api.post('/auth/login/management/', { email, password });
  storeTokens(data.access, data.refresh);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      role: data.role === 'event_admin' ? 'eventAdmin' : 'admin',
      id: data.management_id,
      name: data.management_name,
      email: data.email,
      role_detail: data.role,
    })
  );
  return data;
};

export const registerManagement = async (payload) => {
  const { data } = await api.post('/auth/register/management/', payload);
  return data;
};

// ── Event Participant ────────────────────────────────────────────────────────

export const loginParticipant = async (email, password) => {
  const { data } = await api.post('/auth/login/participant/', { email, password });
  storeTokens(data.access, data.refresh);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      role: 'participant',
      id: data.participant_id,
      name: data.name,
      email: data.email,
    })
  );
  return data;
};

export const registerParticipant = async (payload) => {
  const { data } = await api.post('/auth/register/participant/', payload);
  return data;
};

// ── Logout ───────────────────────────────────────────────────────────────────

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('currentUser');
};
