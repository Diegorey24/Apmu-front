import { useState, useEffect } from 'react';
import { getAutores, createAutor, updateAutor, deleteAutor } from '../api/autores';
import Modal from '../components/Modal';

const EMPTY = { ID: '', Autor: '' };

function Autores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getAutores();
      setData(res.data.data || []);
    } catch {
      setPageError('Error al cargar autores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal({ mode: 'create', record: null });
  };

  const openEdit = (record) => {
    setForm({ ID: record.ID?.trim() || '', Autor: record.Autor || '' });
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
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createAutor(form);
      } else {
        await updateAutor(modal.record.ID.trim(), { Autor: form.Autor });
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
    if (!confirm('¿Eliminar este autor? Esta acción no se puede deshacer.')) return;
    try {
      await deleteAutor(id.trim());
      load();
    } catch {
      alert('Error al eliminar el autor.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Autores</h2>
        <button className="btn-primary btn-inline" onClick={openCreate}>+ Nuevo autor</button>
      </div>

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Autor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={3} className="td-empty">Sin resultados.</td></tr>
            ) : data.map((a) => (
              <tr key={a.ID}>
                <td className="td-mono">{a.ID?.trim()}</td>
                <td>{a.Autor}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => openEdit(a)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => handleDelete(a.ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo autor' : 'Editar autor'}
          onClose={closeModal}
          size="md"
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="ID">
                ID{modal.mode === 'create' ? ' *' : ' (no editable)'}
              </label>
              <input
                id="ID"
                name="ID"
                value={form.ID}
                onChange={handleChange}
                required={modal.mode === 'create'}
                disabled={modal.mode === 'edit'}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label htmlFor="Autor">Autor</label>
              <input id="Autor" name="Autor" value={form.Autor} onChange={handleChange} maxLength={100} />
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

export default Autores;
