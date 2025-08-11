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

// After admin approval, faculty creates event (final registration)
export const createEvent = (data) => axios.post(`${BASE_URL}/events/create-event`, data);

// Fetch all events requested by a specific faculty
export const getEventsByFacultyId = (facultyId) => axios.get(`${BASE_URL}/events/all-requested-events/${facultyId}`);

// // Fetch events registered by a student (expects student id or email)
// export const getRegisteredEvents = (studentIdOrEmail) => axios.get(`${BASE_URL}/events/registered`, { params: { student: studentIdOrEmail } });

// // Register for an event (expects eventId and student info)
// export const registerForEvent = (data) => axios.post(`${BASE_URL}/events/register`, data);

// // Cancel event registration (expects eventId and student info)
// export const cancelEventRegistration = (data) => axios.post(`${BASE_URL}/events/cancel`, data);