import client from './client';

export const getPortalPendientes = () => client.get('/portal/pendientes');
export const aprobarPortal = (id) => client.patch(`/portal/${id}/aprobar`);
export const rechazarPortal = (id) => client.patch(`/portal/${id}/rechazar`);
export const resetPasswordPortal = (id, password) => client.patch(`/portal/${id}/reset-password`, { password });
export const eliminarSolicitudPortal = (id) => client.delete(`/portal/${id}`);
export const crearUsuarioPortal = (documento, password) => client.post('/portal/crear-usuario', { documento, password });
export const getUsuariosPortal = () => client.get('/portal/usuarios');