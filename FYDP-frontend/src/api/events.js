/**
 * Event management API functions.
 */
import api from './index';

/** List all events. */
export const listEvents = async () => {
  const { data } = await api.get('/events/');
  return data;
};

/** Create a new event. */
export const createEvent = async (payload) => {
  const { data } = await api.post('/events/', payload);
  return data;
};

/** Update an event. */
export const updateEvent = async (id, payload) => {
  const { data } = await api.patch(`/events/${id}/`, payload);
  return data;
};

/** Delete an event. */
export const deleteEvent = async (id) => {
  await api.delete(`/events/${id}/`);
};

/** List registrations for an event. */
export const getEventRegistrations = async (eventId) => {
  const { data } = await api.get(`/events/${eventId}/registrations/`);
  return data;
};

/** Get attendance records + statistics for an event. */
export const getEventAttendance = async (eventId) => {
  const { data } = await api.get(`/events/${eventId}/attendance/`);
  return data;
};

/** Mark a participant as present at an event. */
export const markEventAttendance = async (eventId, participantId) => {
  const { data } = await api.post(`/events/${eventId}/mark-attendance/`, {
    participant_id: participantId,
  });
  return data;
};

/** Register the current participant for an event.
 *  @param {number} eventId
 *  @param {number} participantId
 */
export const registerForEvent = async (eventId, participantId) => {
  const { data } = await api.post('/event-registrations/', {
    event: eventId,
    participant: participantId,
  });
  return data;
};
