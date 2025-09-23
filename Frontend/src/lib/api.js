// src/lib/api.js
import axios from 'axios';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BACKEND_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export async function registerUser(username) {
  return api.post('/api/auth/register', { username });
}

export async function loginUser(username) {
  return api.post('/api/auth/login', { username });
}

export async function fetchLeaderboard() {
  return api.get('/api/leaderboard');
}

export async function health() {
  try {
    const response = await api.get('/api/health');
    return response;
  } catch (error) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}

export async function testOllama() {
  try {
    const response = await api.get('/api/test-ollama');
    return response;
  } catch (error) {
    console.error('Ollama test failed:', error.message);
    throw error;
  }
}

export async function testChat(prompt, target) {
  return api.post('/api/chat/similarity', { prompt, target });
}
