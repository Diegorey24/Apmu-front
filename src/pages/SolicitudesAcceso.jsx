import { useState, useEffect } from 'react';
import { getPortalPendientes, aprobarPortal, rechazarPortal } from '../api/portal';
import Modal from '../components/Modal';

export default function SolicitudesAcceso() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getPortalPendientes();
      setSolicitudes(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirAprobar = (solicitud) => {
    setModal(solicitud);
    setError('');
  };

  const confirmarAprobacion = async () => {
    try {
      await aprobarPortal(modal.Id);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aprobar');
    }
  };

  const rechazar = async (id) => {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    try {
      await rechazarPortal(id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al rechazar');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Solicitudes de acceso</h1>
      </div>

      {loading ? <p>Cargando...</p> : (
        <>
          {solicitudes.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 14, padding: '72px 0', color: 'var(--text)',
            }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke="var(--border)" strokeWidth="2" />
                <path d="M16 26l7 8 13-16" stroke="var(--border)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
                No hay solicitudes pendientes
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {solicitudes.length}{' '}
                  {solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
                </span>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Email</th>
                      <th>Fecha solicitud</th>
                      <th>Afiliado encontrado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map(s => (
                      <tr key={s.Id}>
                        <td>{s.Documento}</td>
                        <td>{s.Email || '—'}</td>
                        <td>{s.FechaRegistro ? (() => { const [y,m,d] = s.FechaRegistro.substring(0,10).split('-'); return `${d}-${m}-${y}`; })() : '—'}</td>
                        <td>
                          {s.PrimerNombre
                            ? <span style={{ color: '#16a34a', fontWeight: 500 }}>
                                ✓ {s.PrimerNombre} {s.PrimerApellido}
                              </span>
                            : <span style={{ lineHeight: 1.6 }}>
                                <span style={{
                                  display: 'inline-block',
                                  background: 'rgba(220,38,38,0.09)',
                                  color: 'var(--error)',
                                  border: '1px solid rgba(220,38,38,0.2)',
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}>Sin afiliado</span>
                                <br />
                                <span style={{ fontSize: 11, color: 'var(--text)' }}>
                                  Registrar primero en Afiliados
                                </span>
                              </span>
                          }
                        </td>
                        <td className="td-actions">
                          <button
                            className="btn-sm"
                            onClick={() => abrirAprobar(s)}
                            disabled={!s.PrimerNombre}
                            style={!s.PrimerNombre
                              ? { opacity: 0.38, cursor: 'not-allowed', color: 'var(--text)' }
                              : undefined}
                          >
                            Aprobar
                          </button>
                          <button className="btn-sm danger" onClick={() => rechazar(s.Id)}>
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Aprobar solicitud">
        {modal && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none"
                style={{ marginBottom: 14, display: 'block', margin: '0 auto 14px' }}>
                <circle cx="22" cy="22" r="20" stroke="var(--accent)" strokeWidth="1.5" />
                <path d="M22 13v11" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="22" cy="30" r="1.75" fill="var(--accent)" />
              </svg>
              <p style={{ fontSize: 19, fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>
                {modal.PrimerNombre} {modal.PrimerApellido}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>CI {modal.Documento}</p>
            </div>

            <p style={{
              fontSize: 14, color: 'var(--text)', textAlign: 'center',
              marginBottom: 20, lineHeight: 1.5,
            }}>
              ¿Confirmar el acceso al portal para este afiliado?
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
            )}

            <div className="modal-actions">
              <button className="btn-sm btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary btn-inline" onClick={confirmarAprobacion}>Confirmar</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
