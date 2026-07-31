import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getBanco, createMovimiento, updateMovimiento, deleteMovimiento } from '../api/banco';
import { getPlanCuentas } from '../api/plancuentas';
import { getCentrosCosto } from '../api/centroscosto';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';
import { formatFecha } from '../utils/fecha';

const EMPTY = {
  fecha: '', comprobante: '', codigoCuenta: '', descripcion: '',
  idCentroCosto: '', debe: '', haber: '',
};

function Banco() {
  const [data, setData]       = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [planCuentas, setPlanCuentas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);

  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const load = async (filtros = {}) => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getBanco(filtros);
      setData(res.data.data || []);
      setResumen(res.data.resumen || null);
    } catch {
      setPageError('Error al cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getPlanCuentas().then(r => setPlanCuentas(r.data.data || []));
    getCentrosCosto().then(r => setCentrosCosto(r.data.data || []));
  }, []);

  const aplicarFiltros = () => {
    load({
      fechaDesde: filtroFechaDesde || undefined,
      fechaHasta: filtroFechaHasta || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    load();
  };

  const exportarExcel = () => {
    const filas = data.map(row => ({
      'Nro Interno Comp.': row.NroComp ?? '',
      Fecha: row.Fecha ? row.Fecha.substring(0, 10) : '',
      Comprobante: row.Comprobante || '',
      Rubro: row.CodigoCuenta || '',
      Descripción: row.CuentaDescripcion || '',
      Detalle: row.Descripcion || '',
      'Centro de Costo': row.CentroCostoNombre || '',
      Debe: row.Debe ?? '',
      Haber: row.Haber ?? '',
      Saldo: row.SaldoAcumulado ?? '',
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Banco');
    XLSX.writeFile(libro, 'caja_banco.xlsx');
  };

  const imprimir = () => {
    window.print();
  };

  const openCreate = () => {
    setForm({ ...EMPTY, fecha: new Date().toISOString().substring(0, 10) });
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (row) => {
    setForm({
      fecha: row.Fecha ? row.Fecha.substring(0, 10) : '',
      comprobante: row.Comprobante || '',
      codigoCuenta: row.CodigoCuenta || '',
      descripcion: row.Descripcion || '',
      idCentroCosto: row.IdCentroCosto || '',
      debe: row.Debe ?? '',
      haber: row.Haber ?? '',
    });
    setFormError('');
    setModal({ mode: 'edit', record: row });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const cuentaSeleccionada = planCuentas.find(c => c.Codigo === form.codigoCuenta);

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
    if (!form.descripcion.trim()) {
      setFormError('La descripción es obligatoria.');
      return;
    }
    if (form.descripcion.length > 200) {
      setFormError('La descripción no puede superar los 200 caracteres.');
      return;
    }
    const debe = parseFloat(form.debe) || 0;
    const haber = parseFloat(form.haber) || 0;
    if (debe <= 0 && haber <= 0) {
      setFormError('Debe ingresar un importe en Debe o en Haber.');
      return;
    }
    if (debe > 0 && haber > 0) {
      setFormError('No puede ingresar importe en Debe y en Haber a la vez.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fecha: form.fecha,
        comprobante: form.comprobante || null,
        codigoCuenta: form.codigoCuenta || null,
        descripcion: form.descripcion,
        idCentroCosto: form.idCentroCosto || null,
        debe: debe > 0 ? debe : null,
        haber: haber > 0 ? haber : null,
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
    if (!(await confirmDialog('¿Eliminar este movimiento?'))) return;
    try {
      await deleteMovimiento(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const formatMonto = (m) => m == null || m === '' ? '—' : `$ ${Number(m).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Banco</h2>
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

      <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Desde</label>
          <input type="date" className="form-control" value={filtroFechaDesde}
            onChange={e => setFiltroFechaDesde(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Hasta</label>
          <input type="date" className="form-control" value={filtroFechaHasta}
            onChange={e => setFiltroFechaHasta(e.target.value)} />
        </div>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
        <button className="btn-sm" onClick={exportarExcel}>Exportar Excel</button>
        <button className="btn-sm" onClick={imprimir}>Imprimir</button>
      </div>

      <div className="table-wrapper print-area">
        <h2 className="print-title">BANCO</h2>
        <table>
          <thead>
            <tr>
              <th>Nro Interno Comp.</th>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Rubro</th>
              <th>Descripción</th>
              <th>Detalle</th>
              <th>Centro de Costo</th>
              <th>Debe</th>
              <th>Haber</th>
              <th>Saldo</th>
              <th className="no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={11} className="td-empty">Sin movimientos.</td></tr>
            ) : data.map(row => (
              <tr key={row.Id}>
                <td className="td-muted">{row.NroComp ?? '—'}</td>
                <td>{formatFecha(row.Fecha)}</td>
                <td>{row.Comprobante || '—'}</td>
                <td>{row.CodigoCuenta || '—'}</td>
                <td>{row.CuentaDescripcion || '—'}</td>
                <td>{row.Descripcion}</td>
                <td>{row.CentroCostoNombre || '—'}</td>
                <td>{formatMonto(row.Debe)}</td>
                <td>{formatMonto(row.Haber)}</td>
                <td>{formatMonto(row.SaldoAcumulado)}</td>
                <td className="no-print">
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
                <label htmlFor="comprobante">Comprobante</label>
                <input id="comprobante" name="comprobante" type="text" value={form.comprobante}
                  onChange={handleChange} placeholder='Ej: "I 9298592"' />
              </div>

              <div className="form-group full">
                <label htmlFor="codigoCuenta">Cuenta contable</label>
                <select id="codigoCuenta" name="codigoCuenta" value={form.codigoCuenta} onChange={handleChange}>
                  <option value="">— Seleccioná —</option>
                  {planCuentas.map(c => (
                    <option key={c.Codigo} value={c.Codigo}>{c.Codigo} - {c.Descripcion}</option>
                  ))}
                </select>
                {cuentaSeleccionada && (
                  <small style={{ color: 'var(--text)', fontSize: 12 }}>
                    {cuentaSeleccionada.Descripcion}
                  </small>
                )}
              </div>

              <div className="form-group full">
                <label htmlFor="descripcion">Descripción detalle *</label>
                <input id="descripcion" name="descripcion" type="text" value={form.descripcion} onChange={handleChange} required />
              </div>

              <div className="form-group full">
                <label htmlFor="idCentroCosto">Centro de costo</label>
                <select id="idCentroCosto" name="idCentroCosto" value={form.idCentroCosto} onChange={handleChange}>
                  <option value="">— Seleccioná —</option>
                  {centrosCosto.map(c => (
                    <option key={c.Id} value={c.Id}>{c.Codigo} - {c.Nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="debe">Debe</label>
                <input id="debe" name="debe" type="number" step="0.01" min="0"
                  value={form.debe} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="haber">Haber</label>
                <input id="haber" name="haber" type="number" step="0.01" min="0"
                  value={form.haber} onChange={handleChange} />
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

export default Banco;
