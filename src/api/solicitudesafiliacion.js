import axios from 'axios';
import client from './client';

const BASE = import.meta.env.VITE_API_URL;

export const getSolicitudesAfiliacion = (estado) => client.get('/solicitudes-afiliacion', { params: { estado } });
export const createSolicitudAfiliacion = (data) => axios.post(`${BASE}/solicitudes-afiliacion`, data);
export const aprobarSolicitud = (id) => client.patch(`/solicitudes-afiliacion/${id}/aprobar`);
export const rechazarSolicitud = (id, observaciones) => client.patch(`/solicitudes-afiliacion/${id}/rechazar`, { observaciones });