import { useState, useEffect } from 'react';
import { getLibros, createLibro, updateLibro, bajaLibro, altaLibro } from '../api/libros';
import { getEditoriales } from '../api/editoriales';
import { getMaterias } from '../api/materias';
import Modal from '../components/Modal';

const FORM_VACIO = {
  isbn: '', nombre: '', edicion: '', idEditorial: '', idMateria: '',
  tipo: 'Literatura', material: '', stock: 0,
};

export default function Libros() {
  const [libros, setLibros] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const cargar = async (filtros = {}) => {
    try {
      const res = await getLibros(filtros);
      setLibros(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    getEditoriales().then(r => setEditoriales(r.data.data));
    getMaterias().then(r => setMaterias(r.data.data));
  }, []);

  const aplicarFiltros = () => {
    cargar({
      tipo: filtroTipo || undefined,
      idMateria: filtroMateria || undefined,
      busqueda: filtroBusqueda || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroMateria('');
    setFiltroBusqueda('');
    cargar();
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setModalOpen(true);
  };

  const abrirEditar = (libro) => {
    setEditando(libro);
    setForm({
      isbn: libro.ISBN || '',
      nombre: libro.Nombre || '',
      edicion: libro.Edicion || '',
      idEditorial: libro.IdEditorial || '',
      idMateria: libro.IdMateria || '',
      tipo: libro.Tipo || 'Literatura',
      material: libro.Material || '',
      stock: libro.Stock ?? 0,
    });
    setError('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.tipo) { setError('El tipo es obligatorio'); return; }
    try {
      if (editando) {
        await updateLibro(editando.Id, form);
      } else {
        await createLibro(form);
      }
      setModalOpen(false);
      cargar({ tipo: filtroTipo || undefined, idMateria: filtroMateria || undefined, busqueda: filtroBusqueda || undefined });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const toggleBaja = async (libro) => {
    const activo = !libro.FechaBaja;
    const msg = activo
      ? `¿Dar de baja "${libro.Nombre}"?`
      : `¿Reactivar "${libro.Nombre}"?`;
    if (!confirm(msg)) return;
    try {
      if (activo) await bajaLibro(libro.Id);
      else await altaLibro(libro.Id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Libros</h1>
        <button className="btn-primary btn-inline" onClick={abrirCrear}>+ Nuevo libro</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre o ISBN..."
          value={filtroBusqueda}
          onChange={e => setFiltroBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
        />
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="Literatura">Literatura</option>
          <option value="Estudio">Estudio</option>
        </select>
        <select value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}
          disabled={filtroTipo !== 'Estudio'}>
          <option value="">Todas las materias</option>
          {materias.map(m => <option key={m.Id} value={m.Id}>{m.Nombre}</option>)}
        </select>
        <button className="btn-primary btn-inline" onClick={aplicarFiltros}>Buscar</button>
        <button className="btn-sm" onClick={limpiarFiltros}>Limpiar</button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>ISBN</th>
              <th>Tipo</th>
              <th>Editorial</th>
              <th>Materia</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {libros.length === 0 ? (
              <tr><td colSpan={8}>No hay libros</td></tr>
            ) : (
              libros.map(l => (
                <tr key={l.Id} style={{ opacity: l.FechaBaja ? 0.5 : 1 }}>
                  <td>{l.Nombre}</td>
                  <td>{l.ISBN || '-'}</td>
                  <td>{l.Tipo}</td>
                  <td>{l.NombreEditorial || '-'}</td>
                  <td>{l.NombreMateria || '-'}</td>
                  <td>{l.Stock}</td>
                  <td>{l.FechaBaja ? 'Baja' : 'Activo'}</td>
                  <td>
                    <button className="btn-sm" onClick={() => abrirEditar(l)}>Editar</button>
                    <button
                      className={`btn-sm ${l.FechaBaja ? '' : 'danger'}`}
                      onClick={() => toggleBaja(l)}
                    >
                      {l.FechaBaja ? 'Reactivar' : 'Dar de baja'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar libro' : 'Nuevo libro'}>
        <div className="form-group">
          <label>Nombre *</label>
          <input className="form-control" value={form.nombre}
            onChange={e => setField('nombre', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label>Tipo *</label>
          <select className="form-control" value={form.tipo}
            onChange={e => setField('tipo', e.target.value)}>
            <option value="Literatura">Literatura</option>
            <option value="Estudio">Estudio</option>
          </select>
        </div>
        <div className="form-group">
          <label>ISBN</label>
          <input className="form-control" value={form.isbn}
            onChange={e => setField('isbn', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Edición</label>
          <input className="form-control" value={form.edicion}
            onChange={e => setField('edicion', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Editorial</label>
          <select className="form-control" value={form.idEditorial}
            onChange={e => setField('idEditorial', e.target.value)}>
            <option value="">Sin editorial</option>
            {editoriales.map(e => <option key={e.Id} value={e.Id}>{e.Nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Materia</label>
          <select className="form-control" value={form.idMateria}
            onChange={e => setField('idMateria', e.target.value)}
            disabled={form.tipo !== 'Estudio'}>
            <option value="">Sin materia</option>
            {materias.map(m => <option key={m.Id} value={m.Id}>{m.Nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Material</label>
          <input className="form-control" value={form.material}
            onChange={e => setField('material', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Stock inicial</label>
          <input className="form-control" type="number" min="0" value={form.stock}
            onChange={e => setField('stock', parseInt(e.target.value) || 0)} />
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