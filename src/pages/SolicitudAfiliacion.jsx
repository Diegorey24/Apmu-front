import { useState, useEffect } from 'react';
import { createSolicitudAfiliacion } from '../api/solicitudesafiliacion';
import axios from 'axios';

const FORM_VACIO = {
    nroFuncionario: '', documento: '', primerNombre: '', segundoNombre: '',
    primerApellido: '', segundoApellido: '', fechaNacimiento: '', estadoCivil: '',
    mail: '', departamento: '', domicilio: '', telefono: '', celular: '',
    cargo: '', fechaIngreso: '', sector: '', turno: '', idUbicacion: '',
};

export default function SolicitudAfiliacion() {
    const [form, setForm] = useState(FORM_VACIO);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/ubicaciones`)
            .then(r => setUbicaciones(r.data.data || []))
            .catch(() => { });
    }, []);

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.documento.trim()) { setError('El documento es obligatorio'); return; }
        if (!form.primerNombre.trim()) { setError('El nombre es obligatorio'); return; }
        if (!form.primerApellido.trim()) { setError('El apellido es obligatorio'); return; }
        // Validar cédula uruguaya
        const validarCI = (ci) => {
            const clean = ci.replace(/\D/g, '');
            if (clean.length < 7 || clean.length > 8) return false;
            const padded = clean.padStart(8, '0');
            const digits = padded.split('').map(Number);
            const factors = [2, 9, 8, 7, 6, 3, 4];
            let sum = 0;
            for (let i = 0; i < 7; i++) sum += digits[i] * factors[i];
            const check = (10 - (sum % 10)) % 10;
            return check === digits[7];
        };

        if (!validarCI(form.documento)) { setError('La cédula ingresada no es válida'); return; }

        if (form.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) {
            setError('El mail no es válido'); return;
        }

        if (form.celular && !/^09\d{7}$/.test(form.celular.replace(/\s/g, ''))) {
            setError('El celular debe tener formato 09XXXXXXX'); return;
        }

        if (form.telefono && !/^\d{7,8}$/.test(form.telefono.replace(/\s/g, ''))) {
            setError('El teléfono debe tener 7 u 8 dígitos'); return;
        }
        setSaving(true);
        try {
            await createSolicitudAfiliacion(form);
            setExito(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar la solicitud');
        } finally {
            setSaving(false);
        }
    };

    if (exito) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)', padding: 24
        }}>
            <div style={{
                background: 'var(--card-bg)', borderRadius: 16, padding: 48,
                maxWidth: 480, width: '100%', textAlign: 'center',
                border: '1px solid var(--border)'
            }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>✓</p>
                <h2 style={{ marginBottom: 12 }}>Solicitud enviada</h2>
                <p style={{ color: 'var(--text)' }}>
                    Tu solicitud fue recibida. La directiva de APMU la revisará y te notificará cuando sea procesada.
                </p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 600 }}>Solicitud de afiliación</h1>
                    <p style={{ color: 'var(--text)', marginTop: 8 }}>
                        Asociación del Personal de Médica Uruguaya — APMU
                    </p>
                </div>

                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 32, border: '1px solid var(--border)' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">

                            <p className="section-title">Datos personales</p>

                            <div className="form-group">
                                <label>Nº de funcionario</label>
                                <input className="form-control" value={form.nroFuncionario}
                                    onChange={e => setField('nroFuncionario', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Documento (CI) *</label>
                                <input className="form-control" value={form.documento}
                                    onChange={e => setField('documento', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Primer nombre *</label>
                                <input className="form-control" value={form.primerNombre}
                                    onChange={e => setField('primerNombre', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Segundo nombre</label>
                                <input className="form-control" value={form.segundoNombre}
                                    onChange={e => setField('segundoNombre', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Primer apellido *</label>
                                <input className="form-control" value={form.primerApellido}
                                    onChange={e => setField('primerApellido', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Segundo apellido</label>
                                <input className="form-control" value={form.segundoApellido}
                                    onChange={e => setField('segundoApellido', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Fecha de nacimiento</label>
                                <input type="date" className="form-control" value={form.fechaNacimiento}
                                    onChange={e => setField('fechaNacimiento', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Estado civil</label>
                                <select className="form-control" value={form.estadoCivil}
                                    onChange={e => setField('estadoCivil', e.target.value)}>
                                    <option value="">—</option>
                                    <option>Casado</option>
                                    <option>Divorciado</option>
                                    <option>Separado</option>
                                    <option>Soltero</option>
                                    <option>Union de hecho</option>
                                    <option>Viudo</option>
                                </select>
                            </div>

                            <p className="section-title">Contacto</p>

                            <div className="form-group">
                                <label>Mail</label>
                                <input type="email" className="form-control" value={form.mail}
                                    onChange={e => setField('mail', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Celular</label>
                                <input className="form-control" value={form.celular}
                                    onChange={e => setField('celular', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input className="form-control" value={form.telefono}
                                    onChange={e => setField('telefono', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Departamento</label>
                                <select className="form-control" value={form.departamento}
                                    onChange={e => setField('departamento', e.target.value)}>
                                    <option value="">—</option>
                                    <option>Artigas</option><option>Canelones</option><option>Cerro Largo</option>
                                    <option>Colonia</option><option>Durazno</option><option>Flores</option>
                                    <option>Florida</option><option>Lavalleja</option><option>Maldonado</option>
                                    <option>Montevideo</option><option>Paysandú</option><option>Río Negro</option>
                                    <option>Rivera</option><option>Rocha</option><option>Salto</option>
                                    <option>San José</option><option>Soriano</option><option>Tacuarembó</option>
                                    <option>Treinta y Tres</option>
                                </select>
                            </div>
                            <div className="form-group full">
                                <label>Domicilio</label>
                                <input className="form-control" value={form.domicilio}
                                    onChange={e => setField('domicilio', e.target.value)} />
                            </div>

                            <p className="section-title">Datos laborales</p>

                            <div className="form-group">
                                <label>Cargo</label>
                                <input className="form-control" value={form.cargo}
                                    onChange={e => setField('cargo', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Fecha de ingreso</label>
                                <input type="date" className="form-control" value={form.fechaIngreso}
                                    onChange={e => setField('fechaIngreso', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Sector</label>
                                <input className="form-control" value={form.sector}
                                    onChange={e => setField('sector', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Turno</label>
                                <input className="form-control" value={form.turno}
                                    onChange={e => setField('turno', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Ubicación</label>
                                <select className="form-control" value={form.idUbicacion}
                                    onChange={e => setField('idUbicacion', e.target.value)}>
                                    <option value="">— Seleccioná —</option>
                                    {ubicaciones.map(u => (
                                        <option key={u.Id} value={u.Id}>{u.Nombre} ({u.Tipo})</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {error && <p className="alert alert-error" style={{ marginTop: 16 }}>{error}</p>}

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <button type="submit" className="btn-primary" style={{ maxWidth: 300 }} disabled={saving}>
                                {saving ? 'Enviando...' : 'Enviar solicitud'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}