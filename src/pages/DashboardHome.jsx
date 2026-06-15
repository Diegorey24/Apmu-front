import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getCuentaCorriente } from '../api/cuentacorriente';
import { getAfiliados } from '../api/afiliados';
import { getLibros } from '../api/libros';
import Modal from '../components/Modal';
import { formatFecha } from '../utils/fecha';

function DashboardHome() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
  const ahora = new Date();
  const periodoActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
  const aniomesActual = parseInt(`${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}`);

  const [modal, setModal]               = useState(null);
  const [modalData, setModalData]       = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]     = useState('');

  useEffect(() => {
    client.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(() => setError('Error al cargar estadísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>Cargando…</p></div>;
  if (error)   return <div className="page"><p className="alert alert-error">{error}</p></div>;

  const mesesCortos = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
  const formatPeriodo = (aniomes) => {
    if (!aniomes) return '—';
    const s = String(aniomes);
    return `${mesesCortos[parseInt(s.substring(4, 6)) - 1]} ${s.substring(0, 4)}`;
  };

  const openCargosModal = (tipo) => {
    setModal(tipo);
    setModalError('');
    setModalLoading(true);
    const params = tipo === 'pendientes'
      ? { estado: 'pendiente', aniomes: aniomesActual, limit: 50 }
      : { estado: 'vencido', limit: 50 };
    getCuentaCorriente(params)
      .then(r => setModalData(r.data.data || []))
      .catch(() => setModalError('Error al cargar el detalle.'))
      .finally(() => setModalLoading(false));
  };

  const openAfiliadosBajaModal = () => {
    setModal('afiliados-baja');
    setModalError('');
    setModalLoading(true);
    getAfiliados(1, 50, '', 0)
      .then(r => setModalData(r.data.data || []))
      .catch(() => setModalError('Error al cargar el detalle.'))
      .finally(() => setModalLoading(false));
  };

  const openLibrosStockBajoModal = () => {
    setModal('libros-stock-bajo');
    setModalError('');
    setModalLoading(true);
    getLibros({ stockBajo: 1 })
      .then(r => setModalData(r.data.data || []))
      .catch(() => setModalError('Error al cargar el detalle.'))
      .finally(() => setModalLoading(false));
  };

  const closeModal = () => { setModal(null); setModalData([]); };

  const Card = ({ label, value, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: '12px',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: 'var(--text-h)' }}>{value}</p>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{
        margin: '0 0 12px',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '8px'
      }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      <p style={{ marginTop: '4px', marginBottom: '32px', color: 'var(--text)' }}>
        Período actual: {periodoActual}
      </p>

      <Section title="Afiliados">
        <Card label="Afiliados activos" value={stats.TotalAfiliados} onClick={() => navigate('/dashboard/afiliados')} />
        <Card label="Afiliados dados de baja" value={stats.AfiliadosBaja} onClick={openAfiliadosBajaModal} />
      </Section>

      <Section title="Aportes">
        <Card label={`Cargos pendientes (${periodoActual})`} value={stats.CargosPendientesMes}
          onClick={() => openCargosModal('pendientes')} />
        <Card label="Cargos vencidos" value={stats.CargosVencidos}
          onClick={() => openCargosModal('vencidos')} />
        <Card label={`Total cobrado (${periodoActual})`}
          value={`$ ${Number(stats.TotalCobradoMes).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`} />
      </Section>

      <Section title="Biblioteca">
        <Card label="Total de libros" value={stats.TotalLibros} onClick={() => navigate('/dashboard/libros')} />
        <Card label="Libros con stock bajo" value={stats.LibrosStockBajo} onClick={openLibrosStockBajoModal} />
        <Card label="Préstamos activos" value={stats.PrestamosActivos}
          onClick={() => navigate('/dashboard/prestamos?estado=Activo')} />
        <Card label="Préstamos vencidos" value={stats.PrestamosVencidos}
          onClick={() => navigate('/dashboard/prestamos?estado=Vencido')} />
      </Section>

      {(modal === 'pendientes' || modal === 'vencidos') && (
        <Modal
          title={modal === 'pendientes' ? `Cargos pendientes (${periodoActual})` : 'Cargos vencidos'}
          onClose={closeModal}
          size="lg"
        >
          {modalError && <p className="alert alert-error">{modalError}</p>}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Afiliado</th>
                  <th>Rubro</th>
                  <th>Importe</th>
                  <th>Período</th>
                  <th>Vto</th>
                </tr>
              </thead>
              <tbody>
                {modalLoading ? (
                  <tr><td colSpan={5} className="td-empty">Cargando…</td></tr>
                ) : modalData.length === 0 ? (
                  <tr><td colSpan={5} className="td-empty">Sin movimientos.</td></tr>
                ) : modalData.map(row => (
                  <tr key={row.Id}>
                    <td>
                      <div>{row.NombreAfiliado || '—'}</div>
                      <div className="td-muted" style={{ fontSize: '12px' }}>{row.Documento}</div>
                    </td>
                    <td>{row.RubDsc?.trim() || row.Rubro}</td>
                    <td>{row.Importe != null ? `$ ${Number(row.Importe).toFixed(2)}` : '—'}</td>
                    <td>{formatPeriodo(row.Aniomes)}</td>
                    <td>{formatFecha(row.FechaVto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cerrar</button>
            <button
              type="button"
              className="btn-primary btn-inline"
              onClick={() => navigate(`/dashboard/cuenta-corriente?estado=${modal === 'pendientes' ? 'pendiente' : 'vencido'}`)}
            >
              Ver todo en Aportes
            </button>
          </div>
        </Modal>
      )}

      {modal === 'afiliados-baja' && (
        <Modal title="Afiliados dados de baja" onClose={closeModal} size="lg">
          {modalError && <p className="alert alert-error">{modalError}</p>}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Afiliado</th>
                  <th>Documento</th>
                  <th>Fecha de baja</th>
                </tr>
              </thead>
              <tbody>
                {modalLoading ? (
                  <tr><td colSpan={3} className="td-empty">Cargando…</td></tr>
                ) : modalData.length === 0 ? (
                  <tr><td colSpan={3} className="td-empty">Sin afiliados dados de baja.</td></tr>
                ) : modalData.map(row => (
                  <tr key={row.Id}>
                    <td>{row.PrimerNombre} {row.PrimerApellido}</td>
                    <td>{row.Documento}</td>
                    <td>{formatFecha(row.FechaBaja)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cerrar</button>
          </div>
        </Modal>
      )}

      {modal === 'libros-stock-bajo' && (
        <Modal title="Libros con stock bajo" onClose={closeModal} size="lg">
          {modalError && <p className="alert alert-error">{modalError}</p>}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Editorial</th>
                  <th>Materia</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {modalLoading ? (
                  <tr><td colSpan={4} className="td-empty">Cargando…</td></tr>
                ) : modalData.length === 0 ? (
                  <tr><td colSpan={4} className="td-empty">Sin libros con stock bajo.</td></tr>
                ) : modalData.map(row => (
                  <tr key={row.Id}>
                    <td>{row.Nombre}</td>
                    <td>{row.NombreEditorial || '—'}</td>
                    <td>{row.NombreMateria || '—'}</td>
                    <td>{row.Stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cerrar</button>
            <button type="button" className="btn-primary btn-inline" onClick={() => navigate('/dashboard/libros')}>
              Ver en Biblioteca
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default DashboardHome;