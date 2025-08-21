import React, { useState, useEffect } from 'react';
import { getEvents, registerForEvent, checkEventRegistration, getStudentRegistrations } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';

// Modal component for showing event details
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
        maxWidth: 700,
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

function StudentDashboard() {
  const navigate = useNavigate();
  
  // Get user info using the auth service
  const getUserInfo = () => {
    try {
      const user = getCurrentUser();
      
      if (user) {
        return {
          name: user.name || '',
          role: user.role || 'student',
          email: user.email || '',
          department: user.department || 'Computer Science',
          id: user.id || user._id || ''
        };
      }
      
      // No valid user data found
      console.warn('StudentDashboard - No user data found');
      return { name: '', role: 'student', email: '', department: 'Computer Science', id: '' };
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [enrollmentSuccess, setEnrollmentSuccess] = useState('');
  const [enrolledEventIds, setEnrolledEventIds] = useState([]);
  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  // Function to check if student is enrolled in an event
  const isEnrolled = (eventId) => {
    if (!eventId || !enrolledEventIds || !enrolledEventIds.length) return false;
    return enrolledEventIds.some(id => id === eventId);
  };

  // Check the enrollment status of a specific event
  const checkSingleEventEnrollment = async (eventId) => {
    if (!userInfo.id) return false;
    
    try {
      const response = await checkEventRegistration(userInfo.id, eventId);
      return response.data && response.data.status === 'Registered';
    } catch (error) {
      console.error(`Error checking enrollment for event ${eventId}:`, error);
      return false;
    }
  };
  
  // Function to fetch enrolled events with full details
  const fetchEnrolledEvents = async () => {
    if (!userInfo.id) return;
    
    setLoadingEnrolled(true);
    try {
      // First, get all the student's registrations
      const registrationsResponse = await getStudentRegistrations(userInfo.id);
      
      if (registrationsResponse.data && Array.isArray(registrationsResponse.data)) {
        const registrations = registrationsResponse.data;
        
        // Extract event IDs from the registrations
        const registeredEventIds = registrations.map(reg => 
          reg.eventId || reg.event?._id || reg.event?.id || reg._id
        ).filter(Boolean);
        
        setEnrolledEventIds(registeredEventIds);
        
        // If registrations include event details, use those
        if (registrations.some(reg => reg.event && (reg.event.title || reg.event.description))) {
          const eventsWithDetails = registrations
            .filter(reg => reg.event)
            .map(reg => reg.event);
          setEnrolledEvents(eventsWithDetails);
        } else {
          // Otherwise fetch event details for each ID
          // Get all events
          const eventsRes = await getEvents();
          const allEvents = eventsRes.data || [];
          
          // Filter to only include events the student is registered for
          const studentEvents = allEvents.filter(event => 
            registeredEventIds.includes(event.id || event._id)
          );
          
          setEnrolledEvents(studentEvents);
        }
      }
    } catch (error) {
      console.error('Error fetching enrolled events:', error);
    } finally {
      setLoadingEnrolled(false);
    }
  };
  
  // Load all registered events when component mounts
  useEffect(() => {
    if (userInfo.id) {
      fetchEnrolledEvents();
    }
  }, [userInfo.id]);

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
    // Use the centralized logout function from auth service
    logout();
    window.location.href = 'http://localhost:3000/';
  };
  
  // Handle enrollment in an event
  const handleEnroll = async (eventId) => {
    if (!userInfo.id) {
      setEnrollmentError('You must be logged in to enroll in events.');
      return;
    }

    // First check if already registered
    setEnrolling(true);
    setEnrollmentError('');
    setEnrollmentSuccess('');
    
    try {
      // Check if already registered
      const isAlreadyRegistered = await checkSingleEventEnrollment(eventId);
      
      if (isAlreadyRegistered) {
        setEnrollmentError('You are already enrolled in this event.');
        setEnrolledEventIds(prev => [...prev, eventId]);
        setEnrolling(false);
        return;
      }
      
      // If not registered, proceed with registration
      const response = await registerForEvent({
        studentId: userInfo.id,
        eventId: eventId,
        registrationDate: new Date().toISOString()
      });
      
      if (response.data && (response.data.status === 'Registered' || response.data.status === 'Success')) {
        setEnrolledEventIds(prev => [...prev, eventId]);
        setEnrollmentSuccess('Successfully enrolled in the event!');
        
        // Refresh enrolled events list after successful enrollment
        fetchEnrolledEvents();
      } else {
        setEnrollmentError('Failed to enroll in event. Please try again.');
      }
    } catch (error) {
      setEnrollmentError(error.response?.data?.message || 'Failed to enroll in event. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: 'auto' }}>
      <h2>Student Dashboard</h2>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('events')} style={{ background: tab === 'events' ? '#333' : '#eee', color: tab === 'events' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>View Events</button>
        <button onClick={() => setTab('my-events')} style={{ background: tab === 'my-events' ? '#333' : '#eee', color: tab === 'my-events' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>My Enrollments</button>
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
              <div 
                key={event.id || event._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 16, 
                  background: '#f9f9f9',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={async () => {
                  setSelectedEvent(event);
                  setShowModal(true);
                  
                  // Check if user is registered for this event
                  const eventId = event.id || event._id;
                  const isRegistered = await checkSingleEventEnrollment(eventId);
                  
                  if (isRegistered && !enrolledEventIds.includes(eventId)) {
                    setEnrolledEventIds(prev => [...prev, eventId]);
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
                <div style={{ marginBottom: 6 }}>{event.description || 'No description provided.'}</div>
                <div><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
                <div><strong>Venue:</strong> {event.venue}</div>
                <div style={{ 
                  marginTop: 8, 
                  color: '#0275d8', 
                  fontWeight: 'bold', 
                  fontSize: 14 
                }}>Click for more details</div>
              </div>
            ))
          )}
        </div>
      )}
      
      {tab === 'my-events' && (
        <div>
          <h3>My Enrolled Events</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>Events you've registered for will appear here</div>
            <button 
              onClick={fetchEnrolledEvents} 
              style={{ 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                padding: '5px 10px', 
                borderRadius: 4, 
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          {loadingEnrolled ? (
            <div>Loading your enrolled events...</div>
          ) : enrolledEvents.length === 0 ? (
            <div style={{ 
              padding: 20, 
              background: '#f8f9fa', 
              borderRadius: 8, 
              textAlign: 'center' 
            }}>
              <p>You haven't enrolled in any events yet.</p>
              <p>Explore upcoming events and register for ones you're interested in!</p>
              <button 
                onClick={() => setTab('events')} 
                style={{ 
                  background: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  marginTop: 10
                }}
              >
                Browse Events
              </button>
            </div>
          ) : (
            enrolledEvents.map((event) => (
              <div 
                key={event.id || event._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 16, 
                  background: '#e8f4ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: '4px solid #28a745'
                }}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowModal(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
                  <div style={{ 
                    background: '#28a745', 
                    color: 'white', 
                    padding: '3px 8px', 
                    borderRadius: 20, 
                    fontSize: 12 
                  }}>
                    Enrolled
                  </div>
                </div>
                <div style={{ marginBottom: 6 }}>{event.description || 'No description provided.'}</div>
                <div><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
                <div><strong>Venue:</strong> {event.venue}</div>
                <div style={{ 
                  marginTop: 8, 
                  color: '#0275d8', 
                  fontWeight: 'bold', 
                  fontSize: 14 
                }}>Click for more details</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal for showing event details */}
      <Modal 
        show={showModal}
        onClose={() => setShowModal(false)}
        title={selectedEvent?.title || "Event Details"}
      >
        {selectedEvent && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                background: '#f0f8ff', 
                padding: 15, 
                borderRadius: 8, 
                marginBottom: 20 
              }}>
                <h4 style={{ marginTop: 0 }}>Date & Time</h4>
                <p style={{ margin: '8px 0' }}><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                <p style={{ margin: '8px 0' }}><strong>Venue:</strong> {selectedEvent.venue}</p>
              </div>
              
              <h4>About this event</h4>
              <p>{selectedEvent.description}</p>
              
              {selectedEvent.info && (
                <div style={{ 
                  marginTop: 15,
                  background: '#f9f9f9',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: 15
                }}>
                  <h4 style={{ marginTop: 0 }}>Detailed Information</h4>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedEvent.info}
                  </div>
                </div>
              )}
            </div>
            
            {/* Enrollment messages */}
            {enrollmentError && (
              <div style={{ 
                marginTop: 15, 
                padding: '10px 15px', 
                backgroundColor: '#ffecec', 
                color: '#721c24', 
                borderRadius: 4 
              }}>
                {enrollmentError}
              </div>
            )}
            
            {enrollmentSuccess && (
              <div style={{ 
                marginTop: 15, 
                padding: '10px 15px', 
                backgroundColor: '#d4edda', 
                color: '#155724', 
                borderRadius: 4 
              }}>
                {enrollmentSuccess}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 20,
              gap: 10
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              
              <button
                onClick={() => handleEnroll(selectedEvent.id || selectedEvent._id)}
                disabled={enrolling || isEnrolled(selectedEvent.id || selectedEvent._id)}
                style={{
                  padding: '10px 20px',
                  background: isEnrolled(selectedEvent.id || selectedEvent._id) ? '#28a745' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  opacity: enrolling ? 0.7 : 1
                }}
              >
                {enrolling ? 'Enrolling...' : 
                 isEnrolled(selectedEvent.id || selectedEvent._id) ? 'Enrolled' : 'Enroll Now'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {tab === 'profile' && (
        <div style={{ maxWidth: 600 }}>
          <h3>My Profile</h3>
          {(() => {
            try {
              // Use the userInfo object we already have from getUserInfo()
              if (!userInfo || !userInfo.id) {
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
