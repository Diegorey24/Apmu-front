import client from './client';

export const getLibros = (filtros = {}) => client.get('/libros', { params: filtros });
export const createLibro = (data) => client.post('/libros', data);
export const updateLibro = (id, data) => client.put(`/libros/${id}`, data);
export const bajaLibro = (id) => client.patch(`/libros/${id}/baja`);
export const altaLibro = (id) => client.patch(`/libros/${id}/alta`);