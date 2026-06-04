import client from './client';

export const getAutores = () => client.get('/autor');

export const createAutor = (data) => client.post('/autor', data);

export const updateAutor = (id, data) => client.put(`/autor/${id}`, data);

export const deleteAutor = (id) => client.delete(`/autor/${id}`);
