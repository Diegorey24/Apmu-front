import client from './client';

export const getAfiliados = (page = 1, limit = 20, search = '') =>
  client.get('/afiliado', { params: { page, limit, ...(search && { search }) } });

export const createAfiliado = (data) => client.post('/afiliado', data);

export const updateAfiliado = (id, data) => client.put(`/afiliado/${id}`, data);

export const deleteAfiliado = (id) => client.delete(`/afiliado/${id}`);
