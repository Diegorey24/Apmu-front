import axios from 'axios';
import portalClient from './portalClient';

const BASE = import.meta.env.VITE_API_URL;

export const registrarSocio = (data) => axios.post(`${BASE}/portal/registrar`, data);
export const loginSocio = (data) => axios.post(`${BASE}/portal/login`, data);
export const getMisDatos = () => portalClient.get('/portal/mis-datos');
export const cambiarPassword = (data) => portalClient.patch('/portal/cambiar-password', data);