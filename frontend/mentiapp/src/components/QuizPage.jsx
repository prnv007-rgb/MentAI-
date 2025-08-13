import React, { useState, useEffect, useRef } from 'react';
import { getLeaderboard } from '../api';

const WEBSOCKET_URL = 'ws://localhost:3000';

function QuizPage({ token, user, onLogout }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('Connecting...');
  const ws = useRef(null);

  useEffect(() => {
    fetchLeaderboard();
    
    // Establish WebSocket connection with token
    ws.current = new WebSocket(`${WEBSOCKET_URL}?token=${token}`);

    ws.current.onopen = () => {
      setStatus('Connected! Waiting for quiz to start...');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'question') {
        setCurrentQuestion(message);
        setStatus('Question received!');
      } else if (message.type === 'quiz_end') {
        setCurrentQuestion(null);
        setStatus('Quiz has ended! Thanks for playing.');
        fetchLeaderboard(); // Refresh leaderboard at the end
      }
    };

    ws.current.onclose = () => {
      setStatus('Disconnected from server.');
    };

    ws.current.onerror = () => {
      setStatus('Connection error.');
    };

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      setLeaderboard(response.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  const handleAnswerSubmit = (answerIndex) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert('Not connected to the server!');
      return;
    }

    const payload = {
      type: 'submit_answer',
      quizId: currentQuestion.quizId,
      questionId: currentQuestion.data._id,
      answerIndex: answerIndex,
    };
    
    ws.current.send(JSON.stringify(payload));
    setCurrentQuestion(null); // Hide question after answering
    setStatus('Answer submitted! Waiting for next question...');
  };

  return (
    <div className="quiz-page">
      <button onClick={onLogout} className="logout-button">Logout</button>
      <h2>Quiz In Progress</h2>
      <p className="status-message">{status}</p>

      <div className="quiz-columns">
        <div className="question-column">
          {currentQuestion ? (
            <div className="card question-card">
              <h3>{currentQuestion.data.question}</h3>
              <ul className="options-list">
                {currentQuestion.data.options.map((option, index) => (
                  <li key={index}>
                    <button onClick={() => handleAnswerSubmit(index)}>
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card">
              <h3>Waiting for question...</h3>
              <p>When the admin starts the quiz, the next question will appear here.</p>
            </div>
          )}
        </div>

        <div className="leaderboard-column">
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

export default QuizPage;
