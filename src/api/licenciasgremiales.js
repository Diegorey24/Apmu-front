import client from './client';

export const getLicencias = (filtros = {}) => client.get('/licencias-gremiales', { params: filtros });
export const createLicencia = (data) => client.post('/licencias-gremiales', data);
export const updateLicencia = (id, data) => client.put(`/licencias-gremiales/${id}`, data);
export const deleteLicencia = (id) => client.delete(`/licencias-gremiales/${id}`);