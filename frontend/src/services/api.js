import axios from 'axios';

const BASE_URL = "http://localhost:8081/api"; // adjust if needed

export const login = (data) => axios.post(`${BASE_URL}/auth/login`, data);
export const register = (data) => axios.post(`${BASE_URL}/auth/register`, data);
export const registerFaculty = (data) => axios.post(`${BASE_URL}/auth/add-faculty`, data);

// Fetch all upcoming events
export const getEvents = () => axios.get(`${BASE_URL}/events/all-events`);

// Faculty requests event (sends info to admin for approval)
export const requestEvent = (data) => axios.post(`${BASE_URL}/events/request-event`, data);

// Admin: get all requested events
export const getRequestedEvents = () => axios.get(`${BASE_URL}/events/all-requested-events`);

// Admin: approve a requested event
export const approveEventRequest = (requestId) => axios.post(`${BASE_URL}/events/approve-event/${requestId}`);

// Admin: reject a requested event
export const rejectEventRequest = (requestId) => axios.post(`${BASE_URL}/events/reject-event/${requestId}`);

// Admin: modify a requested event with a remark
export const addRemarkToEvent = (requestId, requestBody) => axios.put(`${BASE_URL}/admin/modify-event/${requestId}`, requestBody);

// Admin: create event directly (bypassing faculty request)
export const adminCreateEvent = (data) => axios.post(`${BASE_URL}/events/create-event`, data);

// After admin approval, faculty creates event (final registration)
export const createEvent = (data) => axios.post(`${BASE_URL}/events/create-event`, data);

// Faculty: edit an existing event request
export const editEventRequest = (eventId, eventData) => axios.put(`${BASE_URL}/events/edit-existing-event/${eventId}`, eventData);

// Faculty: mark remark as notified/read to prevent repeated notifications
export const markRemarkAsNotified = (eventId) => {
  // Make sure we have a valid event ID
  if (!eventId) {
    console.error('Invalid eventId provided to markRemarkAsNotified:', eventId);
    return Promise.reject(new Error('Invalid event ID'));
  }
  return axios.put(`${BASE_URL}/events/mark-remark-notified/${eventId}`, { remarkNotified: true })
    .catch(error => {
      console.error('Failed to mark remark as notified:', error);
      throw error;
    });
};

// Fetch all events requested by a specific faculty
export const getEventsByFacultyId = (facultyId) => axios.get(`${BASE_URL}/events/all-requested-events/${facultyId}`);

// Cancel an event
export const cancelEvent = (eventId) => axios.delete(`${BASE_URL}/events/delete-existing-event/${eventId}`);

// // Fetch events registered by a student (expects student id or email)
// export const getRegisteredEvents = (studentIdOrEmail) => axios.get(`${BASE_URL}/events/registered`, { params: { student: studentIdOrEmail } });

// // Register for an event (expects eventId and student info)
// export const registerForEvent = (data) => axios.post(`${BASE_URL}/events/register`, data);

// // Cancel event registration (expects eventId and student info)
// export const cancelEventRegistration = (data) => axios.post(`${BASE_URL}/events/cancel`, data);