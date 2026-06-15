import { useState, useRef } from 'react';
import { searchAfiliados } from '../api/afiliados';
import { getRubros } from '../api/rubros';
import { getDeudaAfiliado, getConciliacion } from '../api/reportes';
import { useEffect } from 'react';
import { formatFecha } from '../utils/fecha';

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
const mesesCompletos = [
  { v: '01', l: 'Enero' }, { v: '02', l: 'Febrero' }, { v: '03', l: 'Marzo' },
  { v: '04', l: 'Abril' }, { v: '05', l: 'Mayo' }, { v: '06', l: 'Junio' },
  { v: '07', l: 'Julio' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setiembre' },
  { v: '10', l: 'Octubre' }, { v: '11', l: 'Noviembre' }, { v: '12', l: 'Diciembre' },
];

const formatPeriodo = (aniomes) => {
  const s = String(aniomes);
  const mes = parseInt(s.substring(4, 6)) - 1;
  const anio = s.substring(0, 4);
  return `${meses[mes]} ${anio}`;
};

export default function Reportes() {
  const [tab, setTab] = useState('afiliado'); // 'afiliado' | 'conciliacion'

  // --- Tab afiliado ---
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [loadingAfiliado, setLoadingAfiliado] = useState(false);
  const [errorAfiliado, setErrorAfiliado] = useState('');
  const timeout = useRef(null);

  // --- Tab conciliacion ---
  const [rubros, setRubros] = useState([]);
  const [mesConc, setMesConc] = useState('');
  const [anioConc, setAnioConc] = useState('');
  const [rubroConc, setRubroConc] = useState('');
  const [conciliacion, setConciliacion] = useState(null);
  const [loadingConc, setLoadingConc] = useState(false);
  const [errorConc, setErrorConc] = useState('');
  const [vistaConc, setVistaConc] = useState('todos'); // 'todos' | 'con' | 'sin'

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  useEffect(() => {
    getRubros().then(r => {
      const data = r.data.data || [];
      setRubros(data);
      // Pre-seleccionar Cuota Social si existe
      const cuota = data.find(r => r.RubDsc?.trim().toLowerCase() === 'cuota social');
      if (cuota) setRubroConc(cuota.RubCod);
    });
  }, []);

  // Autocomplete afiliado
  const onBusqueda = (valor) => {
    setBusqueda(valor);
    setReporte(null);
    clearTimeout(timeout.current);
    if (valor.length < 2) { setSugerencias([]); return; }
    timeout.current = setTimeout(async () => {
      const res = await searchAfiliados(valor);
      setSugerencias(res.data.data);
    }, 300);
  };

  const seleccionar = async (a) => {
    setBusqueda(`${a.PrimerNombre} ${a.PrimerApellido}${a.SegundoApellido ? ' ' + a.SegundoApellido : ''} — ${a.Documento}`);
    setSugerencias([]);
    setLoadingAfiliado(true);
    setErrorAfiliado('');
    try {
      const res = await getDeudaAfiliado(a.Id);
      setReporte(res.data.data);
    } catch {
      setErrorAfiliado('Error al cargar el reporte');
    } finally {
      setLoadingAfiliado(false);
    }
  };

  const buscarConciliacion = async () => {
    if (!mesConc || !anioConc) { setErrorConc('Seleccioná mes y año'); return; }
    if (!rubroConc) { setErrorConc('Seleccioná un rubro'); return; }
    const aniomes = parseInt(`${anioConc}${mesConc}`);
    setLoadingConc(true);
    setErrorConc('');
    setConciliacion(null);
    try {
      const res = await getConciliacion(aniomes, rubroConc);
      setConciliacion(res.data.data);
    } catch {
      setErrorConc('Error al cargar la conciliación');
    } finally {
      setLoadingConc(false);
    }
  };

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

  const listaConc = conciliacion
    ? vistaConc === 'con' ? conciliacion.conAporte
      : vistaConc === 'sin' ? conciliacion.sinAporte
      : conciliacion.todos
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reportes</h1>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border-primary)' }}>
        {[{ id: 'afiliado', label: 'Por afiliado' }, { id: 'conciliacion', label: 'Conciliación mensual' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              background: 'none', fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab por afiliado */}
      {tab === 'afiliado' && (
        <>
          <div className="form-group" style={{ maxWidth: 480, position: 'relative' }}>
            <label>Buscar afiliado</label>
            <input className="form-control" placeholder="Nombre o documento..."
              value={busqueda} onChange={e => onBusqueda(e.target.value)} autoFocus />
            {sugerencias.length > 0 && (
              <div style={{ border: '1px solid var(--color-border-primary)', borderRadius: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                {sugerencias.map(a => (
                  <div key={a.Id} onClick={() => seleccionar(a)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border-tertiary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <strong>{a.PrimerNombre} {a.PrimerApellido} {a.SegundoApellido}</strong>
                    <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>{a.Documento}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingAfiliado && <p>Cargando...</p>}
          {errorAfiliado && <p style={{ color: 'var(--color-text-danger)' }}>{errorAfiliado}</p>}

          {reporte && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '24px 0' }}>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total pendiente</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-warning)' }}>
                    $ {Number(reporte.totales.TotalDeuda).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total cobrado</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-success)' }}>
                    $ {Number(reporte.totales.TotalPagado).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total aportes</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>
                    $ {Number(reporte.totales.TotalGeneral).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {Object.keys(porPeriodo).length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>No hay movimientos para este afiliado.</p>
              ) : Object.keys(porPeriodo).map(aniomes => (
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
                          <td>{formatFecha(m.FechaVto)}</td>
                          <td style={{ color: estadoColor(m.Estado), fontWeight: 500 }}>{m.Estado}</td>
                          <td>{m.NroRecibo || '—'}</td>
                          <td>{m.FormaPago || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* Tab conciliacion */}
      {tab === 'conciliacion' && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Mes</label>
              <select className="form-control" value={mesConc} onChange={e => setMesConc(e.target.value)}>
                <option value="">— Mes —</option>
                {mesesCompletos.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Año</label>
              <select className="form-control" value={anioConc} onChange={e => setAnioConc(e.target.value)}>
                <option value="">— Año —</option>
                {anios.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Rubro</label>
              <select className="form-control" value={rubroConc} onChange={e => setRubroConc(e.target.value)}>
                <option value="">— Rubro —</option>
                {rubros.map(r => <option key={r.RubCod} value={r.RubCod}>{r.RubDsc?.trim()}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={buscarConciliacion}>Buscar</button>
          </div>

          {errorConc && <p style={{ color: 'var(--color-text-danger)' }}>{errorConc}</p>}
          {loadingConc && <p>Cargando...</p>}

          {conciliacion && (
            <>
              {/* Resumen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Total afiliados</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>{conciliacion.total}</p>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24, cursor: 'pointer' }}
                  onClick={() => setVistaConc('con')}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Con aporte</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-success)' }}>{conciliacion.totalCon}</p>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 24, cursor: 'pointer' }}
                  onClick={() => setVistaConc('sin')}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Sin aporte</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-danger)' }}>{conciliacion.totalSin}</p>
                </div>
              </div>

              {/* Filtro vista */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[{ id: 'todos', l: 'Todos' }, { id: 'con', l: 'Con aporte' }, { id: 'sin', l: 'Sin aporte' }].map(v => (
                  <button key={v.id} onClick={() => setVistaConc(v.id)}
                    className={vistaConc === v.id ? 'btn-sm primary' : 'btn-sm'}>
                    {v.l}
                  </button>
                ))}
              </div>

              <table className="tabla">
                <thead>
                  <tr>
                    <th>Afiliado</th>
                    <th>Documento</th>
                    <th>Aporte</th>
                    <th>Importe</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {listaConc.length === 0 ? (
                    <tr><td colSpan={5}>No hay resultados</td></tr>
                  ) : listaConc.map(a => (
                    <tr key={a.Id}>
                      <td>{a.NombreAfiliado}</td>
                      <td>{a.Documento}</td>
                      <td style={{ color: a.TieneAporte ? 'var(--color-text-success)' : 'var(--color-text-danger)', fontWeight: 500 }}>
                        {a.TieneAporte ? '✓ Sí' : '✗ No'}
                      </td>
                      <td>{a.Importe ? `$ ${Number(a.Importe).toLocaleString('es-UY', { minimumFractionDigits: 2 })}` : '—'}</td>
                      <td>{a.NroRecibo ? 'Cobrado' : a.TieneAporte ? 'Pendiente' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}