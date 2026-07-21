import { useState, useEffect } from 'react';
import { getPortalPendientes, aprobarPortal, rechazarPortal, resetPasswordPortal, eliminarSolicitudPortal, crearUsuarioPortal, getUsuariosPortal } from '../api/portal';
import Modal from '../components/Modal';

export default function SolicitudesAcceso() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [modalReset, setModalReset] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [formCrear, setFormCrear] = useState({ documento: '', password: '' });
  const [errorCrear, setErrorCrear] = useState('');
  const [tab, setTab] = useState('pendientes');
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [msgExito, setMsgExito] = useState('');
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getPortalPendientes();
      setSolicitudes(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    cargarUsuarios();
  }, []);

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

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await getUsuariosPortal();
      setUsuarios(res.data.data || []);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const crearUsuario = async () => {
    if (!formCrear.documento.trim()) { setErrorCrear('El documento es obligatorio'); return; }
    if (!formCrear.password || formCrear.password.length < 6) { setErrorCrear('Mínimo 6 caracteres'); return; }
    try {
      await crearUsuarioPortal(formCrear.documento.trim(), formCrear.password);
      setModalCrear(false);
      cargar();
      cargarUsuarios();
      setTab('todos');
    } catch (err) {
      setErrorCrear(err.response?.data?.message || 'Error al crear');
    }
  };

  const resetPassword = async () => {
    if (!nuevaPassword || nuevaPassword.length < 6) { setResetError('Mínimo 6 caracteres'); return; }
    try {
      await resetPasswordPortal(modalReset.Id, nuevaPassword);
      setModalReset(null);
      setNuevaPassword('');
      cargar();
      cargarUsuarios();
      setMsgExito('Contraseña reseteada correctamente');
      setTimeout(() => setMsgExito(''), 3000);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Error al resetear');
    }
  };

  const eliminarSolicitud = async (id) => {
    if (!confirm('¿Eliminar esta solicitud? El socio podrá volver a registrarse.')) return;
    try {
      await eliminarSolicitudPortal(id);
      cargar();
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Solicitudes de acceso</h1>
        <button className="btn-primary btn-inline" onClick={() => { setFormCrear({ documento: '', password: '' }); setErrorCrear(''); setModalCrear(true); }}>+ Crear usuario</button>
      </div>

      {msgExito && (
        <div style={{
          background: 'rgba(22,163,74,0.08)', color: '#16a34a',
          border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8,
          padding: '10px 14px', fontSize: 13, marginBottom: 16, fontWeight: 500
        }}>
          {msgExito}
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setTab('pendientes')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === 'pendientes' ? 600 : 400,
            color: tab === 'pendientes' ? 'var(--accent)' : 'var(--text)',
            borderBottom: tab === 'pendientes' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>
          Pendientes {solicitudes.length > 0 && `(${solicitudes.length})`}
        </button>
        <button
          onClick={() => setTab('todos')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === 'todos' ? 600 : 400,
            color: tab === 'todos' ? 'var(--accent)' : 'var(--text)',
            borderBottom: tab === 'todos' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>
          Todos los usuarios
        </button>
      </div>

      {tab === 'pendientes' && (
        <>
          {loading ? <p>Cargando...</p> : solicitudes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '72px 0', color: 'var(--text)' }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke="var(--border)" strokeWidth="2" />
                <path d="M16 26l7 8 13-16" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {solicitudes.length} {solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
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
                        <td>{s.FechaRegistro ? (() => { const [y, m, d] = s.FechaRegistro.substring(0, 10).split('-'); return `${d}-${m}-${y}`; })() : '—'}</td>
                        <td>
                          {s.PrimerNombre
                            ? <span style={{ color: '#16a34a', fontWeight: 500 }}>✓ {s.PrimerNombre} {s.PrimerApellido}</span>
                            : <span style={{ lineHeight: 1.6 }}>
                              <span style={{ display: 'inline-block', background: 'rgba(220,38,38,0.09)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>Sin afiliado</span>
                              <br /><span style={{ fontSize: 11, color: 'var(--text)' }}>Registrar primero en Afiliados</span>
                            </span>
                          }
                        </td>
                        <td className="td-actions">
                          <button className="btn-sm" onClick={() => abrirAprobar(s)} disabled={!s.PrimerNombre}
                            style={!s.PrimerNombre ? { opacity: 0.38, cursor: 'not-allowed', color: 'var(--text)' } : undefined}>Aprobar</button>
                          <button className="btn-sm danger" onClick={() => rechazar(s.Id)}>Rechazar</button>
                          <button className="btn-sm" onClick={() => { setModalReset(s); setNuevaPassword(''); setResetError(''); }}>Reset password</button>
                          <button className="btn-sm danger" onClick={() => eliminarSolicitud(s.Id)}>Eliminar</button>
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

      {tab === 'todos' && (
        <>
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por documento, nombre o email…"
              value={busquedaUsuarios}
              onChange={e => setBusquedaUsuarios(e.target.value)}
            />
          </div>
          {loadingUsuarios ? <p>Cargando...</p> : usuarios.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text)' }}>No hay usuarios registrados.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Fecha registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.filter(u => {
                    if (!busquedaUsuarios) return true;
                    const q = busquedaUsuarios.toLowerCase();
                    return (u.Documento || '').toLowerCase().includes(q) ||
                      (u.PrimerNombre || '').toLowerCase().includes(q) ||
                      (u.PrimerApellido || '').toLowerCase().includes(q) ||
                      (u.Email || '').toLowerCase().includes(q);
                  }).map(u => (
                    <tr key={u.Id}>
                      <td>{u.Documento}</td>
                      <td>{u.PrimerNombre ? `${u.PrimerNombre} ${u.PrimerApellido}` : '—'}</td>
                      <td>{u.Email || '—'}</td>
                      <td>
                        <span className={`badge ${u.Estado === 'Habilitado' ? 'badge-ok' : u.Estado === 'Pendiente' ? 'badge-pending' : 'badge-error'}`}>
                          {u.Estado}
                        </span>
                      </td>
                      <td>{u.FechaRegistro ? (() => { const [y, m, d] = u.FechaRegistro.substring(0, 10).split('-'); return `${d}-${m}-${y}`; })() : '—'}</td>
                      <td className="td-actions">
                        <button className="btn-sm" onClick={() => { setModalReset(u); setNuevaPassword(''); setResetError(''); }}>Reset password</button>
                        <button className="btn-sm danger" onClick={() => eliminarSolicitud(u.Id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!modalReset} onClose={() => setModalReset(null)} title="Resetear contraseña">
        {modalReset && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>
              Resetear contraseña de <strong>{modalReset.Documento}</strong>
            </p>
            <div className="form-group">
              <label>Nueva contraseña *</label>
              <input type="password" className="form-control" value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && resetPassword()}
                autoFocus />
            </div>
            {resetError && <span className="error">{resetError}</span>}
            <div className="modal-actions">
              <button className="btn-sm" onClick={() => setModalReset(null)}>Cancelar</button>
              <button className="btn-primary btn-inline" onClick={resetPassword}>Guardar</button>
            </div>
          </>
        )}
      </Modal>

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
            <p style={{ fontSize: 14, color: 'var(--text)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
              ¿Confirmar el acceso al portal para este afiliado?
            </p>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="modal-actions">
              <button className="btn-sm btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary btn-inline" onClick={confirmarAprobacion}>Confirmar</button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Crear usuario portal">
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>
          El afiliado debe existir en el padrón. Se crea directamente como Habilitado.
        </p>
        <div className="form-group">
          <label>Documento (CI) *</label>
          <input className="form-control" value={formCrear.documento}
            onChange={e => setFormCrear(f => ({ ...f, documento: e.target.value }))} autoFocus />
        </div>
        <div className="form-group">
          <label>Contraseña *</label>
          <input type="password" className="form-control" value={formCrear.password}
            onChange={e => setFormCrear(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && crearUsuario()} />
        </div>
        {errorCrear && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{errorCrear}</span>}
        <div className="modal-actions">
          <button className="btn-sm" onClick={() => setModalCrear(false)}>Cancelar</button>
          <button className="btn-primary btn-inline" onClick={crearUsuario}>Crear</button>
        </div>
      </Modal>

    </div>
  );
}

