import React, { useState, useEffect } from 'react';
import { getEvents, requestEvent, createEvent, getRequestedEvents } from '../services/api';


function FacultyDashboard() {
  const [tab, setTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ facultyId: '', title: '', date: '', description: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [myRequestId, setMyRequestId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [createForm, setCreateForm] = useState({ date: '', description: '', title: '', venue: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await getEvents();
        setEvents(res.data || []);
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
  const handleCreateChange = e => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
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
      // Send request to admin
      const payload = { ...form };
      const res = await requestEvent(payload);
      setSuccessMsg('Event request sent to admin for approval!');
      setForm({ facultyId: '', title: '', date: '', description: '' });
      setMyRequestId(res.data?.id || null);
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
            if (status === 'approved' || status == 'Approved') {
              setShowCreateForm(true);
              setPolling(false);
              window.alert('Your event request has been approved! Please fill in the final event details.');
            }
          }
        } catch (err) {
          // console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling, myRequestId]);

  // Handle final event creation after admin approval
  const handleCreateSubmit = async e => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateSuccess('');
    setCreateError('');
    // Validation: only allow future dates
    const today = new Date();
    const selected = new Date(createForm.date);
    if (selected <= today) {
      setCreateError('Please select a future date for the event.');
      setCreateSubmitting(false);
      return;
    }
    try {
      // Map date to event_date
      const payload = { ...createForm };

      await createEvent(payload);
      setCreateSuccess('Event registered in the database!');
      setCreateForm({ date: '', description: '', title: '', venue: '' });
      setShowCreateForm(false);
      setMyRequestId(null);
      setPolling(false);
    } catch (err) {
      setCreateError('Failed to register event.');
    }
    setCreateSubmitting(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Faculty Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('view')} style={{ background: tab === 'view' ? '#333' : '#eee', color: tab === 'view' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View Upcoming Events</button>
        <button onClick={() => setTab('create')} style={{ background: tab === 'create' ? '#333' : '#eee', color: tab === 'create' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Request New Event</button>
      </div>

      {tab === 'view' && (
        <div>
          <h3>Upcoming Events</h3>
          {loading ? <div>Loading events...</div> : (
            events.length === 0 ? <div>No events found.</div> : (
              <div>
                {events.map(event => (
                  <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{event.name}</div>
                    <div>Date: {event.date} &nbsp; | &nbsp; Time: {event.time}</div>
                    <div>Venue: {event.venue}</div>
                    <div>Description: {event.description}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: 500 }}>
          <h3>Request New Event</h3>
          {!showCreateForm ? (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label>Faculty ID:</label><br />
                  <input type="text" name="facultyId" value={form.facultyId} onChange={handleChange} required style={{ width: '100%', padding: 8 }} />
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
              {/* Pin field removed */}
                <button type="submit" disabled={submitting} style={{ padding: '10px 32px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Requesting...' : 'Request Event'}
                </button>
              </form>
              {successMsg && <div style={{ color: 'green', marginTop: 16 }}>{successMsg}</div>}
              {errorMsg && <div style={{ color: 'red', marginTop: 16 }}>{errorMsg}</div>}
            </>
          ) : (
            <>
              <h4>Admin has approved your event request. Please provide final event details:</h4>
              <form onSubmit={handleCreateSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label>Title:</label><br />
                  <input type="text" name="title" value={createForm.title} onChange={handleCreateChange} required style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Date:</label><br />
                  <input type="date" name="date" value={createForm.date} onChange={handleCreateChange} required style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Description:</label><br />
                  <textarea name="description" value={createForm.description} onChange={handleCreateChange} required style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Venue:</label><br />
                  <input type="text" name="venue" value={createForm.venue} onChange={handleCreateChange} required style={{ width: '100%', padding: 8 }} />
                </div>
                <button type="submit" disabled={createSubmitting} style={{ padding: '10px 32px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: createSubmitting ? 'not-allowed' : 'pointer' }}>
                  {createSubmitting ? 'Submitting...' : 'Submit Event'}
                </button>
              </form>
              {createSuccess && <div style={{ color: 'green', marginTop: 16 }}>{createSuccess}</div>}
              {createError && <div style={{ color: 'red', marginTop: 16 }}>{createError}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
