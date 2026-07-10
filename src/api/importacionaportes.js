import client from './client';

export const importarAportes = (formData) =>
    client.post('/importacion-aportes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });