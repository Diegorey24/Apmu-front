import { useState, useEffect } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';

function UsuariosWeb() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  const [modal, setModal] = useState(null); // 'crear' | 'password'
  const [usuarioTarget, setUsuarioTarget] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await client.get('/usuarios-web');
      setData(res.data.data || []);
    } catch {
      setPageError('Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCrear = () => {
    setNuevoUsuario('');
    setNuevoPassword('');
    setFormError('');
    setModal('crear');
  };

  const openPassword = (usuario) => {
    setUsuarioTarget(usuario);
    setPasswordNueva('');
    setFormError('');
    setModal('password');
  };

  const closeModal = () => { setModal(null); setUsuarioTarget(null); };

  const handleCrear = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await client.post('/usuarios-web', { usuario: nuevoUsuario, password: nuevoPassword });
      closeModal();
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await client.patch(`/usuarios-web/${usuarioTarget.ID}/password`, { password: passwordNueva });
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (usuario) => {
    const nuevoEstado = usuario.active === 1 ? 0 : 1;
    if (nuevoEstado === 0) {
      const tokenActual = localStorage.getItem('apmu_token') || '';
      const usuarioActual = tokenActual.split('_')[0];
      if (usuario.Usuario?.trim() === usuarioActual) {
        alert('No podés desactivar tu propio usuario.');
        return;
      }
    }
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} al usuario "${usuario.Usuario?.trim()}"?`)) return;
    try {
      await client.patch(`/usuarios-web/${usuario.ID}/toggle-active`, { active: nuevoEstado });
      load();
    } catch {
      alert('Error al cambiar el estado del usuario.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Usuarios del sistema</h2>
        <button className="btn-primary btn-inline" onClick={openCrear}>+ Nuevo usuario</button>
      </div>

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="td-empty">Sin usuarios.</td></tr>
            ) : data.map((u) => (
              <tr key={u.ID}>
                <td className="td-mono">{u.ID}</td>
                <td style={{ fontWeight: 500 }}>{u.Usuario?.trim()}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: u.active === 1 ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)',
                    color: u.active === 1 ? '#16a34a' : '#6b7280',
                  }}>
                    {u.active === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => openPassword(u)}>
                      Cambiar contraseña
                    </button>
                    <button
                      className={u.active === 1 ? 'btn-sm danger' : 'btn-sm'}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.active === 1 ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'crear' && (
        <Modal title="Nuevo usuario" onClose={closeModal} size="md">
          <form onSubmit={handleCrear}>
            <div className="form-group">
              <label>Usuario *</label>
              <input
                value={nuevoUsuario}
                onChange={e => setNuevoUsuario(e.target.value)}
                maxLength={20}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Contraseña * <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 400 }}>(máx. 15 caracteres)</span></label>
              <input
                type="password"
                value={nuevoPassword}
                onChange={e => setNuevoPassword(e.target.value)}
                maxLength={15}
                required
              />
            </div>

            {formError && <p className="alert alert-error">{formError}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-primary btn-inline" disabled={saving}>
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'password' && usuarioTarget && (
        <Modal title={`Cambiar contraseña — ${usuarioTarget.Usuario?.trim()}`} onClose={closeModal} size="md">
          <form onSubmit={handleCambiarPassword}>
            <div className="form-group">
              <label>Nueva contraseña * <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 400 }}>(máx. 15 caracteres)</span></label>
              <input
                type="password"
                value={passwordNueva}
                onChange={e => setPasswordNueva(e.target.value)}
                maxLength={15}
                required
                autoFocus
              />
            </div>

            {formError && <p className="alert alert-error">{formError}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-primary btn-inline" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default UsuariosWeb;
