import client from './client';

export const getCentrosCosto = () => client.get('/centros-costo');
export const createCentroCosto = (data) => client.post('/centros-costo', data);
export const updateCentroCosto = (id, data) => client.put(`/centros-costo/${id}`, data);
export const deleteCentroCosto = (id) => client.delete(`/centros-costo/${id}`);
