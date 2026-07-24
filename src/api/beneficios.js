import client from './client';

export const getBeneficios = (filtros = {}) => client.get('/beneficios', { params: filtros });
export const createBeneficio = (data) => client.post('/beneficios', data);
export const deleteBeneficio = (id) => client.delete(`/beneficios/${id}`);
export const getListadoCanastas = (filtros = {}) => client.get('/beneficios/listado/canastas', { params: filtros });
export const getListadoUtiles = (filtros = {}) => client.get('/beneficios/listado/utiles', { params: filtros });