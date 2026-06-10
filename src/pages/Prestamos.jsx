import { useState, useEffect, useRef } from 'react';
import { getPrestamos, getPrestamoById, createPrestamo, devolverLibro } from '../api/prestamos';
import { searchAfiliados } from '../api/afiliados';
import { getLibros } from '../api/libros';
import Modal from '../components/Modal';
import { useSearchParams } from 'react-router-dom';

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros lista
  const [filtroEstado, setFiltroEstado] = useState('Activo');
  const [filtroAfiliado, setFiltroAfiliado] = useState('');

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

  const cargar = async (filtros = {}) => {
    try {
      const res = await getPrestamos(filtros);
      setPrestamos(res.data.data);
    } finally {
      setLoading(false);
    }
  };

const [searchParams] = useSearchParams();

useEffect(() => {
  const estadoUrl = searchParams.get('estado');
  if (estadoUrl) {
    setFiltroEstado(estadoUrl);
    cargar({ estado: estadoUrl });
  } else {
    cargar({ estado: 'Activo' });
  }
}, []);

  const aplicarFiltros = () => {
    cargar({
      estado: filtroEstado || undefined,
      idAfiliado: filtroAfiliado || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFiltroEstado('Activo');
    setFiltroAfiliado('');
    cargar({ estado: 'Activo' });
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
      cargar({ estado: filtroEstado });
    } catch (err) {
      setErrorCrear(err.response?.data?.message || 'Error al guardar');
    }
  };

  const abrirDetalle = async (id) => {
    const res = await getPrestamoById(id);
    setDetalle(res.data.data);
    setModalDetalleOpen(true);
  };

  const handleDevolver = async (idLinea) => {
    if (!confirm('¿Registrar devolución de este libro?')) return;
    try {
      await devolverLibro(idLinea);
      // Recargar detalle
      const res = await getPrestamoById(detalle.Id);
      setDetalle(res.data.data);
      cargar({ estado: filtroEstado });
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
        <select value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Devuelto">Devuelto</option>
          <option value="Vencido">Vencido</option>
        </select>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Afiliado</th>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Libros</th>
              <th>Devueltos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.length === 0 ? (
              <tr><td colSpan={8}>No hay préstamos</td></tr>
            ) : prestamos.map(p => (
              <tr key={p.Id}>
                <td>{p.Id}</td>
                <td>{p.NombreAfiliado}</td>
                <td>{p.Documento}</td>
                <td>{new Date(p.FechaPrestamo).toLocaleDateString('es-UY')}</td>
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

      {/* Modal detalle */}
      <Modal isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)}
        title={detalle ? `Préstamo #${detalle.Id} — ${detalle.NombreAfiliado}` : ''}>
        {detalle && (
          <>
            <p style={{ marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              Fecha: {new Date(detalle.FechaPrestamo).toLocaleDateString('es-UY')} &nbsp;|&nbsp; Estado: {estadoBadge(detalle.Estado)}
            </p>
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
                    <td>{l.FechaVencimiento ? new Date(l.FechaVencimiento).toLocaleDateString('es-UY') : '-'}</td>
                    <td>{l.FechaDevolucion ? new Date(l.FechaDevolucion).toLocaleDateString('es-UY') : 'Pendiente'}</td>
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
                    {a.Documento}
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
    </div>
  );
}