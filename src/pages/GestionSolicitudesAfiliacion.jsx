import { useState, useEffect } from 'react';
import { getSolicitudesAfiliacion, aprobarSolicitud, rechazarSolicitud } from '../api/solicitudesafiliacion';
import Modal from '../components/Modal';

export default function GestionSolicitudesAfiliacion() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('Pendiente');
    const [modalRechazar, setModalRechazar] = useState(null);
    const [observaciones, setObservaciones] = useState('');
    const [error, setError] = useState('');
    const [modalDetalle, setModalDetalle] = useState(null);

    const cargar = async (estado) => {
        setLoading(true);
        try {
            const res = await getSolicitudesAfiliacion(estado || undefined);
            setSolicitudes(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar('Pendiente'); }, []);

    const aprobar = async (id) => {
        if (!confirm('¿Aprobar esta solicitud? Se creará el afiliado automáticamente.')) return;
        try {
            await aprobarSolicitud(id);
            cargar(filtroEstado);
        } catch (err) {
            alert(err.response?.data?.message || 'Error al aprobar');
        }
    };

    const confirmarRechazo = async () => {
        try {
            await rechazarSolicitud(modalRechazar.Id, observaciones);
            setModalRechazar(null);
            cargar(filtroEstado);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al rechazar');
        }
    };

    const estadoBadge = (estado) => {
        const colores = { Pendiente: '#f59e0b', Aprobada: '#16a34a', Rechazada: '#dc2626' };
        return (
            <span style={{
                background: colores[estado] || '#888', color: '#fff',
                borderRadius: 4, padding: '2px 8px', fontSize: 12
            }}>{estado}</span>
        );
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Solicitudes de afiliación</h1>
            </div>

            <div className="toolbar">
                <select className="form-control" value={filtroEstado}
                    onChange={e => { setFiltroEstado(e.target.value); cargar(e.target.value); }}>
                    <option value="">Todas</option>
                    <option value="Pendiente">Pendientes</option>
                    <option value="Aprobada">Aprobadas</option>
                    <option value="Rechazada">Rechazadas</option>
                </select>
            </div>

            {loading ? <p>Cargando...</p> : (
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Documento</th>
                            <th>Nº Func.</th>
                            <th>Mail</th>
                            <th>Celular</th>
                            <th>Ubicación</th>
                            <th>Fecha solicitud</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitudes.length === 0 ? (
                            <tr><td colSpan={9}>No hay solicitudes</td></tr>
                        ) : solicitudes.map(s => (
                            <tr key={s.Id}>
                                <td>{s.PrimerNombre} {s.PrimerApellido} {s.SegundoApellido || ''}</td>
                                <td>{s.Documento}</td>
                                <td>{s.NroFuncionario || '—'}</td>
                                <td>{s.Mail || '—'}</td>
                                <td>{s.Celular || '—'}</td>
                                <td>{s.UbicacionNombre || '—'}</td>
                                <td>{s.FechaSolicitud?.substring(0, 10)}</td>
                                <td>{estadoBadge(s.Estado)}</td>
                                <td>
                                    <button className="btn-sm" onClick={() => setModalDetalle(s)}>Ver</button>
                                    {s.Estado === 'Pendiente' && (
                                        <>
                                            <button className="btn-sm" onClick={() => aprobar(s.Id)}>Aprobar</button>
                                            <button className="btn-sm danger" onClick={() => { setModalRechazar(s); setObservaciones(''); setError(''); }}>
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={!!modalDetalle} onClose={() => setModalDetalle(null)}
                title="Detalle de solicitud">
                {modalDetalle && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
                        <div><strong>Documento:</strong> {modalDetalle.Documento}</div>
                        <div><strong>Nº Funcionario:</strong> {modalDetalle.NroFuncionario || '—'}</div>
                        <div><strong>Primer nombre:</strong> {modalDetalle.PrimerNombre}</div>
                        <div><strong>Segundo nombre:</strong> {modalDetalle.SegundoNombre || '—'}</div>
                        <div><strong>Primer apellido:</strong> {modalDetalle.PrimerApellido}</div>
                        <div><strong>Segundo apellido:</strong> {modalDetalle.SegundoApellido || '—'}</div>
                        <div><strong>Fecha nacimiento:</strong> {modalDetalle.FechaNacimiento?.substring(0, 10) || '—'}</div>
                        <div><strong>Estado civil:</strong> {modalDetalle.EstadoCivil || '—'}</div>
                        <div><strong>Mail:</strong> {modalDetalle.Mail || '—'}</div>
                        <div><strong>Celular:</strong> {modalDetalle.Celular || '—'}</div>
                        <div><strong>Teléfono:</strong> {modalDetalle.Telefono || '—'}</div>
                        <div><strong>Departamento:</strong> {modalDetalle.Departamento || '—'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Domicilio:</strong> {modalDetalle.Domicilio || '—'}</div>
                        <div><strong>Cargo:</strong> {modalDetalle.Cargo || '—'}</div>
                        <div><strong>Fecha ingreso:</strong> {modalDetalle.FechaIngreso?.substring(0, 10) || '—'}</div>
                        <div><strong>Sector:</strong> {modalDetalle.Sector || '—'}</div>
                        <div><strong>Turno:</strong> {modalDetalle.Turno || '—'}</div>
                        <div><strong>Ubicación:</strong> {modalDetalle.UbicacionNombre || '—'}</div>
                        <div><strong>Estado:</strong> {modalDetalle.Estado}</div>
                        {modalDetalle.Observaciones && (
                            <div style={{ gridColumn: '1 / -1' }}><strong>Observaciones:</strong> {modalDetalle.Observaciones}</div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!modalRechazar} onClose={() => setModalRechazar(null)}
                title={`Rechazar solicitud — ${modalRechazar?.PrimerNombre} ${modalRechazar?.PrimerApellido}`}>
                {modalRechazar && (
                    <>
                        <div className="form-group">
                            <label>Motivo del rechazo (opcional)</label>
                            <textarea className="form-control" rows={3} value={observaciones}
                                onChange={e => setObservaciones(e.target.value)} placeholder="Podés dejar una nota..." />
                        </div>
                        {error && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
                        <div className="modal-actions">
                            <button className="btn-sm" onClick={() => setModalRechazar(null)}>Cancelar</button>
                            <button className="btn-primary btn-inline" style={{ background: 'var(--error)' }}
                                onClick={confirmarRechazo}>Confirmar rechazo</button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}