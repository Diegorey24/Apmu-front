import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginSocio, registrarSocio } from '../../api/portalSocio';

export default function PortalLogin() {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginSocio({ documento, password });
      localStorage.setItem('portal_token', res.data.data.token);
      localStorage.setItem('portal_nombre', res.data.data.nombre);
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await registrarSocio({ documento, email, password });
      setExito('Solicitud enviada. APMU revisará tu solicitud y te habilitará el acceso.');
      setDocumento('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--color-background-primary)'
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: 32,
        background: 'var(--color-background-secondary)',
        borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/apmu/apmu-5.jpg" alt="APMU" style={{ width: 80, borderRadius: 12 }} />
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>Portal APMU</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {modo === 'login' ? 'Ingresá con tu documento y contraseña' : 'Solicitá tu acceso al portal'}
        </p>

        <form onSubmit={modo === 'login' ? handleLogin : handleRegistro}>
          <div className="form-group">
            <label>Documento (CI)</label>
            <input className="form-control" value={documento}
              onChange={e => setDocumento(e.target.value)} autoFocus required />
          </div>

          {modo === 'registro' && (
            <div className="form-group">
              <label>Email (opcional)</label>
              <input className="form-control" type="email" value={email}
                onChange={e => setEmail(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label>Contraseña</label>
            <input className="form-control" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p style={{ color: 'var(--color-text-danger)', fontSize: 13, margin: '8px 0' }}>{error}</p>}
          {exito && <p style={{ color: 'var(--color-text-success)', fontSize: 13, margin: '8px 0' }}>{exito}</p>}

          <button type="submit" className="btn-primary btn-inline"
            style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar' : 'Solicitar acceso'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {modo === 'login'
            ? <span>¿No tenés acceso? <button onClick={() => { setModo('registro'); setError(''); setExito(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13 }}>
              Solicitá uno acá
            </button></span>
            : <span>¿Ya tenés acceso? <button onClick={() => { setModo('login'); setError(''); setExito(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 13 }}>
              Iniciá sesión
            </button></span>
          }
        </p>
      </div>
      </div>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <img src="/apmu/Macrosoft.png" alt="Macrosoft" style={{ height: 16, opacity: 0.6 }} />
      </div>
    </div>
  );
}