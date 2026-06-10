import { useState, useEffect } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

function DashboardHome() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
  const ahora = new Date();
  const periodoActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;

  useEffect(() => {
    client.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(() => setError('Error al cargar estadísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>Cargando…</p></div>;
  if (error)   return <div className="page"><p className="alert alert-error">{error}</p></div>;

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      <p style={{ marginTop: '4px', marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Período actual: {periodoActual}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

    <div style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Afiliados activos</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500 }}>{stats.TotalAfiliados}</p>
    </div>

    <div style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Cargos pendientes ({periodoActual})</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: 'var(--color-text-warning)' }}>{stats.CargosPendientesMes}</p>
    </div>

    <div style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Cargos vencidos</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: 'var(--color-text-danger)' }}>{stats.CargosVencidos}</p>
    </div>

    <div style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total cobrado ({periodoActual})</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: 'var(--color-text-success)' }}>$ {Number(stats.TotalCobradoMes).toLocaleString('es-UY', { minimumFractionDigits: 2 })}</p>
    </div>

    <div
      onClick={() => navigate('/dashboard/prestamos?estado=Activo')}
      style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
    >
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Préstamos activos</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500 }}>{stats.PrestamosActivos}</p>
    </div>

    <div
      onClick={() => navigate('/dashboard/prestamos?estado=Vencido')}
      style={{ background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}
    >
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Préstamos vencidos</p>
      <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 500, color: 'var(--color-text-danger)' }}>{stats.PrestamosVencidos}</p>
    </div>

  </div>
    </div>
  );
}

export default DashboardHome;