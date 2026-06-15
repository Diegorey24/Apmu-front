import client from './client';

export const getCajaChica = () => client.get('/cajachica');
export const createMovimiento = (data) => client.post('/cajachica', data);
export const updateMovimiento = (id, data) => client.put(`/cajachica/${id}`, data);
export const deleteMovimiento = (id) => client.delete(`/cajachica/${id}`);