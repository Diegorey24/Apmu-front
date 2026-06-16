import { BrowserRouter, Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Afiliados from './pages/Afiliados';
import Autores from './pages/Autores';
import Rubros from './pages/Rubros';
import ProtectedRoute from './components/ProtectedRoute';
import CuentaCorriente from './pages/CuentaCorriente';
import Editoriales from './pages/Editoriales';
import Materias from './pages/Materias';
import Libros from './pages/Libros';
import Prestamos from './pages/Prestamos';
import Reportes from './pages/Reportes';
import Creditos from './pages/Creditos';
import CajaChica from './pages/CajaChica';
import SolicitudesAcceso from './pages/SolicitudesAcceso';
import PortalLogin from './pages/portal/PortalLogin';
import PortalHome from './pages/portal/PortalHome';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Portal del socio*/}
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal" element={<PortalHome />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="afiliados" element={<Afiliados />} />
          <Route path="autores" element={<Autores />} />
          <Route path="rubros" element={<Rubros />} />
          <Route path="cuenta-corriente" element={<CuentaCorriente />} />
          <Route path="editoriales" element={<Editoriales />} />
          <Route path="materias" element={<Materias />} />
          <Route path="libros" element={<Libros />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="creditos" element={<Creditos />} />
          <Route path="cajachica" element={<CajaChica />} />
          <Route path="solicitudes-acceso" element={<SolicitudesAcceso />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;