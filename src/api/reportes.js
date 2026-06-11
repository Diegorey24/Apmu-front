import client from './client';

export const getDeudaAfiliado = (idAfiliado) => client.get(`/reportes/deuda/${idAfiliado}`);
export const getConciliacion = (aniomes, idRubro) => 
  client.get('/reportes/conciliacion', { params: { aniomes, idRubro } });