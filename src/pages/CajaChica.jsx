import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getCajaChica, createMovimiento, updateMovimiento, deleteMovimiento } from '../api/cajachica';
import { getArqueos, createArqueo, deleteArqueo } from '../api/arqueo';
import { getPlanCuentas } from '../api/plancuentas';
import { getCentrosCosto } from '../api/centroscosto';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';
import { formatFecha } from '../utils/fecha';

const EMPTY = {
  fecha: '', comprobante: '', codigoCuenta: '', descripcion: '',
  idCentroCosto: '', debe: '', haber: '',
};

const BILLETES = [2000, 1000, 500, 200, 100, 50, 20];
const MONEDAS = [50, 10, 5, 2, 1];
const CODIGOS = [...BILLETES.map(v => `B${v}`), ...MONEDAS.map(v => `M${v}`)];
const valorDenominacion = (codigo) => parseInt(codigo.substring(1), 10);

const buildEmptyArqueo = () => {
  const obj = { fecha: '', hora: '', realizadoPor: '' };
  CODIGOS.forEach(c => { obj[`${c}_CajaFte`] = ''; obj[`${c}_Caja`] = ''; });
  return obj;
};

const formatMonto = (m) => m == null || m === '' ? '—' : `$ ${Number(m).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;

function CajaChica() {
  const [tab, setTab] = useState('movimientos');

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

  // Filtros movimientos
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Arqueo
  const [arqueos, setArqueos] = useState([]);
  const [arqueoLoading, setArqueoLoading] = useState(true);
  const [arqueoError, setArqueoError] = useState('');
  const [filtroArqDesde, setFiltroArqDesde] = useState('');
  const [filtroArqHasta, setFiltroArqHasta] = useState('');
  const [arqueoModal, setArqueoModal] = useState(false);
  const [arqueoForm, setArqueoForm] = useState(buildEmptyArqueo());
  const [arqueoFormError, setArqueoFormError] = useState('');
  const [arqueoSaving, setArqueoSaving] = useState(false);
  const [arqueoResultado, setArqueoResultado] = useState(null);
  const [arqueoImprimir, setArqueoImprimir] = useState(null);

  const load = async (filtros = {}) => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getCajaChica(filtros);
      setData(res.data.data || []);
      setResumen(res.data.resumen || null);
    } catch {
      setPageError('Error al cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  };

  const loadArqueos = async (filtros = {}) => {
    setArqueoLoading(true);
    setArqueoError('');
    try {
      const res = await getArqueos(filtros);
      setArqueos(res.data.data || []);
    } catch {
      setArqueoError('Error al cargar los arqueos.');
    } finally {
      setArqueoLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadArqueos();
    getPlanCuentas().then(r => setPlanCuentas(r.data.data || []));
    getCentrosCosto().then(r => setCentrosCosto(r.data.data || []));
  }, []);

  useEffect(() => {
    if (!arqueoImprimir) return;
    const timer = setTimeout(() => window.print(), 100);
    return () => clearTimeout(timer);
  }, [arqueoImprimir]);

  useEffect(() => {
    const onAfterPrint = () => setArqueoImprimir(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
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

  const aplicarFiltrosArqueo = () => {
    loadArqueos({
      fechaDesde: filtroArqDesde || undefined,
      fechaHasta: filtroArqHasta || undefined,
    });
  };

  const limpiarFiltrosArqueo = () => {
    setFiltroArqDesde('');
    setFiltroArqHasta('');
    loadArqueos();
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
    XLSX.utils.book_append_sheet(libro, hoja, 'Fondo Fijo');
    XLSX.writeFile(libro, 'fondo_fijo.xlsx');
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

  // ── Arqueo de efectivo ──

  const openArqueoCreate = () => {
    setArqueoForm({ ...buildEmptyArqueo(), fecha: new Date().toISOString().substring(0, 10) });
    setArqueoFormError('');
    setArqueoResultado(null);
    setArqueoModal(true);
  };

  const closeArqueoModal = () => {
    setArqueoModal(false);
    setArqueoResultado(null);
  };

  const handleArqueoMontoChange = (campo, value) => {
    setArqueoForm(f => ({ ...f, [campo]: value }));
  };

  const totalImportePorCampo = (sufijo) => CODIGOS.reduce((acc, c) => {
    const cantidad = parseFloat(arqueoForm[`${c}_${sufijo}`]) || 0;
    return acc + cantidad * valorDenominacion(c);
  }, 0);
  const totalCajaFte = totalImportePorCampo('CajaFte');
  const totalCaja = totalImportePorCampo('Caja');
  const totalGeneral = totalCajaFte + totalCaja;

  const handleSaveArqueo = async (e) => {
    e.preventDefault();
    setArqueoFormError('');
    if (!arqueoForm.fecha) {
      setArqueoFormError('La fecha es obligatoria.');
      return;
    }
    if (!arqueoForm.hora.trim()) {
      setArqueoFormError('La hora es obligatoria.');
      return;
    }
    if (!arqueoForm.realizadoPor.trim()) {
      setArqueoFormError('El campo "Realizado por" es obligatorio.');
      return;
    }
    setArqueoSaving(true);
    try {
      const payload = { fecha: arqueoForm.fecha, hora: arqueoForm.hora, realizadoPor: arqueoForm.realizadoPor };
      CODIGOS.forEach(c => {
        const valor = valorDenominacion(c);
        payload[`${c}_CajaFte`] = (parseFloat(arqueoForm[`${c}_CajaFte`]) || 0) * valor;
        payload[`${c}_Caja`] = (parseFloat(arqueoForm[`${c}_Caja`]) || 0) * valor;
      });
      const res = await createArqueo(payload);
      setArqueoResultado(res.data.data);
      loadArqueos();
    } catch (err) {
      setArqueoFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setArqueoSaving(false);
    }
  };

  const handleDeleteArqueo = async (id) => {
    if (!(await confirmDialog('¿Eliminar este arqueo?'))) return;
    try {
      await deleteArqueo(id);
      loadArqueos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const imprimirArqueo = (row) => setArqueoImprimir(row);

  const filaLabel = (codigo) => `$ ${codigo.substring(1)}`;

  const renderFilasArqueo = (codigos) => codigos.map(codigo => {
    const valor = valorDenominacion(codigo);
    const cantidadCajaFte = parseFloat(arqueoForm[`${codigo}_CajaFte`]) || 0;
    const cantidadCaja = parseFloat(arqueoForm[`${codigo}_Caja`]) || 0;
    const totalFila = (cantidadCajaFte + cantidadCaja) * valor;
    return (
      <tr key={codigo}>
        <td>{filaLabel(codigo)}</td>
        <td>
          <input type="number" step="1" min="0" style={{ width: '90px' }}
            value={arqueoForm[`${codigo}_CajaFte`]}
            onChange={e => handleArqueoMontoChange(`${codigo}_CajaFte`, e.target.value)} />
        </td>
        <td>
          <input type="number" step="1" min="0" style={{ width: '90px' }}
            value={arqueoForm[`${codigo}_Caja`]}
            onChange={e => handleArqueoMontoChange(`${codigo}_Caja`, e.target.value)} />
        </td>
        <td className="td-muted">{formatMonto(totalFila)}</td>
      </tr>
    );
  });

  const renderFilasImpresion = (row, codigos) => codigos.map(codigo => {
    const cajaFte = parseFloat(row[`${codigo}_CajaFte`]) || 0;
    const caja = parseFloat(row[`${codigo}_Caja`]) || 0;
    return (
      <tr key={codigo}>
        <td>{filaLabel(codigo)}</td>
        <td>{formatMonto(cajaFte)}</td>
        <td>{formatMonto(caja)}</td>
        <td>{formatMonto(cajaFte + caja)}</td>
      </tr>
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Fondo Fijo</h2>
        {tab === 'movimientos'
          ? <button className="btn-primary btn-inline no-print" onClick={openCreate}>+ Nuevo movimiento</button>
          : <button className="btn-primary btn-inline no-print" onClick={openArqueoCreate}>+ Nuevo arqueo</button>}
      </div>

      <div className="tabs no-print">
        <button className={tab === 'movimientos' ? 'active' : ''} onClick={() => setTab('movimientos')}>Movimientos</button>
        <button className={tab === 'arqueo' ? 'active' : ''} onClick={() => setTab('arqueo')}>Arqueo</button>
      </div>

      {tab === 'movimientos' && (
        <>
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
            <h2 className="print-title">FONDO FIJO</h2>
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
        </>
      )}

      {tab === 'arqueo' && (
        <>
          {arqueoError && <p className="alert alert-error">{arqueoError}</p>}

          <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Desde</label>
              <input type="date" className="form-control" value={filtroArqDesde}
                onChange={e => setFiltroArqDesde(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Hasta</label>
              <input type="date" className="form-control" value={filtroArqHasta}
                onChange={e => setFiltroArqHasta(e.target.value)} />
            </div>
            <button className="btn-primary btn-inline" onClick={aplicarFiltrosArqueo}>Buscar</button>
            <button className="btn-sm" onClick={limpiarFiltrosArqueo}>Limpiar</button>
          </div>

          <div className="table-wrapper no-print">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Realizado por</th>
                  <th>Total Arqueo</th>
                  <th>Saldo FF</th>
                  <th>Diferencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {arqueoLoading ? (
                  <tr><td colSpan={7} className="td-empty">Cargando…</td></tr>
                ) : arqueos.length === 0 ? (
                  <tr><td colSpan={7} className="td-empty">Sin arqueos registrados.</td></tr>
                ) : arqueos.map(row => (
                  <tr key={row.Id}>
                    <td>{formatFecha(row.Fecha)}</td>
                    <td>{row.Hora || '—'}</td>
                    <td>{row.RealizadoPor || '—'}</td>
                    <td>{formatMonto(row.TotalArqueo)}</td>
                    <td>{formatMonto(row.SaldoFondoFijo)}</td>
                    <td style={{ color: Number(row.Diferencia) !== 0 ? 'var(--danger, #d33)' : undefined }}>
                      {formatMonto(row.Diferencia)}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-sm" onClick={() => imprimirArqueo(row)}>Imprimir</button>
                        <button className="btn-sm danger" onClick={() => handleDeleteArqueo(row.Id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {arqueoImprimir && (
            <div className="print-area" style={{ padding: '24px' }}>
              <h2>Arqueo de Efectivo</h2>
              <p>
                <strong>Fecha:</strong> {formatFecha(arqueoImprimir.Fecha)}{'  '}
                <strong>Hora:</strong> {arqueoImprimir.Hora || '—'}{'  '}
                <strong>Realizado por:</strong> {arqueoImprimir.RealizadoPor || '—'}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="6">
                <thead>
                  <tr>
                    <th>Denominación</th>
                    <th>Caja Fuerte</th>
                    <th>Caja</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th colSpan={4} style={{ textAlign: 'left' }}>Billetes</th></tr>
                  {renderFilasImpresion(arqueoImprimir, BILLETES.map(v => `B${v}`))}
                  <tr><th colSpan={4} style={{ textAlign: 'left' }}>Monedas</th></tr>
                  {renderFilasImpresion(arqueoImprimir, MONEDAS.map(v => `M${v}`))}
                </tbody>
              </table>
              <p style={{ marginTop: 16 }}>
                <strong>Total Arqueo:</strong> {formatMonto(arqueoImprimir.TotalArqueo)}<br />
                <strong>Saldo Fondo Fijo:</strong> {formatMonto(arqueoImprimir.SaldoFondoFijo)}<br />
                <strong>Diferencia:</strong> {formatMonto(arqueoImprimir.Diferencia)}
              </p>
            </div>
          )}

          {arqueoModal && (
            <Modal title="Nuevo arqueo" onClose={closeArqueoModal} size="lg">
              {!arqueoResultado ? (
                <form onSubmit={handleSaveArqueo}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="arq-fecha">Fecha *</label>
                      <input type="date" id="arq-fecha" value={arqueoForm.fecha}
                        onChange={e => setArqueoForm(f => ({ ...f, fecha: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="arq-hora">Hora *</label>
                      <input type="text" id="arq-hora" placeholder='Ej: "18:00"' value={arqueoForm.hora}
                        onChange={e => setArqueoForm(f => ({ ...f, hora: e.target.value }))} required />
                    </div>
                    <div className="form-group full">
                      <label htmlFor="arq-realizadoPor">Realizado por *</label>
                      <input type="text" id="arq-realizadoPor" value={arqueoForm.realizadoPor}
                        onChange={e => setArqueoForm(f => ({ ...f, realizadoPor: e.target.value }))} required />
                    </div>
                  </div>

                  <p style={{ marginTop: '16px', marginBottom: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Ingresá la cantidad de billetes/monedas de cada denominación (no el importe). El total se calcula automáticamente.
                  </p>
                  <div className="table-wrapper" style={{ marginTop: '8px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Denominación</th>
                          <th>Cant. Caja Fuerte</th>
                          <th>Cant. Caja</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><th colSpan={4} style={{ textAlign: 'left' }}>Billetes</th></tr>
                        {renderFilasArqueo(BILLETES.map(v => `B${v}`))}
                        <tr><th colSpan={4} style={{ textAlign: 'left' }}>Monedas</th></tr>
                        {renderFilasArqueo(MONEDAS.map(v => `M${v}`))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0 }}><strong>Total Caja Fte:</strong> {formatMonto(totalCajaFte)}</p>
                    <p style={{ margin: 0 }}><strong>Total Caja:</strong> {formatMonto(totalCaja)}</p>
                    <p style={{ margin: 0 }}><strong>Total General:</strong> {formatMonto(totalGeneral)}</p>
                  </div>

                  {arqueoFormError && <p className="alert alert-error" style={{ marginTop: '16px' }}>{arqueoFormError}</p>}

                  <div className="modal-footer">
                    <button type="button" className="btn-sm btn-cancel" onClick={closeArqueoModal}>Cancelar</button>
                    <button type="submit" className="btn-primary btn-inline" disabled={arqueoSaving}>
                      {arqueoSaving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p style={{ fontSize: '16px' }}>Arqueo guardado correctamente.</p>
                  <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                    <p style={{ margin: 0 }}><strong>Total Arqueo:</strong> {formatMonto(arqueoResultado.totalArqueo)}</p>
                    <p style={{ margin: 0 }}><strong>Saldo Fondo Fijo:</strong> {formatMonto(arqueoResultado.saldoFondoFijo)}</p>
                    <p style={{ margin: 0 }}>
                      <strong>Diferencia:</strong>{' '}
                      <span style={{ color: Number(arqueoResultado.diferencia) !== 0 ? 'var(--danger, #d33)' : undefined }}>
                        {formatMonto(arqueoResultado.diferencia)}
                      </span>
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-primary btn-inline" onClick={closeArqueoModal}>Cerrar</button>
                  </div>
                </div>
              )}
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

export default CajaChica;
