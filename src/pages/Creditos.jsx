import { useState, useEffect } from 'react';
import { getCreditos, getCreditoById } from '../api/creditos';
import Modal from '../components/Modal';

const ESTADOS = ['Anulado', 'Cancelado', 'Castigado'];

export default function Creditos() {
  const [creditos, setCreditos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const cargar = async (p = 1, filtros = {}) => {
    setLoading(true);
    try {
      const res = await getCreditos({ page: p, limit: LIMIT, ...filtros });
      setCreditos(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(1); }, []);

  const aplicarFiltros = () => {
    setPage(1);
    cargar(1, {
      estado: filtroEstado || undefined,
      clienteId: filtroCliente || undefined,
      busqueda: filtroBusqueda || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroCliente('');
    setFiltroBusqueda('');
    setPage(1);
    cargar(1);
  };

  const abrirDetalle = async (id) => {
    const res = await getCreditoById(id);
    setDetalle(res.data.data);
    setModalOpen(true);
  };

  const estadoBadge = (estado) => {
    const colores = {
      Cancelado: '#16a34a',
      Anulado: '#dc2626',
      Castigado: '#6b7280'
    };
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

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-UY') : '—';
  const formatMonto = (m) => m != null ? `$ ${Number(m).toLocaleString('es-UY', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Créditos históricos</h1>
      </div>

      {/* Filtros */}
      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Nº de socio</label>
          <input className="form-control" placeholder="Ej: 2622"
            value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aplicarFiltros()} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Nº de crédito</label>
          <input className="form-control" placeholder="Ej: 6417"
            value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aplicarFiltros()} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Estado</label>
          <select className="form-control" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" style={{ padding: '9px 18px', fontSize: 14 }} onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <>
          <table className="tabla">
            <thead>
              <tr>
                <th>Nº crédito</th>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Finalidad</th>
                <th>Capital</th>
                <th>Cuotas</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Fecha otorgado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {creditos.length === 0 ? (
                <tr><td colSpan={10}>No hay créditos</td></tr>
              ) : creditos.map(c => (
                <tr key={c.Id}>
                  <td>{c.Numero}</td>
                  <td>{c.NombreSocio || c.Cliente_Id}</td>
                  <td>{c.TipoSolicitud}</td>
                  <td>{c.Finalidad}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMonto(c.CapitalInicial)}</td>
                  <td><strong>{c.CuotasPagas}</strong>/{c.CantidadCuotas}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatMonto(c.SaldoCapital)}</td>
                  <td>{estadoBadge(c.Estado)}</td>
                  <td>{formatFecha(c.FechaOtorgado)}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => abrirDetalle(c.Id)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <span classNamec="pagination-info">{total} créditos — Página {page} de {totalPages}</span>
              <button className="page-btn" onClick={() => { setPage(p => p - 1); cargar(page - 1, { estado: filtroEstado, clienteId: filtroCliente, busqueda: filtroBusqueda }); }} disabled={page === 1}>← Anterior</button>
              <button className="page-btn" onClick={() => { setPage(p => p + 1); cargar(page + 1, { estado: filtroEstado, clienteId: filtroCliente, busqueda: filtroBusqueda }); }} disabled={page === totalPages}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {/* Modal detalle */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={detalle ? `Crédito #${detalle.Numero} — Socio ${detalle.Cliente_Id}` : ''}>
        {detalle && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              ['Nº crédito', detalle.Numero],
              ['Socio', detalle.NombreSocio || '—'],
            ['Documento', detalle.DocumentoSocio || '—'],
              ['Estado', detalle.Estado],
              ['Tipo solicitud', detalle.TipoSolicitud],
              ['Finalidad', detalle.Finalidad],
              ['Moneda', detalle.Moneda],
              ['Frecuencia', detalle.Frecuencia],
              ['Capital inicial', formatMonto(detalle.CapitalInicial)],
              ['Monto cuota', formatMonto(detalle.MontoCuotas)],
              ['Total interés', formatMonto(detalle.TotalInteres)],
              ['Cuotas pagas', `${detalle.CuotasPagas} / ${detalle.CantidadCuotas}`],
              ['Saldo capital', formatMonto(detalle.SaldoCapital)],
              ['Saldo interés', formatMonto(detalle.SaldoInteres)],
              ['Días atraso', detalle.DiasAtraso ?? '—'],
              ['Tasa interés', detalle.TasaInteres ? `${detalle.TasaInteres}%` : '—'],
              ['Tasa mora', detalle.TasaMora ? `${detalle.TasaMora}%` : '—'],
              ['Fecha otorgado', formatFecha(detalle.FechaOtorgado)],
              ['Fecha primer vto', formatFecha(detalle.FechaPrimerVencimiento)],
              ['Monto solicitado', formatMonto(detalle.MontoSolicitado)],
              ['Monto aprobado', formatMonto(detalle.MontoAprobado)],
              ['Fecha solicitud', formatFecha(detalle.FechaSolicitud)],
              ['Fecha aprobación', formatFecha(detalle.FechaAprobacion)],
            ].map(([label, valor]) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{valor}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}