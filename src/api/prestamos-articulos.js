import client from './client';

export const getPrestamosArticulos = (filtros = {}) => client.get('/prestamos-articulos', { params: filtros });
export const createPrestamoArticulo = (data) => client.post('/prestamos-articulos', data);
export const updatePrestamoArticulo = (id, data) => client.put(`/prestamos-articulos/${id}`, data);
export const devolverPrestamoArticulo = (id) => client.patch(`/prestamos-articulos/${id}/devolver`);
export const deletePrestamoArticulo = (id) => client.delete(`/prestamos-articulos/${id}`);
