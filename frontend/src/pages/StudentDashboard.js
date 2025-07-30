import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';

function StudentDashboard() {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    user = {};
  }

  const { name = '', role = 'student', email = '', department = 'Computer Science' } = user;
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventsRes = await getEvents();
        const events = eventsRes.data || [];

        // Sort events by date ascending
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));

        setUpcomingEvents(sortedEvents);
      } catch (err) {
        setUpcomingEvents([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Welcome, {name || 'Student'} 👋</h2>
      <div style={{ color: '#888', marginBottom: 24 }}>
        Role: {role.charAt(0).toUpperCase() + role.slice(1)}
      </div>

      {/* All Events */}
      <div>
        <h3>All Events</h3>
        {loading ? (
          <div>Loading events...</div>
        ) : upcomingEvents.length === 0 ? (
          <div>No events found.</div>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#f9f9f9' }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
              <div style={{ marginBottom: 6 }}>{event.description || 'No description provided.'}</div>
              <div><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
              <div><strong>Venue:</strong> {event.venue}</div>
              <div><strong>Status:</strong> <span style={{ color: event.status === 'approved' ? 'green' : 'orange' }}>{event.status}</span></div>
            </div>
          ))
        )}
      </div>

      {/* Profile */}
      <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 24, maxWidth: 400 }}>
        <h3>Profile</h3>
        <div><b>Name:</b> {name}</div>
        <div><b>Email:</b> {email}</div>
        <div><b>Department:</b> {department}</div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{ marginTop: 32, padding: '10px 32px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
}

export default StudentDashboard;
