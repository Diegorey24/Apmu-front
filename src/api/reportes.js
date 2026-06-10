import client from './client';

export const getDeudaAfiliado = (idAfiliado) => client.get(`/reportes/deuda/${idAfiliado}`);