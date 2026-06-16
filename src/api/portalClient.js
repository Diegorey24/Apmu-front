import axios from 'axios';

const portalClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

portalClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default portalClient;