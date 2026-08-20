import { useState } from 'react';
import client from '../api/client';

export default function CambiarPassword() {
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [passwordConfirmar, setPasswordConfirmar] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        if (!passwordActual || !passwordNueva || !passwordConfirmar) {
            setError('Completá todos los campos'); return;
        }
        if (passwordNueva !== passwordConfirmar) {
            setError('La nueva contraseña y su confirmación no coinciden'); return;
        }
        if (passwordNueva.length < 6) {
            setError('La contraseña nueva debe tener al menos 6 caracteres'); return;
        }

        setSaving(true);
        try {
            await client.put('/usuarios/cambiar-password', { passwordActual, passwordNueva });
            setExito('Contraseña actualizada correctamente');
            setPasswordActual('');
            setPasswordNueva('');
            setPasswordConfirmar('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar la contraseña');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2 className="page-title">Cambiar contraseña</h2>
            </div>

            <div style={{ maxWidth: 420 }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Contraseña actual *</label>
                        <input
                            type="password"
                            className="form-control"
                            value={passwordActual}
                            onChange={e => setPasswordActual(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña nueva *</label>
                        <input
                            type="password"
                            className="form-control"
                            value={passwordNueva}
                            onChange={e => setPasswordNueva(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar contraseña nueva *</label>
                        <input
                            type="password"
                            className="form-control"
                            value={passwordConfirmar}
                            onChange={e => setPasswordConfirmar(e.target.value)}
                        />
                    </div>

                    {error && <p className="alert alert-error">{error}</p>}
                    {exito && <p className="alert" style={{ color: '#16a34a' }}>{exito}</p>}

                    <button type="submit" className="btn-primary btn-inline" disabled={saving}>
                        {saving ? 'Guardando...' : 'Actualizar contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
