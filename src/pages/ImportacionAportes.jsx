import { useState, useEffect } from 'react';
import { importarAportes } from '../api/importacionaportes';
import { getRubros } from '../api/rubros';

const mesesCompletos = [
    { v: '01', l: 'Enero' }, { v: '02', l: 'Febrero' }, { v: '03', l: 'Marzo' },
    { v: '04', l: 'Abril' }, { v: '05', l: 'Mayo' }, { v: '06', l: 'Junio' },
    { v: '07', l: 'Julio' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setiembre' },
    { v: '10', l: 'Octubre' }, { v: '11', l: 'Noviembre' }, { v: '12', l: 'Diciembre' },
];

export default function ImportacionAportes() {
    const [rubros, setRubros] = useState([]);
    const [mes, setMes] = useState('');
    const [anio, setAnio] = useState('');
    const [idRubro, setIdRubro] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState(null);

    const anioActual = new Date().getFullYear();
    const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

    useEffect(() => {
        getRubros().then(r => {
            const data = r.data.data || [];
            setRubros(data);
            const cuota = data.find(r => r.RubDsc?.trim().toLowerCase() === 'cuota social');
            if (cuota) setIdRubro(cuota.RubCod);
        });
    }, []);

    const handleImportar = async () => {
        setError('');
        setResultado(null);
        if (!mes || !anio) { setError('Seleccioná mes y año'); return; }
        if (!idRubro) { setError('Seleccioná un rubro'); return; }
        if (!archivo) { setError('Seleccioná un archivo Excel'); return; }

        const aniomes = `${anio}${mes}`;
        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('aniomes', aniomes);
        formData.append('idRubro', idRubro);

        setLoading(true);
        try {
            const res = await importarAportes(formData);
            setResultado(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al importar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Importación de aportes</h1>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 600, margin: '0 auto' }}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Mes *</label>
                        <select className="form-control" value={mes} onChange={e => setMes(e.target.value)}>
                            <option value="">— Mes —</option>
                            {mesesCompletos.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Año *</label>
                        <select className="form-control" value={anio} onChange={e => setAnio(e.target.value)}>
                            <option value="">— Año —</option>
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="form-group full">
                        <label>Rubro *</label>
                        <select className="form-control" value={idRubro} onChange={e => setIdRubro(e.target.value)}>
                            <option value="">— Rubro —</option>
                            {rubros.map(r => <option key={r.RubCod} value={r.RubCod}>{r.RubDsc?.trim()}</option>)}
                        </select>
                    </div>
                    <div className="form-group full">
                        <label>Archivo Excel *</label>
                        <input type="file" accept=".xlsx,.xls,.csv" className="file-input"
                            onChange={e => setArchivo(e.target.files[0])} />
                        <small style={{ color: 'var(--text)', fontSize: 12 }}>
                            El archivo debe tener las columnas: NroFuncionario, Nombre, Aporte
                        </small>
                    </div>
                </div>

                {error && <p className="alert alert-error">{error}</p>}

                <button className="btn-primary btn-inline" onClick={handleImportar} disabled={loading}>
                    {loading ? 'Importando...' : 'Importar'}
                </button>
            </div>

            {resultado && (
                <div style={{ marginTop: 24, maxWidth: 600, margin: '24px auto 0' }}>
                    {/* Resumen */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Importados</p>
                            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 600, color: '#16a34a' }}>{resultado.importados}</p>
                        </div>
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>No encontrados</p>
                            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 600, color: '#f59e0b' }}>{resultado.noEncontrados.length}</p>
                        </div>
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>Errores</p>
                            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 600, color: '#dc2626' }}>{resultado.errores.length}</p>
                        </div>
                    </div>

                    {/* No encontrados */}
                    {resultado.noEncontrados.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f59e0b' }}>
                                ⚠ No encontrados en el sistema
                            </h3>
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Nº Funcionario</th>
                                        <th>Nombre</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultado.noEncontrados.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.nroFuncionario}</td>
                                            <td>{r.nombre}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Errores */}
                    {resultado.errores.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>
                                ✗ Errores
                            </h3>
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Nº Funcionario</th>
                                        <th>Nombre</th>
                                        <th>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultado.errores.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.nroFuncionario}</td>
                                            <td>{r.nombre}</td>
                                            <td>{r.motivo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}