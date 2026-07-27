import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getPrestamosArticulos, createPrestamoArticulo, updatePrestamoArticulo,
  devolverPrestamoArticulo, deletePrestamoArticulo,
} from '../api/prestamos-articulos';
import { searchAfiliados } from '../api/afiliados';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';
import { formatFecha } from '../utils/fecha';

const FORM_VACIO = {
  idAfiliado: '', fechaPrestamo: '', fechaDesde: '', fechaHasta: '',
  articulo: '', observaciones: '',
};

export default function PrestamosArticulos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('Activo');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');

  // Autocomplete afiliado
  const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [afiliadoSeleccionado, setAfiliadoSeleccionado] = useState(null);
  const timeoutRef = useRef(null);

  const cargar = async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await getPrestamosArticulos(filtros);
      setPrestamos(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar({ estado: 'Activo' }); }, []);

  const aplicarFiltros = () => {
    cargar({
      estado: filtroEstado || undefined,
      fechaDesde: filtroFechaDesde || undefined,
      fechaHasta: filtroFechaHasta || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFiltroEstado('Activo');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    cargar({ estado: 'Activo' });
  };

  const onBusquedaAfiliado = (valor) => {
    setBusquedaAfiliado(valor);
    setAfiliadoSeleccionado(null);
    setForm(f => ({ ...f, idAfiliado: '' }));
    clearTimeout(timeoutRef.current);
    if (valor.length < 2) { setSugerencias([]); return; }
    timeoutRef.current = setTimeout(async () => {
      const res = await searchAfiliados(valor);
      setSugerencias(res.data.data);
    }, 300);
  };

  const seleccionarAfiliado = (a) => {
    setAfiliadoSeleccionado(a);
    setForm(f => ({ ...f, idAfiliado: a.Id }));
    setBusquedaAfiliado(`${a.PrimerNombre} ${a.PrimerApellido} — ${a.Documento}${a.NroFuncionario ? ' · Func. ' + a.NroFuncionario : ''}`);
    setSugerencias([]);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setBusquedaAfiliado('');
    setAfiliadoSeleccionado(null);
    setSugerencias([]);
    setError('');
    setModalOpen(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      idAfiliado: p.IdAfiliado,
      fechaPrestamo: p.FechaPrestamo?.substring(0, 10) || '',
      fechaDesde: p.FechaDesde?.substring(0, 10) || '',
      fechaHasta: p.FechaHasta?.substring(0, 10) || '',
      articulo: p.Articulo || '',
      observaciones: p.Observaciones || '',
    });
    setBusquedaAfiliado(`${p.PrimerNombre} ${p.PrimerApellido} — ${p.Documento}${p.NroFuncionario ? ' · Func. ' + p.NroFuncionario : ''}`);
    setAfiliadoSeleccionado({ Id: p.IdAfiliado });
    setSugerencias([]);
    setError('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.idAfiliado) { setError('Seleccioná un afiliado'); return; }
    if (!form.fechaPrestamo) { setError('La fecha de préstamo es obligatoria'); return; }
    if (!form.fechaDesde) { setError('La fecha desde es obligatoria'); return; }
    if (!form.fechaHasta) { setError('La fecha hasta es obligatoria'); return; }
    if (!form.articulo.trim()) { setError('El artículo es obligatorio'); return; }
    try {
      if (editando) {
        await updatePrestamoArticulo(editando.Id, form);
      } else {
        await createPrestamoArticulo(form);
      }
      setModalOpen(false);
      cargar({ estado: filtroEstado || undefined, fechaDesde: filtroFechaDesde || undefined, fechaHasta: filtroFechaHasta || undefined });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const devolver = async (p) => {
    if (!(await confirmDialog(`¿Registrar la devolución del artículo de ${p.PrimerNombre} ${p.PrimerApellido}?`))) return;
    try {
      await devolverPrestamoArticulo(p.Id);
      cargar({ estado: filtroEstado || undefined, fechaDesde: filtroFechaDesde || undefined, fechaHasta: filtroFechaHasta || undefined });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar la devolución');
    }
  };

  const eliminar = async (p) => {
    if (!(await confirmDialog(`¿Eliminar este préstamo de artículo?`))) return;
    try {
      await deletePrestamoArticulo(p.Id);
      cargar({ estado: filtroEstado || undefined, fechaDesde: filtroFechaDesde || undefined, fechaHasta: filtroFechaHasta || undefined });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const abrirComprobante = (p) => {
    const token = localStorage.getItem('apmu_token');
    window.open(`${import.meta.env.VITE_API_URL || ''}/prestamos-articulos/${p.Id}/pdf?token=${token}`, '_blank');
  };

  const exportarExcel = () => {
    const filas = prestamos.map(p => ({
      'Fecha préstamo': p.FechaPrestamo?.substring(0, 10) || '',
      'Desde': p.FechaDesde?.substring(0, 10) || '',
      'Hasta': p.FechaHasta?.substring(0, 10) || '',
      'Nº Func.': p.NroFuncionario || '',
      Nombre: `${p.PrimerNombre} ${p.PrimerApellido}`,
      CI: p.Documento,
      'Teléfono': p.Celular || p.Telefono || '',
      'Artículo': p.Articulo,
      Estado: p.Estado,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Prestamos articulos');
    XLSX.writeFile(libro, 'prestamos_articulos.xlsx');
  };

  const imprimir = () => window.print();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Préstamo de artículos</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nuevo préstamo</button>
      </div>

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
        <div className="form-group" style={{ margin: 0 }}>
          <label>Estado</label>
          <select className="form-control" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Devuelto">Devuelto</option>
          </select>
        </div>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
        <button className="btn-sm" onClick={exportarExcel}>Exportar Excel</button>
        <button className="btn-sm" onClick={imprimir}>Imprimir</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table className="tabla print-area">
          <thead>
            <tr>
              <th>Fecha préstamo</th>
              <th>Período</th>
              <th>Nº Func.</th>
              <th>Nombre</th>
              <th>CI</th>
              <th>Teléfono</th>
              <th>Artículo</th>
              <th>Estado</th>
              <th className="no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.length === 0 ? (
              <tr><td colSpan={9}>No hay préstamos de artículos</td></tr>
            ) : prestamos.map(p => (
              <tr key={p.Id}>
                <td>{formatFecha(p.FechaPrestamo)}</td>
                <td>{formatFecha(p.FechaDesde)} — {formatFecha(p.FechaHasta)}</td>
                <td>{p.NroFuncionario || '—'}</td>
                <td>{p.PrimerNombre} {p.PrimerApellido}</td>
                <td>{p.Documento}</td>
                <td>{p.Celular || p.Telefono || '—'}</td>
                <td>{p.Articulo}</td>
                <td>{p.Estado}</td>
                <td className="no-print">
                  <div className="td-actions">
                    <button className="btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                    {p.Estado === 'Activo' && (
                      <button className="btn-sm" onClick={() => devolver(p)}>Devolver</button>
                    )}
                    <button className="btn-sm" onClick={() => abrirComprobante(p)}>Comprobante</button>
                    <button className="btn-sm danger" onClick={() => eliminar(p)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar préstamo de artículo' : 'Nuevo préstamo de artículo'}>

        <div className="form-group" style={{ position: 'relative' }}>
          <label>Afiliado *</label>
          <input className="form-control"
            placeholder="Buscá por nombre o documento..."
            value={busquedaAfiliado}
            onChange={e => onBusquedaAfiliado(e.target.value)}
            autoFocus />
          {sugerencias.length > 0 && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: 6,
              marginTop: 4, maxHeight: 200, overflowY: 'auto'
            }}>
              {sugerencias.map(a => (
                <div key={a.Id} onClick={() => seleccionarAfiliado(a)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <strong>{a.PrimerNombre} {a.PrimerApellido}</strong>
                  <span style={{ marginLeft: 8, color: 'var(--text)', fontSize: 13 }}>
                    {a.Documento} {a.NroFuncionario ? `· Func. ${a.NroFuncionario}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Fecha de préstamo *</label>
            <input type="date" className="form-control" value={form.fechaPrestamo}
              onChange={e => setForm(f => ({ ...f, fechaPrestamo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Desde *</label>
            <input type="date" className="form-control" value={form.fechaDesde}
              onChange={e => setForm(f => ({ ...f, fechaDesde: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Hasta *</label>
            <input type="date" className="form-control" value={form.fechaHasta}
              onChange={e => setForm(f => ({ ...f, fechaHasta: e.target.value }))} />
          </div>
          <div className="form-group full">
            <label>Artículo *</label>
            <textarea className="form-control" rows={2} value={form.articulo}
              onChange={e => setForm(f => ({ ...f, articulo: e.target.value }))} />
          </div>
          <div className="form-group full">
            <label>Observaciones</label>
            <textarea className="form-control" rows={2} value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>
        </div>

        {error && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
        <div className="modal-actions">
          <button className="btn-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn-primary btn-inline" onClick={guardar}>Guardar</button>
        </div>
      </Modal>
    </div>
  );
}
