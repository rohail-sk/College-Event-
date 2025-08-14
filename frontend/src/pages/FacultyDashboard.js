import React, { useState, useEffect } from 'react';
import { getEvents, requestEvent, getRequestedEvents, getEventsByFacultyId, editEventRequest, markRemarkAsNotified } from '../services/api';
import { useNavigate } from 'react-router-dom';

function FacultyDashboard() {
  // Get faculty user info from localStorage with role separation
  const getUserInfo = () => {
    try {
      // First try to get faculty-specific data
      const facultyUser = JSON.parse(localStorage.getItem('user_faculty') || 'null');
      if (facultyUser && facultyUser.role === 'faculty') {
        return {
          id: facultyUser.id || facultyUser._id || facultyUser.facultyId || '',
          name: facultyUser.name || '',
          email: facultyUser.email || '',
          role: 'faculty'
        };
      }
      
      // If faculty-specific data not found, check generic user data but verify it's faculty role
      const genericUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (genericUser && genericUser.role === 'faculty') {
        // Store into faculty-specific storage to prevent future role confusion
        localStorage.setItem('user_faculty', JSON.stringify(genericUser));
        return {
          id: genericUser.id || genericUser._id || genericUser.facultyId || '',
          name: genericUser.name || '',
          email: genericUser.email || '',
          role: 'faculty'
        };
      }
      
      // No valid faculty data found
      return { id: '', name: '', email: '', role: '' };
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
    facultyId: userInfo.id, 
    title: '', 
    date: '', 
    description: '', 
    venue: '' 
  });
  const [editingEvent, setEditingEvent] = useState(null); // Store the event being edited
  const [myRequestId, setMyRequestId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [isValidFaculty, setIsValidFaculty] = useState(true);
  
  // Check user role on component mount and prevent admin data leakage
  useEffect(() => {
    // Get latest user info and set to state
    const latest = getUserInfo();
    setUserInfo(latest);
    
    // Store last active role to help prevent confusion
    localStorage.setItem('lastActiveRole', 'faculty');
    
    // If we don't have a valid faculty user, check if switching dashboards is needed
    if (!latest.id || latest.role !== 'faculty') {
      setIsValidFaculty(false);
      
      // Check if we have admin data but not faculty data - this means we're likely
      // trying to access faculty dashboard while logged in as admin
      const adminData = JSON.parse(localStorage.getItem('user_admin') || 'null');
      if (adminData && adminData.role === 'admin') {
        const confirmSwitch = window.confirm(
          'You appear to be logged in as an admin but trying to access the Faculty dashboard. ' +
          'Would you like to switch to the Admin dashboard instead?'
        );
        if (confirmSwitch) {
          navigate('/admin');
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
      let res;
      
      if (editingEvent) {
        // If we are editing an existing event request
        const payload = { 
          ...form,
          status: 'Pending' // Explicitly set status to Pending when editing an event
        };
        res = await editEventRequest(editingEvent.id || editingEvent._id, payload);
        setSuccessMsg('Event request updated and sent to admin for approval!');
        setEditingEvent(null); // Clear the editing state
      } else {
        // If this is a new event request
        const payload = { ...form };
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
          if (form.facultyId) {
            const res = await getEventsByFacultyId(form.facultyId);
            console.log('Faculty events response:', res.data);
            
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
                localStorage.removeItem('user');
                localStorage.removeItem('user_admin');
                localStorage.removeItem('user_faculty');
                localStorage.removeItem('token');
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
                    localStorage.removeItem('user_faculty');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    localStorage.removeItem('lastActiveRole');
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
