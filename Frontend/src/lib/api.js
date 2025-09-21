// src/lib/api.js
import axios from 'axios';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BACKEND_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

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
  return api.get('/api/health');
}

export async function testOllama() {
  return api.get('/api/test-ollama');
}

export async function testChat(prompt, target) {
  return api.post('/api/chat/similarity', { prompt, target });
}
