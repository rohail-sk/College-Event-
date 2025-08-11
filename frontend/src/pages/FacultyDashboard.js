import React, { useState, useEffect } from 'react';
import { getEvents, requestEvent, getRequestedEvents, getEventsByFacultyId } from '../services/api';
import { useNavigate } from 'react-router-dom';


function FacultyDashboard() {
  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        id: user.id || user._id || user.facultyId || '',
        name: user.name || '',
        email: user.email || ''
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { id: '', name: '', email: '' };
    }
  };

  const userInfo = getUserInfo();
  
  const navigate = useNavigate();
  const [tab, setTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    facultyId: userInfo.id, 
    title: '', 
    date: '', 
    description: '', 
    venue: '' 
  });
  const [myRequestId, setMyRequestId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

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

  // Handle form input
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle event request submit (API call)
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    // Validation: only allow future dates
    const today = new Date();
    const selected = new Date(form.date);
    if (selected <= today) {
      setErrorMsg('Please select a future date for the event.');
      setSubmitting(false);
      return;
    }
    try {
      // Send request to admin with all details
      const payload = { ...form };
      const res = await requestEvent(payload);
      setSuccessMsg('Event request sent to admin for approval!');
      // Keep the faculty ID when resetting the form
      setForm({ 
        facultyId: form.facultyId, // Keep the faculty ID
        title: '', 
        date: '', 
        description: '', 
        venue: '' 
      });
      setMyRequestId(res.data?.id || res.data?._id || null);
      setPolling(true);
    } catch (err) {
      setErrorMsg('Failed to send event request.');
    }
    setSubmitting(false);
  };

  // Poll for approval of the latest request
  useEffect(() => {
    let interval;
    if (polling && myRequestId) {
      interval = setInterval(async () => {
        try {
          const res = await getRequestedEvents();
          const req = res.data?.find(r => r.id === myRequestId || r._id === myRequestId);
          if (req) {
            const status = (req.status || '').toString().trim().toLowerCase();
            console.log('Polling: myRequestId', myRequestId, 'found request:', req, 'status:', status);
            if (status === 'approved' || status === 'Approved'.toLowerCase()) {
              setSuccessMsg('Your event has been approved and is now live!');
              setPolling(false);
              // Optionally, refresh events list
              const eventsRes = await getEvents();
              setEvents(eventsRes.data || []);
              window.alert('Your event request has been approved! The event is now public.');
            }
          }
        } catch (err) {
          // console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling, myRequestId]);

  // This section is intentionally removed as we no longer have a two-step process
  
  // Fetch requested events for this faculty
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (tab === 'requests') {
        setRequestsLoading(true);
        try {
          // Simply use the facultyId from the form state, which is already initialized
          // from localStorage when the component mounts
          if (form.facultyId) {
            // Use the dedicated API endpoint to get events by faculty ID
            const res = await getEventsByFacultyId(form.facultyId);
            console.log('Faculty events response:', res.data);
            setMyRequests(res.data || []);
          } else {
            console.log('No faculty ID found to fetch requests');
            setMyRequests([]);
          }
        } catch (error) {
          console.error('Error fetching faculty events:', error);
          setMyRequests([]);
        }
        setRequestsLoading(false);
      }
    };
    fetchMyRequests();
  }, [tab, form.facultyId]);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Faculty Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('view')} style={{ background: tab === 'view' ? '#333' : '#eee', color: tab === 'view' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View Upcoming Events</button>
        <button onClick={() => setTab('requests')} style={{ background: tab === 'requests' ? '#333' : '#eee', color: tab === 'requests' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Requested Events</button>
        <button onClick={() => setTab('create')} style={{ background: tab === 'create' ? '#333' : '#eee', color: tab === 'create' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Request New Event</button>
        <button onClick={() => setTab('profile')} style={{ background: tab === 'profile' ? '#333' : '#eee', color: tab === 'profile' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Profile</button>
      </div>

      {tab === 'view' && (
        <div>
          <h3>Upcoming Events</h3>
          {loading ? <div>Loading events...</div> : (
            events.length === 0 ? <div>No events found.</div> : (
              <div>
                {events.map(event => (
                  <div key={event.id || event._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{event.title || event.name}</div>
                    <div>Date: {event.date || event.event_date} &nbsp; | &nbsp; Time: {event.time}</div>
                    <div>Venue: {event.venue}</div>
                    <div>Description: {event.description}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          <h3>My Requested Events</h3>
          {requestsLoading ? <div>Loading your requests...</div> : (
            myRequests.length === 0 ? (
              <div>
                <p>No event requests found. Please ensure your Faculty ID is correct when submitting requests.</p>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  Current Faculty ID: {
                    (function() {
                      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                      return form.facultyId || localStorage.getItem('facultyId') || userInfo.facultyId || userInfo.id || "None found";
                    })()
                  }
                </p>
              </div>
            ) : (
              <div>
                {myRequests.map(request => {
                  const status = (request.status || '').toString().trim().toLowerCase();
                  let statusColor, statusBg, statusText;
                  
                  if (status === 'approved') {
                    statusColor = '#5cb85c';  // Green
                    statusBg = '#dff0d8';     // Light green
                    statusText = 'Approved';
                  } else if (status === 'rejected') {
                    statusColor = '#d9534f';  // Red
                    statusBg = '#f2dede';     // Light red
                    statusText = 'Rejected';
                  } else {
                    statusColor = '#f0ad4e';  // Orange
                    statusBg = '#fcf8e3';     // Light orange
                    statusText = 'Pending';
                  }
                  
                  return (
                    <div key={request.id || request._id} style={{ 
                      border: `1px solid ${statusColor}`, 
                      borderRadius: 8, 
                      padding: 16, 
                      marginBottom: 16, 
                      background: statusBg
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: 18 }}>{request.title}</div>
                        <div style={{ 
                          padding: '4px 10px', 
                          background: statusColor, 
                          color: 'white', 
                          borderRadius: '4px', 
                          fontWeight: 'bold' 
                        }}>{statusText}</div>
                      </div>
                      <div><b>Faculty ID:</b> {request.facultyId}</div>
                      <div><b>Date:</b> {request.date || request.event_date}</div>
                      <div><b>Venue:</b> {request.venue}</div>
                      <div><b>Description:</b> {request.description}</div>
                      <div><b>Submitted on:</b> {new Date(request.createdAt || request.timestamp || Date.now()).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: 500 }}>
          <h3>Request New Event</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label>Faculty ID:</label><br />
              <input 
                type="text" 
                name="facultyId" 
                value={form.facultyId} 
                readOnly 
                style={{ width: '100%', padding: 8, background: '#f0f0f0', cursor: 'not-allowed' }} 
                title="This value is automatically filled from your account" 
              />
              {!form.facultyId && (
                <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>
                  Faculty ID not found. Please logout and login again.
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Title:</label><br />
              <input type="text" name="title" value={form.title} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Event Date:</label><br />
              <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Description:</label><br />
              <textarea name="description" value={form.description} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Venue:</label><br />
              <input type="text" name="venue" value={form.venue} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
            </div>
            <button type="submit" disabled={submitting} style={{ padding: '10px 32px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Requesting...' : 'Request Event'}
            </button>
          </form>
          {successMsg && <div style={{ color: 'green', marginTop: 16 }}>{successMsg}</div>}
          {errorMsg && <div style={{ color: 'red', marginTop: 16 }}>{errorMsg}</div>}
        </div>
      )}

      {tab === 'profile' && (
        <div style={{ maxWidth: 600 }}>
          <h3>My Profile</h3>
          {(() => {
            // Get user data from localStorage
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              if (!user || Object.keys(user).length === 0) {
                return <div>No profile information found. Please log in again.</div>;
              }

              return (
                <div>
                  <div style={{ 
                    background: '#f9f9f9', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '20px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: '#333', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '24px',
                        marginRight: '15px'
                      }}>
                        {(user.name?.charAt(0) || 'F').toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>{user.name || 'Faculty Member'}</h3>
                        <div style={{ 
                          background: '#333', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          display: 'inline-block' 
                        }}>
                          Faculty
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <strong>Email:</strong> {user.email || 'No email provided'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Faculty ID:</strong> {user.id || user._id || user.facultyId || 'No ID found'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Position:</strong> {user.position || 'Faculty Member'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Account Status:</strong> <span style={{ color: 'green' }}>Active</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      // Clear user data from localStorage
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      // Navigate to auth page (login/register)
                      navigate('/auth');
                    }}
                    style={{ 
                      padding: '10px 20px', 
                      background: '#d9534f', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Logout
                  </button>
                </div>
              );
            } catch (error) {
              console.error('Error displaying profile:', error);
              return <div>Error loading profile information. Please try again later.</div>;
            }
          })()}
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
