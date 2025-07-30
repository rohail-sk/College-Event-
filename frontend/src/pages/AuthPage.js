import React, { useState } from 'react';
import Login from './Login';

function Register() {
  // Simple placeholder for student registration
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Student Registration</h2>
      <p>Registration form goes here.</p>
    </div>
  );
}

function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <button onClick={() => setShowLogin(true)} style={{ marginRight: '1rem' }}>Login</button>
      <button onClick={() => setShowLogin(false)}>Register (Student)</button>
      <div style={{ marginTop: '2rem' }}>
        {showLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
}

export default AuthPage;
