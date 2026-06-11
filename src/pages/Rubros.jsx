import { useState, useEffect } from 'react';
import { getRubros, createRubro, updateRubro, deleteRubro } from '../api/rubros';
import Modal from '../components/Modal';

const EMPTY = { RubCod: '', RubDsc: '', Importe: '' };

function Rubros() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pageError, setPageError] = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getRubros();
      setData(res.data.data || []);
    } catch {
      setPageError('Error al cargar rubros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (record) => {
    setForm({
      RubCod:  record.RubCod,
      RubDsc:  record.RubDsc?.trim() || '',
      Importe: record.Importe ?? '',
    });
    setFormError('');
    setModal({ mode: 'edit', record });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.Importe === '' || parseFloat(form.Importe) <= 0) {
      setFormError('El importe es obligatorio y debe ser mayor a 0.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        RubCod:  parseInt(form.RubCod),
        Importe: form.Importe !== '' ? parseFloat(form.Importe) : null,
      };
      if (modal.mode === 'create') {
        await createRubro(payload);
      } else {
        await updateRubro(modal.record.RubCod, payload);
      }
      closeModal();
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este rubro?')) return;
    try {
      await deleteRubro(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Rubros</h2>
        <button className="btn-primary btn-inline" onClick={openCreate}>+ Nuevo rubro</button>
      </div>

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Importe</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="td-empty">Sin rubros cargados.</td></tr>
            ) : data.map((r) => (
              <tr key={r.RubCod}>
                <td className="td-muted">{r.RubCod}</td>
                <td>{r.RubDsc?.trim()}</td>
                <td>{r.Importe != null ? `$ ${Number(r.Importe).toFixed(2)}` : '—'}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => openEdit(r)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => handleDelete(r.RubCod)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo rubro' : 'Editar rubro'}
          onClose={closeModal}
        >
          <form onSubmit={handleSave}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="RubCod">Código *</label>
                <input
                  id="RubCod" name="RubCod" type="number"
                  value={form.RubCod} onChange={handleChange}
                  required disabled={modal.mode === 'edit'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="Importe">Importe *</label>
                <input
                  id="Importe" name="Importe" type="number"
                  step="0.01" min="0"
                  value={form.Importe} onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full">
                <label htmlFor="RubDsc">Descripción *</label>
                <input
                  id="RubDsc" name="RubDsc"
                  value={form.RubDsc} onChange={handleChange}
                  required maxLength={50}
                />
              </div>

            </div>

            {formError && <p className="alert alert-error" style={{ marginTop: '16px' }}>{formError}</p>}

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

export default Rubros;