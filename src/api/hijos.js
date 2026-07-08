import client from './client';

export const getHijos = (idAfiliado) => client.get(`/hijos/${idAfiliado}`);
export const createHijo = (data) => client.post('/hijos', data);
export const updateHijo = (id, data) => client.put(`/hijos/${id}`, data);
export const validarHijo = (id, validado) => client.patch(`/hijos/${id}/validar`, { validado });
export const deleteHijo = (id) => client.delete(`/hijos/${id}`);