import { useState, useEffect } from 'react';
import { getPlanCuentas, createPlanCuenta, updatePlanCuenta, deletePlanCuenta } from '../api/plancuentas';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';

const EMPTY = { codigo: '', descripcion: '', codigoPadre: '' };

function RubrosContables() {
  const [rubros, setRubros] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getPlanCuentas();
      setRubros(res.data.data || []);
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

  const abrirEditar = (rubro) => {
    setForm({
      codigo: rubro.Codigo,
      descripcion: rubro.Descripcion || '',
      codigoPadre: rubro.CodigoPadre || '',
    });
    setFormError('');
    setModal({ mode: 'edit', record: rubro });
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
    if (!form.descripcion.trim()) {
      setFormError('La descripción es obligatoria.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        codigo: form.codigo,
        descripcion: form.descripcion,
        codigoPadre: form.codigoPadre || null,
      };
      if (modal.mode === 'create') {
        await createPlanCuenta(payload);
      } else {
        await updatePlanCuenta(modal.record.Codigo, payload);
      }
      cerrarModal();
      cargar();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (rubro) => {
    if (!(await confirmDialog(`¿Eliminar el rubro "${rubro.Codigo} - ${rubro.Descripcion}"?`))) return;
    try {
      await deletePlanCuenta(rubro.Codigo);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const nombrePadre = (codigoPadre) => {
    if (!codigoPadre) return '—';
    const padre = rubros.find(r => r.Codigo === codigoPadre);
    return padre ? `${padre.Codigo} - ${padre.Descripcion}` : codigoPadre;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Rubros contables</h2>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nuevo rubro</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Padre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="td-empty">Cargando…</td></tr>
            ) : rubros.length === 0 ? (
              <tr><td colSpan={4} className="td-empty">Sin rubros.</td></tr>
            ) : rubros.map(r => (
              <tr key={r.Codigo}>
                <td>{r.Codigo}</td>
                <td>{r.Descripcion}</td>
                <td>{nombrePadre(r.CodigoPadre)}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => abrirEditar(r)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => eliminar(r)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Nuevo rubro' : 'Editar rubro'} onClose={cerrarModal}>
          <form onSubmit={guardar}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="codigo">Código *</label>
                <input id="codigo" name="codigo" type="text" value={form.codigo}
                  onChange={handleChange} disabled={modal.mode === 'edit'} required />
              </div>

              <div className="form-group full">
                <label htmlFor="descripcion">Descripción *</label>
                <input id="descripcion" name="descripcion" type="text" value={form.descripcion}
                  onChange={handleChange} required />
              </div>

              <div className="form-group full">
                <label htmlFor="codigoPadre">Rubro padre</label>
                <select id="codigoPadre" name="codigoPadre" value={form.codigoPadre} onChange={handleChange}>
                  <option value="">— Ninguno —</option>
                  {rubros
                    .filter(r => r.Codigo !== form.codigo)
                    .map(r => (
                      <option key={r.Codigo} value={r.Codigo}>{r.Codigo} - {r.Descripcion}</option>
                    ))}
                </select>
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

export default RubrosContables;
