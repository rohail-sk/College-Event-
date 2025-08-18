import React, { useState, useEffect } from 'react';
import { getEvents, requestEvent, getRequestedEvents, getEventsByFacultyId, editEventRequest, markRemarkAsNotified, cancelEvent } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';

function FacultyDashboard() {
  // Get faculty user info using the centralized auth service
  const getUserInfo = () => {
    try {
      const user = getCurrentUser();
      
      if (!user) {
        console.warn('No user data found');
        return { id: '', name: '', email: '', role: '' };
      }
      
      // Verify this is a faculty user
      if (user.role === 'faculty') {
        return {
          id: user.id || user._id || user.facultyId || '',
          name: user.name || '',
          email: user.email || '',
          role: 'faculty'
        };
      } else {
        console.warn('User is not a faculty member:', user.role);
        return { id: '', name: '', email: '', role: '' };
      }
    } catch (error) {
      console.error('Error parsing faculty user data:', error);
      return { id: '', name: '', email: '', role: '' };
    }
  };

  const [userInfo, setUserInfo] = useState(getUserInfo());
  
  const navigate = useNavigate();
  const [tab, setTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    title: '', 
    date: '', 
    description: '', 
    venue: '' 
  });
  
  // Update form when userInfo changes to ensure we always use the current faculty ID
  useEffect(() => {
    if (userInfo.id) {
      setForm(currentForm => ({
        ...currentForm,
        facultyId: userInfo.id
      }));
      console.log('Updated form with current faculty ID:', userInfo.id);
    }
  }, [userInfo.id]);
  const [editingEvent, setEditingEvent] = useState(null); // Store the event being edited
  const [myRequestId, setMyRequestId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [isValidFaculty, setIsValidFaculty] = useState(true);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  
  // Check user role on component mount and prevent admin data leakage
  useEffect(() => {
    // Get the latest user info and set to state
    const latest = getUserInfo();
    setUserInfo(latest);
    
    // Log the user info we found
    console.log('FacultyDashboard - Current user info:', latest);
    
    // If we have no faculty data at all, redirect to login
    if (!latest.id) {
      console.warn('No faculty data found, redirecting to login');
      setIsValidFaculty(false);
      navigate('/');
      return;
    }
    
    // If we have a specific session ID, add it to the URL to make this page specific to this faculty
    if (latest.sessionId && !window.location.search.includes('sessionId')) {
      // Create a new URL with the session ID
      const url = new URL(window.location.href);
      url.searchParams.set('sessionId', latest.sessionId);
      
      // Update browser history without reloading page
      window.history.replaceState({}, '', url);
      console.log('Added session ID to URL:', latest.sessionId);
    }
    
    // If not a refresh and user is not faculty, check if switching dashboards is needed
    if (!latest.id || latest.role !== 'faculty') {
      setIsValidFaculty(false);
      
      // Check if we have admin data but not faculty data - this means we're likely
      // trying to access faculty dashboard while logged in as admin
      const sessionId = localStorage.getItem('currentSession');
      let adminData = null;
      
      if (sessionId) {
        // First check session-based storage
        const userData = JSON.parse(localStorage.getItem(`user_${sessionId}`) || 'null');
        if (userData && userData.role === 'admin') {
          adminData = userData;
        }
      }
      
      // Fall back to legacy storage if needed
      if (!adminData) {
        adminData = JSON.parse(localStorage.getItem('user_admin') || 'null');
      }
      
      if (adminData && adminData.role === 'admin') {
        // Only show the confirmation dialog if this isn't a page refresh
        const confirmSwitch = window.confirm(
          'You appear to be logged in as an admin but trying to access the Faculty dashboard. ' +
          'Would you like to switch to the Admin dashboard instead?'
        );
        if (confirmSwitch) {
          navigate('/admin-dashboard');
          return;
        }
      }
    } else {
      setIsValidFaculty(true);
      // Ensure form has the correct faculty ID
      setForm(prev => ({...prev, facultyId: latest.id}));
    }
  }, [navigate]);

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await getEvents();
        // Filter to only show approved events - use case-insensitive comparison
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

  // Handle cancelling an event
  const handleCancelEvent = async (eventId) => {
    // Confirm with the user
    if (window.confirm('Are you sure you want to cancel this event?')) {
      setCancellingEventId(eventId);
      try {
        await cancelEvent(eventId);
        // Remove the event from the myRequests list
        setMyRequests(prev => prev.filter(event => (event.id !== eventId && event._id !== eventId)));
        alert('Event cancelled successfully');
      } catch (error) {
        console.error('Error cancelling event:', error);
        alert('Failed to cancel event. Please try again.');
      } finally {
        setCancellingEventId(null);
      }
    }
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
      // Ensure we always use the current user ID from our session
      const currentUserInfo = getUserInfo();
      
      let res;
      
      if (editingEvent) {
        // If we are editing an existing event request
        const payload = { 
          ...form,
          facultyId: currentUserInfo.id, // Use current faculty ID
          status: 'Pending' // Explicitly set status to Pending when editing an event
        };
        console.log('Editing event with faculty ID:', currentUserInfo.id);
        res = await editEventRequest(editingEvent.id || editingEvent._id, payload);
        setSuccessMsg('Event request updated and sent to admin for approval!');
        setEditingEvent(null); // Clear the editing state
      } else {
        // If this is a new event request
        const payload = { 
          ...form,
          facultyId: currentUserInfo.id // Use current faculty ID
        };
        console.log('Creating event with faculty ID:', currentUserInfo.id);
        res = await requestEvent(payload);
        setSuccessMsg('Event request sent to admin for approval!');
      }
      
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

  // Poll for approval of the latest request and check for remarks
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
            
            // Check for new remark - ONLY if it hasn't been notified yet
            if (req.remark && req.remarkNotified === false) {
              window.alert(`Admin has added remark to your event request: "${req.remark}"`);
              
              try {
                // Call API to mark the remark as notified on the server
                await markRemarkAsNotified(myRequestId);
                
                // Also update in local state
                setMyRequests(prevRequests => 
                  prevRequests.map(r => 
                    (r.id === myRequestId || r._id === myRequestId) 
                      ? { ...r, remarkNotified: true } 
                      : r
                  )
                );
                
                // Update the polling request object to prevent repeat alerts in the current session
                req.remarkNotified = true;
                
                // Stop polling after showing the remark
                setPolling(false);
              } catch (error) {
                console.error('Failed to mark remark as notified:', error);
              }
            }
            
            // Check for approval
            if (status === 'approved' || status === 'Approved'.toLowerCase()) {
              setSuccessMsg('Your event has been approved and is now live!');
              setPolling(false);
              // Optionally, refresh events list
              const eventsRes = await getEvents();
              setEvents(eventsRes.data || []);
              
              // Show appropriate alert based on whether there is a remark
              if (req.remark) {
                window.alert(`Your event request has been approved with remark: "${req.remark}". The event is now public.`);
              } else {
                window.alert('Your event request has been approved! The event is now public.');
              }
            }
          }
        } catch (err) {
          // console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling, myRequestId]);
  
  // Fetch requested events for this faculty
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (tab === 'requests') {
        setRequestsLoading(true);
        try {
          // Get the current user info to ensure we have the right faculty ID
          const currentUserInfo = getUserInfo();
          console.log('Fetching events for faculty with ID:', currentUserInfo.id);
          console.log('Using session ID:', currentUserInfo.sessionId);
          
          // Use the current user ID from session storage
          if (currentUserInfo.id) {
            // Add a cache-busting parameter to prevent browser caching
            const timestamp = new Date().getTime();
            const res = await getEventsByFacultyId(currentUserInfo.id, { timestamp });
            console.log('Faculty events response for ID', currentUserInfo.id, ':', res.data);
            
            // Check for unnotified remarks and mark them
            const events = res.data || [];
            for (const event of events) {
              if (event.remark && !event.remarkNotified) {
                try {
                  // Mark remark as notified on the server
                  await markRemarkAsNotified(event.id || event._id);
                  // Update the event object
                  event.remarkNotified = true;
                  
                  // Show notification for the remark
                  window.alert(`Admin has added remark to your event request: "${event.remark}"`);
                } catch (error) {
                  console.error('Failed to mark remark as notified:', error);
                }
              }
            }
            
            setMyRequests(events);
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
      
      {!isValidFaculty ? (
        <div style={{ padding: '20px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', marginBottom: '20px', color: '#856404' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Access Issue Detected</h4>
          <p>You are not currently logged in as faculty or your faculty data could not be found.</p>
          <p>Possible reasons:</p>
          <ul>
            <li>You may be logged in as admin but viewing the faculty dashboard</li>
            <li>Your session may have expired</li>
            <li>There might be a role conflict in your browser storage</li>
          </ul>
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={() => navigate('/auth')}
              style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '10px', cursor: 'pointer' }}
            >
              Log In Again
            </button>
            <button 
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Clear All & Log Out
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <button onClick={() => setTab('view')} style={{ background: tab === 'view' ? '#333' : '#eee', color: tab === 'view' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View Upcoming Events</button>
            <button onClick={() => setTab('requests')} style={{ background: tab === 'requests' ? '#333' : '#eee', color: tab === 'requests' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Events</button>
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
              <h3>My Events</h3>
              {requestsLoading ? <div>Loading your requests...</div> : (
                myRequests.length === 0 ? (
                  <div>
                    <p>No event requests found. Submit one in the Request New Event tab.</p>
                    <p style={{ fontSize: '0.85em', color: '#666' }}>Faculty ID in use: {form.facultyId || userInfo.id || 'Not set'}</p>
                  </div>
                ) : (
                  <div>
                    {myRequests.map(request => {
                      const status = (request.status || '').toString().trim().toLowerCase();
                      let statusColor = '#999', statusBg = '#eee', statusText = status || 'pending';
                      if (status.toLowerCase() === 'approved') { statusColor = '#2e7d32'; statusBg = '#e8f5e9'; statusText = 'Approved'; }
                      else if (status === 'rejected') { statusColor = '#c62828'; statusBg = '#ffebee'; statusText = 'Rejected'; }
                      else if (status === 'pending') { statusColor = '#f57c00'; statusBg = '#fff3e0'; statusText = 'Pending'; }
                      return (
                        <div key={request.id || request._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <strong>{request.title}</strong>
                            <span style={{ background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize' }}>{statusText}</span>
                          </div>
                          <div style={{ fontSize: 14, marginBottom: 4 }}>Date: {request.date}</div>
                          <div style={{ fontSize: 14, marginBottom: 4 }}>Venue: {request.venue}</div>
                          <div style={{ fontSize: 14, marginBottom: 4 }}>Description: {request.description}</div>
                          {/* Show remark only when status is pending */}
                          {request.remark && status.toLowerCase() !== 'approved' && (
                            <div style={{ marginTop: 8, background: '#fffbe6', border: '1px solid #ffe58f', padding: 10, borderRadius: 6 }}>
                              <strong>Admin Remark:</strong> {request.remark}
                              {/* Show edit button only when status is pending */}
                              {status.toLowerCase() === 'pending' && (
                                <button
                                  style={{ marginLeft: 12, padding: '4px 12px', background: '#0275d8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                                  onClick={() => {
                                    // Set the editing event and pre-fill the form
                                    setEditingEvent(request);
                                    setTab('create');
                                    setForm({
                                      facultyId: request.facultyId || userInfo.id,
                                      title: request.title || '',
                                      date: request.date || '',
                                      description: request.description || '',
                                      venue: request.venue || ''
                                    });
                                  }}
                                >
                                  Edit Event
                                </button>
                              )}
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
                                opacity: cancellingEventId === (request.id || request._id) ? 0.7 : 1
                              }}
                              onClick={() => handleCancelEvent(request.id || request._id)}
                              disabled={cancellingEventId === (request.id || request._id)}
                            >
                              {cancellingEventId === (request.id || request._id) ? 'Cancelling...' : 'Cancel Event'}
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

          {tab === 'create' && (
            <div style={{ maxWidth: 600 }}>
              <h3>{editingEvent ? 'Edit Event Request' : 'Request New Event'}</h3>
              <form onSubmit={handleSubmit} style={{ background: '#fafafa', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
                <div style={{ marginBottom: 12 }}>
                  <label>Faculty ID:</label><br />
                  <input type="text" name="facultyId" value={form.facultyId || userInfo.id} onChange={handleChange} required readOnly style={{ width: '100%', padding: 8, background: '#eee' }} />
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  {editingEvent && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingEvent(null);
                        setForm({ 
                          facultyId: userInfo.id, 
                          title: '', 
                          date: '', 
                          description: '', 
                          venue: '' 
                        });
                      }} 
                      style={{ 
                        padding: '10px 20px', 
                        background: '#ccc', 
                        color: '#333', 
                        border: 'none', 
                        borderRadius: 4, 
                        fontWeight: 'bold', 
                        cursor: submitting ? 'not-allowed' : 'pointer' 
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    style={{ 
                      padding: '10px 32px', 
                      background: '#333', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      fontWeight: 'bold', 
                      cursor: submitting ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {submitting 
                      ? (editingEvent ? 'Updating...' : 'Requesting...') 
                      : (editingEvent ? 'Update Request' : 'Submit Request')
                    }
                  </button>
                </div>
              </form>
              {successMsg && <div style={{ color: 'green', marginTop: 16 }}>{successMsg}</div>}
              {errorMsg && <div style={{ color: 'red', marginTop: 16 }}>{errorMsg}</div>}
            </div>
          )}

          {tab === 'profile' && (
            <div style={{ maxWidth: 600 }}>
              <h3>My Profile</h3>
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginRight: 16 }}>
                    {(userInfo.name?.charAt(0) || 'F').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{userInfo.name || 'Faculty Member'}</div>
                    <div style={{ background: '#333', color: '#fff', padding: '2px 8px', fontSize: 12, borderRadius: 4, display: 'inline-block', marginTop: 4 }}>Faculty</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}><strong>Email:</strong> {userInfo.email || 'N/A'}</div>
                <div style={{ marginBottom: 8 }}><strong>Faculty ID:</strong> {userInfo.id}</div>
                <div style={{ marginBottom: 16 }}><strong>Account Status:</strong> <span style={{ color: 'green' }}>Active</span></div>
                <button
                  onClick={() => {
                    // Use the centralized logout function
                    logout();
                    window.location.href = 'http://localhost:3000/';
                  }}
                  style={{ padding: '10px 20px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FacultyDashboard;
