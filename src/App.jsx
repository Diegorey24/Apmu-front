import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Afiliados from './pages/Afiliados';
import Autores from './pages/Autores';
import Rubros from './pages/Rubros';
import ProtectedRoute from './components/ProtectedRoute';
import CuentaCorriente from './pages/CuentaCorriente';

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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
