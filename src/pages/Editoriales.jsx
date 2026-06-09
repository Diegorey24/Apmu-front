import { useState, useEffect } from 'react';
import { getEditoriales, createEditorial, updateEditorial, deleteEditorial } from '../api/editoriales';
import Modal from '../components/Modal';

export default function Editoriales() {
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null); // null = crear, objeto = editar
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const res = await getEditoriales();
      setEditoriales(res.data.data);
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

  const abrirEditar = (editorial) => {
    setEditando(editorial);
    setNombre(editorial.Nombre);
    setError('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    try {
      if (editando) {
        await updateEditorial(editando.Id, nombre);
      } else {
        await createEditorial(nombre);
      }
      setModalOpen(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const eliminar = async (editorial) => {
    if (!confirm(`¿Eliminar "${editorial.Nombre}"?`)) return;
    try {
      await deleteEditorial(editorial.Id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Editoriales</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva editorial</button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {editoriales.length === 0 ? (
              <tr><td colSpan={3}>No hay editoriales cargadas</td></tr>
            ) : (
              editoriales.map((e) => (
                <tr key={e.Id}>
                  <td>{e.Id}</td>
                  <td>{e.Nombre}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => abrirEditar(e)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => eliminar(e)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar editorial' : 'Nueva editorial'}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardar()}
            autoFocus
          />
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