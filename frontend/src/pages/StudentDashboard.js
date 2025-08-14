import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: user.name || '',
        role: user.role || 'student',
        email: user.email || '',
        department: user.department || 'Computer Science',
        id: user.id || user._id || ''
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { 
        name: '', 
        role: 'student', 
        email: '', 
        department: 'Computer Science',
        id: ''
      };
    }
  };

  const userInfo = getUserInfo();
  const [tab, setTab] = useState('events');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventsRes = await getEvents();
        const events = eventsRes.data || [];

        // Filter for only approved events
        const approvedEvents = events.filter(event => {
          const status = (event.status || '').toString().trim().toLowerCase();
          return status === 'approved';
        });

        // Sort events by date ascending
        const sortedEvents = approvedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

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
    localStorage.removeItem('token');
    window.location.href = 'http://localhost:3000/';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Student Dashboard</h2>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('events')} style={{ background: tab === 'events' ? '#333' : '#eee', color: tab === 'events' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View Events</button>
        <button onClick={() => setTab('profile')} style={{ background: tab === 'profile' ? '#333' : '#eee', color: tab === 'profile' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Profile</button>
      </div>

      {tab === 'events' && (
        <div>
          <h3>Upcoming Events</h3>
          {loading ? (
            <div>Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div>No events found.</div>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id || event._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#f9f9f9' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
                <div style={{ marginBottom: 6 }}>{event.description || 'No description provided.'}</div>
                <div><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
                <div><strong>Venue:</strong> {event.venue}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div style={{ maxWidth: 600 }}>
          <h3>My Profile</h3>
          {(() => {
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
                        {(userInfo.name?.charAt(0) || 'S').toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>{userInfo.name || 'Student'}</h3>
                        <div style={{ 
                          background: '#333', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          display: 'inline-block' 
                        }}>
                          Student
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <strong>Email:</strong> {userInfo.email || 'No email provided'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Student ID:</strong> {userInfo.id || 'No ID found'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Department:</strong> {userInfo.department || 'Not specified'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Account Status:</strong> <span style={{ color: 'green' }}>Active</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
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

export default StudentDashboard;
