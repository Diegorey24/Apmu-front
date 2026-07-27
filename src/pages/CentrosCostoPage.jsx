import { useState, useEffect } from 'react';
import { getCentrosCosto, createCentroCosto, updateCentroCosto, deleteCentroCosto } from '../api/centroscosto';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';

const EMPTY = { codigo: '', nombre: '' };

function CentrosCostoPage() {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getCentrosCosto();
      setCentros(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setForm(EMPTY);
    setFormError('');
    setModal({ mode: 'create' });
  };

  const abrirEditar = (centro) => {
    setForm({ codigo: centro.Codigo || '', nombre: centro.Nombre || '' });
    setFormError('');
    setModal({ mode: 'edit', record: centro });
  };

  const cerrarModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.codigo.trim()) {
      setFormError('El código es obligatorio.');
      return;
    }
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const payload = { codigo: form.codigo, nombre: form.nombre };
      if (modal.mode === 'create') {
        await createCentroCosto(payload);
      } else {
        await updateCentroCosto(modal.record.Id, payload);
      }
      cerrarModal();
      cargar();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (centro) => {
    if (!(await confirmDialog(`¿Eliminar el centro de costo "${centro.Codigo} - ${centro.Nombre}"?`))) return;
    try {
      await deleteCentroCosto(centro.Id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Centros de costo</h2>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nuevo centro de costo</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="td-empty">Cargando…</td></tr>
            ) : centros.length === 0 ? (
              <tr><td colSpan={3} className="td-empty">Sin centros de costo.</td></tr>
            ) : centros.map(c => (
              <tr key={c.Id}>
                <td>{c.Codigo}</td>
                <td>{c.Nombre}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => abrirEditar(c)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => eliminar(c)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Nuevo centro de costo' : 'Editar centro de costo'} onClose={cerrarModal}>
          <form onSubmit={guardar}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="codigo">Código *</label>
                <input id="codigo" name="codigo" type="text" value={form.codigo} onChange={handleChange} required />
              </div>

              <div className="form-group full">
                <label htmlFor="nombre">Nombre *</label>
                <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} required />
              </div>

            </div>

            {formError && <p className="alert alert-error" style={{ marginTop: '16px' }}>{formError}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-sm btn-cancel" onClick={cerrarModal}>Cancelar</button>
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

export default CentrosCostoPage;
