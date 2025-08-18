import axios from 'axios';
import { getToken } from './auth';

const BASE_URL = "http://localhost:8081/api"; // adjust if needed

// Create an instance of axios
const api = axios.create({
  baseURL: BASE_URL
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = (data) => axios.post(`${BASE_URL}/auth/login`, data);
export const register = (data) => axios.post(`${BASE_URL}/auth/register`, data);
export const registerFaculty = (data) => api.post(`/admin/add-faculty`, data);

// Fetch all upcoming events
export const getEvents = () => api.get(`/events/all-events`);

// Faculty requests event (sends info to admin for approval)
export const requestEvent = (data) => api.post(`/events/request-event`, data);

// Admin: get all requested events
export const getRequestedEvents = () => api.get(`/events/all-requested-events`);

// Admin: approve a requested event
export const approveEventRequest = (requestId) => api.post(`/events/approve-event/${requestId}`);

// Admin: reject a requested event
export const rejectEventRequest = (requestId) => api.post(`/events/reject-event/${requestId}`);

// Admin: modify a requested event with a remark
export const addRemarkToEvent = (requestId, requestBody) => api.put(`/admin/modify-event/${requestId}`, requestBody);

// Admin: create event directly (bypassing faculty request)
export const adminCreateEvent = (data) => api.post(`/events/create-event`, data);

// After admin approval, faculty creates event (final registration)
export const createEvent = (data) => api.post(`/events/create-event`, data);

// Faculty: edit an existing event request
export const editEventRequest = (eventId, eventData) => api.put(`/events/edit-existing-event/${eventId}`, eventData);

// Faculty: mark remark as notified/read to prevent repeated notifications
export const markRemarkAsNotified = (eventId) => {
  // Make sure we have a valid event ID
  if (!eventId) {
    console.error('Invalid eventId provided to markRemarkAsNotified:', eventId);
    return Promise.reject(new Error('Invalid event ID'));
  }
  return api.put(`/events/mark-remark-notified/${eventId}`, { remarkNotified: true })
    .catch(error => {
      console.error('Failed to mark remark as notified:', error);
      throw error;
    });
};

// Fetch all events requested by a specific faculty
export const getEventsByFacultyId = (facultyId, params = {}) => {
  // Add a timestamp parameter to prevent browser caching if not already provided
  const finalParams = params.timestamp ? params : { ...params, timestamp: new Date().getTime() };
  return api.get(`/events/all-requested-events/${facultyId}`, { params: finalParams });
};

// Cancel an event
export const cancelEvent = (eventId) => api.delete(`/events/delete-existing-event/${eventId}`);

// // Fetch events registered by a student (expects student id or email)
// export const getRegisteredEvents = (studentIdOrEmail) => axios.get(`${BASE_URL}/events/registered`, { params: { student: studentIdOrEmail } });

// // Register for an event (expects eventId and student info)
// export const registerForEvent = (data) => axios.post(`${BASE_URL}/events/register`, data);

// // Cancel event registration (expects eventId and student info)
// export const cancelEventRegistration = (data) => axios.post(`${BASE_URL}/events/cancel`, data);