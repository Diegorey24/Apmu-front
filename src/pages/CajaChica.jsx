import { useState, useEffect } from 'react';
import { getCajaChica, createMovimiento, updateMovimiento, deleteMovimiento } from '../api/cajachica';
import Modal from '../components/Modal';

const EMPTY = { fecha: '', tipo: 'Entrada', descripcion: '', importe: '', usuario: '' };

function CajaChica() {
  const [data, setData]       = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getCajaChica();
      setData(res.data.data || []);
      setResumen(res.data.resumen || null);
    } catch {
      setPageError('Error al cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY, fecha: new Date().toISOString().substring(0, 10) });
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (row) => {
    setForm({
      fecha: row.Fecha ? row.Fecha.substring(0, 10) : '',
      tipo: row.Tipo,
      descripcion: row.Descripcion,
      importe: row.Importe,
      usuario: row.Usuario || '',
    });
    setFormError('');
    setModal({ mode: 'edit', record: row });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.fecha) {
      setFormError('La fecha es obligatoria.');
      return;
    }
    const hoy = new Date().toISOString().substring(0, 10);
    if (form.fecha > hoy) {
      setFormError('La fecha no puede ser una fecha futura.');
      return;
    }
    if (form.tipo !== 'Entrada' && form.tipo !== 'Salida') {
      setFormError('El tipo debe ser Entrada o Salida.');
      return;
    }
    if (!form.descripcion.trim()) {
      setFormError('La descripción es obligatoria.');
      return;
    }
    if (form.descripcion.length > 200) {
      setFormError('La descripción no puede superar los 200 caracteres.');
      return;
    }
    if (parseFloat(form.importe) <= 0) {
      setFormError('El importe debe ser mayor a 0.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fecha: form.fecha,
        tipo: form.tipo,
        descripcion: form.descripcion,
        importe: parseFloat(form.importe),
        usuario: form.usuario || null,
      };
      if (modal.mode === 'create') {
        await createMovimiento(payload);
      } else {
        await updateMovimiento(modal.record.Id, payload);
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
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      await deleteMovimiento(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const formatMonto = (m) => `$ ${Number(m).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;

  const formatFecha = (f) => {
    if (!f) return '—';
    const [y, m, d] = f.substring(0, 10).split('-');
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Caja chica</h2>
        <button className="btn-primary btn-inline" onClick={openCreate}>+ Nuevo movimiento</button>
      </div>

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total entradas</p>
            <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 500 }}>{formatMonto(resumen.TotalEntradas)}</p>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total salidas</p>
            <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 500 }}>{formatMonto(resumen.TotalSalidas)}</p>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Saldo actual</p>
            <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 500 }}>{formatMonto(resumen.Saldo)}</p>
          </div>
        </div>
      )}

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Importe</th>
              <th>Usuario</th>
              <th>Saldo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="td-empty">Sin movimientos.</td></tr>
            ) : data.map(row => (
              <tr key={row.Id}>
                <td>{formatFecha(row.Fecha)}</td>
                <td>{row.Tipo}</td>
                <td>{row.Descripcion}</td>
                <td>{row.Tipo === 'Entrada' ? '+ ' : '- '}{formatMonto(row.Importe)}</td>
                <td className="td-muted">{row.Usuario || '—'}</td>
                <td>{formatMonto(row.SaldoAcumulado)}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => openEdit(row)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => handleDelete(row.Id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Nuevo movimiento' : 'Editar movimiento'} onClose={closeModal}>
          <form onSubmit={handleSave}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input type="date" id="fecha" name="fecha" value={form.fecha} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="tipo">Tipo *</label>
                <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} required>
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                </select>
              </div>

              <div className="form-group full">
                <label htmlFor="descripcion">Descripción *</label>
                <input id="descripcion" name="descripcion" type="text" value={form.descripcion} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="importe">Importe *</label>
                <input id="importe" name="importe" type="number" step="0.01" min="0"
                  value={form.importe} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="usuario">Usuario</label>
                <input id="usuario" name="usuario" type="text" value={form.usuario} onChange={handleChange} />
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

export default CajaChica;