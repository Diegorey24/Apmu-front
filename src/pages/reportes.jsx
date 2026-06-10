import { useState, useRef } from 'react';
import { searchAfiliados } from '../api/afiliados';
import { getDeudaAfiliado } from '../api/reportes';

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

const formatPeriodo = (aniomes) => {
  const s = String(aniomes);
  const mes = parseInt(s.substring(4, 6)) - 1;
  const anio = s.substring(0, 4);
  return `${meses[mes]} ${anio}`;
};

export default function Reportes() {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [afiliado, setAfiliado] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timeout = useRef(null);

  const onBusqueda = (valor) => {
    setBusqueda(valor);
    setAfiliado(null);
    setReporte(null);
    clearTimeout(timeout.current);
    if (valor.length < 2) { setSugerencias([]); return; }
    timeout.current = setTimeout(async () => {
      const res = await searchAfiliados(valor);
      setSugerencias(res.data.data);
    }, 300);
  };

  const seleccionar = async (a) => {
    setAfiliado(a);
    setBusqueda(`${a.PrimerNombre} ${a.PrimerApellido}${a.SegundoApellido ? ' ' + a.SegundoApellido : ''} — ${a.Documento}`);
    setSugerencias([]);
    setLoading(true);
    setError('');
    try {
      const res = await getDeudaAfiliado(a.Id);
      setReporte(res.data.data);
    } catch {
      setError('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar movimientos por período
  const porPeriodo = reporte ? reporte.movimientos.reduce((acc, m) => {
    const key = m.Aniomes;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {}) : {};

  const estadoColor = (estado) => {
    if (estado === 'Pagado') return 'var(--color-text-success)';
    if (estado === 'Vencido') return 'var(--color-text-danger)';
    return 'var(--color-text-warning)';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reportes</h1>
      </div>

      {/* Buscador afiliado */}
      <div className="form-group" style={{ maxWidth: 480, position: 'relative' }}>
        <label>Buscar afiliado</label>
        <input
          className="form-control"
          placeholder="Nombre o documento..."
          value={busqueda}
          onChange={e => onBusqueda(e.target.value)}
          autoFocus
        />
        {sugerencias.length > 0 && (
          <div style={{
            border: '1px solid var(--color-border-primary)',
            borderRadius: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto'
          }}>
            {sugerencias.map(a => (
              <div key={a.Id} onClick={() => seleccionar(a)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border-tertiary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <strong>{a.PrimerNombre} {a.PrimerApellido} {a.SegundoApellido}</strong>
                <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>{a.Documento}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'var(--color-text-danger)' }}>{error}</p>}

      {reporte && (
        <>
          {/* Totales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '24px 0' }}>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total deuda</p>
              <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-danger)' }}>
                $ {Number(reporte.totales.TotalDeuda).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total pagado</p>
              <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-success)' }}>
                $ {Number(reporte.totales.TotalPagado).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total general</p>
              <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>
                $ {Number(reporte.totales.TotalGeneral).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Movimientos por período */}
          {Object.keys(porPeriodo).length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No hay movimientos para este afiliado.</p>
          ) : (
            Object.keys(porPeriodo).map(aniomes => (
              <div key={aniomes} style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 500, marginBottom: 8 }}>{formatPeriodo(aniomes)}</h3>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Rubro</th>
                      <th>Importe</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Recibo</th>
                      <th>Forma de pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porPeriodo[aniomes].map((m, i) => (
                      <tr key={i}>
                        <td>{m.Rubro?.trim() || '—'}</td>
                        <td>$ {Number(m.Importe).toLocaleString('es-UY', { minimumFractionDigits: 2 })}</td>
                        <td>{m.FechaVto ? m.FechaVto.substring(0, 10) : '—'}</td>
                        <td style={{ color: estadoColor(m.Estado), fontWeight: 500 }}>{m.Estado}</td>
                        <td>{m.NroRecibo || '—'}</td>
                        <td>{m.FormaPago || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}