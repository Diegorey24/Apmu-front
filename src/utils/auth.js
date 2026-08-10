// Helpers de sesión: token y rol en localStorage, sin dependencias externas
// para decodificar el JWT (solo lectura del payload, no valida la firma;
// la validación real la hace siempre el backend).

export const getToken = () => localStorage.getItem('apmu_token');
export const getRole = () => localStorage.getItem('apmu_role');

export const setSession = ({ token, rol }) => {
  localStorage.setItem('apmu_token', token);
  localStorage.setItem('apmu_role', rol);
};

export const clearSession = () => {
  localStorage.removeItem('apmu_token');
  localStorage.removeItem('apmu_role');
};

const decodePayload = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const hasValidToken = () => {
  const token = getToken();
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
};
