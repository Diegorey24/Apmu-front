import { useState, useEffect } from 'react';
import { getMaterias, createMateria, updateMateria, deleteMateria } from '../api/materias';
import Modal from '../components/Modal';

export default function Materias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const res = await getMaterias();
      setMaterias(res.data.data);
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

  const abrirEditar = (materia) => {
    setEditando(materia);
    setNombre(materia.Nombre);
    setError('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    try {
      if (editando) {
        await updateMateria(editando.Id, nombre);
      } else {
        await createMateria(nombre);
      }
      setModalOpen(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const eliminar = async (materia) => {
    if (!confirm(`¿Eliminar "${materia.Nombre}"?`)) return;
    try {
      await deleteMateria(materia.Id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Materias</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nueva materia</button>
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
            {materias.length === 0 ? (
              <tr><td colSpan={3}>No hay materias cargadas</td></tr>
            ) : (
              materias.map((m) => (
                <tr key={m.Id}>
                  <td>{m.Id}</td>
                  <td>{m.Nombre}</td>
                  <td>
                    <button className="btn-sm" onClick={() => abrirEditar(m)}>Editar</button>
                    <button className="btn-sm danger" onClick={() => eliminar(m)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar materia' : 'Nueva materia'}>
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