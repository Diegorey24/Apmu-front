import client from './client';

export const getDeudaAfiliado = (idAfiliado) => client.get(`/reportes/deuda/${idAfiliado}`);
export const getConciliacion = (aniomes, idRubro) =>
  client.get('/reportes/conciliacion', { params: { aniomes, idRubro } });
export const exportarAfiliados = (fechaDesde, fechaHasta) =>
  client.get('/reportes/exportar/afiliados', { params: { fechaDesde, fechaHasta }, responseType: 'blob' });

export const exportarBajas = (fechaDesde, fechaHasta) =>
  client.get('/reportes/exportar/bajas', { params: { fechaDesde, fechaHasta }, responseType: 'blob' });
export const exportarAportes = (aniomes) => client.get('/reportes/exportar/aportes', { params: { aniomes }, responseType: 'blob' });
export const exportarPrestamos = () => client.get('/reportes/exportar/prestamos', { responseType: 'blob' });
export const exportarLicencias = (fechaDesde, fechaHasta) => client.get('/reportes/exportar/licencias', { params: { fechaDesde, fechaHasta }, responseType: 'blob' });