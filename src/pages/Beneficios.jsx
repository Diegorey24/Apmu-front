import { useState, useEffect, useRef } from 'react';
import { getBeneficios, createBeneficio, deleteBeneficio } from '../api/beneficios';
import { searchAfiliados } from '../api/afiliados';
import { getHijos } from '../api/hijos';
import Modal from '../components/Modal';

const anioActual = new Date().getFullYear();
const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

export default function Beneficios() {
    const [beneficios, setBeneficios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        idAfiliado: '', tipo: 'Canasta', anio: anioActual,
        fechaEntrega: new Date().toISOString().substring(0, 10),
        idHijo: '', observaciones: '',
    });
    const [error, setError] = useState('');
    const [advertencia, setAdvertencia] = useState('');
    const [hijos, setHijos] = useState([]);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroAnio, setFiltroAnio] = useState(String(anioActual));

    // Autocomplete afiliado
    const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
    const [sugerencias, setSugerencias] = useState([]);
    const timeoutRef = useRef(null);

    const cargar = async (filtros = {}) => {
        setLoading(true);
        try {
            const res = await getBeneficios(filtros);
            setBeneficios(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar({ anio: anioActual });
    }, []);

    const aplicarFiltros = () => {
        cargar({
            tipo: filtroTipo || undefined,
            anio: filtroAnio || undefined,
        });
    };

    const onBusquedaAfiliado = (valor) => {
        setBusquedaAfiliado(valor);
        setForm(f => ({ ...f, idAfiliado: '', idHijo: '' }));
        setHijos([]);
        clearTimeout(timeoutRef.current);
        if (valor.length < 2) { setSugerencias([]); return; }
        timeoutRef.current = setTimeout(async () => {
            const res = await searchAfiliados(valor);
            setSugerencias(res.data.data);
        }, 300);
    };

    const seleccionarAfiliado = async (a) => {
        setForm(f => ({ ...f, idAfiliado: a.Id, idHijo: '' }));
        setBusquedaAfiliado(`${a.PrimerNombre} ${a.PrimerApellido} — ${a.Documento}`);
        setSugerencias([]);
        // Cargar hijos si el tipo es Utiles
        if (form.tipo === 'Utiles') {
            const res = await getHijos(a.Id);
            setHijos(res.data.data || []);
        }
    };

    const abrirCrear = () => {
        setForm({
            idAfiliado: '', tipo: 'Canasta', anio: anioActual,
            fechaEntrega: new Date().toISOString().substring(0, 10),
            idHijo: '', observaciones: '',
        });
        setBusquedaAfiliado('');
        setSugerencias([]);
        setHijos([]);
        setError('');
        setAdvertencia('');
        setModalOpen(true);
    };

    const guardar = async () => {
        try {
            setError('');
            setAdvertencia('');
            const res = await createBeneficio(form);
            if (res.data.data?.advertencia) {
                setAdvertencia(res.data.data.advertencia);
            }
            setModalOpen(false);
            cargar({ tipo: filtroTipo || undefined, anio: filtroAnio || undefined });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const eliminar = async (b) => {
        if (!confirm(`¿Eliminar este beneficio?`)) return;
        try {
            await deleteBeneficio(b.Id);
            cargar({ tipo: filtroTipo || undefined, anio: filtroAnio || undefined });
        } catch (err) {
            alert(err.response?.data?.message || 'Error');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Beneficios</h1>
                <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Registrar beneficio</button>
            </div>

            {advertencia && (
                <div className="alert" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 16 }}>
                    ⚠ {advertencia}
                </div>
            )}

            <div className="toolbar">
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Tipo</label>
                    <select className="form-control" value={filtroTipo}
                        onChange={e => setFiltroTipo(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="Canasta">Canasta</option>
                        <option value="Utiles">Útiles escolares</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Año</label>
                    <select className="form-control" value={filtroAnio}
                        onChange={e => setFiltroAnio(e.target.value)}>
                        <option value="">Todos</option>
                        {anios.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Afiliado</th>
                            <th>Documento</th>
                            <th>Tipo</th>
                            <th>Hijo</th>
                            <th>Año</th>
                            <th>Fecha entrega</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {beneficios.length === 0 ? (
                            <tr><td colSpan={7}>No hay beneficios registrados</td></tr>
                        ) : beneficios.map(b => (
                            <tr key={b.Id}>
                                <td>{b.NombreAfiliado}</td>
                                <td>{b.Documento}</td>
                                <td>{b.Tipo === 'Utiles' ? 'Útiles escolares' : 'Canasta'}</td>
                                <td>{b.NombreHijo || '—'}</td>
                                <td>{b.Anio}</td>
                                <td>{b.FechaEntrega?.substring(0, 10)}</td>
                                <td>
                                    <button className="btn-sm danger" onClick={() => eliminar(b)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar beneficio">
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
                                    <span style={{ marginLeft: 8, color: 'var(--text)', fontSize: 13 }}>{a.Documento}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Tipo *</label>
                        <select className="form-control" value={form.tipo}
                            onChange={async e => {
                                const tipo = e.target.value;
                                setForm(f => ({ ...f, tipo, idHijo: '' }));
                                if (tipo === 'Utiles' && form.idAfiliado) {
                                    const res = await getHijos(form.idAfiliado);
                                    setHijos(res.data.data || []);
                                } else {
                                    setHijos([]);
                                }
                            }}>
                            <option value="Canasta">Canasta</option>
                            <option value="Utiles">Útiles escolares</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Año *</label>
                        <select className="form-control" value={form.anio}
                            onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}>
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha de entrega *</label>
                        <input type="date" className="form-control" value={form.fechaEntrega}
                            onChange={e => setForm(f => ({ ...f, fechaEntrega: e.target.value }))} />
                    </div>

                    {form.tipo === 'Utiles' && (
                        <div className="form-group">
                            <label>Hijo *</label>
                            <select className="form-control" value={form.idHijo}
                                onChange={e => setForm(f => ({ ...f, idHijo: e.target.value }))}>
                                <option value="">— Seleccioná —</option>
                                {hijos.map(h => (
                                    <option key={h.Id} value={h.Id}>
                                        {h.PrimerNombre} {h.PrimerApellido}
                                    </option>
                                ))}
                            </select>
                            {hijos.length === 0 && form.idAfiliado && (
                                <small style={{ color: 'var(--text)', fontSize: 12 }}>
                                    Este afiliado no tiene hijos registrados
                                </small>
                            )}
                        </div>
                    )}

                    <div className="form-group full">
                        <label>Observaciones</label>
                        <textarea className="form-control" rows={2} value={form.observaciones}
                            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
                    </div>
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