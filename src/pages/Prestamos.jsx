import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getPrestamos, searchPrestamos, getPrestamoById, createPrestamo, devolverLibro } from '../api/prestamos';
import { searchAfiliados } from '../api/afiliados';
import { getLibros } from '../api/libros';
import { getConfiguracion, updateConfiguracion } from '../api/configuracion';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';
import { formatFecha } from '../utils/fecha';

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros lista
  const [filtroEstado, setFiltroEstado] = useState('Activo');
  const [filtroAfiliado, setFiltroAfiliado] = useState('');

  // Buscador (Id, documento, Nº funcionario, nombre/apellido)
  const [busqueda, setBusqueda] = useState('');
  const [modoBusqueda, setModoBusqueda] = useState(false);
  const timeoutBusqueda = useRef(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  // Exportar/imprimir (todos los registros, no solo la página actual)
  const [printData, setPrintData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Modal detalle
  const [detalle, setDetalle] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Modal crear
  const [modalCrearOpen, setModalCrearOpen] = useState(false);

  // Autocomplete afiliado (crear)
  const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
  const [sugerenciasAfiliado, setSugerenciasAfiliado] = useState([]);
  const [afiliadoSeleccionado, setAfiliadoSeleccionado] = useState(null);
  const timeoutAfiliado = useRef(null);

  // Libros del préstamo nuevo
  const [busquedaLibro, setBusquedaLibro] = useState('');
  const [resultadosLibro, setResultadosLibro] = useState([]);
  const [lineas, setLineas] = useState([]); // [{ idLibro, nombreLibro, fechaVencimiento }]

  const [errorCrear, setErrorCrear] = useState('');

  // Configuración: precio préstamo libros de estudio
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [precioEstudio, setPrecioEstudio] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [errorConfig, setErrorConfig] = useState('');

  const cargar = async (filtros = {}, p = 1) => {
    try {
      const res = await getPrestamos({ ...filtros, page: p, limit: LIMIT });
      setPrestamos(res.data.data);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const estadoUrl = searchParams.get('estado');
    if (estadoUrl) {
      setFiltroEstado(estadoUrl);
      cargar({ estado: estadoUrl }, 1);
    } else {
      cargar({ estado: 'Activo' }, 1);
    }
  }, []);

  const buscar = async (termino) => {
    const q = (termino ?? busqueda).trim();
    if (!q) {
      setModoBusqueda(false);
      setPage(1);
      cargar({ estado: filtroEstado || undefined, idAfiliado: filtroAfiliado || undefined }, 1);
      return;
    }
    setLoading(true);
    setModoBusqueda(true);
    setPage(1);
    try {
      const res = await searchPrestamos(q);
      const filas = res.data.data || [];
      setPrestamos(filas);
      setTotal(filas.length);
    } finally {
      setLoading(false);
    }
  };

  // Refresca la lista respetando el modo actual (búsqueda o filtros)
  const recargar = () => modoBusqueda
    ? buscar()
    : cargar({ estado: filtroEstado || undefined, idAfiliado: filtroAfiliado || undefined }, page);

  const onBusquedaChange = (valor) => {
    setBusqueda(valor);
    clearTimeout(timeoutBusqueda.current);
    timeoutBusqueda.current = setTimeout(() => buscar(valor), 400);
  };

  const limpiarBusqueda = () => {
    clearTimeout(timeoutBusqueda.current);
    setBusqueda('');
    buscar('');
  };

  const aplicarFiltros = () => {
    clearTimeout(timeoutBusqueda.current);
    if (busqueda.trim()) { buscar(); return; }
    setModoBusqueda(false);
    setPage(1);
    cargar({ estado: filtroEstado || undefined, idAfiliado: filtroAfiliado || undefined }, 1);
  };

  const limpiarFiltros = () => {
    clearTimeout(timeoutBusqueda.current);
    setFiltroEstado('Activo');
    setFiltroAfiliado('');
    setBusqueda('');
    setModoBusqueda(false);
    setPage(1);
    cargar({ estado: 'Activo' }, 1);
  };

  useEffect(() => {
    if (!printData) return;
    const timer = setTimeout(() => window.print(), 100);
    return () => clearTimeout(timer);
  }, [printData]);

  useEffect(() => {
    const onAfterPrint = () => setPrintData(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  // En modo búsqueda el endpoint ya devuelve todos los resultados, no hay paginación
  const cargarTodos = () => modoBusqueda
    ? searchPrestamos(busqueda.trim())
    : getPrestamos({
      estado: filtroEstado || undefined,
      idAfiliado: filtroAfiliado || undefined,
      page: 1,
      limit: 99999,
    });

  const exportarExcel = async () => {
    setExporting(true);
    try {
      const res = await cargarTodos();
      const filas = (res.data.data || []).map(p => ({
        '#': p.Id,
        Afiliado: p.NombreAfiliado,
        Documento: p.Documento,
        'Nº Func.': p.NroFuncionario || '',
        Fecha: p.FechaPrestamo ? formatFecha(p.FechaPrestamo) : '',
        Libros: p.CantLibros,
        Devueltos: p.CantDevueltos,
        Estado: p.Estado,
      }));
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Préstamos');
      XLSX.writeFile(libro, 'prestamos_libros.xlsx');
    } catch {
      alert('Error al exportar.');
    } finally {
      setExporting(false);
    }
  };

  const imprimir = async () => {
    setPrinting(true);
    try {
      const res = await cargarTodos();
      setPrintData(res.data.data || []);
    } catch {
      alert('Error al preparar la impresión.');
    } finally {
      setPrinting(false);
    }
  };

  // Autocomplete afiliado
  const onBusquedaAfiliado = (valor) => {
    setBusquedaAfiliado(valor);
    setAfiliadoSeleccionado(null);
    clearTimeout(timeoutAfiliado.current);
    if (valor.length < 2) { setSugerenciasAfiliado([]); return; }
    timeoutAfiliado.current = setTimeout(async () => {
      const res = await searchAfiliados(valor);
      setSugerenciasAfiliado(res.data.data);
    }, 300);
  };

  const seleccionarAfiliado = (afiliado) => {
    setAfiliadoSeleccionado(afiliado);
    setBusquedaAfiliado(
      `${afiliado.PrimerNombre} ${afiliado.PrimerApellido}${afiliado.SegundoApellido ? ' ' + afiliado.SegundoApellido : ''} — ${afiliado.Documento}`
    );
    setSugerenciasAfiliado([]);
  };

  // Buscar libros para agregar
  const onBusquedaLibro = async (valor) => {
    setBusquedaLibro(valor);
    if (valor.length < 2) { setResultadosLibro([]); return; }
    const res = await getLibros({ busqueda: valor });
    // Solo libros con stock > 0 y no ya agregados
    const idsAgregados = lineas.map(l => l.idLibro);
    setResultadosLibro(
      res.data.data.filter(l => l.Stock > 0 && !l.FechaBaja && !idsAgregados.includes(l.Id))
    );
  };

  const agregarLibro = (libro) => {
    setLineas(prev => [...prev, {
      idLibro: libro.Id,
      nombreLibro: libro.Nombre,
      fechaVencimiento: '',
    }]);
    setBusquedaLibro('');
    setResultadosLibro([]);
  };

  const quitarLibro = (idLibro) => {
    setLineas(prev => prev.filter(l => l.idLibro !== idLibro));
  };

  const setFechaVencimiento = (idLibro, fecha) => {
    setLineas(prev => prev.map(l => l.idLibro === idLibro ? { ...l, fechaVencimiento: fecha } : l));
  };

  const abrirCrear = () => {
    setBusquedaAfiliado('');
    setSugerenciasAfiliado([]);
    setAfiliadoSeleccionado(null);
    setBusquedaLibro('');
    setResultadosLibro([]);
    setLineas([]);
    setErrorCrear('');
    setModalCrearOpen(true);
  };

  const guardarPrestamo = async () => {
    if (!afiliadoSeleccionado) { setErrorCrear('Seleccioná un afiliado'); return; }
    if (lineas.length === 0) { setErrorCrear('Agregá al menos un libro'); return; }
    try {
      await createPrestamo({
        idAfiliado: afiliadoSeleccionado.Id,
        lineas: lineas.map(l => ({
          idLibro: l.idLibro,
          fechaVencimiento: l.fechaVencimiento || null,
        })),
      });
      setModalCrearOpen(false);
      recargar();
    } catch (err) {
      setErrorCrear(err.response?.data?.message || 'Error al guardar');
    }
  };

  const abrirConfig = async () => {
    setErrorConfig('');
    try {
      const res = await getConfiguracion();
      const config = res.data.data.find(c => c.Clave === 'PrecioPrestamoEstudio');
      setPrecioEstudio(config?.Valor || '');
    } catch {
      setErrorConfig('Error al cargar la configuración');
    }
    setModalConfigOpen(true);
  };

  const guardarConfig = async () => {
    if (!precioEstudio || parseFloat(precioEstudio) <= 0) {
      setErrorConfig('El precio debe ser mayor a 0');
      return;
    }
    setSavingConfig(true);
    try {
      await updateConfiguracion('PrecioPrestamoEstudio', precioEstudio);
      setModalConfigOpen(false);
    } catch (err) {
      setErrorConfig(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingConfig(false);
    }
  };

  const abrirDetalle = async (id) => {
    const res = await getPrestamoById(id);
    setDetalle(res.data.data);
    setModalDetalleOpen(true);
  };

  const handleDevolver = async (idLinea) => {
    if (!(await confirmDialog('¿Registrar devolución de este libro?'))) return;
    try {
      await devolverLibro(idLinea);
      // Recargar detalle
      const res = await getPrestamoById(detalle.Id);
      setDetalle(res.data.data);
      recargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const estadoBadge = (estado) => {
    const colores = { Activo: '#2563eb', Devuelto: '#16a34a', Vencido: '#dc2626' };
    return (
      <span style={{
        background: colores[estado] || '#888',
        color: '#fff', borderRadius: 4,
        padding: '2px 8px', fontSize: 12
      }}>
        {estado}
      </span>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Préstamos</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nuevo préstamo</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Documento, Nº func. o nombre..."
            value={busqueda}
            onChange={e => onBusquedaChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { clearTimeout(timeoutBusqueda.current); buscar(); }
              if (e.key === 'Escape') limpiarBusqueda();
            }}
          />
          {busqueda && (
            <button className="search-clear" onClick={limpiarBusqueda} title="Limpiar búsqueda">×</button>
          )}
        </div>
        <select value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Devuelto">Devuelto</option>
          <option value="Vencido">Vencido</option>
        </select>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
        <button className="btn-sm" onClick={abrirConfig}>Configurar precio</button>
        <button className="btn-sm no-print" onClick={exportarExcel} disabled={exporting}>
          {exporting ? 'Exportando…' : 'Exportar Excel'}
        </button>
        <button className="btn-sm no-print" onClick={imprimir} disabled={printing}>
          {printing ? 'Preparando…' : 'Imprimir'}
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Afiliado</th>
              <th>Documento</th>
              <th>Nº Func.</th>
              <th>Fecha</th>
              <th>Libros</th>
              <th>Devueltos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.length === 0 ? (
              <tr><td colSpan={9}>{modoBusqueda ? 'No se encontraron préstamos' : 'No hay préstamos'}</td></tr>
            ) : prestamos.map(p => (
              <tr key={p.Id}>
                <td>{p.Id}</td>
                <td>{p.NombreAfiliado}</td>
                <td>{p.Documento}</td>
                <td>{p.NroFuncionario || '—'}</td>
                <td>{formatFecha(p.FechaPrestamo)}</td>
                <td>{p.CantLibros}</td>
                <td>{p.CantDevueltos}</td>
                <td>{estadoBadge(p.Estado)}</td>
                <td>
                  <button className="btn-sm" onClick={() => abrirDetalle(p.Id)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {printData && (
        <div className="print-area">
          <h2 className="print-title">PRÉSTAMOS DE LIBROS</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Afiliado</th>
                <th>Documento</th>
                <th>Nº Func.</th>
                <th>Fecha</th>
                <th>Libros</th>
                <th>Devueltos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {printData.length === 0 ? (
                <tr><td colSpan={8}>No hay préstamos</td></tr>
              ) : printData.map(p => (
                <tr key={p.Id}>
                  <td>{p.Id}</td>
                  <td>{p.NombreAfiliado}</td>
                  <td>{p.Documento}</td>
                  <td>{p.NroFuncionario || '—'}</td>
                  <td>{formatFecha(p.FechaPrestamo)}</td>
                  <td>{p.CantLibros}</td>
                  <td>{p.CantDevueltos}</td>
                  <td>{p.Estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modoBusqueda && !loading && (
        <p className="pagination-info" style={{ marginTop: 8 }}>
          {total} resultado{total === 1 ? '' : 's'} para "{busqueda.trim()}"
        </p>
      )}

      {!modoBusqueda && totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">{total} préstamos — Página {page} de {totalPages}</span>
          <button className="page-btn" onClick={() => { setPage(page - 1); cargar({ estado: filtroEstado || undefined, idAfiliado: filtroAfiliado || undefined }, page - 1); }} disabled={page === 1}>← Anterior</button>
          <button className="page-btn" onClick={() => { setPage(page + 1); cargar({ estado: filtroEstado || undefined, idAfiliado: filtroAfiliado || undefined }, page + 1); }} disabled={page === totalPages}>Siguiente →</button>
        </div>
      )}

      {/* Modal detalle */}
      <Modal isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)}
        title={detalle ? `Préstamo #${detalle.Id} — ${detalle.NombreAfiliado}` : ''}>
        {detalle && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                Fecha: {formatFecha(detalle.FechaPrestamo)} &nbsp;|&nbsp; Estado: {estadoBadge(detalle.Estado)}
              </p>
              <button className="btn-sm" onClick={() => {
                const token = localStorage.getItem('apmu_token');
                window.open(`${import.meta.env.VITE_API_URL || ''}/prestamos/${detalle.Id}/pdf?token=${token}`, '_blank');
              }}>Imprimir comprobante</button>
            </div>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Vencimiento</th>
                  <th>Devolución</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detalle.lineas.map(l => (
                  <tr key={l.Id} style={{ opacity: l.FechaDevolucion ? 0.5 : 1 }}>
                    <td>{l.NombreLibro}</td>
                    <td>{l.FechaVencimiento ? formatFecha(l.FechaVencimiento) : '-'}</td>
                    <td>{l.FechaDevolucion ? formatFecha(l.FechaDevolucion) : 'Pendiente'}</td>
                    <td>
                      {!l.FechaDevolucion && (
                        <button className="btn-sm primary" onClick={() => handleDevolver(l.Id)}>
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>

      {/* Modal crear préstamo */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)}
        title="Nuevo préstamo">

        {/* Autocomplete afiliado */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Afiliado *</label>
          <input
            className="form-control"
            placeholder="Buscá por nombre o documento..."
            value={busquedaAfiliado}
            onChange={e => onBusquedaAfiliado(e.target.value)}
            autoFocus
          />
          {sugerenciasAfiliado.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 6, zIndex: 100, maxHeight: 200, overflowY: 'auto'
            }}>
              {sugerenciasAfiliado.map(a => (
                <div key={a.Id}
                  onClick={() => seleccionarAfiliado(a)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <strong>{a.PrimerNombre} {a.PrimerApellido} {a.SegundoApellido}</strong>
                  <span style={{ marginLeft: 8, color: 'var(--text)', fontSize: 13 }}>
                    {a.Documento} {a.NroFuncionario ? `· Func. ${a.NroFuncionario}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buscador de libros */}
        <div className="form-group" style={{ position: 'relative', marginTop: 8 }}>
          <label>Agregar libro</label>
          <input
            className="form-control"
            placeholder="Buscá por nombre o ISBN..."
            value={busquedaLibro}
            onChange={e => onBusquedaLibro(e.target.value)}
          />
          {resultadosLibro.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 6, zIndex: 100, maxHeight: 200, overflowY: 'auto'
            }}>
              {resultadosLibro.map(l => (
                <div key={l.Id}
                  onClick={() => agregarLibro(l)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <strong>{l.Nombre}</strong>
                  <span style={{ marginLeft: 8, color: 'var(--text)', fontSize: 13 }}>
                    Stock: {l.Stock} — {l.Tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de libros agregados */}
        {lineas.length > 0 && (
          <table className="tabla" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Libro</th>
                <th>Fecha vencimiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map(l => (
                <tr key={l.idLibro}>
                  <td>{l.nombreLibro}</td>
                  <td>
                    <input
                      type="date"
                      className="form-control"
                      value={l.fechaVencimiento}
                      onChange={e => setFechaVencimiento(l.idLibro, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn-sm danger" onClick={() => quitarLibro(l.idLibro)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {errorCrear && <span className="error" style={{ marginTop: 8, display: 'block' }}>{errorCrear}</span>}

        <div className="modal-actions">
          <button className="btn-sm" onClick={() => setModalCrearOpen(false)}>Cancelar</button>
          <button className="btn-primary btn-inline" onClick={guardarPrestamo}>Guardar préstamo</button>
        </div>
      </Modal>

      {/* Modal configuración precio */}
      <Modal isOpen={modalConfigOpen} onClose={() => setModalConfigOpen(false)}
        title="Precio préstamo libros de estudio">
        <div className="form-group">
          <label>Precio por libro ($)</label>
          <input
            type="number" min="0" step="0.01"
            className="form-control"
            value={precioEstudio}
            onChange={e => setPrecioEstudio(e.target.value)}
            autoFocus
          />
        </div>
        {errorConfig && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{errorConfig}</span>}
        <div className="modal-actions">
          <button className="btn-sm" onClick={() => setModalConfigOpen(false)}>Cancelar</button>
          <button className="btn-primary btn-inline" onClick={guardarConfig} disabled={savingConfig}>
            {savingConfig ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}