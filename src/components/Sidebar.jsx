import { NavLink, useNavigate } from 'react-router-dom';
import apmuLogo from '../assets/apmu-5.jpg';

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('apmu_token');
    navigate('/', { replace: true });
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <img src={apmuLogo} alt="APMU" />
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end onClick={handleNav}>Dashboard</NavLink>
        <NavLink to="/dashboard/afiliados" onClick={handleNav}>Afiliados</NavLink>
        <NavLink to="/dashboard/rubros" onClick={handleNav}>Rubros</NavLink>
        <NavLink to="/dashboard/autores" onClick={handleNav}>Autores</NavLink>
        <NavLink to="/dashboard/cuenta-corriente" onClick={handleNav}>Cuenta corriente</NavLink>
        <NavLink to="/dashboard/editoriales">Editoriales</NavLink>
        <NavLink to="/dashboard/materias">Materias</NavLink>
        <NavLink to="/dashboard/libros">Libros</NavLink>
        <NavLink to="/dashboard/prestamos">Préstamos</NavLink>
        
      </nav>
      <button className="sidebar-logout" onClick={logout}>Cerrar sesión</button>
    </aside>
  );
}

export default Sidebar;
