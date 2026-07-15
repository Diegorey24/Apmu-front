import { useState, useRef, useEffect } from 'react';
import { searchAfiliados } from '../api/afiliados';
import { getRubros } from '../api/rubros';
import { getDeudaAfiliado, getConciliacion, exportarAfiliados, exportarBajas, exportarAportes, exportarPrestamos, exportarLicencias } from '../api/reportes';
import { formatFecha } from '../utils/fecha';

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
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

const descargar = (blob, nombre) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function Reportes() {
  const [tab, setTab] = useState('conciliacion');

  // Tab afiliado
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [loadingAfiliado, setLoadingAfiliado] = useState(false);
  const [errorAfiliado, setErrorAfiliado] = useState('');
  const timeout = useRef(null);

  // Tab conciliacion
  const [rubros, setRubros] = useState([]);
  const [mesConc, setMesConc] = useState('');
  const [anioConc, setAnioConc] = useState('');
  const [rubroConc, setRubroConc] = useState('');
  const [conciliacion, setConciliacion] = useState(null);
  const [loadingConc, setLoadingConc] = useState(false);
  const [errorConc, setErrorConc] = useState('');
  const [vistaConc, setVistaConc] = useState('todos');
  const [fechaIngresoDesde, setFechaIngresoDesde] = useState('');
  const [fechaIngresoHasta, setFechaIngresoHasta] = useState('');


  // Tab exportar
  const [mesExport, setMesExport] = useState('');
  const [anioExport, setAnioExport] = useState('');
  const [fechaDesdeExport, setFechaDesdeExport] = useState('');
  const [fechaHastaExport, setFechaHastaExport] = useState('');
  const [fechaBajaDesde, setFechaBajaDesde] = useState('');
  const [fechaBajaHasta, setFechaBajaHasta] = useState('');

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  useEffect(() => {
    getRubros().then(r => {
      const data = r.data.data || [];
      setRubros(data);
      const cuota = data.find(r => r.RubDsc?.trim().toLowerCase() === 'cuota social');
      if (cuota) setRubroConc(cuota.RubCod);
    });
  }, []);

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

  const handleExportarAfiliados = async () => {
    try {
      const res = await exportarAfiliados(fechaIngresoDesde, fechaIngresoHasta);
      descargar(res.data, 'padron_afiliados.xlsx');
    } catch { alert('Error al exportar'); }
  };

  const handleExportarBajas = async () => {
    try {
      const res = await exportarBajas(fechaBajaDesde, fechaBajaHasta);
      descargar(res.data, 'afiliados_bajas.xlsx');
    } catch { alert('Error al exportar'); }
  };

  const handleExportarAportes = async () => {
    try {
      const aniomes = mesExport && anioExport ? `${anioExport}${mesExport}` : '';
      const res = await exportarAportes(aniomes);
      descargar(res.data, `aportes${aniomes ? '_' + aniomes : ''}.xlsx`);
    } catch { alert('Error al exportar'); }
  };

  const handleExportarPrestamos = async () => {
    try {
      const res = await exportarPrestamos();
      descargar(res.data, 'prestamos.xlsx');
    } catch { alert('Error al exportar'); }
  };

  const handleExportarLicencias = async () => {
    try {
      const res = await exportarLicencias(fechaDesdeExport, fechaHastaExport);
      descargar(res.data, 'licencias_gremiales.xlsx');
    } catch { alert('Error al exportar'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reportes</h1>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'conciliacion', label: 'Conciliación mensual' },
          { id: 'exportar', label: 'Exportar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              background: 'none', fontWeight: tab === t.id ? 600 : 400,
              fontFamily: 'var(--sans)', fontSize: 14,
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text)',
              marginBottom: -1,
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
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                {sugerencias.map(a => (
                  <div key={a.Id} onClick={() => seleccionar(a)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <strong>{a.PrimerNombre} {a.PrimerApellido} {a.SegundoApellido}</strong>
                    <span style={{ marginLeft: 8, color: 'var(--text)', fontSize: 13 }}>{a.Documento}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingAfiliado && <p>Cargando...</p>}
          {errorAfiliado && <p style={{ color: 'var(--error)' }}>{errorAfiliado}</p>}

          {reporte && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '24px 0' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Total pendiente</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>
                    $ {Number(reporte.totales.TotalDeuda).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Total cobrado</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>
                    $ {Number(reporte.totales.TotalPagado).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Total aportes</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>
                    $ {Number(reporte.totales.TotalGeneral).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {Object.keys(porPeriodo).length === 0 ? (
                <p style={{ color: 'var(--text)' }}>No hay movimientos para este afiliado.</p>
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
            <button className="btn-primary btn-inline" onClick={buscarConciliacion}>Buscar</button>
          </div>

          {errorConc && <p style={{ color: 'var(--error)' }}>{errorConc}</p>}
          {loadingConc && <p>Cargando...</p>}

          {conciliacion && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Total afiliados</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500 }}>{conciliacion.total}</p>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, cursor: 'pointer' }}
                  onClick={() => setVistaConc('con')}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Con aporte</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: '#16a34a' }}>{conciliacion.totalCon}</p>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, cursor: 'pointer' }}
                  onClick={() => setVistaConc('sin')}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Sin aporte</p>
                  <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--error)' }}>{conciliacion.totalSin}</p>
                </div>
              </div>

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
                      <td style={{ color: a.TieneAporte ? '#16a34a' : 'var(--error)', fontWeight: 500 }}>
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

      {/* Tab exportar */}
      {tab === 'exportar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Padrón de afiliados</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>Todos los afiliados activos con sus datos completos.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Ingreso desde</label>
                <input type="date" className="form-control" value={fechaIngresoDesde}
                  onChange={e => setFechaIngresoDesde(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Ingreso hasta</label>
                <input type="date" className="form-control" value={fechaIngresoHasta}
                  onChange={e => setFechaIngresoHasta(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary btn-inline" onClick={handleExportarAfiliados}>Exportar Excel</button>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Afiliados dados de baja</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>Listado de bajas con motivo y fecha.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Desde</label>
                <input type="date" className="form-control" value={fechaBajaDesde}
                  onChange={e => setFechaBajaDesde(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Hasta</label>
                <input type="date" className="form-control" value={fechaBajaHasta}
                  onChange={e => setFechaBajaHasta(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary btn-inline" onClick={handleExportarBajas}>Exportar Excel</button>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Aportes</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>Filtrá por período o exportá todos.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Mes</label>
                <select className="form-control" value={mesExport} onChange={e => setMesExport(e.target.value)}>
                  <option value="">Todos los meses</option>
                  {mesesCompletos.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Año</label>
                <select className="form-control" value={anioExport} onChange={e => setAnioExport(e.target.value)}>
                  <option value="">Todos los años</option>
                  {anios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary btn-inline" onClick={handleExportarAportes}>Exportar Excel</button>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Préstamos de libros</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>Todos los préstamos con detalle de libros.</p>
            <button className="btn-primary btn-inline" onClick={handleExportarPrestamos}>Exportar Excel</button>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>Licencias gremiales</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text)' }}>Filtrá por rango de fechas o exportá todas.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Desde</label>
                <input type="date" className="form-control" value={fechaDesdeExport}
                  onChange={e => setFechaDesdeExport(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Hasta</label>
                <input type="date" className="form-control" value={fechaHastaExport}
                  onChange={e => setFechaHastaExport(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary btn-inline" onClick={handleExportarLicencias}>Exportar Excel</button>
          </div>

        </div>
      )}
    </div>
  );
}