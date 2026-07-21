import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import apmuLogo from '../assets/apmu-5.jpg';

const grupos = [
  {
    id: 'socios',
    label: 'Gestión de socios',
    links: [
      { to: '/afiliados', label: 'Afiliados' },
      { to: '/categorias', label: 'Categorías' },
      { to: '/rubros', label: 'Rubros' },
      { to: '/ubicaciones', label: 'Ubicaciones' },
      { to: '/solicitudes-afiliacion', label: 'Solicitudes de afiliación' },
      { to: '/importacion-aportes', label: 'Importar aportes' },
    ],
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    links: [
      { to: '/libros', label: 'Libros' },
      { to: '/editoriales', label: 'Editoriales' },
      { to: '/materias', label: 'Materias' },
      { to: '/prestamos', label: 'Préstamos' },
      { to: '/autores', label: 'Autores' },
      { to: '/solicitudes-prestamo', label: 'Solicitudes de préstamo' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    links: [
      { to: '/cuenta-corriente', label: 'Aportes' },
      { to: '/cajachica', label: 'Caja chica' },
      { to: '/creditos', label: 'Créditos Históricos CPMU' },
    ],
  },
  {
    id: 'gremial',
    label: 'Gestión gremial',
    links: [
      { to: '/licencias-gremiales', label: 'Licencias gremiales' },
      { to: '/beneficios', label: 'Beneficios' },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    links: [
      { to: '/reportes', label: 'Reportes' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    links: [
      { to: '/solicitudes-acceso', label: 'Solicitudes de acceso' },
      { to: '/usuarios-web', label: 'Usuarios del sistema' },
    ],
  },
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const grupoActivo = grupos.find(g =>
    g.links.some(l => location.pathname.startsWith(l.to))
  )?.id;

  const [abiertos, setAbiertos] = useState(grupoActivo ? [grupoActivo] : []);

  const logout = () => {
    localStorage.removeItem('apmu_token');
    navigate('/login', { replace: true });
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  const toggleGrupo = (id) => {
    setAbiertos(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <img src={apmuLogo} alt="APMU" />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end onClick={handleNav}>
          Dashboard
        </NavLink>

        {grupos.map(grupo => {
          const estaAbierto = abiertos.includes(grupo.id);
          const tieneActivo = grupo.links.some(l => location.pathname.startsWith(l.to));

          return (
            <div key={grupo.id}>
              <button
                onClick={() => toggleGrupo(grupo.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  background: tieneActivo ? 'var(--accent-bg)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--sans)',
                  color: tieneActivo ? 'var(--accent)' : 'var(--text)',
                  textAlign: 'left',
                }}
              >
                {grupo.label}
                <span style={{
                  fontSize: 10,
                  transition: 'transform 0.2s',
                  transform: estaAbierto ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  opacity: 0.6,
                }}>▼</span>
              </button>

              {estaAbierto && (
                <div style={{
                  paddingLeft: 8,
                  borderLeft: '2px solid var(--border)',
                  marginLeft: 12,
                  marginBottom: 4,
                }}>
                  {grupo.links.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={handleNav}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={logout}>Cerrar sesión</button>
    </aside>
  );
}

export default Sidebar;