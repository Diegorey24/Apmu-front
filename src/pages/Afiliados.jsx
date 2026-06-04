import { useState, useEffect, useRef } from 'react';
import { getAfiliados, createAfiliado, updateAfiliado, deleteAfiliado } from '../api/afiliados';
import Modal from '../components/Modal';

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
                <label htmlFor="Sexo">Sexo</label>
                <select id="Sexo" name="Sexo" value={form.Sexo} onChange={handleChange}>
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
                <label htmlFor="FechaNacimiento">Fecha de nacimiento</label>
                <input type="date" id="FechaNacimiento" name="FechaNacimiento" value={form.FechaNacimiento} onChange={handleChange} />
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

export default Afiliados;
