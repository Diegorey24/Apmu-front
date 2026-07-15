import { useState, useEffect } from 'react';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../api/categorias';
import Modal from '../components/Modal';

export default function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');

    const cargar = async () => {
        try {
            const res = await getCategorias();
            setCategorias(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const abrirCrear = () => {
        setEditando(null);
        setNombre('');
        setError('');
        setModalOpen(true);
    };

    const abrirEditar = (cat) => {
        setEditando(cat);
        setNombre(cat.Nombre);
        setError('');
        setModalOpen(true);
    };

    const guardar = async () => {
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
        try {
            if (editando) {
                await updateCategoria(editando.Id, nombre);
            } else {
                await createCategoria(nombre);
            }
            setModalOpen(false);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const eliminar = async (cat) => {
        if (!confirm(`¿Eliminar "${cat.Nombre}"?`)) return;
        try {
            await deleteCategoria(cat.Id);
            cargar();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Categorías de afiliados</h1>
                <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva categoría</button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.length === 0 ? (
                            <tr><td colSpan={2}>No hay categorías</td></tr>
                        ) : categorias.map(c => (
                            <tr key={c.Id}>
                                <td>{c.Nombre}</td>
                                <td>
                                    <button className="btn-sm" onClick={() => abrirEditar(c)}>Editar</button>
                                    <button className="btn-sm danger" onClick={() => eliminar(c)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                title={editando ? 'Editar categoría' : 'Nueva categoría'}>
                <div className="form-group">
                    <label>Nombre</label>
                    <input className="form-control" value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && guardar()}
                        autoFocus />
                    {error && <span className="error">{error}</span>}
                </div>
                <div className="modal-actions">
                    <button className="btn-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                    <button className="btn-primary btn-inline" onClick={guardar}>Guardar</button>
                </div>
            </Modal>
        </div>
    );
}