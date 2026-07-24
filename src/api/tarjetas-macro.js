import client from './client';

export const getTarjetasMacro = (filtros = {}) => client.get('/tarjetas-macro', { params: filtros });
export const createTarjetaMacro = (data) => client.post('/tarjetas-macro', data);
export const cambiarEstadoTarjetaMacro = (id, nuevoEstado) => client.patch(`/tarjetas-macro/${id}/estado`, { nuevoEstado });
export const deleteTarjetaMacro = (id) => client.delete(`/tarjetas-macro/${id}`);
