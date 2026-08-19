import { useState, useEffect, useRef } from 'react';
import { getRole } from '../utils/auth';
import * as XLSX from 'xlsx';
import { getLicencias, createLicencia, updateLicencia, deleteLicencia } from '../api/licenciasgremiales';
import { searchAfiliados } from '../api/afiliados';
import Modal from '../components/Modal';
import { confirmDialog } from '../components/ConfirmDialog';

const FORM_VACIO = {
    idAfiliado: '', solicitadaPor: '', horario: '',
    fechaLicencia: '', pedidaPor: '', convocatoria: '', comision: '',
};

export default function LicenciasGremiales() {
    const [licencias, setLicencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [error, setError] = useState('');

    // Filtros
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

    // Autocomplete afiliado
    const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
    const [sugerencias, setSugerencias] = useState([]);
    const [afiliadoSeleccionado, setAfiliadoSeleccionado] = useState(null);
    const timeoutRef = useRef(null);

    const esConsulta = getRole() === 'Consulta';

    const cargar = async (filtros = {}) => {
        setLoading(true);
        try {
            const res = await getLicencias(filtros);
            setLicencias(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const aplicarFiltros = () => {
        cargar({
            fechaDesde: filtroFechaDesde || undefined,
            fechaHasta: filtroFechaHasta || undefined,
        });
    };

    const limpiarFiltros = () => {
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
        cargar();
    };

    const exportarExcel = () => {
        const filas = licencias.map(l => ({
            Afiliado: l.NombreAfiliado,
            'Nº Funcionario': l.NroFuncionario || '',
            'Cargo/Sector': [l.Cargo, l.Sector].filter(Boolean).join(' / '),
            Horario: l.Horario || '',
            Fecha: l.FechaLicencia?.substring(0, 10) || '',
            'Solicitada por': l.SolicitadaPor || '',
            'Pedida por': l.PedidaPor || '',
            Convocatoria: l.Convocatoria || '',
            Comisión: l.Comision || '',
        }));
        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Licencias gremiales');
        XLSX.writeFile(libro, 'licencias_gremiales.xlsx');
    };

    const imprimir = () => {
        window.print();
    };

    const onBusquedaAfiliado = (valor) => {
        setBusquedaAfiliado(valor);
        setAfiliadoSeleccionado(null);
        setForm(f => ({ ...f, idAfiliado: '' }));
        clearTimeout(timeoutRef.current);
        if (valor.length < 2) { setSugerencias([]); return; }
        timeoutRef.current = setTimeout(async () => {
            const res = await searchAfiliados(valor);
            setSugerencias(res.data.data);
        }, 300);
    };

    const seleccionarAfiliado = (a) => {
        setAfiliadoSeleccionado(a);
        setForm(f => ({ ...f, idAfiliado: a.Id }));
        setBusquedaAfiliado(`${a.PrimerNombre} ${a.PrimerApellido} — ${a.Documento}`);
        setSugerencias([]);
    };

    const abrirCrear = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setBusquedaAfiliado('');
        setAfiliadoSeleccionado(null);
        setSugerencias([]);
        setError('');
        setModalOpen(true);
    };

    const abrirEditar = (lic) => {
        setEditando(lic);
        setForm({
            idAfiliado: lic.IdAfiliado,
            solicitadaPor: lic.SolicitadaPor || '',
            horario: lic.Horario || '',
            fechaLicencia: lic.FechaLicencia?.substring(0, 10) || '',
            pedidaPor: lic.PedidaPor || '',
            convocatoria: lic.Convocatoria || '',
            comision: lic.Comision || '',
        });
        setBusquedaAfiliado(`${lic.NombreAfiliado} — ${lic.Documento}`);
        setAfiliadoSeleccionado({ Id: lic.IdAfiliado, NroFuncionario: lic.NroFuncionario, Cargo: lic.Cargo });
        setSugerencias([]);
        setError('');
        setModalOpen(true);
    };

    const guardar = async () => {
        if (!form.idAfiliado) { setError('Seleccioná un afiliado'); return; }
        if (!form.fechaLicencia) { setError('La fecha es obligatoria'); return; }
        try {
            if (editando) {
                await updateLicencia(editando.Id, form);
            } else {
                await createLicencia(form);
            }
            setModalOpen(false);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const eliminar = async (lic) => {
        if (!(await confirmDialog(`¿Eliminar licencia de ${lic.NombreAfiliado}?`))) return;
        try {
            await deleteLicencia(lic.Id);
            cargar();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Licencias gremiales</h1>
                {!esConsulta && <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva licencia</button>}
            </div>

            <div className="toolbar" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Desde</label>
                    <input type="date" className="form-control" value={filtroFechaDesde}
                        onChange={e => setFiltroFechaDesde(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Hasta</label>
                    <input type="date" className="form-control" value={filtroFechaHasta}
                        onChange={e => setFiltroFechaHasta(e.target.value)} />
                </div>
                <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
                <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
                <button className="btn-sm no-print" onClick={exportarExcel}>Exportar Excel</button>
                <button className="btn-sm no-print" onClick={imprimir}>Imprimir</button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="print-area">
                    <h2 className="print-title">LICENCIAS GREMIALES</h2>
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Afiliado</th>
                                <th>Nº Func.</th>
                                <th>Cargo/Sector</th>
                                <th>Horario</th>
                                <th>Fecha</th>
                                <th>Solicitada por</th>
                                <th>Pedida por</th>
                                <th>Convocatoria</th>
                                {!esConsulta && <th className="no-print">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {licencias.length === 0 ? (
                                <tr><td colSpan={9}>No hay licencias</td></tr>
                            ) : licencias.map(l => (
                                <tr key={l.Id}>
                                    <td>{l.NombreAfiliado}</td>
                                    <td>{l.NroFuncionario || '—'}</td>
                                    <td>{[l.Cargo, l.Sector].filter(Boolean).join(' / ') || '—'}</td>
                                    <td>{l.Horario || '—'}</td>
                                    <td>{l.FechaLicencia?.substring(0, 10)}</td>
                                    <td>{l.SolicitadaPor || '—'}</td>
                                    <td>{l.PedidaPor || '—'}</td>
                                    <td>{l.Convocatoria || '—'}</td>
                                    {!esConsulta && (
                                        <td className="no-print">
                                            <button className="btn-sm" onClick={() => abrirEditar(l)}>Editar</button>
                                            <button className="btn-sm danger" onClick={() => eliminar(l)}>Eliminar</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                title={editando ? 'Editar licencia' : 'Nueva licencia'}>

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
                    {afiliadoSeleccionado && (
                        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text)' }}>
                            Nº Funcionario: <strong>{afiliadoSeleccionado.NroFuncionario || '—'}</strong>
                            {' · '}
                            Cargo: <strong>{afiliadoSeleccionado.Cargo || '—'}</strong>
                        </div>
                    )}
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Fecha de licencia *</label>
                        <input type="date" className="form-control" value={form.fechaLicencia}
                            onChange={e => setForm(f => ({ ...f, fechaLicencia: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Horario</label>
                        <input className="form-control" placeholder="Ej: 18-24"
                            value={form.horario}
                            onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Solicitada por</label>
                        <input className="form-control" value={form.solicitadaPor}
                            onChange={e => setForm(f => ({ ...f, solicitadaPor: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Pedida por</label>
                        <input className="form-control" value={form.pedidaPor}
                            onChange={e => setForm(f => ({ ...f, pedidaPor: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Convocatoria</label>
                        <input className="form-control" value={form.convocatoria}
                            onChange={e => setForm(f => ({ ...f, convocatoria: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Comisión</label>
                        <input className="form-control" value={form.comision}
                            onChange={e => setForm(f => ({ ...f, comision: e.target.value }))} />
                    </div>
                </div>

                {error && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
                <div className="modal-actions">
                    <button className="btn-sm" onClick={() => setModalOpen(false)}>{esConsulta ? 'Cerrar' : 'Cancelar'}</button>
                    {!esConsulta && <button className="btn-primary btn-inline" onClick={guardar}>Guardar</button>}
                </div>
            </Modal>
        </div>
    );
}