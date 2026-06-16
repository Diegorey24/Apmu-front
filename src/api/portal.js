import client from './client';

export const getPortalPendientes = () => client.get('/portal/pendientes');
export const aprobarPortal = (id) => client.patch(`/portal/${id}/aprobar`);
export const rechazarPortal = (id) => client.patch(`/portal/${id}/rechazar`);