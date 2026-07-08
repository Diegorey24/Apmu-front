import { useState, useEffect } from 'react';
import { getUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from '../api/ubicaciones';
import Modal from '../components/Modal';

const TIPOS = ['Central', 'Sucursal', 'Filial'];
const FORM_VACIO = { codigo: '', tipo: 'Central', nombre: '' };

export default function Ubicaciones() {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [error, setError] = useState('');

    const cargar = async () => {
        try {
            const res = await getUbicaciones();
            setUbicaciones(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const abrirCrear = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setError('');
        setModalOpen(true);
    };

    const abrirEditar = (u) => {
        setEditando(u);
        setForm({ codigo: u.Codigo, tipo: u.Tipo, nombre: u.Nombre });
        setError('');
        setModalOpen(true);
    };

    const guardar = async () => {
        if (!form.codigo) { setError('El código es obligatorio'); return; }
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
        try {
            if (editando) {
                await updateUbicacion(editando.Id, form);
            } else {
                await createUbicacion(form);
            }
            setModalOpen(false);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const eliminar = async (u) => {
        if (!confirm(`¿Eliminar "${u.Nombre}"?`)) return;
        try {
            await deleteUbicacion(u.Id);
            cargar();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Ubicaciones</h1>
                <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva ubicación</button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ubicaciones.length === 0 ? (
                            <tr><td colSpan={4}>No hay ubicaciones cargadas</td></tr>
                        ) : ubicaciones.map(u => (
                            <tr key={u.Id}>
                                <td>{u.Codigo}</td>
                                <td>{u.Tipo}</td>
                                <td>{u.Nombre}</td>
                                <td>
                                    <button className="btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                                    <button className="btn-sm danger" onClick={() => eliminar(u)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                title={editando ? 'Editar ubicación' : 'Nueva ubicación'}>
                <div className="form-group">
                    <label>Código *</label>
                    <input className="form-control" type="number" value={form.codigo}
                        onChange={e => setField('codigo', e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                    <label>Tipo *</label>
                    <select className="form-control" value={form.tipo}
                        onChange={e => setField('tipo', e.target.value)}>
                        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Nombre *</label>
                    <input className="form-control" value={form.nombre}
                        onChange={e => setField('nombre', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && guardar()} />
                </div>
                {error && <span className="error">{error}</span>}
                <div className="modal-actions">
                    <button className="btn-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                    <button className="btn-primary btn-inline" onClick={guardar}>Guardar</button>
                </div>
            </Modal>
        </div>
    );
}