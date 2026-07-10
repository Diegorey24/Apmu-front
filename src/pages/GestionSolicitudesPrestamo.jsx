import { useState, useEffect } from 'react';
import { getSolicitudesPrestamo, aprobarSolicitudPrestamo, rechazarSolicitudPrestamo } from '../api/solicitudesprestamo';
import Modal from '../components/Modal';

export default function GestionSolicitudesPrestamo() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('Pendiente');
    const [modalRechazar, setModalRechazar] = useState(null);
    const [modalAprobar, setModalAprobar] = useState(null);
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [error, setError] = useState('');

    const cargar = async (estado) => {
        setLoading(true);
        try {
            const res = await getSolicitudesPrestamo({ estado: estado || undefined });
            setSolicitudes(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar('Pendiente'); }, []);

    const aprobar = async () => {
        try {
            await aprobarSolicitudPrestamo(modalAprobar.Id, fechaVencimiento || null);
            setModalAprobar(null);
            cargar(filtroEstado);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al aprobar');
        }
    };

    const rechazar = async () => {
        try {
            await rechazarSolicitudPrestamo(modalRechazar.Id, observaciones);
            setModalRechazar(null);
            cargar(filtroEstado);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al rechazar');
        }
    };

    const estadoBadge = (estado) => {
        const colores = { Pendiente: '#f59e0b', Aprobada: '#16a34a', Rechazada: '#dc2626' };
        return (
            <span style={{ background: colores[estado] || '#888', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>
                {estado}
            </span>
        );
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Solicitudes de préstamo</h1>
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
                            <th>Afiliado</th>
                            <th>Documento</th>
                            <th>Libro</th>
                            <th>Tipo</th>
                            <th>Stock</th>
                            <th>Fecha solicitud</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitudes.length === 0 ? (
                            <tr><td colSpan={8}>No hay solicitudes</td></tr>
                        ) : solicitudes.map(s => (
                            <tr key={s.Id}>
                                <td>{s.NombreAfiliado}</td>
                                <td>{s.Documento}</td>
                                <td>{s.NombreLibro}</td>
                                <td>{s.Tipo}</td>
                                <td>{s.Stock}</td>
                                <td>{s.FechaSolicitud?.substring(0, 10)}</td>
                                <td>{estadoBadge(s.Estado)}</td>
                                <td>
                                    {s.Estado === 'Pendiente' && (
                                        <>
                                            <button className="btn-sm" onClick={() => { setModalAprobar(s); setFechaVencimiento(''); setError(''); }}>
                                                Aprobar
                                            </button>
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

            <Modal isOpen={!!modalAprobar} onClose={() => setModalAprobar(null)}
                title={`Aprobar solicitud — ${modalAprobar?.NombreLibro}`}>
                {modalAprobar && (
                    <>
                        <p style={{ marginBottom: 16 }}>
                            <strong>{modalAprobar.NombreAfiliado}</strong> solicita el libro <strong>{modalAprobar.NombreLibro}</strong>.
                        </p>
                        <div className="form-group">
                            <label>Fecha de vencimiento (opcional)</label>
                            <input type="date" className="form-control" value={fechaVencimiento}
                                onChange={e => setFechaVencimiento(e.target.value)} />
                        </div>
                        {error && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
                        <div className="modal-actions">
                            <button className="btn-sm" onClick={() => setModalAprobar(null)}>Cancelar</button>
                            <button className="btn-primary btn-inline" onClick={aprobar}>Confirmar</button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal isOpen={!!modalRechazar} onClose={() => setModalRechazar(null)}
                title={`Rechazar solicitud — ${modalRechazar?.NombreLibro}`}>
                {modalRechazar && (
                    <>
                        <div className="form-group">
                            <label>Motivo (opcional)</label>
                            <textarea className="form-control" rows={3} value={observaciones}
                                onChange={e => setObservaciones(e.target.value)} />
                        </div>
                        {error && <span className="error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
                        <div className="modal-actions">
                            <button className="btn-sm" onClick={() => setModalRechazar(null)}>Cancelar</button>
                            <button className="btn-primary btn-inline" style={{ background: 'var(--error)' }} onClick={rechazar}>
                                Rechazar
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}