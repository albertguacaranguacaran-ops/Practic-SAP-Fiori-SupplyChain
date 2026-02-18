import { useState, useEffect, useRef } from 'react';
import {
    Play, Download, Clock, Database, Table,
    AlertCircle, CheckCircle, RotateCcw,
    Save, FolderOpen
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

// SAP Table descriptions
const SAP_TABLES = {
    'MARA': 'Datos Generales del Material',
    'MAKT': 'Textos de Material',
    'MARC': 'Datos del Material por Centro',
    'MARD': 'Stock por Almacén'
};

// Example queries
const EXAMPLE_QUERIES = [
    { label: 'Todos los materiales', query: 'SELECT * FROM MARA LIMIT 50' },
    { label: 'Stock Bajo (<10)', query: 'SELECT * FROM MARD WHERE LABST < 10' },
    { label: 'Materiales Pesados (>50kg)', query: 'SELECT MATNR, NTGEW, BRGEW FROM MARA WHERE NTGEW > 50' },
    { label: 'Buscar por Descripción', query: "SELECT * FROM MAKT WHERE MAKTX LIKE '%NEVERA%'" }
];

export default function SQLBrowser({ onClose, onStatusMessage, data = [] }) {
    const [query, setQuery] = useState('SELECT * FROM MARA LIMIT 50');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [history, setHistory] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);

    // Save/Load State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [variantName, setVariantName] = useState('');
    const [savedQueries, setSavedQueries] = useState([]);

    const textareaRef = useRef(null);

    // Initial load
    useEffect(() => {
        // Focus textarea on mount
        if (textareaRef.current) {
            textareaRef.current.focus();
        }

        // Load saved queries
        const saved = localStorage.getItem('sap_se16n_variants');
        if (saved) {
            setSavedQueries(JSON.parse(saved));
        }
    }, []);

    // Save Variant
    const handleSaveVariant = () => {
        if (!variantName.trim()) return;
        const newVariant = { name: variantName, query, date: new Date().toISOString() };
        const newSaved = [...savedQueries, newVariant];
        setSavedQueries(newSaved);
        localStorage.setItem('sap_se16n_variants', JSON.stringify(newSaved));
        setShowSaveModal(false);
        setVariantName('');
        onStatusMessage?.(`Variante "${variantName}" guardada`, 'success');
    };

    // Load Variant
    const handleLoadVariant = (q) => {
        setQuery(q);
        setShowLoadModal(false);
        onStatusMessage?.('Variante cargada', 'success');
    };

    // Global keydown for F8
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                executeQuery();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [query, data]);


    const executeQuery = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        const startTime = performance.now();

        try {
            // Emulate network/processing delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Use passed data or fallback
            // We expect 'data' to be the full products array
            if (!data || data.length === 0) {
                // Fallback if data is empty (just in case)
                throw new Error('No data available to query');
            }

            const rawData = data;
            const sql = query.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

            // Simple Parser
            // 1. PROJECT (SELECT ...)
            // 2. SOURCE (FROM ...)
            // 3. FILTER (WHERE ...)
            // 4. LIMIT (LIMIT ...)

            // Parse FROM
            const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
            if (!fromMatch) throw new Error('Syntax Error: Missing FROM clause');
            const tableName = fromMatch[1].toUpperCase();

            if (!SAP_TABLES[tableName]) {
                throw new Error(`Table '${tableName}' not found in Data Dictionary`);
            }

            // Map data to table structure
            let tableData = [];
            if (tableName === 'MARA') {
                tableData = rawData.map(p => ({
                    MATNR: p.id,
                    EAN11: p.ean,
                    MATKL: p.categoria,
                    NTGEW: p.pesoNeto,
                    BRGEW: p.pesoBruto,
                    ERSDA: p.fechaCreacion,
                    LAEDA: p.ultimaModificacion
                }));
            } else if (tableName === 'MAKT') {
                tableData = rawData.map(p => ({
                    MATNR: p.id,
                    SPRAS: 'ES',
                    MAKTX: p.descripcion
                }));
            } else if (tableName === 'MARC') {
                tableData = rawData.map(p => ({
                    MATNR: p.id,
                    WERKS: '1000',
                    MINBE: p.puntoReorden
                }));
            } else if (tableName === 'MARD') {
                tableData = rawData.map(p => ({
                    MATNR: p.id,
                    WERKS: '1000',
                    LGORT: p.ubicacion.split('-')[0] || '0001',
                    LABST: p.stockActual
                }));
            }

            // Parse WHERE
            const whereMatch = sql.match(/WHERE\s+(.+?)(\s+(LIMIT|ORDER)|$)/i);
            let filteredData = tableData;

            if (whereMatch) {
                const condition = whereMatch[1].trim();
                // Extremely basic parser for single condition
                // Supports: =, >, <, LIKE

                filteredData = tableData.filter(row => {
                    if (condition.includes('=')) {
                        const [col, val] = condition.split('=').map(s => s.trim().replace(/'/g, ''));
                        return String(row[col]) === String(val);
                    }
                    if (condition.includes('>')) {
                        const [col, val] = condition.split('>').map(s => s.trim());
                        return parseFloat(row[col]) > parseFloat(val);
                    }
                    if (condition.includes('<')) {
                        const [col, val] = condition.split('<').map(s => s.trim());
                        return parseFloat(row[col]) < parseFloat(val);
                    }
                    if (condition.toUpperCase().includes('LIKE')) {
                        const [col, val] = condition.toUpperCase().split('LIKE').map(s => s.trim().replace(/'/g, '').replace(/%/g, ''));
                        return String(row[col]).toUpperCase().includes(val);
                    }
                    return true;
                });
            }

            // Parse LIMIT
            const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
            const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
            const limitedData = filteredData.slice(0, limit);

            // Parse SELECT (Columns)
            const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
            const colsStr = selectMatch ? selectMatch[1].trim() : '*';

            let finalData = limitedData;
            let fields = Object.keys(limitedData[0] || {}).map(k => ({ name: k }));

            if (colsStr !== '*' && limitedData.length > 0) {
                const requestedCols = colsStr.split(',').map(c => c.trim().toUpperCase());
                finalData = limitedData.map(row => {
                    const newRow = {};
                    requestedCols.forEach(col => {
                        if (row[col] !== undefined) newRow[col] = row[col];
                    });
                    return newRow;
                });
                fields = requestedCols.map(c => ({ name: c }));
            }

            const endTime = performance.now();
            const timeMs = Math.round(endTime - startTime);

            setResults({
                command: 'SELECT',
                rowCount: finalData.length,
                fields: fields,
                rows: finalData
            });
            setExecutionTime(timeMs);
            setHistory(prev => [{ query, timestamp: new Date(), rowCount: finalData.length }, ...prev.slice(0, 9)]);
            onStatusMessage?.(`Datos seleccionados: ${finalData.length} registros en ${timeMs}ms`, 'success');

        } catch (err) {
            console.error(err);
            setError(err.message);
            onStatusMessage?.('Error en la consulta SQL', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            executeQuery();
        }
    };

    const insertTableName = (tableName) => {
        setQuery(`SELECT * FROM ${tableName} LIMIT 100`);
        textareaRef.current?.focus();
    };

    const handleExport = async () => {
        if (!results?.rows?.length) return;

        try {
            await exportToExcel(results.rows, 'Resultado_SE16N');
            onStatusMessage?.('Fichero local creado exitosamente', 'success');
        } catch (err) {
            onStatusMessage?.('Error al exportar lista', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#F5F7FA] w-[95%] h-[90vh] shadow-2xl flex flex-col border border-[#0854A0]" onClick={e => e.stopPropagation()}>
                {/* SAP GUI Header Style */}
                <div className="bg-[#E5E9F0] border-b border-[#C4C4C4] px-2 py-1 flex items-center justify-between h-9 select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-[#6A6D70] font-bold text-xs">Visualización general de tablas:</span>
                        <span className="text-black font-normal text-xs bg-white px-2 py-0.5 border border-gray-300 shadow-inner">
                            SE16N
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={onClose} className="hover:bg-[#FFD7D7] hover:text-red-600 px-2 rounded font-bold text-gray-500">×</button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-[#F5F7FA] border-b border-[#C4C4C4] p-1 flex items-center gap-1 h-9">
                    <button onClick={executeQuery} className="sap-btn-icon text-[#8BC34A]" title="Ejecutar (F8)">
                        <Play size={16} fill="currentColor" />
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    <button onClick={() => setQuery('')} className="sap-btn-icon" title="Reiniciar">
                        <RotateCcw size={14} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    {results && (
                        <button onClick={handleExport} className="sap-btn-icon" title="Fichero Local (Exportar)">
                            <Download size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tables */}
                    <div className="w-64 bg-white border-r border-[#C4C4C4] overflow-y-auto">
                        <div className="bg-[#E8F4FD] px-2 py-1 text-xs font-bold text-[#0854A0] border-b border-[#C4C4C4]">
                            Tablas Disponibles
                        </div>
                        {Object.entries(SAP_TABLES).map(([table, desc]) => (
                            <div
                                key={table}
                                onClick={() => insertTableName(table)}
                                className={`px-2 py-1.5 cursor-pointer text-xs border-b border-gray-100 hover:bg-[#E8F4FD] ${query.includes(table) ? 'bg-[#E8F4FD]' : ''}`}
                            >
                                <div className="font-bold text-[#0854A0]">{table}</div>
                                <div className="text-gray-500 truncate">{desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Query Input */}
                        <div className="p-2 border-b border-[#C4C4C4] bg-[#F5F7FA]">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-[#6A6D70]">Criterios de Selección (SQL Simplificado)</label>
                                <div className="flex gap-1">
                                    {EXAMPLE_QUERIES.map((ex, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(ex.query)}
                                            className="text-[10px] bg-white border border-gray-300 px-1 rounded hover:bg-blue-50 text-blue-600"
                                        >
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full h-24 text-sm font-mono border border-[#89A7C2] p-2 focus:ring-1 focus:ring-[#0854A0] outline-none resize-none"
                                    placeholder="SELECT * FROM MARA..."
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                        onClick={() => setShowSaveModal(true)}
                                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                                        title="Guardar como Variante"
                                    >
                                        <Save size={16} />
                                    </button>
                                    <button
                                        onClick={() => setShowLoadModal(true)}
                                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                                        title="Abrir Variante"
                                    >
                                        <FolderOpen size={16} />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 right-2 text-xs text-[#6A6D70]">
                                    Ctrl+Enter para ejecutar
                                </div>
                            </div>


                            {/* Result Area */}
                            <div className="flex-1 overflow-auto bg-white relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin text-[#0854A0] mb-2">
                                                <Clock size={32} />
                                            </div>
                                            <span className="text-xs font-bold text-[#0854A0]">Leyendo base de datos...</span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 flex items-start gap-2 text-red-700 bg-red-50 m-2 border border-red-200 rounded">
                                        <AlertCircle size={16} className="mt-0.5" />
                                        <div className="text-xs font-mono">{error}</div>
                                    </div>
                                )}

                                {results ? (
                                    <div className="min-w-full inline-block align-middle">
                                        <div className="bg-[#F2F2F2] px-2 py-1 text-xs border-b border-[#C4C4C4] sticky top-0 z-10 flex justify-between">
                                            <span>Entradas: {results.rowCount}</span>
                                            <span>Tiempo: {executionTime}ms</span>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-[#F5F7FA]">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10 sticky top-7 bg-[#F5F7FA]">#</th>
                                                    {results.fields.map((f, i) => (
                                                        <th key={i} className="px-3 py-2 text-left text-xs font-bold text-[#444] uppercase tracking-wider border-l border-gray-200 sticky top-7 bg-[#F5F7FA]">
                                                            {f.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {results.rows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-[#FFF8E1]">
                                                        <td className="px-3 py-1 whitespace-nowrap text-xs text-gray-400 bg-gray-50">{i + 1}</td>
                                                        {results.fields.map((f, j) => (
                                                            <td key={j} className="px-3 py-1 whitespace-nowrap text-xs text-gray-700 border-l border-gray-100">
                                                                {row[f.name]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    !loading && !error && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                            <Database size={64} strokeWidth={1} />
                                            <p className="mt-4 text-sm">Esperando ejecución (F8)</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer status */}
                    <div className="bg-[#F5F7FA] border-t border-[#C4C4C4] px-2 py-0.5 text-[10px] text-[#6A6D70] flex justify-between">
                        <span>Sistema: PRD (300)</span>
                        <span>Modo: Visualización</span>
                    </div>
                </div>

                {/* Save Variant Modal */}
                {showSaveModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSaveModal(false)}>
                        <div className="bg-white p-4 rounded shadow-lg w-80" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-sm mb-2 text-[#0854A0]">Guardar Variante de Selección</h3>
                            <input
                                type="text"
                                value={variantName}
                                onChange={e => setVariantName(e.target.value)}
                                placeholder="Nombre de la variante..."
                                className="w-full border p-1 text-sm mb-3"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSaveModal(false)} className="px-2 py-1 text-xs border rounded">Cancelar</button>
                                <button onClick={handleSaveVariant} className="px-2 py-1 text-xs bg-[#0854A0] text-white rounded">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Load Variant Modal */}
                {showLoadModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLoadModal(false)}>
                        <div className="bg-white p-0 rounded shadow-lg w-96 max-h-[400px] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="bg-[#E5E9F0] p-2 border-b flex justify-between items-center">
                                <h3 className="font-bold text-xs text-[#0854A0]">Variantes de Usuario</h3>
                                <button onClick={() => setShowLoadModal(false)}>×</button>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1">
                                {savedQueries.length === 0 ? (
                                    <p className="text-xs text-gray-500 text-center py-4">No hay variantes guardadas</p>
                                ) : (
                                    savedQueries.map((v, i) => (
                                        <div key={i} className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 items-center flex justify-between" onClick={() => handleLoadVariant(v.query)}>
                                            <div>
                                                <div className="font-bold text-sm text-[#333]">{v.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono truncate w-64">{v.query}</div>
                                            </div>
                                            <Play size={10} className="text-green-600" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
