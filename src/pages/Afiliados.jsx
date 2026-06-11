import { useState, useEffect, useRef } from 'react';
import { getAfiliados, createAfiliado, updateAfiliado, deleteAfiliado } from '../api/afiliados';
import { getCuentaCorriente, createCargo } from '../api/cuentacorriente';
import { getRubros } from '../api/rubros';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { validate_ci, validate_mail, validate_celular } from '../utils/validaciones';

const LIMIT = 20;

const EMPTY = {
  Documento: '', PrimerNombre: '', SegundoNombre: '',
  PrimerApellido: '', SegundoApellido: '',
  FechaNacimiento: '', FechaFallecimiento: '',
  Sexo: '', EstadoCivil: '',
  Mail: '', Celular: '', Telefono: '', TelefonoTrabajo: '',
  Domicilio: '', Ciudad: '', Localidad: '',
  CodigoPostal: '', Departamento: '', Observacion: '',
};

const toDateInput = (val) => (val ? val.substring(0, 10) : '');

const nombreCompleto = (a) =>
  [a.PrimerNombre, a.SegundoNombre, a.PrimerApellido, a.SegundoApellido]
    .filter(Boolean).join(' ');

function Afiliados() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [movimientos, setMovimientos]   = useState([]);
  const [rubros, setRubros]             = useState([]);
  const [loadingMov, setLoadingMov]     = useState(false);
  const [modalCargo, setModalCargo]     = useState(false);
  const [formCargo, setFormCargo]       = useState({ Rubro: '', Importe: '', Mes: '', Anio: '', FechaVto: '' });
  const [errorCargo, setErrorCargo]     = useState('');
  const [savingCargo, setSavingCargo]   = useState(false);
  const timerRef = useRef(null);
  const totalPages = Math.ceil(total / LIMIT);

  const load = async (p, s) => {
    setLoading(true);
    setPageError('');
    try {
      const res = await getAfiliados(p, LIMIT, s);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setPageError('Error al cargar afiliados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, ''); }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPage(1);
      load(1, val);
    }, 350);
  };

  const handlePageChange = (p) => {
    setPage(p);
    load(p, search);
  };

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal({ mode: 'create', record: null });
  };

const openEdit = (record) => {
  setForm({
    Documento: record.Documento || '',
    PrimerNombre: record.PrimerNombre || '',
    SegundoNombre: record.SegundoNombre || '',
    PrimerApellido: record.PrimerApellido || '',
    SegundoApellido: record.SegundoApellido || '',
    FechaNacimiento: toDateInput(record.FechaNacimiento),
    FechaFallecimiento: toDateInput(record.FechaFallecimiento),
    Sexo: record.Sexo?.trim() || '',
    EstadoCivil: record.EstadoCivil?.trim() || '',
    Mail: record.Mail || '',
    Celular: record.Celular?.trim() || '',
    Telefono: record.Telefono?.trim() || '',
    TelefonoTrabajo: record.TelefonoTrabajo?.trim() || '',
    Domicilio: record.Domicilio || '',
    Ciudad: record.Ciudad || '',
    Localidad: record.Localidad || '',
    CodigoPostal: record.CodigoPostal?.trim() || '',
    Departamento: record.Departamento?.trim() || '',
    Observacion: record.Observacion || '',
  });
  setFormError('');
  setModal({ mode: 'edit', record });
  loadMovimientos(record.Id);
  getRubros().then(r => setRubros(r.data.data || []));
};
  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.FechaNacimiento) {
      setFormError('La fecha de nacimiento es obligatoria.');
      return;
    }
    if (!form.Sexo) {
      setFormError('El sexo es obligatorio.');
      return;
    }
    if (form.Documento && !validate_ci(form.Documento)) {
      setFormError('La cédula ingresada no es válida.');
      return;
    }
    if (form.Mail && !validate_mail(form.Mail)) {
      setFormError('El mail ingresado no es válido.');
      return;
    }
    if (form.Celular && !validate_celular(form.Celular)) {
      setFormError('El celular debe tener formato 09XXXXXXX (9 dígitos).');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createAfiliado(form);
      } else {
        await updateAfiliado(modal.record.Id, form);
      }
      closeModal();
      load(page, search);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleBaja = async (id) => {
    if (!confirm('¿Dar de baja este afiliado?')) return;
    try {
      await deleteAfiliado(id);
      load(page, search);
    } catch {
      alert('Error al dar de baja.');
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

const loadMovimientos = async (idAfiliado) => {
  setLoadingMov(true);
  try {
    const res = await getCuentaCorriente({ idAfiliado, limit: 10, page: 1 });
    setMovimientos(res.data.data || []);
  } catch {
    setMovimientos([]);
  } finally {
    setLoadingMov(false);
  }
};

const handleSaveCargo = async (e) => {
  e.preventDefault();
  setErrorCargo('');
  if (!formCargo.Rubro) {
    setErrorCargo('Debés seleccionar un rubro.');
    setSavingCargo(false);
    return;
  }
  if (formCargo.Importe !== '' && parseFloat(formCargo.Importe) <= 0) {
    setErrorCargo('El importe debe ser mayor a 0.');
    setSavingCargo(false);
    return;
  }
  setSavingCargo(true);
  try {
    const { Anio, Mes } = formCargo;
    if (!Anio || !Mes) { setErrorCargo('Mes y año son requeridos.'); setSavingCargo(false); return; }
    const aniomes = parseInt(`${Anio}${String(Mes).padStart(2, '0')}`);
    await createCargo({
      IdAfiliado: modal.record.Id,
      Rubro:      parseInt(formCargo.Rubro),
      Importe:    formCargo.Importe !== '' ? parseFloat(formCargo.Importe) : null,
      Aniomes:    aniomes,
      Mes:        `${Anio}-${String(Mes).padStart(2, '0')}-01`,
      FechaVto:   formCargo.FechaVto || null,
    });
    setModalCargo(false);
    setFormCargo({ Rubro: '', Importe: '', Mes: '', Anio: '', FechaVto: '' });
    loadMovimientos(modal.record.Id);
  } catch (err) {
    setErrorCargo(err.response?.data?.message || 'Error al guardar.');
  } finally {
    setSavingCargo(false);
  }
};

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Afiliados</h2>
        <button className="btn-primary btn-inline" onClick={openCreate}>+ Nuevo afiliado</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por nombre, apellido o documento…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {pageError && <p className="alert alert-error">{pageError}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Documento</th>
              <th>Apellido y Nombre</th>
              <th>Celular</th>
              <th>Mail</th>
              <th>Ciudad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="td-empty">Cargando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="td-empty">Sin resultados.</td></tr>
            ) : data.map((a) => (
              <tr key={a.Id}>
                <td className="td-muted">{a.Id}</td>
                <td>{a.Documento}</td>
                <td>{nombreCompleto(a)}</td>
                <td>{a.Celular?.trim() || '—'}</td>
                <td>{a.Mail || '—'}</td>
                <td>{a.Ciudad || '—'}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => openEdit(a)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => handleBaja(a.Id)}>Dar de baja</button>
                    <button className="btn-sm" onClick={() => navigate(`/dashboard/cuenta-corriente?idAfiliado=${a.Id}`)}>
                      Aportes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">{total} afiliados — Página {page} de {totalPages}</span>
          <button className="page-btn" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>← Anterior</button>
          <button className="page-btn" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Siguiente →</button>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo afiliado' : 'Editar afiliado'}
          onClose={closeModal}
          size="lg"
        >
          <form onSubmit={handleSave}>
            <div className="form-grid">

              <p className="section-title">Datos personales</p>

              <div className="form-group">
                <label htmlFor="Documento">Documento *</label>
                <input id="Documento" name="Documento" value={form.Documento} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="Sexo">Sexo *</label>
                <select id="Sexo" name="Sexo" value={form.Sexo} onChange={handleChange} required>
                  <option value="">—</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="NB">No binario</option>
                  <option value="O">Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="PrimerNombre">Primer nombre *</label>
                <input id="PrimerNombre" name="PrimerNombre" value={form.PrimerNombre} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="SegundoNombre">Segundo nombre</label>
                <input id="SegundoNombre" name="SegundoNombre" value={form.SegundoNombre} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="PrimerApellido">Primer apellido *</label>
                <input id="PrimerApellido" name="PrimerApellido" value={form.PrimerApellido} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="SegundoApellido">Segundo apellido</label>
                <input id="SegundoApellido" name="SegundoApellido" value={form.SegundoApellido} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="FechaNacimiento">Fecha de nacimiento *</label>
                <input type="date" id="FechaNacimiento" name="FechaNacimiento" value={form.FechaNacimiento} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="EstadoCivil">Estado civil</label>
                <select id="EstadoCivil" name="EstadoCivil" value={form.EstadoCivil} onChange={handleChange}>
                  <option value="">—</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                  <option value="Separado">Separado/a</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Union de hecho">Unión de hecho</option>
                  <option value="Viudo">Viudo/a</option>
                </select>
              </div>

              {modal.mode === 'edit' && (
                <div className="form-group">
                  <label htmlFor="FechaFallecimiento">Fecha de fallecimiento</label>
                  <input type="date" id="FechaFallecimiento" name="FechaFallecimiento" value={form.FechaFallecimiento} onChange={handleChange} />
                </div>
              )}

              <p className="section-title">Contacto</p>

              <div className="form-group">
                <label htmlFor="Mail">Mail</label>
                <input type="email" id="Mail" name="Mail" value={form.Mail} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="Celular">Celular</label>
                <input id="Celular" name="Celular" value={form.Celular} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="Telefono">Teléfono</label>
                <input id="Telefono" name="Telefono" value={form.Telefono} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="TelefonoTrabajo">Teléfono trabajo</label>
                <input id="TelefonoTrabajo" name="TelefonoTrabajo" value={form.TelefonoTrabajo} onChange={handleChange} />
              </div>

              <p className="section-title">Domicilio</p>

              <div className="form-group full">
                <label htmlFor="Domicilio">Domicilio</label>
                <input id="Domicilio" name="Domicilio" value={form.Domicilio} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="Ciudad">Ciudad</label>
                <input id="Ciudad" name="Ciudad" value={form.Ciudad} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="Localidad">Localidad</label>
                <input id="Localidad" name="Localidad" value={form.Localidad} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="CodigoPostal">Código postal</label>
                <input id="CodigoPostal" name="CodigoPostal" value={form.CodigoPostal} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="Departamento">Departamento</label>
                <select id="Departamento" name="Departamento" value={form.Departamento} onChange={handleChange}>
                  <option value="">—</option>
                  <option>Artigas</option>
                  <option>Canelones</option>
                  <option>Cerro Largo</option>
                  <option>Colonia</option>
                  <option>Durazno</option>
                  <option>Flores</option>
                  <option>Florida</option>
                  <option>Lavalleja</option>
                  <option>Maldonado</option>
                  <option>Montevideo</option>
                  <option>Paysandú</option>
                  <option>Río Negro</option>
                  <option>Rivera</option>
                  <option>Rocha</option>
                  <option>Salto</option>
                  <option>San José</option>
                  <option>Soriano</option>
                  <option>Tacuarembó</option>
                  <option>Treinta y Tres</option>
                </select>
              </div>

              <p className="section-title">Otros</p>

              <div className="form-group full">
                <label htmlFor="Observacion">Observación</label>
                <textarea id="Observacion" name="Observacion" value={form.Observacion} onChange={handleChange} rows={3} />
              </div>
              <p className="section-title">Aportes</p>

            <div className="form-group full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Últimos 10 movimientos
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-sm" onClick={() => {
                    setFormCargo({ Rubro: '', Importe: '', Mes: '', Anio: '', FechaVto: '' });
                    setErrorCargo('');
                    setModalCargo(true);
                  }}>+ Nuevo cargo</button>
                  <button type="button" className="btn-sm" onClick={() => {
                    closeModal();
                    navigate(`/dashboard/cuenta-corriente?idAfiliado=${modal.record.Id}`);
                  }}>Ver todos</button>
                </div>
              </div>

              {loadingMov ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Cargando…</p>
              ) : movimientos.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Sin movimientos.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Rubro</th>
                      <th>Importe</th>
                      <th>Período</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(m => {
                      const s = String(m.Aniomes);
                      const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
                      const periodo = m.Aniomes ? `${mesesNombres[parseInt(s.substring(4,6))-1]} ${s.substring(0,4)}` : '—';
                      return (
                        <tr key={m.Id}>
                          <td>{m.RubDsc?.trim() || m.Rubro}</td>
                          <td>{m.Importe != null ? `$ ${Number(m.Importe).toFixed(2)}` : '—'}</td>
                          <td>{periodo}</td>
                          <td>{m.NroRecibo ? <span className="badge badge-ok">Pagado</span> : <span className="badge badge-pending">Pendiente</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
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

{modalCargo && modal?.mode === 'edit' && (
  <Modal title="Nuevo cargo" onClose={() => setModalCargo(false)}>
    <form onSubmit={handleSaveCargo}>
      <div className="form-grid">

        <div className="form-group full" style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {modal.record.PrimerNombre} {modal.record.PrimerApellido}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Doc: {modal.record.Documento}
          </p>
        </div>

        <div className="form-group full">
          <label htmlFor="cc-Rubro">Rubro *</label>
          <select id="cc-Rubro" value={formCargo.Rubro}
            onChange={e => setFormCargo(f => ({ ...f, Rubro: e.target.value }))} required>
            <option value="">— Seleccioná —</option>
            {rubros.map(r => (
              <option key={r.RubCod} value={r.RubCod}>{r.RubDsc?.trim()}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cc-Importe">Importe</label>
          <input id="cc-Importe" type="number" step="0.01" min="0"
            value={formCargo.Importe}
            onChange={e => setFormCargo(f => ({ ...f, Importe: e.target.value }))} />
        </div>

        <div className="form-group">
          <label htmlFor="cc-FechaVto">Fecha de vencimiento</label>
          <input type="date" id="cc-FechaVto"
            value={formCargo.FechaVto}
            onChange={e => setFormCargo(f => ({ ...f, FechaVto: e.target.value }))} />
        </div>

        <div className="form-group">
          <label htmlFor="cc-Mes">Mes *</label>
          <select id="cc-Mes" value={formCargo.Mes}
            onChange={e => setFormCargo(f => ({ ...f, Mes: e.target.value }))} required>
            <option value="">— Mes —</option>
            {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cc-Anio">Año *</label>
          <select id="cc-Anio" value={formCargo.Anio}
            onChange={e => setFormCargo(f => ({ ...f, Anio: e.target.value }))} required>
            <option value="">— Año —</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

      </div>

      {errorCargo && <p className="alert alert-error" style={{ marginTop: '16px' }}>{errorCargo}</p>}

      <div className="modal-footer">
        <button type="button" className="btn-sm btn-cancel" onClick={() => setModalCargo(false)}>Cancelar</button>
        <button type="submit" className="btn-primary btn-inline" disabled={savingCargo}>
          {savingCargo ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  </Modal>
)}

    </div>
  )
}

export default Afiliados;
