import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Function to set the auth token for all subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Auth Endpoints ---
export const signup = (userData, isClient = false) => {
  const url = isClient ? '/client_signup' : '/signup';
  return api.post(url, userData);
};

export const signin = (userData, isClient = false) => {
  const url = isClient ? '/client_signin' : '/signin';
  return api.post(url, userData);
};

// --- Admin Endpoints ---
export const createQuestion = (questionData) => api.post('/create', questionData);
export const startQuiz = (quizData) => api.post('/start', quizData);

// FIX: Added the missing export for generateQuestions
export const generateQuestions = (prompt) => api.post('/generate-questions', { prompt });


// --- General Endpoints ---
export const getLeaderboard = () => api.get('/leaderboard');

export default api;
