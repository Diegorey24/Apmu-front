import client from './client';

export const getRubros = () => client.get('/rubro');

export const createRubro = (data) => client.post('/rubro', data);

export const updateRubro = (id, data) => client.put(`/rubro/${id}`, data);

export const deleteRubro = (id) => client.delete(`/rubro/${id}`);