import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisDatos } from '../../api/portalSocio';

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

const formatPeriodo = (aniomes) => {
  const s = String(aniomes);
  const mes = parseInt(s.substring(4, 6)) - 1;
  return `${meses[mes]} ${s.substring(0, 4)}`;
};

export default function PortalHome() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('prestamos');
  const navigate = useNavigate();

  const nombre = localStorage.getItem('portal_nombre');

  useEffect(() => {
    getMisDatos()
      .then(res => setDatos(res.data.data))
      .catch(() => setError('Error al cargar tus datos'))
      .finally(() => setLoading(false));
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_nombre');
    navigate('/portal/login');
  };

  const estadoBadge = (estado) => {
    const colores = { Activo: '#2563eb', Devuelto: '#16a34a', Vencido: '#dc2626' };
    return (
      <span style={{
        background: colores[estado] || '#888', color: '#fff',
        borderRadius: 4, padding: '2px 8px', fontSize: 12
      }}>{estado}</span>
    );
  };

  if (loading) return <div style={{ padding: 32 }}><p>Cargando...</p></div>;
  if (error) return <div style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--color-background-secondary)',
        borderBottom: '1px solid var(--color-border-primary)',
        padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Portal APMU</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Bienvenido, {nombre}</p>
        </div>
        <button className="btn-sm" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      <div style={{ padding: 32 }}>

        {/* Datos personales */}
        {datos?.afiliado && (
          <div style={{
            background: 'var(--color-background-secondary)',
            borderRadius: 12, padding: 24, marginBottom: 24
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Mis datos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px 24px' }}>
              {[
                ['Nombre', `${datos.afiliado.PrimerNombre} ${datos.afiliado.PrimerApellido} ${datos.afiliado.SegundoApellido || ''}`],
                ['Documento', datos.afiliado.Documento],
                ['Email', datos.afiliado.Mail || '—'],
                ['Celular', datos.afiliado.Celular || '—'],
                ['Teléfono', datos.afiliado.Telefono || '—'],
                ['Domicilio', datos.afiliado.Domicilio || '—'],
                ['Departamento', datos.afiliado.Departamento || '—'],
              ].map(([label, valor]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{valor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div style={{ borderBottom: '1px solid var(--color-border-primary)', marginBottom: 24, display: 'flex', gap: 8 }}>
          {[{ id: 'prestamos', l: 'Mis préstamos' }, { id: 'aportes', l: 'Mis aportes' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'none',
                fontWeight: tab === t.id ? 600 : 400,
                borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Préstamos */}
        {tab === 'prestamos' && (
          <table className="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Libros</th>
                <th>Devueltos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos?.prestamos?.length === 0 ? (
                <tr><td colSpan={5}>No tenés préstamos registrados</td></tr>
              ) : datos?.prestamos?.map(p => (
                <tr key={p.Id}>
                  <td>{p.Id}</td>
                  <td>{new Date(p.FechaPrestamo).toLocaleDateString('es-UY')}</td>
                  <td>{p.CantLibros}</td>
                  <td>{p.CantDevueltos}</td>
                  <td>{estadoBadge(p.Estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Aportes */}
        {tab === 'aportes' && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Período</th>
                <th>Rubro</th>
                <th>Importe</th>
                <th>Estado</th>
                <th>Fecha pago</th>
              </tr>
            </thead>
            <tbody>
              {datos?.aportes?.length === 0 ? (
                <tr><td colSpan={5}>No tenés aportes registrados</td></tr>
              ) : datos?.aportes?.map((a, i) => (
                <tr key={i}>
                  <td>{formatPeriodo(a.Aniomes)}</td>
                  <td>{a.Rubro?.trim() || '—'}</td>
                  <td>$ {Number(a.Importe).toLocaleString('es-UY', { minimumFractionDigits: 2 })}</td>
                  <td style={{
                    color: a.Estado === 'Cobrado' ? 'var(--color-text-success)' : a.Estado === 'Vencido' ? 'var(--color-text-danger)' : 'var(--color-text-warning)',
                    fontWeight: 500
                  }}>{a.Estado}</td>
                  <td>{a.FechaPago ? a.FechaPago.substring(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}