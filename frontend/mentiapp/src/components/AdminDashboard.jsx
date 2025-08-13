import React, { useState, useEffect } from 'react';
// Import the new function from api.js
import { createQuestion, startQuiz, getLeaderboard, setAuthToken, generateQuestions } from '../api';

function AdminDashboard({ token, onLogout }) {
  // State for the manual question creation form
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correct, setCorrect] = useState(0);

  // State for the start quiz form
  const [quizCount, setQuizCount] = useState(5);
  const [quizTitle, setQuizTitle] = useState('New Quiz');
  
  // State for messages and leaderboard
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  // New state for AI generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Set the auth token for API calls when the component mounts
    setAuthToken(token);
    fetchLeaderboard(); // Fetch leaderboard on initial load
  }, [token]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await createQuestion({ question, options, correct });
      setMessage(`Question created successfully! ID: ${response.data.qid}`);
      // Reset form
      setQuestion('');
      setOptions(['', '', '']);
      setCorrect(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question.');
    }
  };

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await startQuiz({ count: quizCount, title: quizTitle });
      setMessage(`Quiz started! ID: ${response.data.quizId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz.');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      setLeaderboard(response.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  // New handler for AI generation
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsGenerating(true);
    try {
      const response = await generateQuestions(aiPrompt);
      setMessage(response.data.message);
      setAiPrompt('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <button onClick={onLogout} className="logout-button">Logout</button>
      <h2>Admin Dashboard</h2>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="dashboard-columns">
        <div className="column">
          {/* New AI Generation Card */}
          <div className="card">
            <h3>Generate Questions with AI</h3>
            <form onSubmit={handleAiGenerate}>
              <div className="form-group">
                <label>Enter a topic (e.g., "5 questions about the solar system")</label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Generate 3 multiple choice questions about ancient Rome..."
                  rows="3"
                  required
                />
              </div>
              <button type="submit" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Create a Question Manually</h3>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-group">
                <label>Question Text</label>
                <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>
              {options.map((opt, index) => (
                <div key={index} className="form-group option-group">
                  <label>Option {index + 1}</label>
                  <input type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} required />
                  <label className="radio-label">
                    <input type="radio" name="correct" checked={correct === index} onChange={() => setCorrect(index)} />
                    Correct
                  </label>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} className="secondary-button">Add Option</button>
              <button type="submit">Create Question</button>
            </form>
          </div>
        </div>

        <div className="column">
           <div className="card">
            <h3>Start a Quiz</h3>
            <form onSubmit={handleStartQuiz}>
              <div className="form-group">
                <label>Quiz Title</label>
                <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Number of Questions</label>
                <input type="number" value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))} min="1" />
              </div>
              <button type="submit">Start Quiz</button>
            </form>
          </div>

          <div className="card leaderboard-card">
            <h3>Leaderboard</h3>
            <button onClick={fetchLeaderboard} className="secondary-button">Refresh</button>
            <ol className="leaderboard-list">
              {leaderboard.map((player, index) => (
                <li key={index}>
                  <span>{player.username}</span>
                  <span>{player.score}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
