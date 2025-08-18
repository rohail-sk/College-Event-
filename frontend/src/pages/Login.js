// src/pages/Login.js
import React, { useState } from 'react';
import { login, register } from '../services/api';
import { handleLoginSuccess, navigateToRoleDashboard } from '../services/auth';

function Login() {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleLogin = async () => {
    try {
      const res = await login({ role, email, password });
      
      // Verify role in the response matches requested role
      if (res.data && res.data.role !== role) {
        console.warn('Role mismatch! Requested:', role, 'Received:', res.data.role);
        alert(`Warning: Your account has ${res.data.role} privileges, not ${role} as selected.`);
      }
      
      // Store user data and token
      handleLoginSuccess(res.data, res.data.token);
      
      alert("Login successful!");
      
      // Get actual role from server response, with fallback to selected role
      const actualRole = (res.data && res.data.role) || role;
      
      // Redirect based on actual role
      navigateToRoleDashboard(actualRole);
    } catch (error) {
      alert("Login failed. Check your credentials.");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await register({ name, role: "student", email, password });
      alert("Registration successful! Please login.");
      setTab('login');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      alert("Registration failed. Email might be already in use.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 400, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <button
          onClick={() => setTab('login')}
          style={{ background: tab === 'login' ? '#333' : '#eee', color: tab === 'login' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer', marginRight: 8 }}
        >
          Login
        </button>
        <button
          onClick={() => setTab('register')}
          style={{ background: tab === 'register' ? '#333' : '#eee', color: tab === 'register' ? '#fff' : '#333', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer' }}
        >
          Register (Student)
        </button>
      </div>

      {tab === 'login' ? (
        <>
          <h2>Login</h2>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select><br /><br />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} /><br /><br />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} /><br /><br />
          <button onClick={handleLogin} style={{ width: '100%', padding: 10 }}>Login</button>
        </>
      ) : (
        <>
          <h2>Student Registration</h2>
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 8 }} /><br /><br />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} /><br /><br />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} /><br /><br />
          <button onClick={handleRegister} style={{ width: '100%', padding: 10 }}>Register</button>
        </>
      )}
    </div>
  );
}

export default Login;
