import React from 'react';

function StudentDashboard() {
  let name = '';
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    name = user?.name || '';
  } catch {
    name = '';
  }
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Student Dashboard</h2>
      <p>Welcome, {name ? name : 'Student'}!</p>
    </div>
  );
}

export default StudentDashboard;
