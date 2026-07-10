import client from './client';

export const getSolicitudesPrestamo = (filtros = {}) => client.get('/solicitudes-prestamo', { params: filtros });
export const aprobarSolicitudPrestamo = (id, fechaVencimiento) => client.patch(`/solicitudes-prestamo/${id}/aprobar`, { fechaVencimiento });
export const rechazarSolicitudPrestamo = (id, observaciones) => client.patch(`/solicitudes-prestamo/${id}/rechazar`, { observaciones });