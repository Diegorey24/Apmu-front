import client from './client';

export const getBeneficios = (filtros = {}) => client.get('/beneficios', { params: filtros });
export const createBeneficio = (data) => client.post('/beneficios', data);
export const deleteBeneficio = (id) => client.delete(`/beneficios/${id}`);
export const getListadoCanastas = () => client.get('/beneficios/listado/canastas');
export const getListadoUtiles = () => client.get('/beneficios/listado/utiles');