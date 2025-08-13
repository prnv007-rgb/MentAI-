import React, { useState } from 'react';
import { signin, signup, setAuthToken } from '../api';

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isClient, setIsClient] = useState(false); // Toggle between admin/client
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      let response;
      if (isLogin) {
        response = await signin({ username, password }, isClient);
        const token = response.data.token;
        setAuthToken(token); // Set token for future API calls
        onLogin(token); // Update App state
      } else {
        response = await signup({ username, password }, isClient);
        setMessage(response.data.message + ". Please log in.");
        setIsLogin(true); // Switch to login form after successful signup
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <div className="role-toggle">
        <label>
          <input
            type="checkbox"
            checked={isClient}
            onChange={() => setIsClient(!isClient)}
          />
          Login as Player
        </label>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
      </form>
      <button className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
    </div>
  );
}

export default AuthPage;
