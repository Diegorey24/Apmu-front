import client from './client';

export const getBanco = (filtros = {}) => client.get('/banco', { params: filtros });
export const createMovimiento = (data) => client.post('/banco', data);
export const updateMovimiento = (id, data) => client.put(`/banco/${id}`, data);
export const deleteMovimiento = (id) => client.delete(`/banco/${id}`);
