import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cambiarPasswordPortal } from '../../api/portalSocio';

export default function PortalCambiarPassword() {
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [passwordConfirmar, setPasswordConfirmar] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

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
            await cambiarPasswordPortal({ passwordActual, passwordNueva });
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
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-h)' }}>

            {/* Header */}
            <div style={{
                background: 'var(--accent)',
                padding: '0 32px',
                height: 58,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>APMU</span>
                    <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>Portal del socio</span>
                </div>
                <button
                    onClick={() => navigate('/portal')}
                    style={{
                        background: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.28)',
                        borderRadius: 8,
                        color: '#fff',
                        padding: '6px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                    }}
                >
                    Volver
                </button>
            </div>

            <div style={{ maxWidth: 460, margin: '0 auto', padding: '28px 24px' }}>
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden',
                }}>
                    <div style={{ height: 6, background: 'var(--accent)' }} />
                    <div style={{ padding: '28px 28px' }}>
                        <h1 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Cambiar contraseña</h1>
                        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text)' }}>
                            Ingresá tu contraseña actual y la nueva para actualizarla.
                        </p>
                        <form onSubmit={handleSubmit}>
                            {[
                                { label: 'Contraseña actual', value: passwordActual, setter: setPasswordActual },
                                { label: 'Nueva contraseña', value: passwordNueva, setter: setPasswordNueva },
                                { label: 'Confirmar nueva contraseña', value: passwordConfirmar, setter: setPasswordConfirmar },
                            ].map(({ label, value, setter }) => (
                                <div key={label} style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)', marginBottom: 6 }}>
                                        {label}
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={value}
                                        onChange={e => setter(e.target.value)}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            padding: '9px 12px', borderRadius: 8,
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg)', color: 'var(--text-h)',
                                            fontFamily: 'var(--sans)', fontSize: 14,
                                        }}
                                    />
                                </div>
                            ))}

                            {error && (
                                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{error}</p>
                            )}
                            {exito && (
                                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 500, color: '#16a34a' }}>{exito}</p>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    background: 'var(--accent)', color: '#fff',
                                    border: 'none', borderRadius: 8,
                                    padding: '10px 22px', fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--sans)', opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? 'Guardando...' : 'Actualizar contraseña'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
