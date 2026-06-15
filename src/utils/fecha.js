// Formatea una fecha (string ISO o Date) como DD-MM-YYYY
export function formatFecha(f) {
  if (!f) return '—';
  const d = f instanceof Date ? f : new Date(f);
  if (isNaN(d.getTime())) return '—';
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const anio = d.getUTCFullYear();
  return `${dia}-${mes}-${anio}`;
}
