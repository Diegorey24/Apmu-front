import client from './client';

export const getMaterias = () => client.get('/materias');
export const createMateria = (nombre) => client.post('/materias', { nombre });
export const updateMateria = (id, nombre) => client.put(`/materias/${id}`, { nombre });
export const deleteMateria = (id) => client.delete(`/materias/${id}`);