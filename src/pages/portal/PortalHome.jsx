import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisDatos } from '../../api/portalSocio';

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

const formatPeriodo = (aniomes) => {
  const s = String(aniomes);
  const mes = parseInt(s.substring(4, 6)) - 1;
  return `${meses[mes]} ${s.substring(0, 4)}`;
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '—';
  const s = String(fechaStr).substring(0, 10);
  const [y, m, d] = s.split('-');
  return `${d}-${m}-${y}`;
};

const estadoBadge = (estado) => {
  const cfg = {
    Activo:   { bg: 'rgba(37,99,235,0.1)',  color: '#2563eb' },
    Devuelto: { bg: 'rgba(22,163,74,0.1)',  color: '#16a34a' },
    Vencido:  { bg: 'rgba(220,38,38,0.1)',  color: '#dc2626' },
  };
  const c = cfg[estado] || { bg: 'rgba(107,99,117,0.1)', color: 'var(--text)' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 600,
    }}>{estado}</span>
  );
};

export default function PortalHome() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('prestamos');
  const navigate = useNavigate();

  const nombre = localStorage.getItem('portal_nombre') || '';

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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text)', fontFamily: 'var(--sans)' }}>Cargando...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--error)', fontFamily: 'var(--sans)' }}>{error}</p>
    </div>
  );

  const afiliado = datos?.afiliado;
  const initiales = nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const prestamosActivos = datos?.prestamos?.filter(p => p.Estado === 'Activo').length ?? 0;
  const totalPrestamos = datos?.prestamos?.length ?? 0;
  const totalAportes = datos?.aportes?.length ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-h)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--accent)',
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>APMU</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>Portal del socio</span>
        </div>
        <button
          onClick={cerrarSesion}
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: 8,
            color: '#fff',
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        {/* Member card */}
        {afiliado && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
          }}>
            {/* Card top strip */}
            <div style={{ height: 6, background: 'var(--accent)' }} />
            <div style={{ padding: '24px 28px' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 19, fontWeight: 700, flexShrink: 0,
                  letterSpacing: 1,
                }}>
                  {initiales}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', marginBottom: 3 }}>Bienvenido/a</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.2 }}>
                    {afiliado.PrimerNombre} {afiliado.PrimerApellido}{afiliado.SegundoApellido ? ` ${afiliado.SegundoApellido}` : ''}
                  </p>
                </div>
              </div>

              {/* Data fields grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '14px 24px',
                paddingTop: 20,
                borderTop: '1px solid var(--border)',
              }}>
                {[
                  ['Documento', afiliado.Documento],
                  ['Email', afiliado.Mail || '—'],
                  ['Celular', afiliado.Celular || '—'],
                  ['Teléfono', afiliado.Telefono || '—'],
                  ['Domicilio', afiliado.Domicilio || '—'],
                  ['Departamento', afiliado.Departamento || '—'],
                ].map(([label, valor]) => (
                  <div key={label}>
                    <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-h)' }}>{valor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Préstamos activos', value: prestamosActivos, accent: true },
            { label: 'Total préstamos',   value: totalPrestamos,   accent: false },
            { label: 'Aportes',           value: totalAportes,     accent: false },
          ].map(s => (
            <div key={s.label} style={{
              background: s.accent ? 'var(--accent-bg)' : 'var(--card-bg)',
              border: `1px solid ${s.accent ? 'rgba(192,57,43,0.2)' : 'var(--border)'}`,
              borderRadius: 10,
              padding: '14px 20px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: s.accent ? 'var(--accent)' : 'var(--text)' }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: s.accent ? 'var(--accent)' : 'var(--text-h)' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab content card */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex' }}>
            {[{ id: 'prestamos', l: 'Mis préstamos' }, { id: 'aportes', l: 'Mis aportes' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '13px 16px',
                border: 'none', background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === t.id ? 600 : 500,
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--sans)',
                marginBottom: -1,
                transition: 'color 0.15s',
              }}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Préstamos */}
          {tab === 'prestamos' && (
            datos?.prestamos?.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center', color: 'var(--text)', fontSize: 14 }}>
                No tenés préstamos registrados
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['#', 'Fecha', 'Libros', 'Devueltos', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos?.prestamos?.map(p => (
                    <tr key={p.Id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 20px', color: 'var(--text)', fontFamily: 'ui-monospace,Consolas,monospace', fontSize: 13 }}>{p.Id}</td>
                      <td style={{ padding: '11px 20px', color: 'var(--text-h)' }}>{formatFecha(p.FechaPrestamo)}</td>
                      <td style={{ padding: '11px 20px', color: 'var(--text-h)' }}>{p.CantLibros}</td>
                      <td style={{ padding: '11px 20px', color: 'var(--text-h)' }}>{p.CantDevueltos}</td>
                      <td style={{ padding: '11px 20px' }}>{estadoBadge(p.Estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Aportes */}
          {tab === 'aportes' && (
            datos?.aportes?.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center', color: 'var(--text)', fontSize: 14 }}>
                No tenés aportes registrados
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Período', 'Rubro', 'Importe', 'Estado', 'Fecha pago'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos?.aportes?.map((a, i) => {
                    const ec = a.Estado === 'Cobrado' ? '#16a34a' : a.Estado === 'Vencido' ? '#dc2626' : '#d97706';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '11px 20px', color: 'var(--text-h)', fontWeight: 500 }}>{formatPeriodo(a.Aniomes)}</td>
                        <td style={{ padding: '11px 20px', color: 'var(--text-h)' }}>{a.Rubro?.trim() || '—'}</td>
                        <td style={{ padding: '11px 20px', color: 'var(--text-h)', fontWeight: 500 }}>$ {Number(a.Importe).toLocaleString('es-UY', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '11px 20px', color: ec, fontWeight: 600, fontSize: 13 }}>{a.Estado}</td>
                        <td style={{ padding: '11px 20px', color: 'var(--text)' }}>{formatFecha(a.FechaPago)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>

      </div>
    </div>
  );
}
