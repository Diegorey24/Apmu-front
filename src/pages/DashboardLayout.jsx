import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const main = document.querySelector('.layout-main');
    if (main) main.scrollTo(0, 0);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('apmu_token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <div className="topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <span /><span /><span />
        </button>
        <button className="topbar-logout" onClick={logout}>Cerrar sesión</button>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="layout-main">
        <Outlet />
        <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <img src="/apmu/Macrosoft.png" alt="Macrosoft" style={{ height: 16, opacity: 0.5 }} />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
