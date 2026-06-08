import { useState, useEffect, useRef } from 'react';
import { getCuentaCorriente, createCargo, updateCargo, cobrarCargo, deleteCargo } from '../api/cuentacorriente';
import { getAfiliados } from '../api/afiliados';
import { getRubros } from '../api/rubros';
import Modal from '../components/Modal';
import { useSearchParams } from 'react-router-dom';

const LIMIT = 20;

const EMPTY_CARGO = {
  IdAfiliado: '', Rubro: '', Importe: '',
  Mes: '', Anio: '',
  FechaVto: '', FechaCargo: '', Usuario: '',
};

const EMPTY_COBRO = { NroRecibo: '', FechaPago: '', FormaPago: '' };

const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Débito', 'Crédito'];

const estadoBadge = (row) => {
  if (row.NroRecibo) return <span className="badge badge-ok">Pagado</span>;
  if (row.FechaVto && new Date(row.FechaVto) < new Date()) return <span className="badge badge-warn">Vencido</span>;
  return <span className="badge badge-pending">Pendiente</span>;
};

function CuentaCorriente() {
  const [data, setData]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [pageError, setPageError] = useState('');

  const [filtroAfiliado, setFiltroAfiliado] = useState('');
  const [filtroMes, setFiltroMes]           = useState('');
  const [filtroAnio, setFiltroAnio]         = useState('');
  const [filtroEstado, setFiltroEstado]     = useState('');

  const [afiliados, setAfiliados] = useState([]);
  const [rubros, setRubros]       = useState([]);

  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY_CARGO);
  const [formCobro, setFormCobro] = useState(EMPTY_COBRO);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);
  const [searchParams] = useSearchParams();

  const searchTimer = useRef(null);
  const totalPages  = Math.ceil(total / LIMIT);

  const buildAniomes = (anio, mes) => {
    if (!anio || !mes) return null;
    return parseInt(`${anio}${String(mes).padStart(2, '0')}`);
  };

const load = async (p = 1, idAfiliadoOverride) => {
  setLoading(true);
  setPageError('');
  try {
    const aniomes = buildAniomes(filtroAnio, filtroMes);
    const idAfiliado = idAfiliadoOverride ?? (filtroAfiliado || null);
    const res = await getCuentaCorriente({
      page: p, limit: LIMIT,
      ...(idAfiliado && { idAfiliado }),
      ...(aniomes    && { aniomes }),
      ...(filtroEstado && { estado: filtroEstado }),
    });
    setData(res.data.data || []);
    setTotal(res.data.total || 0);
  } catch {
    setPageError('Error al cargar movimientos.');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const idFromUrl = searchParams.get('idAfiliado');
  if (idFromUrl) {
    setFiltroAfiliado(idFromUrl);
    load(1, idFromUrl);
  } else {
    load(1);
  }
  getRubros().then(r => setRubros(r.data.data || []));
  getAfiliados(1, 200, '').then(r => setAfiliados(r.data.data || []));
}, []);

  const handleFiltroAfiliado = (val) => {
    setFiltroAfiliado(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1); }, 350);
  };

  const aplicarFiltros = () => { setPage(1); load(1); };

  const openCreate = () => {
    setForm(EMPTY_CARGO);
    setFormError('');
    setModal({ mode: 'create' });
    getAfiliados(1, 200, '').then(r => setAfiliados(r.data.data || []));
  };

  const openEdit = (row) => {
    const anio = row.Aniomes ? String(row.Aniomes).substring(0, 4) : '';
    const mes  = row.Aniomes ? String(row.Aniomes).substring(4, 6) : '';
    setForm({
      IdAfiliado: row.IdAfiliado || '',
      Rubro:      row.Rubro      || '',
      Importe:    row.Importe    ?? '',
      Anio:       anio,
      Mes:        mes,
      FechaVto:   row.FechaVto   ? row.FechaVto.substring(0, 10) : '',
      FechaCargo: row.FechaCargo ? row.FechaCargo.substring(0, 10) : '',
      Usuario:    row.Usuario    || '',
    });
    setFormError('');
    setModal({ mode: 'edit', record: row });
    getAfiliados(1, 200, '').then(r => setAfiliados(r.data.data || []));
  };

  const openCobrar = (row) => {
    setFormCobro({ NroRecibo: '', FechaPago: '', FormaPago: '' });
    setFormError('');
    setModal({ mode: 'cobrar', record: row });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleChangeCobro = (e) => {
    const { name, value } = e.target;
    setFormCobro(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (parseFloat(form.Importe) <= 0) {
    setFormError('El importe debe ser mayor a 0.');
    setSaving(false);
    return;
    }
    setSaving(true);
    try {
      const aniomes = buildAniomes(form.Anio, form.Mes);
      if (!aniomes) { setFormError('Mes y año son requeridos.'); setSaving(false); return; }
      const payload = {
        IdAfiliado: parseInt(form.IdAfiliado),
        Rubro:      parseInt(form.Rubro),
        Importe:    form.Importe !== '' ? parseFloat(form.Importe) : null,
        Aniomes:    aniomes,
        Mes:        form.Mes && form.Anio ? `${form.Anio}-${String(form.Mes).padStart(2, '0')}-01` : null,
        FechaVto:   form.FechaVto   || null,
        FechaCargo: form.FechaCargo || null,
        Usuario:    form.Usuario    || null,
      };
      if (modal.mode === 'create') {
        await createCargo(payload);
      } else {
        await updateCargo(modal.record.Id, payload);
      }
      closeModal();
      load(page);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCobrar = async (e) => {
    e.preventDefault();
    setFormError('');
    if (parseInt(formCobro.NroRecibo) <= 0) {
    setFormError('El número de recibo debe ser mayor a 0.');
    setSaving(false);
    return;
    }
    if (new Date(formCobro.FechaPago) > new Date()) {
    setFormError('La fecha de pago no puede ser futura.');
    setSaving(false);
    return;
    }
    setSaving(true);
    try {
      await cobrarCargo(modal.record.Id, {
        NroRecibo: parseInt(formCobro.NroRecibo),
        FechaPago: formCobro.FechaPago,
        FormaPago: formCobro.FormaPago,
      });
      closeModal();
      load(page);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al registrar pago.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cargo? Solo se pueden eliminar cargos pendientes.')) return;
    try {
      await deleteCargo(id);
      load(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const meses = [
    { v: '01', l: 'Enero' }, { v: '02', l: 'Febrero' }, { v: '03', l: 'Marzo' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Mayo' },    { v: '06', l: 'Junio' },
    { v: '07', l: 'Julio' }, { v: '08', l: 'Agosto' },  { v: '09', l: 'Setiembre' },
    { v: '10', l: 'Octubre' },{ v: '11', l: 'Noviembre' },{ v: '12', l: 'Diciembre' },
  ];

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 10 }, (_, i) => anioActual - i);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Cuenta corriente</h2>
        <button className="btn-primary btn-inline" onClick={openCreate}>+ Nuevo cargo</button>
      </div>

        <div className="form-group" style={{ margin: 0 }}>
        <label>Afiliado</label>
        <select value={filtroAfiliado} onChange={e => setFiltroAfiliado(e.target.value)}>
            <option value="">Todos</option>
            {afiliados.map(a => (
            <option key={a.Id} value={a.Id}>
                {a.PrimerNombre} {a.PrimerApellido} — {a.Documento}
            </option>
            ))}
        </select>
        </div>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Mes</label>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            <option value="">Todos</option>
            {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Año</label>
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
            <option value="">Todos</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Filtrar</button>
      </div>

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Afiliado</th>
              <th>Rubro</th>
              <th>Importe</th>
              <th>Período</th>
              <th>Vto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="td-empty">Sin movimientos.</td></tr>
            ) : data.map(row => (
              <tr key={row.Id}>
                <td className="td-muted">{row.Id}</td>
                <td>
                  <div>{row.NombreAfiliado || '—'}</div>
                  <div className="td-muted" style={{ fontSize: '12px' }}>{row.Documento}</div>
                </td>
                <td>{row.RubDsc?.trim() || row.Rubro}</td>
                <td>{row.Importe != null ? `$ ${Number(row.Importe).toFixed(2)}` : '—'}</td>
               <td>{row.Aniomes ? (() => {
                const s = String(row.Aniomes);
                const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
                const mes = parseInt(s.substring(4, 6)) - 1;
                const anio = s.substring(0, 4);
                return `${meses[mes]}a ${anio}`;
                })() : '—'}</td>
                <td>{row.FechaVto ? row.FechaVto.substring(0, 10) : '—'}</td>
                <td>{estadoBadge(row)}</td>
                <td>
                  <div className="td-actions">
                    {!row.NroRecibo && (
                      <>
                        <button className="btn-sm" onClick={() => openCobrar(row)}>Cobrar</button>
                        <button className="btn-sm" onClick={() => openEdit(row)}>Editar</button>
                        <button className="btn-sm danger" onClick={() => handleDelete(row.Id)}>Eliminar</button>
                      </>
                    )}
                    {row.NroRecibo && (
                      <span className="td-muted" style={{ fontSize: '12px' }}>
                        Recibo #{row.NroRecibo}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">{total} movimientos — Página {page} de {totalPages}</span>
          <button className="page-btn" onClick={() => { setPage(p => p - 1); load(page - 1); }} disabled={page === 1}>← Anterior</button>
          <button className="page-btn" onClick={() => { setPage(p => p + 1); load(page + 1); }} disabled={page === totalPages}>Siguiente →</button>
        </div>
      )}

      {/* Modal cargo */}
      {modal && modal.mode !== 'cobrar' && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo cargo' : 'Editar cargo'}
          onClose={closeModal}
        >
          <form onSubmit={handleSave}>
            <div className="form-grid">

              <div className="form-group full">
                <label htmlFor="IdAfiliado">Afiliado *</label>
                <select id="IdAfiliado" name="IdAfiliado" value={form.IdAfiliado} onChange={handleChange} required>
                  <option value="">— Seleccioná un afiliado —</option>
                  {afiliados.map(a => (
                    <option key={a.Id} value={a.Id}>
                      {a.PrimerNombre} {a.PrimerApellido} — {a.Documento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="Rubro">Rubro *</label>
                <select id="Rubro" name="Rubro" value={form.Rubro} onChange={handleChange} required>
                  <option value="">— Seleccioná —</option>
                  {rubros.map(r => (
                    <option key={r.RubCod} value={r.RubCod}>{r.RubDsc?.trim()}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="Importe">Importe</label>
                <input id="Importe" name="Importe" type="number" step="0.01" min="0"
                  value={form.Importe} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="Mes">Mes *</label>
                <select id="Mes" name="Mes" value={form.Mes} onChange={handleChange} required>
                  <option value="">— Mes —</option>
                  {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="Anio">Año *</label>
                <select id="Anio" name="Anio" value={form.Anio} onChange={handleChange} required>
                  <option value="">— Año —</option>
                  {anios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="FechaVto">Fecha de vencimiento</label>
                <input type="date" id="FechaVto" name="FechaVto"
                  value={form.FechaVto} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="FechaCargo">Fecha de cargo</label>
                <input type="date" id="FechaCargo" name="FechaCargo"
                  value={form.FechaCargo} onChange={handleChange} />
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

      {/* Modal cobrar */}
      {modal && modal.mode === 'cobrar' && (
        <Modal title="Registrar pago" onClose={closeModal}>
          <form onSubmit={handleCobrar}>
            <div className="form-grid">

              <div className="form-group full" style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{modal.record.NombreAfiliado}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {modal.record.RubDsc?.trim()} — $ {Number(modal.record.Importe).toFixed(2)} — Período {modal.record.Aniomes}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="NroRecibo">Nº de recibo *</label>
                <input id="NroRecibo" name="NroRecibo" type="number"
                  value={formCobro.NroRecibo} onChange={handleChangeCobro} required />
              </div>

              <div className="form-group">
                <label htmlFor="FechaPago">Fecha de pago *</label>
                <input type="date" id="FechaPago" name="FechaPago"
                  value={formCobro.FechaPago} onChange={handleChangeCobro} required />
              </div>

              <div className="form-group full">
                <label htmlFor="FormaPago">Forma de pago *</label>
                <select id="FormaPago" name="FormaPago"
                  value={formCobro.FormaPago} onChange={handleChangeCobro} required>
                  <option value="">— Seleccioná —</option>
                  {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

            </div>

            {formError && <p className="alert alert-error" style={{ marginTop: '16px' }}>{formError}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-primary btn-inline" disabled={saving}>
                {saving ? 'Guardando…' : 'Confirmar pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default CuentaCorriente;