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
export const getDeudoresLibros = (fechaDesde, fechaHasta) =>
  client.get('/reportes/deudores-libros', { params: { fechaDesde, fechaHasta } });
export const exportarDeudoresLibros = (fechaDesde, fechaHasta) =>
  client.get('/reportes/exportar/deudores-libros', { params: { fechaDesde, fechaHasta }, responseType: 'blob' });
export const exportarListadoLibros = (fechaDesde, fechaHasta) =>
  client.get('/reportes/exportar/libros', { params: { fechaDesde, fechaHasta }, responseType: 'blob' });
export const getAfiliadosPorFilial = (idUbicacion) =>
  client.get('/reportes/afiliados-filial', { params: { idUbicacion } });

export const exportarAfiliadosFilial = (idUbicacion) =>
  client.get('/reportes/afiliados-filial/export', { params: { idUbicacion }, responseType: 'blob' });