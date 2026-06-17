import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
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

  const [graficos, setGraficos] = useState(null);

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

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/recaudacion-mensual'),
      client.get('/dashboard/prestamos-por-estado'),
      client.get('/dashboard/libros-mas-prestados'),
    ]).then(([rec, est, lib]) => {
      setGraficos({
        recaudacion: rec.data.data,
        estados: est.data.data,
        libros: lib.data.data,
      });
    }).catch(() => {});
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

  const openProximosVencerModal = () => {
    setModal('proximos-vencer');
    setModalError('');
    setModalLoading(true);
    client.get('/dashboard/proximos-vencer')
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

  const Card = ({ label, value, onClick, warning }) => (
    <div
      onClick={onClick}
      style={{
        background: warning ? 'rgba(217,119,6,0.07)' : 'var(--card-bg)',
        border: warning ? '1px solid rgba(217,119,6,0.35)' : '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: '12px',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <p style={{ margin: 0, fontSize: '13px', color: warning ? '#92400e' : 'var(--text)' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: warning ? '#d97706' : 'var(--text-h)' }}>{value}</p>
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
        <Card
          label="Vencen en los próximos 7 días"
          value={stats.PrestamosProximosVencer}
          onClick={openProximosVencerModal}
          warning={stats.PrestamosProximosVencer > 0}
        />
      </Section>

      {graficos && (
        <>
          <h3 style={{
            margin: '0 0 12px', fontSize: '14px', fontWeight: 600,
            color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border)', paddingBottom: '8px',
          }}>
            Estadísticas
          </h3>

          {/* Recaudación mensual - ancho completo */}
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: 'var(--shadow)',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Recaudación mensual
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={graficos.recaudacion} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c0392b" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#c0392b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="Aniomes" tickFormatter={formatPeriodo} tick={{ fontSize: 11, fill: 'var(--text)' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text)' }} width={52} />
                <Tooltip
                  formatter={v => [`$ ${Number(v).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`, 'Recaudado']}
                  labelFormatter={formatPeriodo}
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                />
                <Area type="monotone" dataKey="Total" stroke="#c0392b" strokeWidth={2} fill="url(#gradAcc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie + Barras - lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 32 }}>

            {/* Estado de préstamos */}
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Estado de préstamos
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={graficos.estados} dataKey="Cantidad" nameKey="Estado"
                    innerRadius={52} outerRadius={78} paddingAngle={3}>
                    {graficos.estados.map(entry => {
                      const col = { Activo: '#2563eb', Devuelto: '#16a34a', Vencido: '#dc2626' };
                      return <Cell key={entry.Estado} fill={col[entry.Estado] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Libros más prestados */}
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Libros más prestados
              </p>
              {graficos.libros.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 40, textAlign: 'center' }}>Sin datos aún</p>
              ) : (
                <ResponsiveContainer width="100%" height={graficos.libros.length * 32 + 20}>
                  <BarChart layout="vertical" data={graficos.libros} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text)' }} />
                    <YAxis type="category" dataKey="Nombre" width={160}
                      tick={{ fontSize: 11, fill: 'var(--text)' }}
                      tickFormatter={v => v.length > 22 ? v.substring(0, 22) + '…' : v} />
                    <Tooltip
                      formatter={v => [v, 'Préstamos']}
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    />
                    <Bar dataKey="Veces" fill="#c0392b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

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

      {modal === 'proximos-vencer' && (
        <Modal title="Préstamos que vencen en los próximos 7 días" onClose={closeModal} size="lg">
          {modalError && <p className="alert alert-error">{modalError}</p>}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Afiliado</th>
                  <th>Libro</th>
                  <th>Vencimiento</th>
                  <th>Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {modalLoading ? (
                  <tr><td colSpan={4} className="td-empty">Cargando…</td></tr>
                ) : modalData.length === 0 ? (
                  <tr><td colSpan={4} className="td-empty">No hay préstamos por vencer esta semana.</td></tr>
                ) : modalData.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div>{row.NombreAfiliado}</div>
                      <div className="td-muted" style={{ fontSize: '12px' }}>{row.Documento}</div>
                    </td>
                    <td>{row.NombreLibro}</td>
                    <td>{formatFecha(row.FechaVencimiento)}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: row.DiasRestantes <= 2 ? '#dc2626' : '#d97706',
                      }}>
                        {row.DiasRestantes === 0 ? 'Hoy' : `${row.DiasRestantes} día${row.DiasRestantes !== 1 ? 's' : ''}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-cancel" onClick={closeModal}>Cerrar</button>
            <button type="button" className="btn-primary btn-inline" onClick={() => navigate('/dashboard/prestamos')}>
              Ver préstamos
            </button>
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