import React, { useState, useEffect } from 'react';
import { getEvents, getRequestedEvents, approveEventRequest, rejectEventRequest, registerFaculty, addRemarkToEvent, adminCreateEvent, getEventsByFacultyId, cancelEvent } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Modal component for remarks
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 24,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};


function AdminDashboard() {
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        id: user.id || user._id || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'admin'
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { id: '', name: '', email: '', role: 'admin' };
    }
  };
  
  const userInfo = getUserInfo();
  const [tab, setTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [rejecting, setRejecting] = useState(null);
  const [reqLoading, setReqLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [modifying, setModifying] = useState(null); // Track which event is being modified
  const [currentEventObj, setCurrentEventObj] = useState(null); // Store the event being modified
  const [remarkText, setRemarkText] = useState(''); // Remark to be added
  const [showModifyModal, setShowModifyModal] = useState(false); // Control modify modal visibility
  
  // Faculty registration state
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', password: '' });
  const [facultySubmitting, setFacultySubmitting] = useState(false);
  const [facultySuccess, setFacultySuccess] = useState('');
  const [facultyError, setFacultyError] = useState('');
  
  // Event creation state
  const [eventForm, setEventForm] = useState({ title: '', date: '', venue: '', description: '' });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventSuccess, setEventSuccess] = useState('');
  const [eventError, setEventError] = useState('');
  
  // My Events state
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(true);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  
  // Handle cancel event
  const handleCancelEvent = async (eventId) => {
    // Confirm with the user
    if (window.confirm('Are you sure you want to cancel this event?')) {
      setCancellingEventId(eventId);
      try {
        await cancelEvent(eventId);
        // Remove the event from the myEvents list
        setMyEvents(prev => prev.filter(event => (event.id !== eventId && event._id !== eventId)));
        // Remove the event from requests if it's there
        setRequests(prev => prev.filter(event => (event.id !== eventId && event._id !== eventId)));
        alert('Event cancelled successfully');
      } catch (error) {
        console.error('Error cancelling event:', error);
        alert('Failed to cancel event. Please try again.');
      } finally {
        setCancellingEventId(null);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'http://localhost:3000/';
  };

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await getEvents();
        // Filter to only show approved events
        const approvedEvents = (res.data || []).filter(event => {
          const status = (event.status || '').toString().trim().toLowerCase();
          return status === 'approved';
        });
        setEvents(approvedEvents);
      } catch {
        setEvents([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  // Fetch requested events
  useEffect(() => {
    const fetchRequests = async () => {
      setReqLoading(true);
      try {
        const res = await getRequestedEvents();
        setRequests(res.data || []);
      } catch {
        setRequests([]);
      }
      setReqLoading(false);
    };
    fetchRequests();
  }, []);
  
  // Fetch my events (admin's events by facultyId)
  useEffect(() => {
    const fetchMyEvents = async () => {
      if (tab === 'myevents' && userInfo.id) {
        setMyEventsLoading(true);
        try {
          // Get events associated with this admin's facultyId
          const res = await getEventsByFacultyId(userInfo.id);
          
          // Filter events to only include those created by this admin
          const adminEvents = (res.data || []).filter(event => {
            // Check various fields that might indicate the admin created this event
            return (
              // Admin might be identified by different fields in different contexts
              (event.createdBy === userInfo.id) || 
              (event.facultyId === userInfo.id) ||
              (event.creatorId === userInfo.id) ||
              (event.adminId === userInfo.id) ||
              // If the admin created the event directly
              (event.createdByAdmin === true)
            );
          });
          
          setMyEvents(adminEvents);
        } catch (err) {
          console.error('Error fetching my events:', err);
          setMyEvents([]);
        }
        setMyEventsLoading(false);
      }
    };
    fetchMyEvents();
  }, [tab, userInfo.id]);

  // Approve event request (real API)
  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approveEventRequest(id);
      // Update the status of the approved request instead of removing it
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'Approved' } : r
      ));
      // Refresh events list
      const eventsRes = await getEvents();
      const approvedEvents = (eventsRes.data || []).filter(event => {
        const status = (event.status || '').toString().trim().toLowerCase();
        return status === 'approved';
      });
      setEvents(approvedEvents);
      alert('Event approved! Faculty has been notified.');
    } catch {
      alert('Failed to approve event.');
    }
    setApproving(null);
  };

  // Reject event request
  const handleReject = async (id) => {
    setRejecting(id);
    try {
      await rejectEventRequest(id);
      // Update the status of the rejected request
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'Rejected' } : r
      ));
      alert('Event request rejected.');
    } catch {
      alert('Failed to reject event.');
    }
    setRejecting(null);
  };
  
  // Open modify modal with current event data
  const openModifyModal = (event) => {
    setCurrentEventObj(event);
    setRemarkText(event.remark || '');
    setShowModifyModal(true);
  };
  
  // Handle modify event with remark
  const handleModify = async () => {
    if (!currentEventObj) return;
    
    setModifying(currentEventObj.id);
    
    try {
      // Send the full object along with the remark
      const completeEventData = {
        ...currentEventObj,
        remark: remarkText
      };
      
      await addRemarkToEvent(currentEventObj.id, completeEventData);
      
      // Update local state to reflect the change
      setRequests(prev => prev.map(r => 
        r.id === currentEventObj.id ? { ...r, remark: remarkText } : r
      ));
      
      setShowModifyModal(false);
      alert('Remark added successfully.');
    } catch (error) {
      console.error('Error adding remark:', error);
      alert('Failed to add remark.');
    }
    
    setModifying(null);
  };
  
  // Handle faculty form input changes
  const handleFacultyChange = (e) => {
    setFacultyForm({ ...facultyForm, [e.target.name]: e.target.value });
  };
  
  // Handle faculty registration
  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setFacultySubmitting(true);
    setFacultySuccess('');
    setFacultyError('');
    
    // Validate form
    if (!facultyForm.name || !facultyForm.email || !facultyForm.password) {
      setFacultyError('All fields are required');
      setFacultySubmitting(false);
      return;
    }
    
    try {
      // Call the API to register a new faculty
      await registerFaculty(facultyForm);
      setFacultySuccess('Faculty member registered successfully!');
      // Reset the form
      setFacultyForm({ name: '', email: '', password: '' });
    } catch (error) {
      setFacultyError(error.response?.data?.message || 'Failed to register faculty member');
    }
    
    setFacultySubmitting(false);
  };
  
  // Handle event form input changes
  const handleEventChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };
  
  // Handle event creation submission
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventSubmitting(true);
    setEventSuccess('');
    setEventError('');
    
    // Validate form
    if (!eventForm.title || !eventForm.date || !eventForm.venue || !eventForm.description) {
      setEventError('Title, date, venue and description are required');
      setEventSubmitting(false);
      return;
    }
    
    // Validation: only allow future dates
    const today = new Date();
    const selected = new Date(eventForm.date);
    if (selected <= today) {
      setEventError('Please select a future date for the event.');
      setEventSubmitting(false);
      return;
    }
    
    try {
      // Call API to create event
      const eventData = {
        ...eventForm,
        adminId: userInfo.id,
        facultyId: userInfo.id, // Add facultyId field with the admin's ID
        status: 'Approved' // Set as approved since admin is creating directly
      };
      
      await adminCreateEvent(eventData);
      setEventSuccess('Event created successfully!');
      
      // Reset form
      setEventForm({
        title: '',
        date: '',
        venue: '',
        description: ''
      });
      
      // Refresh events list
      const res = await getEvents();
      setEvents(res.data || []);
    } catch (error) {
      setEventError(error.response?.data?.message || 'Failed to create event');
    }
    
    setEventSubmitting(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2 style={{ marginBottom: 24 }}>Admin Dashboard</h2>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setTab('view')} style={{ background: tab === 'view' ? '#333' : '#eee', color: tab === 'view' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View All Events</button>
          <button onClick={() => setTab('requests')} style={{ background: tab === 'requests' ? '#333' : '#eee', color: tab === 'requests' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Requested Events</button>
          <button onClick={() => setTab('myevents')} style={{ background: tab === 'myevents' ? '#333' : '#eee', color: tab === 'myevents' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Events</button>
          <button onClick={() => setTab('create')} style={{ background: tab === 'create' ? '#333' : '#eee', color: tab === 'create' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Create Event</button>
          <button onClick={() => setTab('faculty')} style={{ background: tab === 'faculty' ? '#333' : '#eee', color: tab === 'faculty' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Add Faculty</button>
          <button onClick={() => setTab('profile')} style={{ background: tab === 'profile' ? '#333' : '#eee', color: tab === 'profile' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Profile</button>
        </div>
      </div>

      {tab === 'view' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>All Events</h3>
          {loading ? <div>Loading events...</div> : (
            events.length === 0 ? <div>No events found.</div> : (
              <div>
                {events.map(event => (
                  <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{event.title || event.name}</div>
                    <div>Date: {event.event_date || event.date}</div>
                    <div>Description: {event.description}</div>
                    <div>Venue: {event.venue}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
      
      {tab === 'myevents' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>My Events</h3>
          {myEventsLoading ? <div>Loading my events...</div> : (
            myEvents.length === 0 ? <div>You haven't created any events yet.</div> : (
              <div>
                {myEvents.map(event => {
                  const status = (event.status || '').toString().trim().toLowerCase();
                  let statusColor = '#999', statusBg = '#eee', statusText = status || 'pending';
                  
                  if (status === 'approved') { 
                    statusColor = '#2e7d32'; 
                    statusBg = '#e8f5e9'; 
                    statusText = 'Approved'; 
                  } else if (status === 'rejected') { 
                    statusColor = '#c62828'; 
                    statusBg = '#ffebee'; 
                    statusText = 'Rejected'; 
                  } else if (status === 'pending') { 
                    statusColor = '#f57c00'; 
                    statusBg = '#fff3e0'; 
                    statusText = 'Pending'; 
                  }
                  
                  return (
                    <div key={event.id || event._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 24, background: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>{event.title}</strong>
                        <span style={{ background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize' }}>{statusText}</span>
                      </div>
                      <div>Date: {event.date || event.event_date}</div>
                      <div>Description: {event.description}</div>
                      <div>Venue: {event.venue}</div>
                      
                      {/* Show remark if present */}
                      {event.remark && (
                        <div style={{ marginTop: 8, background: '#fffbe6', border: '1px solid #ffe58f', padding: 10, borderRadius: 6 }}>
                          <strong>Admin Remark:</strong> {event.remark}
                        </div>
                      )}
                      
                      {/* Actions row */}
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          style={{ 
                            padding: '4px 12px', 
                            background: '#d9534f', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            cursor: 'pointer', 
                            fontSize: 12,
                            opacity: cancellingEventId === (event.id || event._id) ? 0.7 : 1
                          }}
                          onClick={() => handleCancelEvent(event.id || event._id)}
                          disabled={cancellingEventId === (event.id || event._id)}
                        >
                          {cancellingEventId === (event.id || event._id) ? 'Cancelling...' : 'Cancel Event'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>Requested Events</h3>
          {reqLoading ? <div>Loading requests...</div> : (
            requests.length === 0 ? <div>No event requests.</div> : (
              <div>
                {requests.map(req => {
                  const status = (req.status || '').toString().trim().toLowerCase();
                  // More lenient check for approved status
                  const isApproved = status === 'approved' || status.includes('approve');
                  const isRejected = status === 'rejected' || status.includes('reject');
                  const isPending = !isApproved && !isRejected;

                  let borderColor = '#f0ad4e'; // Default orange for pending
                  let backgroundColor = '#fffbe6'; // Default light yellow for pending

                  if (isApproved) {
                    borderColor = '#cccccc';
                    backgroundColor = '#f2f2f2';
                  } else if (isRejected) {
                    borderColor = '#d9534f'; // Red border
                    backgroundColor = '#f2dede'; // Light red background
                  }

                  return (
                    <div key={req.id} style={{ 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: 8, 
                      padding: 20, 
                      marginBottom: 24, 
                      background: backgroundColor,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div><b>Faculty ID:</b> {req.facultyId}</div>
                      <div><b>Title:</b> {req.title}</div>
                      <div><b>Date:</b> {req.date || req.event_date}</div>
                      <div><b>Description:</b> {req.description}</div>
                      <div><b>Venue:</b> {req.venue}</div>
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '4px 8px', 
                        backgroundColor: isApproved ? '#e8f5e9' : (isRejected ? '#ffebee' : '#fff9c4'),
                        color: isApproved ? '#2e7d32' : (isRejected ? '#c62828' : '#f57f17'),
                        display: 'inline-block',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        <b>Status:</b> {req.status || 'Pending'}
                      </div>
                      
                      {/* Display remark if present */}
                      {req.remark && (
                        <div style={{ 
                          marginTop: '8px',
                          padding: '8px', 
                          background: '#f8f9fa', 
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          <strong>Remark:</strong> {req.remark}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                        {isApproved ? (
                          <>
                            <button disabled style={{ 
                              padding: '6px 16px', 
                              background: '#cccccc', 
                              color: '#666666', 
                              border: 'none', 
                              borderRadius: 4, 
                              fontWeight: 'bold', 
                              cursor: 'not-allowed' 
                            }}>
                              Approved
                            </button>
                            
                            {/* Cancel button for Approved events */}
                            <button 
                              onClick={() => handleCancelEvent(req.id)} 
                              disabled={cancellingEventId === req.id} 
                              style={{ 
                                padding: '6px 16px', 
                                marginLeft: '4px',
                                background: '#f0ad4e',
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                cursor: cancellingEventId === req.id ? 'not-allowed' : 'pointer', 
                                opacity: cancellingEventId === req.id ? 0.6 : 1 
                              }}>
                              {cancellingEventId === req.id ? 'Cancelling...' : 'Cancel Event'}
                            </button>
                          </>
                        ) : isRejected ? (
                          <button disabled style={{ 
                            padding: '6px 16px', 
                            background: '#cccccc', 
                            color: '#666666', 
                            border: 'none', 
                            borderRadius: 4, 
                            fontWeight: 'bold', 
                            cursor: 'not-allowed' 
                          }}>
                            Rejected
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleApprove(req.id)} 
                              disabled={approving === req.id || rejecting === req.id || modifying === req.id} 
                              style={{ 
                                padding: '6px 16px', 
                                background: '#5cb85c', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                cursor: (approving === req.id || rejecting === req.id || modifying === req.id) ? 'not-allowed' : 'pointer', 
                                opacity: (approving === req.id || rejecting === req.id || modifying === req.id) ? 0.6 : 1 
                              }}>
                              {approving === req.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)} 
                              disabled={approving === req.id || rejecting === req.id || modifying === req.id} 
                              style={{ 
                                padding: '6px 16px', 
                                background: '#d9534f', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                cursor: (approving === req.id || rejecting === req.id || modifying === req.id) ? 'not-allowed' : 'pointer', 
                                opacity: (approving === req.id || rejecting === req.id || modifying === req.id) ? 0.6 : 1 
                              }}>
                              {rejecting === req.id ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button 
                              onClick={() => openModifyModal(req)} 
                              disabled={approving === req.id || rejecting === req.id || modifying === req.id} 
                              style={{ 
                                padding: '6px 16px', 
                                background: '#0275d8', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                cursor: (approving === req.id || rejecting === req.id || modifying === req.id) ? 'not-allowed' : 'pointer', 
                                opacity: (approving === req.id || rejecting === req.id || modifying === req.id) ? 0.6 : 1 
                              }}>
                              {modifying === req.id ? 'Modifying...' : 'Modify'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'create' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>Create New Event</h3>
          <div style={{ maxWidth: 500 }}>
            <form onSubmit={handleEventSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Title:</label><br />
                <input 
                  type="text" 
                  name="title" 
                  value={eventForm.title} 
                  onChange={handleEventChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Date:</label><br />
                <input 
                  type="date" 
                  name="date" 
                  value={eventForm.date} 
                  onChange={handleEventChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Venue:</label><br />
                <input 
                  type="text" 
                  name="venue" 
                  value={eventForm.venue} 
                  onChange={handleEventChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Description:</label><br />
                <textarea 
                  name="description" 
                  value={eventForm.description} 
                  onChange={handleEventChange} 
                  required 
                  style={{ width: '100%', padding: 8, minHeight: 100 }} 
                />
              </div>
              
              {eventError && <div style={{ color: 'red', marginBottom: 16 }}>{eventError}</div>}
              {eventSuccess && <div style={{ color: 'green', marginBottom: 16 }}>{eventSuccess}</div>}
              
              <button 
                type="submit" 
                disabled={eventSubmitting} 
                style={{ 
                  padding: '8px 16px', 
                  background: '#5cb85c', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: eventSubmitting ? 'not-allowed' : 'pointer',
                  opacity: eventSubmitting ? 0.7 : 1
                }}
              >
                {eventSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'faculty' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>Add New Faculty Member</h3>
          <div style={{ maxWidth: 500 }}>
            <form onSubmit={handleFacultySubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Name:</label><br />
                <input 
                  type="text" 
                  name="name" 
                  value={facultyForm.name} 
                  onChange={handleFacultyChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Email:</label><br />
                <input 
                  type="email" 
                  name="email" 
                  value={facultyForm.email} 
                  onChange={handleFacultyChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Password:</label><br />
                <input 
                  type="password" 
                  name="password" 
                  value={facultyForm.password} 
                  onChange={handleFacultyChange} 
                  required 
                  style={{ width: '100%', padding: 8 }} 
                />
              </div>
              <button 
                type="submit" 
                disabled={facultySubmitting} 
                style={{ 
                  padding: '10px 32px', 
                  background: '#333', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 4, 
                  fontWeight: 'bold', 
                  cursor: facultySubmitting ? 'not-allowed' : 'pointer',
                  opacity: facultySubmitting ? 0.7 : 1 
                }}
              >
                {facultySubmitting ? 'Registering...' : 'Register Faculty'}
              </button>
            </form>
            
            {facultySuccess && (
              <div style={{ color: 'green', marginTop: 16, padding: 12, background: '#dff0d8', borderRadius: 4 }}>
                {facultySuccess}
              </div>
            )}
            
            {facultyError && (
              <div style={{ color: '#a94442', marginTop: 16, padding: 12, background: '#f2dede', borderRadius: 4 }}>
                {facultyError}
              </div>
            )}
          </div>
        </div>
      )}
      
      {tab === 'profile' && (
        <div>
          <h3 style={{ marginBottom: 24 }}>My Profile</h3>
          <div style={{ maxWidth: 600, padding: 24, background: '#f9f9f9', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: '#333', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontSize: 36,
                fontWeight: 'bold',
                marginRight: 24
              }}>
                {userInfo.name ? userInfo.name[0].toUpperCase() : 'A'}
              </div>
              <div>
                <h2 style={{ margin: 0, marginBottom: 8 }}>{userInfo.name || 'Admin User'}</h2>
                <p style={{ margin: 0, color: '#666', fontStyle: 'italic', textTransform: 'capitalize' }}>{userInfo.role}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>User ID:</p>
              <p style={{ margin: 0, padding: 8, background: '#eee', borderRadius: 4 }}>{userInfo.id}</p>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Email Address:</p>
              <p style={{ margin: 0, padding: 8, background: '#eee', borderRadius: 4 }}>{userInfo.email}</p>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Role:</p>
              <p style={{ margin: 0, padding: 8, background: '#eee', borderRadius: 4, textTransform: 'capitalize' }}>{userInfo.role}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{ 
                marginTop: 16,
                padding: '10px 24px',
                background: '#d9534f',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
      
      {/* Modify Modal */}
      <Modal
        show={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Add Remark"
      >
        {currentEventObj && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Event Details:</h4>
              <p><strong>Faculty ID:</strong> {currentEventObj.facultyId}</p>
              <p><strong>Title:</strong> {currentEventObj.title}</p>
              <p><strong>Date:</strong> {currentEventObj.date}</p>
              <p><strong>Venue:</strong> {currentEventObj.venue}</p>
            </div>
            <div>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter remark for the faculty regarding this event"
                style={{ width: '100%', height: '100px', padding: '8px', marginBottom: '16px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setShowModifyModal(false)}
                style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleModify}
                disabled={modifying === currentEventObj.id}
                style={{ 
                  padding: '8px 16px', 
                  background: '#0275d8', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: modifying === currentEventObj.id ? 'not-allowed' : 'pointer',
                  opacity: modifying === currentEventObj.id ? 0.7 : 1
                }}
              >
                {modifying === currentEventObj.id ? 'Submitting...' : 'Submit Remark'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
