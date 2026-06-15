import client from './client';

export const getCreditos = (filtros = {}) => client.get('/creditos', { params: filtros });
export const getCreditoById = (id) => client.get(`/creditos/${id}`);