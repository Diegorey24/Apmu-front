import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getTarjetasMacro, createTarjetaMacro, cambiarEstadoTarjetaMacro, deleteTarjetaMacro,
} from '../api/tarjetas-macro';
import { searchAfiliados } from '../api/afiliados';
import Modal from '../components/Modal';

const ORDEN_ESTADOS = ['Pendiente', 'Solicitado', 'En APMU', 'Entregado'];

const COLOR_ESTADO = {
  Pendiente: '#888',
  Solicitado: '#2563eb',
  'En APMU': '#f59e0b',
  Entregado: '#16a34a',
};

const FORM_VACIO = { idAfiliado: '', observaciones: '' };

export default function TarjetasMacro() {
  const [tarjetas, setTarjetas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');

  // Autocomplete afiliado
  const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const timeoutRef = useRef(null);

  const cargar = async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await getTarjetasMacro(filtros);
      setTarjetas(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aplicarFiltros = () => {
    cargar({ estado: filtroEstado || undefined });
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    cargar();
  };

  const onBusquedaAfiliado = (valor) => {
    setBusquedaAfiliado(valor);
    setForm(f => ({ ...f, idAfiliado: '' }));
    clearTimeout(timeoutRef.current);
    if (valor.length < 2) { setSugerencias([]); return; }
    timeoutRef.current = setTimeout(async () => {
      const res = await searchAfiliados(valor);
      setSugerencias(res.data.data);
    }, 300);
  };

  const seleccionarAfiliado = (a) => {
    setForm(f => ({ ...f, idAfiliado: a.Id }));
    setBusquedaAfiliado(`${a.PrimerNombre} ${a.PrimerApellido} — ${a.Documento}${a.NroFuncionario ? ' · Func. ' + a.NroFuncionario : ''}`);
    setSugerencias([]);
  };

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setBusquedaAfiliado('');
    setSugerencias([]);
    setError('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.idAfiliado) { setError('Seleccioná un afiliado'); return; }
    try {
      await createTarjetaMacro(form);
      setModalOpen(false);
      cargar({ estado: filtroEstado || undefined });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const avanzarEstado = async (t) => {
    const indiceActual = ORDEN_ESTADOS.indexOf(t.Estado);
    const siguiente = ORDEN_ESTADOS[indiceActual + 1];
    if (!siguiente) return;
    if (!confirm(`¿Cambiar a ${siguiente}?`)) return;
    try {
      await cambiarEstadoTarjetaMacro(t.Id, siguiente);
      cargar({ estado: filtroEstado || undefined });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar el estado');
    }
  };

  const eliminar = async (t) => {
    if (!confirm('¿Eliminar esta solicitud de tarjeta?')) return;
    try {
      await deleteTarjetaMacro(t.Id);
      cargar({ estado: filtroEstado || undefined });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const exportarExcel = () => {
    const filas = tarjetas.map(t => ({
      'N° Func.': t.NroFuncionario || '',
      Apellido: [t.PrimerApellido, t.SegundoApellido].filter(Boolean).join(' '),
      Nombre: [t.PrimerNombre, t.SegundoNombre].filter(Boolean).join(' '),
      'Dirección': t.Domicilio || '',
      Departamento: t.Departamento || '',
      'Teléfono': t.Celular || t.Telefono || '',
      CI: t.Documento,
      Estado: t.Estado,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Tarjetas Macro');
    XLSX.writeFile(libro, 'tarjetas_macro.xlsx');
  };

  const imprimir = () => window.print();

  const estadoBadge = (estado) => (
    <span style={{
      background: COLOR_ESTADO[estado] || '#888',
      color: '#fff', borderRadius: 4,
      padding: '2px 8px', fontSize: 12,
    }}>
      {estado}
    </span>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tarjetas Macro Mercado</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva solicitud</button>
      </div>

      <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Estado</label>
          <select className="form-control" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ORDEN_ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
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
              <th>N° Func.</th>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Departamento</th>
              <th>Teléfono</th>
              <th>CI</th>
              <th>Estado</th>
              <th className="no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarjetas.length === 0 ? (
              <tr><td colSpan={9}>No hay solicitudes</td></tr>
            ) : tarjetas.map(t => (
              <tr key={t.Id}>
                <td>{t.NroFuncionario || '—'}</td>
                <td>{[t.PrimerApellido, t.SegundoApellido].filter(Boolean).join(' ')}</td>
                <td>{[t.PrimerNombre, t.SegundoNombre].filter(Boolean).join(' ')}</td>
                <td>{t.Domicilio || '—'}</td>
                <td>{t.Departamento || '—'}</td>
                <td>{t.Celular || t.Telefono || '—'}</td>
                <td>{t.Documento}</td>
                <td>{estadoBadge(t.Estado)}</td>
                <td className="no-print">
                  <div className="td-actions">
                    {t.Estado !== 'Entregado' && (
                      <button className="btn-sm" onClick={() => avanzarEstado(t)}>Avanzar estado</button>
                    )}
                    {t.Estado === 'Pendiente' && (
                      <button className="btn-sm danger" onClick={() => eliminar(t)}>Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva solicitud de tarjeta">
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

        <div className="form-group">
          <label>Observaciones</label>
          <textarea className="form-control" rows={2} value={form.observaciones}
            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
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
