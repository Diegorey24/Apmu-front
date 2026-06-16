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
            <p style={{ color: 'var(--color-text-secondary)' }}>No hay solicitudes pendientes.</p>
          ) : (
            <table className="tabla">
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
                    <td>{s.FechaRegistro?.substring(0, 10)}</td>
                    <td>
                      {s.PrimerNombre
                        ? <span style={{ color: 'var(--color-text-success)', fontWeight: 500 }}>
                            ✓ {s.PrimerNombre} {s.PrimerApellido}
                          </span>
                        : <span style={{ color: 'var(--color-text-danger)' }}>
                            ✗ Afiliado no encontrado. Debe registrarse previamente en el módulo de Afiliados.
                          </span>
                      }
                    </td>
                    <td>
                      <button className="btn-sm" onClick={() => abrirAprobar(s)}
                        disabled={!s.PrimerNombre}>
                        Aprobar
                      </button>
                      <button className="btn-sm danger" onClick={() => rechazar(s.Id)}>Rechazar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={`Aprobar solicitud — ${modal?.Documento}`}>
        {modal && (
          <>
            <p style={{ marginBottom: 16 }}>
              ¿Confirmar el acceso al portal para <strong>{modal.PrimerNombre} {modal.PrimerApellido}</strong> (CI {modal.Documento})?
            </p>
            {error && <span className="error" style={{ display: 'block', marginBottom: 12 }}>{error}</span>}
            <div className="modal-actions">
              <button className="btn-sm" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary btn-inline" onClick={confirmarAprobacion}>Confirmar</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}