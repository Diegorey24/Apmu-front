import client from './client';

export const getAfiliados = (page = 1, limit = 20, search = '', activo = 1) =>
  client.get('/afiliado', { params: { page, limit, activo, ...(search && { search }) } });

export const createAfiliado = (data) => client.post('/afiliado', data);
export const updateAfiliado = (id, data) => client.put(`/afiliado/${id}`, data);
export const deleteAfiliado = (id, idMotivo, observaciones) =>
  client.delete(`/afiliado/${id}`, { data: { idMotivo, observaciones } });
export const searchAfiliados = (q) => client.get('/afiliados/search', { params: { q } });
export const reactivarAfiliado = (id) => client.patch(`/afiliados/${id}/reactivar`);
