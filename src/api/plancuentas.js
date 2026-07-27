import client from './client';

export const getPlanCuentas = () => client.get('/plan-cuentas');
export const createPlanCuenta = (data) => client.post('/plan-cuentas', data);
export const updatePlanCuenta = (codigo, data) => client.put(`/plan-cuentas/${codigo}`, data);
export const deletePlanCuenta = (codigo) => client.delete(`/plan-cuentas/${codigo}`);
