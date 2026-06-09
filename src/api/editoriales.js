import client from './client';

export const getEditoriales = () => client.get('/editoriales');
export const createEditorial = (nombre) => client.post('/editoriales', { nombre });
export const updateEditorial = (id, nombre) => client.put(`/editoriales/${id}`, { nombre });
export const deleteEditorial = (id) => client.delete(`/editoriales/${id}`);