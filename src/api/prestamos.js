import client from './client';

export const getPrestamos = (filtros = {}) => client.get('/prestamos', { params: filtros });
export const getPrestamoById = (id) => client.get(`/prestamos/${id}`);
export const createPrestamo = (data) => client.post('/prestamos', data);
export const devolverLibro = (idLinea) => client.patch(`/prestamos/linea/${idLinea}/devolver`);