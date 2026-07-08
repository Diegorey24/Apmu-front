import client from './client';

export const getUbicaciones = () => client.get('/ubicaciones');
export const createUbicacion = (data) => client.post('/ubicaciones', data);
export const updateUbicacion = (id, data) => client.put(`/ubicaciones/${id}`, data);
export const deleteUbicacion = (id) => client.delete(`/ubicaciones/${id}`);