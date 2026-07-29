import client from './client';

export const getArqueos = (filtros = {}) => client.get('/arqueos', { params: filtros });
export const createArqueo = (data) => client.post('/arqueos', data);
export const deleteArqueo = (id) => client.delete(`/arqueos/${id}`);
