import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL;

export const login = (username, password) =>
  axios.post(`${BASE}/auth/login`, { username, password });
