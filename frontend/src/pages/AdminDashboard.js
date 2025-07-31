import React, { useState, useEffect } from 'react';
import { getEvents, getRequestedEvents, approveEventRequest } from '../services/api';



function AdminDashboard() {
  const [tab, setTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [approving, setApproving] = useState(null);

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

  // Approve event request (real API)
  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approveEventRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      // Optionally, notify faculty via backend or polling
      alert('Event approved! Faculty can now submit final event details.');
    } catch {
      alert('Failed to approve event.');
    }
    setApproving(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('view')} style={{ background: tab === 'view' ? '#333' : '#eee', color: tab === 'view' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View All Events</button>
        <button onClick={() => setTab('requests')} style={{ background: tab === 'requests' ? '#333' : '#eee', color: tab === 'requests' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Requested Events</button>
      </div>

      {tab === 'view' && (
        <div>
          <h3>All Events</h3>
          {loading ? <div>Loading events...</div> : (
            events.length === 0 ? <div>No events found.</div> : (
              <div>
                {events.map(event => (
                  <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
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

      {tab === 'requests' && (
        <div>
          <h3>Requested Events</h3>
          {reqLoading ? <div>Loading requests...</div> : (
            requests.length === 0 ? <div>No event requests.</div> : (
              <div>
                {requests.map(req => (
                  <div key={req.id} style={{ border: '1px solid #f0ad4e', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fffbe6' }}>
                    <div><b>Faculty ID:</b> {req.facultyId}</div>
                    <div><b>Title:</b> {req.title}</div>
                    <div><b>Date:</b> {req.event_date}</div>
                    <div><b>Description:</b> {req.description}</div>
                    <button onClick={() => handleApprove(req.id)} disabled={approving === req.id} style={{ marginTop: 8, padding: '6px 16px', background: '#5cb85c', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: approving === req.id ? 'not-allowed' : 'pointer', opacity: approving === req.id ? 0.6 : 1 }}>
                      {approving === req.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
