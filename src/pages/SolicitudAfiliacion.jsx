import { useState, useEffect } from 'react';
import { createSolicitudAfiliacion } from '../api/solicitudesafiliacion';
import axios from 'axios';

const FORM_VACIO = {
    nroFuncionario: '', documento: '', primerNombre: '', segundoNombre: '',
    primerApellido: '', segundoApellido: '', fechaNacimiento: '', estadoCivil: '',
    mail: '', departamento: '', domicilio: '', telefono: '', celular: '',
    cargo: '', fechaIngreso: '', sector: '', turno: '', idUbicacion: '',
    cantidadHijos: '',
};

const HIJO_VACIO = { nombre: '', fechaNacimiento: '', documento: '' };

const FieldError = ({ msg }) => msg
    ? <span style={{ display: 'block', color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{msg}</span>
    : null;

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

export default function SolicitudAfiliacion() {
    const [form, setForm] = useState(FORM_VACIO);
    const [hijos, setHijos] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [errores, setErrores] = useState({});
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/ubicaciones`)
            .then(r => setUbicaciones(r.data.data || []))
            .catch(() => { });
    }, []);

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const setCantidadHijos = (value) => {
        setField('cantidadHijos', value);
        const cantidad = Math.max(0, parseInt(value) || 0);
        setHijos(prev => {
            const next = prev.slice(0, cantidad);
            while (next.length < cantidad) next.push({ ...HIJO_VACIO });
            return next;
        });
    };

    const setHijoField = (index, field, value) => {
        setHijos(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
    };

    const validar = () => {
        const err = {};

        if (!form.nroFuncionario.trim()) err.nroFuncionario = 'El nº de funcionario es obligatorio';

        if (!form.documento.trim()) err.documento = 'El documento es obligatorio';
        else if (!validarCI(form.documento)) err.documento = 'La cédula ingresada no es válida';

        if (!form.primerNombre.trim()) err.primerNombre = 'El nombre es obligatorio';
        if (!form.primerApellido.trim()) err.primerApellido = 'El apellido es obligatorio';
        if (!form.fechaNacimiento) err.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
        if (!form.estadoCivil) err.estadoCivil = 'El estado civil es obligatorio';

        if (!form.mail.trim()) err.mail = 'El mail es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) err.mail = 'El mail no es válido';

        if (!form.departamento) err.departamento = 'El departamento es obligatorio';
        if (!form.domicilio.trim()) err.domicilio = 'La dirección es obligatoria';

        if (!form.telefono.trim() && !form.celular.trim()) {
            err.telefono = 'Debe ingresar teléfono o celular';
            err.celular = 'Debe ingresar teléfono o celular';
        } else {
            if (form.celular && !/^09\d{7}$/.test(form.celular.replace(/\s/g, ''))) {
                err.celular = 'El celular debe tener formato 09XXXXXXX';
            }
            if (form.telefono && !/^\d{7,8}$/.test(form.telefono.replace(/\s/g, ''))) {
                err.telefono = 'El teléfono debe tener 7 u 8 dígitos';
            }
        }

        if (!form.cargo.trim()) err.cargo = 'El cargo es obligatorio';
        if (!form.fechaIngreso) err.fechaIngreso = 'La fecha de ingreso es obligatoria';

        const cantidadHijos = Math.max(0, parseInt(form.cantidadHijos) || 0);
        if (cantidadHijos > 0) {
            err.hijos = [];
            for (let i = 0; i < cantidadHijos; i++) {
                const h = hijos[i] || {};
                const hErr = {};
                if (!h.nombre?.trim()) hErr.nombre = 'El nombre es obligatorio';
                if (!h.fechaNacimiento) hErr.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
                if (!h.documento?.trim()) hErr.documento = 'La C.I. es obligatoria';
                err.hijos[i] = hErr;
            }
            if (err.hijos.every(h => Object.keys(h).length === 0)) delete err.hijos;
        }

        return err;
    };

    const hayErrores = (err) => Object.keys(err).some(k => {
        if (k === 'hijos') return err.hijos.some(h => Object.keys(h).length > 0);
        return true;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const err = validar();
        setErrores(err);
        if (hayErrores(err)) return;

        const cantidadHijos = Math.max(0, parseInt(form.cantidadHijos) || 0);
        setSaving(true);
        try {
            const { cantidadHijos: _cantidadHijos, ...formData } = form;
            await createSolicitudAfiliacion({ ...formData, hijos: cantidadHijos > 0 ? hijos : [] });
            setExito(true);
        } catch (err2) {
            setError(err2.response?.data?.message || 'Error al enviar la solicitud');
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
                <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#fff', fontSize: 32
                }}>✓</div>
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
                    <img src="/apmu/apmu-5.jpg" alt="APMU" style={{ width: 80, borderRadius: 12, marginBottom: 16 }} />
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
                                <label>Nº de funcionario *</label>
                                <input className="form-control" value={form.nroFuncionario}
                                    onChange={e => setField('nroFuncionario', e.target.value)} />
                                <FieldError msg={errores.nroFuncionario} />
                            </div>
                            <div className="form-group">
                                <label>Documento (CI) *</label>
                                <input className="form-control" value={form.documento}
                                    onChange={e => setField('documento', e.target.value)} />
                                <FieldError msg={errores.documento} />
                            </div>
                            <div className="form-group">
                                <label>Primer nombre *</label>
                                <input className="form-control" value={form.primerNombre}
                                    onChange={e => setField('primerNombre', e.target.value)} />
                                <FieldError msg={errores.primerNombre} />
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
                                <FieldError msg={errores.primerApellido} />
                            </div>
                            <div className="form-group">
                                <label>Segundo apellido</label>
                                <input className="form-control" value={form.segundoApellido}
                                    onChange={e => setField('segundoApellido', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Fecha de nacimiento *</label>
                                <input type="date" className="form-control" value={form.fechaNacimiento}
                                    onChange={e => setField('fechaNacimiento', e.target.value)} />
                                <FieldError msg={errores.fechaNacimiento} />
                            </div>
                            <div className="form-group">
                                <label>Estado civil *</label>
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
                                <FieldError msg={errores.estadoCivil} />
                            </div>

                            <p className="section-title">Contacto</p>

                            <div className="form-group">
                                <label>Mail *</label>
                                <input type="email" className="form-control" value={form.mail}
                                    onChange={e => setField('mail', e.target.value)} />
                                <FieldError msg={errores.mail} />
                            </div>
                            <div className="form-group">
                                <label>Celular {!form.telefono.trim() && '*'}</label>
                                <input className="form-control" value={form.celular}
                                    onChange={e => setField('celular', e.target.value)} />
                                <FieldError msg={errores.celular} />
                            </div>
                            <div className="form-group">
                                <label>Teléfono {!form.celular.trim() && '*'}</label>
                                <input className="form-control" value={form.telefono}
                                    onChange={e => setField('telefono', e.target.value)} />
                                <FieldError msg={errores.telefono} />
                            </div>
                            <div className="form-group">
                                <label>Departamento *</label>
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
                                <FieldError msg={errores.departamento} />
                            </div>
                            <div className="form-group full">
                                <label>Domicilio *</label>
                                <input className="form-control" value={form.domicilio}
                                    onChange={e => setField('domicilio', e.target.value)} />
                                <FieldError msg={errores.domicilio} />
                            </div>

                            <p className="section-title">Datos laborales</p>

                            <div className="form-group">
                                <label>Cargo *</label>
                                <input className="form-control" value={form.cargo}
                                    onChange={e => setField('cargo', e.target.value)} />
                                <FieldError msg={errores.cargo} />
                            </div>
                            <div className="form-group">
                                <label>Fecha de ingreso *</label>
                                <input type="date" className="form-control" value={form.fechaIngreso}
                                    onChange={e => setField('fechaIngreso', e.target.value)} />
                                <FieldError msg={errores.fechaIngreso} />
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

                            <p className="section-title">Hijos</p>

                            <div className="form-group">
                                <label>Cantidad de hijos</label>
                                <input type="number" min="0" className="form-control" value={form.cantidadHijos}
                                    onChange={e => setCantidadHijos(e.target.value)} />
                            </div>

                        </div>

                        {hijos.map((hijo, i) => (
                            <div key={i} style={{
                                marginTop: 16, padding: 16, borderRadius: 12,
                                border: '1px solid var(--border)', background: 'var(--bg)'
                            }}>
                                <p className="section-title" style={{ marginTop: 0 }}>Hijo {i + 1}</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nombre *</label>
                                        <input className="form-control" value={hijo.nombre}
                                            onChange={e => setHijoField(i, 'nombre', e.target.value)} />
                                        <FieldError msg={errores.hijos?.[i]?.nombre} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de nacimiento *</label>
                                        <input type="date" className="form-control" value={hijo.fechaNacimiento}
                                            onChange={e => setHijoField(i, 'fechaNacimiento', e.target.value)} />
                                        <FieldError msg={errores.hijos?.[i]?.fechaNacimiento} />
                                    </div>
                                    <div className="form-group">
                                        <label>C.I. *</label>
                                        <input className="form-control" value={hijo.documento}
                                            onChange={e => setHijoField(i, 'documento', e.target.value)} />
                                        <FieldError msg={errores.hijos?.[i]?.documento} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {error && <p className="alert alert-error" style={{ marginTop: 16 }}>{error}</p>}

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <button type="submit" className="btn-primary" style={{ maxWidth: 300 }} disabled={saving}>
                                {saving ? 'Enviando...' : 'Enviar solicitud'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '24px 0', marginTop: 32 }}>
                <img src="/apmu/Macrosoft.png" alt="Macrosoft" style={{ height: 24, opacity: 0.6 }} />
            </div>
        </div>
    );
}