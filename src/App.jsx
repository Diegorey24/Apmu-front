import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
