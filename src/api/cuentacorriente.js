import client from './client';

export const getCuentaCorriente = (params = {}) =>
  client.get('/cuenta-corriente', { params });

export const createCargo = (data) => client.post('/cuenta-corriente', data);

export const updateCargo = (id, data) => client.put(`/cuenta-corriente/${id}`, data);

export const cobrarCargo = (id, data) => client.patch(`/cuenta-corriente/${id}/cobrar`, data);

export const deleteCargo = (id) => client.delete(`/cuenta-corriente/${id}`);