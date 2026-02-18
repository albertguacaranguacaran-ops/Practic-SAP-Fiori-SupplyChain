import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Play, Download, Clock, Database, Table,
    AlertCircle, CheckCircle, RotateCcw,
    Save, FolderOpen, Link2, BookOpen,
    ArrowRight, ChevronRight, FileSpreadsheet,
    Search, Filter, Eye, Zap
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

// SAP Table descriptions
const SAP_TABLES = {
    'MARA': { desc: 'Datos Generales del Material', fields: ['MATNR', 'EAN11', 'MATKL', 'NTGEW', 'BRGEW', 'VOLUM', 'ERSDA', 'LAEDA'] },
    'MAKT': { desc: 'Textos de Material', fields: ['MATNR', 'SPRAS', 'MAKTX'] },
    'MARC': { desc: 'Datos del Material por Centro', fields: ['MATNR', 'WERKS', 'MINBE'] },
    'MARD': { desc: 'Stock por Almacén', fields: ['MATNR', 'WERKS', 'LGORT', 'LABST'] }
};

// Example queries for free tab
const EXAMPLE_QUERIES = [
    { label: 'Todos los materiales', query: 'SELECT * FROM MARA LIMIT 50' },
    { label: 'Stock Bajo (<10)', query: 'SELECT * FROM MARD WHERE LABST < 10' },
    { label: 'Materiales Pesados (>50kg)', query: 'SELECT MATNR, NTGEW, BRGEW FROM MARA WHERE NTGEW > 50' },
    { label: 'Buscar por Descripción', query: "SELECT * FROM MAKT WHERE MAKTX LIKE '%NEVERA%'" }
];

// Pre-built JOIN diagnostic queries
const DIAGNOSTIC_QUERIES = [
    {
        id: 'full_master',
        name: '📋 Master Data Completa',
        desc: 'MARA + MAKT + MARC + MARD — Vista 360° de cada material',
        purpose: 'Esta es tu primera consulta. Al exportar esto a Excel, ves TODO lo que tiene y lo que le falta a cada material.',
        columns: ['MATNR', 'MAKTX', 'MATKL', 'EAN11', 'NTGEW', 'BRGEW', 'LABST', 'MINBE'],
        icon: '📋',
        exportName: 'Master_Data_Completa'
    },
    {
        id: 'sin_ean',
        name: '🔴 Materiales SIN código EAN',
        desc: 'Materiales que no tienen código de barras asignado',
        purpose: 'Sin EAN el punto de venta no puede escanear el producto. Esto es prioritario.',
        filter: (row) => !row.EAN11 || row.EAN11 === '',
        columns: ['MATNR', 'MAKTX', 'MATKL', 'EAN11'],
        icon: '🔴',
        exportName: 'Materiales_SIN_EAN'
    },
    {
        id: 'sin_peso',
        name: '🟡 Materiales SIN peso',
        desc: 'Materiales con peso neto o bruto vacío/cero',
        purpose: 'Sin peso no puedes calcular fletes ni cubicaje. El ingeniero de empaque necesita estos datos.',
        filter: (row) => !row.NTGEW || row.NTGEW === 0 || !row.BRGEW || row.BRGEW === 0,
        columns: ['MATNR', 'MAKTX', 'NTGEW', 'BRGEW'],
        icon: '🟡',
        exportName: 'Materiales_SIN_Peso'
    },
    {
        id: 'sin_reorden',
        name: '🟠 Materiales SIN punto de reorden',
        desc: 'MARC.MINBE = 0 — no hay alerta automática cuando se acaba',
        purpose: 'Si MINBE está en cero, SAP nunca te avisa que necesitas reabastecer. Tu analista de compras debe corregir esto.',
        filter: (row) => !row.MINBE || row.MINBE === 0,
        columns: ['MATNR', 'MAKTX', 'LABST', 'MINBE'],
        icon: '🟠',
        exportName: 'Materiales_SIN_Reorden'
    },
    {
        id: 'bajo_reorden',
        name: '🔴 Stock BAJO punto de reorden',
        desc: 'Materiales que ya están por debajo del mínimo — URGENTE',
        purpose: '¡Estos necesitan pedido YA! Exporta esta lista y pásala a tu analista de compras para que genere pedidos (ME21N).',
        filter: (row) => row.MINBE > 0 && row.LABST < row.MINBE,
        columns: ['MATNR', 'MAKTX', 'LABST', 'MINBE', 'MATKL'],
        icon: '🔴',
        exportName: 'Stock_BAJO_Reorden'
    },
    {
        id: 'sin_stock',
        name: '⛔ Materiales con stock CERO',
        desc: 'No hay ni una unidad en almacén',
        purpose: 'Rotura de stock total. Si alguno de estos tiene demanda, estás perdiendo ventas.',
        filter: (row) => row.LABST === 0 || row.LABST === null,
        columns: ['MATNR', 'MAKTX', 'LABST', 'MINBE', 'MATKL'],
        icon: '⛔',
        exportName: 'Stock_CERO'
    },
    {
        id: 'sobrepeso',
        name: '⚠️ Materiales con SOBREPESO (>50kg)',
        desc: 'Requieren equipo especial de manipulación',
        purpose: 'Identificar estos materiales es responsabilidad del ingeniero de empaque. Deben estar etiquetados.',
        filter: (row) => row.NTGEW > 50,
        columns: ['MATNR', 'MAKTX', 'NTGEW', 'BRGEW', 'MATKL'],
        icon: '⚠️',
        exportName: 'Materiales_SOBREPESO'
    },
    {
        id: 'ean_duplicado',
        name: '🔁 EANs DUPLICADOS',
        desc: 'Mismo código EAN en más de un material',
        purpose: 'Si dos materiales tienen el mismo EAN, el punto de venta cobra cualquiera de los dos. Tu analista de master data debe resolver esto.',
        filter: 'ean_duplicates',
        columns: ['MATNR', 'MAKTX', 'EAN11', 'MATKL'],
        icon: '🔁',
        exportName: 'EANs_Duplicados'
    }
];

// Tutorial steps
const TUTORIAL_STEPS = [
    {
        step: 1,
        title: 'Exporta tu Master Data Completa',
        icon: '📥',
        description: 'Lo primero es ver qué tienes. Haz clic en "📋 Master Data Completa" y luego exporta a Excel.',
        action: 'full_master',
        sapReal: 'En SAP real usarías SE16N → tabla MARA, luego MAKT, MARC, MARD por separado, o SQVI para el JOIN.',
        whatToLook: 'Abre el Excel y ordena por columnas vacías. ¿Cuántas celdas vacías ves en EAN11? ¿En NTGEW?'
    },
    {
        step: 2,
        title: 'Identifica materiales sin EAN',
        icon: '🔴',
        description: 'Ahora filtra solo los materiales que NO tienen código de barras. Esto bloquea las ventas en tienda.',
        action: 'sin_ean',
        sapReal: 'En SAP: SE16N → MARA → campo EAN11 = vacío. O usa SQVI para cruzar MARA con MEAN.',
        whatToLook: 'Anota la cantidad. Ese número es tu KPI #1: "Materiales sin EAN". El objetivo es llevarlo a CERO.'
    },
    {
        step: 3,
        title: 'Revisa los pesos faltantes',
        icon: '🟡',
        description: 'Los pesos son esenciales para calcular fletes y cubicaje. Exporta esta lista para tu ingeniero de empaque.',
        action: 'sin_peso',
        sapReal: 'En SAP: SE16N → MARA → campo NTGEW = 0 AND BRGEW = 0.',
        whatToLook: 'Esa lista va DIRECTO a tu Ingeniero de Empaque. Él debe pesar y medir cada producto.'
    },
    {
        step: 4,
        title: 'Verifica puntos de reorden',
        icon: '🟠',
        description: 'Sin punto de reorden, SAP no genera alertas. Esto causa quiebres de stock.',
        action: 'sin_reorden',
        sapReal: 'En SAP: SE16N → MARC → campo MINBE = 0. O usa MD04 para ver material por material.',
        whatToLook: 'Cada material de categoría A debería tener un MINBE > 0. Tu analista de compras asigna estos valores.'
    },
    {
        step: 5,
        title: '¡Alerta! Stock bajo punto de reorden',
        icon: '🚨',
        description: 'Estos materiales YA necesitan pedido de compra. Son tu acción inmediata del día 1.',
        action: 'bajo_reorden',
        sapReal: 'En SAP: MD04 muestra esto material por material. SE16N te da la vista agrupada.',
        whatToLook: 'Exporta y pásaselo a tu analista de compras. Cada línea = un pedido potencial en ME21N.'
    },
    {
        step: 6,
        title: 'Presenta tu diagnóstico al jefe',
        icon: '📊',
        description: 'Ya tienes los números. Arma un resumen con los conteos de cada problema.',
        action: null,
        sapReal: 'Usa los archivos Excel que exportaste para crear un informe con gráficos en Excel o PowerPoint.',
        whatToLook: 'Resumen: "Tenemos X materiales sin EAN, Y sin peso, Z bajo reorden. Aquí está mi plan para corregirlo en 30 días."'
    }
];

export default function SQLBrowser({ onClose, onStatusMessage, data = [] }) {
    const [activeTab, setActiveTab] = useState('joins');
    const [query, setQuery] = useState('SELECT * FROM MARA LIMIT 50');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);
    const [activeQueryId, setActiveQueryId] = useState(null);
    const [activeTutorialStep, setActiveTutorialStep] = useState(0);

    // Save/Load State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [variantName, setVariantName] = useState('');
    const [savedQueries, setSavedQueries] = useState([]);

    const textareaRef = useRef(null);

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem('sap_se16n_variants');
        if (saved) setSavedQueries(JSON.parse(saved));
    }, []);

    // Build joined master data
    const joinedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(p => ({
            MATNR: p.id,
            MAKTX: p.descripcion,
            MATKL: p.categoria,
            EAN11: p.ean || '',
            NTGEW: p.pesoNeto || 0,
            BRGEW: p.pesoBruto || 0,
            VOLUM: p.largo && p.ancho && p.alto ? Math.round((p.largo * p.ancho * p.alto) / 1000000 * 10000) / 10000 : 0,
            LABST: p.stockActual ?? 0,
            MINBE: p.puntoReorden || 0,
            LGORT: p.ubicacion ? p.ubicacion.split('-')[0] : '0001',
            WERKS: '1000',
            LARGO: p.largo || 0,
            ANCHO: p.ancho || 0,
            ALTO: p.alto || 0,
        }));
    }, [data]);

    // Count metrics for diagnostic queries
    const diagnosticCounts = useMemo(() => {
        const counts = {};
        // EAN duplicates detection
        const eanMap = new Map();
        for (const row of joinedData) {
            if (row.EAN11) {
                if (!eanMap.has(row.EAN11)) eanMap.set(row.EAN11, []);
                eanMap.get(row.EAN11).push(row);
            }
        }
        const duplicateEans = new Map();
        for (const [ean, rows] of eanMap.entries()) {
            if (rows.length > 1) duplicateEans.set(ean, rows);
        }

        for (const dq of DIAGNOSTIC_QUERIES) {
            if (dq.id === 'full_master') {
                counts[dq.id] = joinedData.length;
            } else if (dq.filter === 'ean_duplicates') {
                let count = 0;
                for (const rows of duplicateEans.values()) count += rows.length;
                counts[dq.id] = count;
            } else if (dq.filter) {
                counts[dq.id] = joinedData.filter(dq.filter).length;
            }
        }
        counts._duplicateEans = duplicateEans;
        return counts;
    }, [joinedData]);

    // Execute a diagnostic query
    const executeDiagnosticQuery = (dq) => {
        setActiveQueryId(dq.id);
        setLoading(true);
        setError(null);
        const startTime = performance.now();

        setTimeout(() => {
            let rows;
            if (dq.id === 'full_master') {
                rows = joinedData.slice(0, 200);
            } else if (dq.filter === 'ean_duplicates') {
                rows = [];
                for (const dupRows of diagnosticCounts._duplicateEans.values()) {
                    rows.push(...dupRows);
                }
                rows = rows.slice(0, 200);
            } else {
                rows = joinedData.filter(dq.filter).slice(0, 200);
            }

            const fields = dq.columns.map(c => ({ name: c }));
            const projectedRows = rows.map(row => {
                const newRow = {};
                dq.columns.forEach(col => { newRow[col] = row[col]; });
                return newRow;
            });

            const endTime = performance.now();
            setResults({
                command: 'JOIN',
                queryName: dq.name,
                rowCount: projectedRows.length,
                totalMatch: dq.id === 'full_master' ? joinedData.length : (dq.filter === 'ean_duplicates' ? diagnosticCounts[dq.id] : joinedData.filter(dq.filter).length),
                fields,
                rows: projectedRows,
                exportName: dq.exportName
            });
            setExecutionTime(Math.round(endTime - startTime));
            setLoading(false);
            onStatusMessage?.(`${dq.name}: ${projectedRows.length} registros encontrados`, 'success');
        }, 400);
    };

    // Free query executor
    const executeQuery = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        const startTime = performance.now();

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!data || data.length === 0) throw new Error('No data available to query');

            const rawData = data;
            const sql = query.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

            const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
            if (!fromMatch) throw new Error('Syntax Error: Missing FROM clause');
            const tableName = fromMatch[1].toUpperCase();

            if (!SAP_TABLES[tableName]) throw new Error(`Table '${tableName}' not found in Data Dictionary`);

            let tableData = [];
            if (tableName === 'MARA') {
                tableData = rawData.map(p => ({ MATNR: p.id, EAN11: p.ean, MATKL: p.categoria, NTGEW: p.pesoNeto, BRGEW: p.pesoBruto, ERSDA: p.fechaCreacion, LAEDA: p.ultimaModificacion }));
            } else if (tableName === 'MAKT') {
                tableData = rawData.map(p => ({ MATNR: p.id, SPRAS: 'ES', MAKTX: p.descripcion }));
            } else if (tableName === 'MARC') {
                tableData = rawData.map(p => ({ MATNR: p.id, WERKS: '1000', MINBE: p.puntoReorden }));
            } else if (tableName === 'MARD') {
                tableData = rawData.map(p => ({ MATNR: p.id, WERKS: '1000', LGORT: p.ubicacion?.split('-')[0] || '0001', LABST: p.stockActual }));
            }

            const whereMatch = sql.match(/WHERE\s+(.+?)(\s+(LIMIT|ORDER)|$)/i);
            let filteredData = tableData;
            if (whereMatch) {
                const condition = whereMatch[1].trim();
                filteredData = tableData.filter(row => {
                    if (condition.includes('=')) { const [col, val] = condition.split('=').map(s => s.trim().replace(/'/g, '')); return String(row[col]) === String(val); }
                    if (condition.includes('>')) { const [col, val] = condition.split('>').map(s => s.trim()); return parseFloat(row[col]) > parseFloat(val); }
                    if (condition.includes('<')) { const [col, val] = condition.split('<').map(s => s.trim()); return parseFloat(row[col]) < parseFloat(val); }
                    if (condition.toUpperCase().includes('LIKE')) { const [col, val] = condition.toUpperCase().split('LIKE').map(s => s.trim().replace(/'/g, '').replace(/%/g, '')); return String(row[col]).toUpperCase().includes(val); }
                    return true;
                });
            }

            const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
            const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
            const limitedData = filteredData.slice(0, limit);

            const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
            const colsStr = selectMatch ? selectMatch[1].trim() : '*';
            let finalData = limitedData;
            let fields = Object.keys(limitedData[0] || {}).map(k => ({ name: k }));

            if (colsStr !== '*' && limitedData.length > 0) {
                const requestedCols = colsStr.split(',').map(c => c.trim().toUpperCase());
                finalData = limitedData.map(row => { const newRow = {}; requestedCols.forEach(col => { if (row[col] !== undefined) newRow[col] = row[col]; }); return newRow; });
                fields = requestedCols.map(c => ({ name: c }));
            }

            const endTime = performance.now();
            setResults({ command: 'SELECT', rowCount: finalData.length, totalMatch: filteredData.length, fields, rows: finalData });
            setExecutionTime(Math.round(endTime - startTime));
            setHistory(prev => [{ query, timestamp: new Date(), rowCount: finalData.length }, ...prev.slice(0, 9)]);
            onStatusMessage?.(`${finalData.length} registros en ${Math.round(endTime - startTime)}ms`, 'success');
        } catch (err) {
            setError(err.message);
            onStatusMessage?.('Error en la consulta SQL', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Save Variant
    const handleSaveVariant = () => {
        if (!variantName.trim()) return;
        const newSaved = [...savedQueries, { name: variantName, query, date: new Date().toISOString() }];
        setSavedQueries(newSaved);
        localStorage.setItem('sap_se16n_variants', JSON.stringify(newSaved));
        setShowSaveModal(false);
        setVariantName('');
        onStatusMessage?.(`Variante "${variantName}" guardada`, 'success');
    };

    const handleExport = async () => {
        if (!results?.rows?.length) return;
        try {
            await exportToExcel(results.rows, results.exportName || 'Resultado_SE16N');
            onStatusMessage?.(`Exportado: ${results.exportName || 'Resultado_SE16N'}.xlsx`, 'success');
        } catch (err) {
            onStatusMessage?.('Error al exportar', 'error');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) executeQuery();
    };

    useEffect(() => {
        const h = (e) => { if (e.key === 'F8') { e.preventDefault(); if (activeTab === 'free') executeQuery(); } };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [query, data, activeTab]);

    const TABS = [
        { id: 'joins', label: 'Diagnóstico (JOINs)', icon: Link2 },
        { id: 'free', label: 'Consulta Libre', icon: Database },
        { id: 'tutorial', label: 'Paso a Paso', icon: BookOpen },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#F5F7FA] w-[96%] h-[93vh] shadow-2xl flex flex-col border border-[#0854A0] rounded-sm" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#354A5F] text-white px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-mono bg-[#0854A0] px-2 py-0.5 rounded text-xs">SE16N+</span>
                        <Database size={16} />
                        <span className="font-bold text-sm">Data Browser Avanzado — Diagnóstico de Master Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {results && (
                            <button onClick={handleExport} className="text-xs flex items-center gap-1 bg-green-600 px-3 py-1 rounded hover:bg-green-700 transition-colors">
                                <Download size={12} /> Exportar Excel
                            </button>
                        )}
                        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded text-lg">✕</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-[#C4C4C4] flex">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setResults(null); setError(null); }}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-b-[#0854A0] text-[#0854A0] bg-[#F5F8FC]'
                                    : 'border-b-transparent text-[#6A6D70] hover:text-[#32363A] hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* ============ TAB: DIAGNOSTIC JOINS ============ */}
                    {activeTab === 'joins' && (
                        <>
                            {/* Left: Query List */}
                            <div className="w-80 bg-white border-r border-[#C4C4C4] overflow-y-auto flex-shrink-0">
                                <div className="bg-[#EFF4F9] px-3 py-2 text-xs font-bold text-[#0854A0] border-b border-[#C4C4C4] flex items-center gap-2">
                                    <Zap size={13} /> Consultas de Diagnóstico
                                </div>
                                {DIAGNOSTIC_QUERIES.map(dq => (
                                    <div
                                        key={dq.id}
                                        onClick={() => executeDiagnosticQuery(dq)}
                                        className={`px-3 py-2.5 cursor-pointer border-b border-gray-100 hover:bg-[#E8F4FD] transition-colors ${activeQueryId === dq.id ? 'bg-[#E8F4FD] border-l-2 border-l-[#0854A0]' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#32363A]">{dq.name}</span>
                                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${diagnosticCounts[dq.id] === 0 ? 'bg-green-100 text-green-700' : diagnosticCounts[dq.id] > 100 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {(diagnosticCounts[dq.id] || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-[#6A6D70] mt-0.5">{dq.desc}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: Results */}
                            <div className="flex-1 flex flex-col">
                                {/* Purpose banner */}
                                {activeQueryId && (
                                    <div className="bg-[#FFF8E1] px-4 py-2 border-b border-[#FFE082] text-xs text-[#795548]">
                                        <strong>💡 ¿Para qué sirve?</strong> {DIAGNOSTIC_QUERIES.find(d => d.id === activeQueryId)?.purpose}
                                    </div>
                                )}
                                {renderResultsTable()}
                            </div>
                        </>
                    )}

                    {/* ============ TAB: FREE QUERY ============ */}
                    {activeTab === 'free' && (
                        <>
                            {/* Sidebar Tables */}
                            <div className="w-56 bg-white border-r border-[#C4C4C4] overflow-y-auto flex-shrink-0">
                                <div className="bg-[#EFF4F9] px-2 py-2 text-xs font-bold text-[#0854A0] border-b border-[#C4C4C4]">
                                    Tablas Disponibles
                                </div>
                                {Object.entries(SAP_TABLES).map(([table, info]) => (
                                    <div
                                        key={table}
                                        onClick={() => { setQuery(`SELECT * FROM ${table} LIMIT 100`); textareaRef.current?.focus(); }}
                                        className={`px-2 py-2 cursor-pointer text-xs border-b border-gray-100 hover:bg-[#E8F4FD] ${query.includes(table) ? 'bg-[#E8F4FD]' : ''}`}
                                    >
                                        <div className="font-bold text-[#0854A0]">{table}</div>
                                        <div className="text-gray-500 truncate">{info.desc}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{info.fields.join(', ')}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Area */}
                            <div className="flex-1 flex flex-col bg-white">
                                <div className="p-3 border-b border-[#C4C4C4] bg-[#F5F7FA]">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-[#6A6D70]">SQL Simplificado</label>
                                        <div className="flex gap-1">
                                            {EXAMPLE_QUERIES.map((ex, i) => (
                                                <button key={i} onClick={() => setQuery(ex.query)} className="text-[10px] bg-white border border-gray-300 px-1.5 py-0.5 rounded hover:bg-blue-50 text-blue-600">{ex.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            ref={textareaRef}
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="w-full h-20 text-sm font-mono border border-[#89A7C2] p-2 focus:ring-1 focus:ring-[#0854A0] outline-none resize-none"
                                            placeholder="SELECT * FROM MARA..."
                                        />
                                        <div className="absolute bottom-2 left-2 flex gap-2">
                                            <button onClick={executeQuery} className="bg-[#0854A0] text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-[#0A6ED1]"><Play size={12} fill="white" /> Ejecutar (F8)</button>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button onClick={() => setShowSaveModal(true)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Guardar Variante"><Save size={14} /></button>
                                            <button onClick={() => setShowLoadModal(true)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Cargar Variante"><FolderOpen size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                                {renderResultsTable()}
                            </div>
                        </>
                    )}

                    {/* ============ TAB: TUTORIAL ============ */}
                    {activeTab === 'tutorial' && (
                        <>
                            {/* Steps sidebar */}
                            <div className="w-72 bg-white border-r border-[#C4C4C4] overflow-y-auto flex-shrink-0">
                                <div className="bg-[#EFF4F9] px-3 py-2 text-xs font-bold text-[#0854A0] border-b border-[#C4C4C4] flex items-center gap-2">
                                    <BookOpen size={13} /> Guía: Tu Primer Día
                                </div>
                                {TUTORIAL_STEPS.map((step, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveTutorialStep(idx)}
                                        className={`px-3 py-3 cursor-pointer border-b border-gray-100 hover:bg-[#E8F4FD] transition-colors ${activeTutorialStep === idx ? 'bg-[#E8F4FD] border-l-2 border-l-[#0854A0]' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{step.icon}</span>
                                            <div>
                                                <div className="text-xs font-bold text-[#32363A]">Paso {step.step}</div>
                                                <div className="text-xs text-[#6A6D70]">{step.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Step detail */}
                            <div className="flex-1 overflow-auto bg-white">
                                {(() => {
                                    const step = TUTORIAL_STEPS[activeTutorialStep];
                                    return (
                                        <div className="max-w-2xl mx-auto p-6">
                                            <div className="text-center mb-6">
                                                <span className="text-5xl">{step.icon}</span>
                                                <h2 className="text-xl font-bold text-[#32363A] mt-3">Paso {step.step}: {step.title}</h2>
                                            </div>

                                            <div className="space-y-4">
                                                {/* What to do */}
                                                <div className="bg-[#E8F4FD] rounded-lg p-4 border border-[#B3D7F2]">
                                                    <h3 className="text-sm font-bold text-[#0854A0] mb-1 flex items-center gap-2"><Zap size={14} /> ¿Qué hacer?</h3>
                                                    <p className="text-sm text-[#32363A]">{step.description}</p>
                                                    {step.action && (
                                                        <button
                                                            onClick={() => {
                                                                setActiveTab('joins');
                                                                const dq = DIAGNOSTIC_QUERIES.find(d => d.id === step.action);
                                                                if (dq) setTimeout(() => executeDiagnosticQuery(dq), 200);
                                                            }}
                                                            className="mt-3 bg-[#0854A0] text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-[#0A6ED1] transition-colors"
                                                        >
                                                            <Play size={14} /> Ejecutar esta consulta ahora
                                                        </button>
                                                    )}
                                                </div>

                                                {/* In real SAP */}
                                                <div className="bg-[#FFF3E0] rounded-lg p-4 border border-[#FFE0B2]">
                                                    <h3 className="text-sm font-bold text-[#E65100] mb-1 flex items-center gap-2"><Eye size={14} /> En SAP Real</h3>
                                                    <p className="text-sm text-[#5D4037]">{step.sapReal}</p>
                                                </div>

                                                {/* What to look for */}
                                                <div className="bg-[#E8F5E9] rounded-lg p-4 border border-[#C8E6C9]">
                                                    <h3 className="text-sm font-bold text-[#2E7D32] mb-1 flex items-center gap-2"><Search size={14} /> ¿Qué buscar en el resultado?</h3>
                                                    <p className="text-sm text-[#33691E]">{step.whatToLook}</p>
                                                </div>
                                            </div>

                                            {/* Navigation */}
                                            <div className="flex justify-between mt-8">
                                                <button
                                                    disabled={activeTutorialStep === 0}
                                                    onClick={() => setActiveTutorialStep(prev => prev - 1)}
                                                    className="px-4 py-2 text-sm border border-[#C4C4C4] rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    ← Anterior
                                                </button>
                                                <span className="text-xs text-[#6A6D70] self-center">
                                                    {activeTutorialStep + 1} de {TUTORIAL_STEPS.length}
                                                </span>
                                                <button
                                                    disabled={activeTutorialStep === TUTORIAL_STEPS.length - 1}
                                                    onClick={() => setActiveTutorialStep(prev => prev + 1)}
                                                    className="px-4 py-2 text-sm bg-[#0854A0] text-white rounded hover:bg-[#0A6ED1] disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    Siguiente →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#F5F7FA] border-t border-[#C4C4C4] px-3 py-1 text-[10px] text-[#6A6D70] flex justify-between">
                    <span>Sistema: PRD (300) | {data.length.toLocaleString()} materiales cargados</span>
                    <span>{results ? `${results.rowCount} de ${results.totalMatch?.toLocaleString() || results.rowCount} registros${results.totalMatch > 200 ? ' (mostrando 200)' : ''}` : 'Listo'}</span>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowSaveModal(false)}>
                    <div className="bg-white p-4 rounded shadow-lg w-80" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-sm mb-2 text-[#0854A0]">Guardar Variante</h3>
                        <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="Nombre..." className="w-full border p-1 text-sm mb-3" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSaveModal(false)} className="px-2 py-1 text-xs border rounded">Cancelar</button>
                            <button onClick={handleSaveVariant} className="px-2 py-1 text-xs bg-[#0854A0] text-white rounded">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal */}
            {showLoadModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowLoadModal(false)}>
                    <div className="bg-white rounded shadow-lg w-96 max-h-[400px] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#E5E9F0] p-2 border-b flex justify-between items-center">
                            <h3 className="font-bold text-xs text-[#0854A0]">Variantes Guardadas</h3>
                            <button onClick={() => setShowLoadModal(false)}>×</button>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1">
                            {savedQueries.length === 0
                                ? <p className="text-xs text-gray-500 text-center py-4">No hay variantes guardadas</p>
                                : savedQueries.map((v, i) => (
                                    <div key={i} className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between" onClick={() => { setQuery(v.query); setShowLoadModal(false); setActiveTab('free'); }}>
                                        <div><div className="font-bold text-sm">{v.name}</div><div className="text-[10px] text-gray-400 font-mono truncate w-64">{v.query}</div></div>
                                        <Play size={10} className="text-green-600 self-center" />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Shared results table renderer
    function renderResultsTable() {
        return (
            <div className="flex-1 overflow-auto bg-white relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin text-[#0854A0] mb-2"><Clock size={32} /></div>
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
                        <div className="bg-[#F2F2F2] px-3 py-1.5 text-xs border-b border-[#C4C4C4] sticky top-0 z-10 flex justify-between items-center">
                            <span className="font-medium">{results.queryName || 'Resultado'}: <strong>{results.rowCount.toLocaleString()}</strong> registros</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[#6A6D70]">{executionTime}ms</span>
                                <button onClick={handleExport} className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium">
                                    <Download size={12} /> Excel
                                </button>
                            </div>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#F5F7FA]">
                                <tr>
                                    <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase w-10 sticky top-[33px] bg-[#F5F7FA]">#</th>
                                    {results.fields.map((f, i) => (
                                        <th key={i} className="px-3 py-2 text-left text-[10px] font-bold text-[#444] uppercase border-l border-gray-200 sticky top-[33px] bg-[#F5F7FA]">
                                            {f.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {results.rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-[#FFF8E1]">
                                        <td className="px-2 py-1 text-[10px] text-gray-400 bg-gray-50">{i + 1}</td>
                                        {results.fields.map((f, j) => {
                                            const val = row[f.name];
                                            const isEmpty = val === null || val === undefined || val === '' || val === 0;
                                            return (
                                                <td key={j} className={`px-3 py-1 text-xs border-l border-gray-50 font-mono ${isEmpty && f.name !== 'LABST' ? 'bg-red-50 text-red-400 italic' : 'text-gray-700'}`}>
                                                    {isEmpty ? (f.name === 'LABST' ? '0' : '⚠ vacío') : val}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !loading && !error && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8">
                            <Database size={64} strokeWidth={1} />
                            <p className="mt-4 text-sm">Selecciona una consulta a la izquierda para comenzar</p>
                            <p className="text-xs text-gray-400 mt-1">O usa la pestaña "Consulta Libre" para escribir SQL</p>
                        </div>
                    )
                )}
            </div>
        );
    }
}
