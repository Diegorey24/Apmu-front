import client from './client';

export const getConfiguracion = () => client.get('/configuracion');
export const updateConfiguracion = (clave, valor) => client.put(`/configuracion/${clave}`, { valor });
