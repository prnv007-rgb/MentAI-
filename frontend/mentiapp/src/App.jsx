import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import QuizPage from './components/QuizPage';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      // Decode token to get user info (basic decoding, no verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        console.error("Failed to decode token:", e);
        handleLogout();
      }
    }
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Simple router based on user role
  const renderPage = () => {
    if (!token || !user) {
      return <AuthPage onLogin={handleLogin} />;
    }

    if (user.role === 'admin') {
      return <AdminDashboard token={token} onLogout={handleLogout} />;
    }

    if (user.role === 'client') {
      return <QuizPage token={token} user={user} onLogout={handleLogout} />;
    }

    // Fallback in case of an unknown role
    return <AuthPage onLogin={handleLogin} />;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Real-Time Menti Quiz</h1>
        {user && <p>Welcome, {user.username} ({user.role})</p>}
      </header>
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
