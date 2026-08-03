import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getBeneficios, createBeneficio, deleteBeneficio, getListadoCanastas, getListadoUtiles } from '../api/beneficios';
import { searchAfiliados } from '../api/afiliados';
import { getHijos } from '../api/hijos';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';
import { formatFecha } from '../utils/fecha';

const anioActual = new Date().getFullYear();
const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

export default function Beneficios() {
    const [tab, setTab] = useState('registro');
    const [beneficios, setBeneficios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Listado canastas
    const [listadoCanastas, setListadoCanastas] = useState([]);
    const [loadingCanastas, setLoadingCanastas] = useState(false);

    // Listado útiles
    const [listadoUtiles, setListadoUtiles] = useState([]);
    const [loadingUtiles, setLoadingUtiles] = useState(false);
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
        if (!(await confirmDialog(`¿Eliminar este beneficio?`))) return;
        try {
            await deleteBeneficio(b.Id);
            cargar({ tipo: filtroTipo || undefined, anio: filtroAnio || undefined });
        } catch (err) {
            alert(err.response?.data?.message || 'Error');
        }
    };

    const cargarCanastas = async () => {
        setLoadingCanastas(true);
        try {
            const res = await getListadoCanastas();
            setListadoCanastas(res.data.data || []);
        } finally {
            setLoadingCanastas(false);
        }
    };

    const cargarUtiles = async () => {
        setLoadingUtiles(true);
        try {
            const res = await getListadoUtiles();
            setListadoUtiles(res.data.data || []);
        } finally {
            setLoadingUtiles(false);
        }
    };

    const cambiarTab = (t) => {
        setTab(t);
        if (t === 'canastas') cargarCanastas();
        if (t === 'utiles') cargarUtiles();
    };

    const exportarCanastasExcel = () => {
        const filas = listadoCanastas.map(r => ({
            'Nº Funcionario': r.NroFuncionario || '',
            Documento: r.Documento,
            Nombre: r.NombreCompleto,
            'Deuda libros': r.DeudaLibros ? 'Sí' : 'No',
            Sucursal: r.Ubicacion || '',
        }));
        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Canastas');
        XLSX.writeFile(libro, 'beneficios_canastas.xlsx');
    };

    const exportarUtilesExcel = () => {
        const filas = listadoUtiles.map(r => ({
            'Nº Funcionario': r.NroFuncionario || '',
            'Nombre socio': r.NombreSocio,
            CI: r.Documento,
            'Nombre hijo': r.NombreHijo,
            'F. Nac.': r.FechaNacimiento ? r.FechaNacimiento.substring(0, 10) : '',
            Edad: r.Edad ?? '',
            Género: r.Sexo || '',
            Discapacidad: r.Discapacidad ? 'Sí' : 'No',
            Ubicación: r.Ubicacion || '',
        }));
        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Utiles');
        XLSX.writeFile(libro, 'beneficios_utiles.xlsx');
    };

    const imprimir = () => window.print();

    return (
        <div className="page">
            <div className="page-header">
                <h1>Beneficios</h1>
                {tab === 'registro' && (
                    <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Registrar beneficio</button>
                )}
            </div>

            <div className="tabs no-print">
                <button className={tab === 'registro' ? 'active' : ''} onClick={() => cambiarTab('registro')}>Registro</button>
                <button className={tab === 'canastas' ? 'active' : ''} onClick={() => cambiarTab('canastas')}>Listado canastas</button>
                <button className={tab === 'utiles' ? 'active' : ''} onClick={() => cambiarTab('utiles')}>Listado útiles</button>
            </div>

            {tab === 'registro' && advertencia && (
                <div className="alert" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 16 }}>
                    ⚠ {advertencia}
                </div>
            )}

            {tab === 'registro' && (
                <>
                    <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                </>
            )}

            {tab === 'canastas' && (
                <>
                    <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <button className="btn-sm" onClick={() => cargarCanastas()}>Actualizar</button>
                        <button className="btn-sm" onClick={exportarCanastasExcel}>Exportar Excel</button>
                        <button className="btn-sm" onClick={imprimir}>Imprimir</button>
                    </div>

                    {loadingCanastas ? <p>Cargando...</p> : (
                        <table className="tabla print-area">
                            <thead>
                                <tr>
                                    <th>Nº Func.</th>
                                    <th>Documento</th>
                                    <th>Nombre</th>
                                    <th>Deuda libros</th>
                                    <th>Sucursal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listadoCanastas.length === 0 ? (
                                    <tr><td colSpan={5}>No hay registros</td></tr>
                                ) : listadoCanastas.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.NroFuncionario || '—'}</td>
                                        <td>{r.Documento}</td>
                                        <td>{r.NombreCompleto}</td>
                                        <td style={{ color: r.DeudaLibros ? 'var(--error)' : 'inherit', fontWeight: r.DeudaLibros ? 500 : 400 }}>
                                            {r.DeudaLibros ? 'Sí' : 'No'}
                                        </td>
                                        <td>{r.Ubicacion || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {tab === 'utiles' && (
                <>
                    <div className="toolbar no-print" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <button className="btn-sm" onClick={() => cargarUtiles()}>Actualizar</button>
                        <button className="btn-sm" onClick={exportarUtilesExcel}>Exportar Excel</button>
                        <button className="btn-sm" onClick={imprimir}>Imprimir</button>
                    </div>

                    {loadingUtiles ? <p>Cargando...</p> : (
                        <table className="tabla print-area">
                            <thead>
                                <tr>
                                    <th>Nº Func.</th>
                                    <th>Nombre socio</th>
                                    <th>CI</th>
                                    <th>Nombre hijo</th>
                                    <th>F. Nac.</th>
                                    <th>Edad</th>
                                    <th>Género</th>
                                    <th>Discapacidad</th>
                                    <th>Ubicación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listadoUtiles.length === 0 ? (
                                    <tr><td colSpan={9}>No hay registros</td></tr>
                                ) : listadoUtiles.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.NroFuncionario || '—'}</td>
                                        <td>{r.NombreSocio}</td>
                                        <td>{r.Documento}</td>
                                        <td>{r.NombreHijo}</td>
                                        <td>{formatFecha(r.FechaNacimiento)}</td>
                                        <td>{r.Edad ?? '—'}</td>
                                        <td>{r.Sexo || '—'}</td>
                                        <td>{r.Discapacidad ? 'Sí' : 'No'}</td>
                                        <td>{r.Ubicacion || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
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