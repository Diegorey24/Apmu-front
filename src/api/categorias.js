import client from './client';

export const getCategorias = () => client.get('/categorias');
export const createCategoria = (nombre) => client.post('/categorias', { nombre });
export const updateCategoria = (id, nombre) => client.put(`/categorias/${id}`, { nombre });
export const deleteCategoria = (id) => client.delete(`/categorias/${id}`);