import { useState } from 'react';
import { Database, FileSpreadsheet, ArrowRight, CircleCheck, Info, Search, GitMerge, List, Filter, Code, Terminal, Download, FileText } from 'lucide-react';

const TUTORIALS = [
    {
        id: 'Z_INVENTARIO_TOTAL',
        title: '1. Reporte Maestro de Inventario',
        desc: 'La "Foto" del Almacén: Stock, Valor y Peso.',
        tables: ['MARA', 'MARD', 'MAKT', 'MBEW'],
        joins: [
            { from: 'MARA-MATNR', to: 'MARD-MATNR' },
            { from: 'MARA-MATNR', to: 'MAKT-MATNR' },
            { from: 'MARA-MATNR', to: 'MBEW-MATNR' },
            { from: 'MARD-WERKS', to: 'MBEW-BWKEY', note: '¡Truco de Líder! Asegura el costo de esa tienda.' }
        ],
        filters: ['MARD-WERKS (Centro)', 'MARD-LGORT (Almacén)', 'MARA-MATNR (Material)'],
        columns: ['Material (MARA-MATNR)', 'Descripción (MAKT-MAKTX)', 'Stock Libre (MARD-LABST)', 'Peso Bruto (MARA-BRGEW)', 'Costo Variable (MBEW-VERPR)'],
        sql: `SELECT 
  MARA.MATNR, MAKT.MAKTX, MARD.LABST, MARA.BRGEW, MBEW.VERPR
FROM MARA
INNER JOIN MARD ON MARA.MATNR = MARD.MATNR
INNER JOIN MAKT ON MARA.MATNR = MAKT.MATNR
INNER JOIN MBEW ON MARA.MATNR = MBEW.MATNR AND MARD.WERKS = MBEW.BWKEY
WHERE MARD.WERKS = @Centro 
  AND MARD.LGORT = @Almacen`
    },
    {
        id: 'Z_VENTAS_ANALISIS',
        title: '2. Tendencia Global de Ventas',
        desc: 'Análisis de rotación mensual (Filtro Mov 601).',
        tables: ['MKPF', 'MSEG', 'MAKT'],
        joins: [
            { from: 'MKPF-MBLNR', to: 'MSEG-MBLNR' },
            { from: 'MKPF-MJAHR', to: 'MSEG-MJAHR', note: 'Sin esto, la data sale duplicada.' },
            { from: 'MSEG-MATNR', to: 'MAKT-MATNR' }
        ],
        filters: ['MKPF-BUDAT (Fecha)', 'MSEG-BWART (Clase Mov: 601)'],
        columns: ['Material (MSEG-MATNR)', 'Descripción (MAKT-MAKTX)', 'Fecha Contab. (MKPF-BUDAT)', 'Cantidad (MSEG-MENGE)'],
        sql: `SELECT 
  MSEG.MATNR, MAKT.MAKTX, MKPF.BUDAT, MSEG.MENGE 
FROM MKPF
INNER JOIN MSEG ON MKPF.MBLNR = MSEG.MBLNR AND MKPF.MJAHR = MSEG.MJAHR
INNER JOIN MAKT ON MSEG.MATNR = MAKT.MATNR
WHERE MKPF.BUDAT BETWEEN @FechaDesde AND @FechaHasta
  AND MSEG.BWART = '601'`
    },
    {
        id: 'Z_VENTAS_SUCURSAL',
        title: '3. Ventas por Sucursal',
        desc: 'Igual al anterior, pero desglosado por tienda.',
        tables: ['MKPF', 'MSEG', 'MAKT'],
        joins: [
            { from: 'MKPF-MBLNR', to: 'MSEG-MBLNR' },
            { from: 'MKPF-MJAHR', to: 'MSEG-MJAHR' },
            { from: 'MSEG-MATNR', to: 'MAKT-MATNR' }
        ],
        filters: ['MKPF-BUDAT', 'MSEG-BWART', 'MSEG-WERKS (Centro)'],
        columns: ['Material (MSEG-MATNR)', 'Descripción (MAKT-MAKTX)', 'Centro (MSEG-WERKS)', 'Cantidad (MSEG-MENGE)'],
        sql: `SELECT 
  MSEG.MATNR, MAKT.MAKTX, MSEG.WERKS, MSEG.MENGE 
FROM MKPF
INNER JOIN MSEG ON MKPF.MBLNR = MSEG.MBLNR AND MKPF.MJAHR = MSEG.MJAHR
INNER JOIN MAKT ON MSEG.MATNR = MAKT.MATNR
WHERE MKPF.BUDAT BETWEEN @FechaDesde AND @FechaHasta
  AND MSEG.BWART = '601'`
    },
    {
        id: 'Z_COMPRAS_ENTRADAS',
        title: '4. Reporte de Abastecimiento',
        desc: 'Qué llegó de proveedores (Filtro Mov 101).',
        tables: ['MKPF', 'MSEG', 'MAKT'],
        joins: [
            { from: 'MKPF-MBLNR', to: 'MSEG-MBLNR' },
            { from: 'MKPF-MJAHR', to: 'MSEG-MJAHR' },
            { from: 'MSEG-MATNR', to: 'MAKT-MATNR' }
        ],
        filters: ['MKPF-BUDAT', 'MSEG-BWART (Clase Mov: 101)', 'MSEG-LIFNR (Proveedor)'],
        columns: ['Material (MSEG-MATNR)', 'Descripción (MAKT-MAKTX)', 'Fecha (MKPF-BUDAT)', 'Cantidad (MSEG-MENGE)', 'Proveedor (MSEG-LIFNR)'],
        sql: `SELECT 
  MSEG.MATNR, MAKT.MAKTX, MKPF.BUDAT, MSEG.MENGE, MSEG.LIFNR
FROM MKPF
INNER JOIN MSEG ON MKPF.MBLNR = MSEG.MBLNR AND MKPF.MJAHR = MSEG.MJAHR
INNER JOIN MAKT ON MSEG.MATNR = MAKT.MATNR
WHERE MKPF.BUDAT BETWEEN @FechaDesde AND @FechaHasta
  AND MSEG.BWART = '101'`
    },
    {
        id: 'Z_AUDITORIA_MERMAS',
        title: '5. Auditoría de Mermas/Pérdidas',
        desc: 'Seguridad y control de inventario (Filtro Mov 551).',
        tables: ['MKPF', 'MSEG', 'MAKT'],
        joins: [
            { from: 'MKPF-MBLNR', to: 'MSEG-MBLNR' },
            { from: 'MKPF-MJAHR', to: 'MSEG-MJAHR' },
            { from: 'MSEG-MATNR', to: 'MAKT-MATNR' }
        ],
        filters: ['MKPF-BUDAT', 'MSEG-BWART (Clase Mov: 551/561)'],
        columns: ['Material', 'Descripción', 'Centro', 'Almacén (MSEG-LGORT)', 'Cantidad', 'Texto Breve (MSEG-SGTXT) - La Excusa'],
        sql: `SELECT 
  MSEG.MATNR, MAKT.MAKTX, MSEG.WERKS, MSEG.LGORT, MSEG.MENGE, MSEG.SGTXT
FROM MKPF
INNER JOIN MSEG ON MKPF.MBLNR = MSEG.MBLNR AND MKPF.MJAHR = MSEG.MJAHR
INNER JOIN MAKT ON MSEG.MATNR = MAKT.MATNR
WHERE MKPF.BUDAT BETWEEN @FechaDesde AND @FechaHasta
  AND MSEG.BWART IN ('551', '561')`
    }
];

const AVAILABLE_TABLES = [
    { name: 'MARA', desc: 'Datos Maestros General' },
    { name: 'MARD', desc: 'Datos de Almacén/Stock' },
    { name: 'MAKT', desc: 'Descripciones Material' },
    { name: 'MBEW', desc: 'Valoración/Costos' },
    { name: 'MKPF', desc: 'Cabecera Doc. Material' },
    { name: 'MSEG', desc: 'Segmento Doc. Material' },
    { name: 'VBAK', desc: 'Cabecera Pedido Venta' },
    { name: 'VBAP', desc: 'Posición Pedido Venta' },
    { name: 'LFA1', desc: 'Maestro Proveedores' },
    { name: 'EKKO', desc: 'Cabecera Pedido Compra' },
    { name: 'EKPO', desc: 'Posición Pedido Compra' },
];

export default function SQVI({ onClose }) {
    const [mode, setMode] = useState('menu'); // menu, build, sql, result
    const [selectedTutorial, setSelectedTutorial] = useState(null);
    const [addedTables, setAddedTables] = useState([]);
    const [joins, setJoins] = useState([]);
    const [step, setStep] = useState(0);
    const [showExportModal, setShowExportModal] = useState(false);
    const [sqlCode, setSqlCode] = useState('');

    const handleStartTutorial = (tutorial) => {
        setSelectedTutorial(tutorial);
        setMode('build');
        setAddedTables([]);
        setJoins([]);
        setStep(1); // Step 1: Add Tables
    };

    const handleStartSQL = (tutorial) => {
        setSelectedTutorial(tutorial);
        setSqlCode(tutorial.sql);
        setMode('sql');
    }

    const handleAddTable = (tableName) => {
        if (!selectedTutorial) return;

        // Check if table is required
        const isRequired = selectedTutorial.tables.includes(tableName);

        if (isRequired) {
            if (!addedTables.includes(tableName)) {
                setAddedTables([...addedTables, tableName]);
            }
        } else {
            // Simulator feedback
            alert(`⚠️ ¡Cuidado! La tabla ${tableName} NO es necesaria para el reporte ${selectedTutorial.id}. \n\nRecuerda el principio de "Menos es Más" en SQVI para evitar duplicidad de datos.`);
        }
    };

    const handleAutoJoin = () => {
        if (addedTables.length === selectedTutorial.tables.length) {
            setJoins(selectedTutorial.joins);
            setStep(2); // Move to Select Fields
        } else {
            alert(`Aún faltan tablas. Este reporte requiere: ${selectedTutorial.tables.join(', ')}.`);
        }
    };

    const handleExecute = () => {
        setMode('result');
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col font-sans">
            {/* Header */}
            <div className="bg-[#0a6ed1] text-white px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <Database size={20} />
                    <div>
                        <h1 className="font-bold text-sm">QuickViewer: Simulador de Reportes (SQVI)</h1>
                        <p className="text-[10px] text-white/80">Entrenamiento Oficial Dataelectric</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>

            <div className="flex-1 overflow-auto p-6">

                {/* MODE: MENU */}
                {mode === 'menu' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Centro de Entrenamiento de Reportes</h2>
                            <p className="text-gray-500">Selecciona una misión para aprender a construir los reportes oficiales.</p>
                        </div>

                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                                <button className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-bold text-blue-600">Modo Gráfico (SQVI)</button>
                                <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Modo SQL (Experto)</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {TUTORIALS.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col h-full relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">SQVI</span>
                                    </div>
                                    <h3 className="font-bold text-base text-gray-800 mb-2">{t.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4 flex-grow">{t.desc}</p>

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => handleStartTutorial(t)} className="flex-1 sap-btn sap-btn-primary text-xs justify-center">
                                            Construir
                                        </button>
                                        <button onClick={() => handleStartSQL(t)} className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600" title="Ver Código SQL">
                                            <Code size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODE: BUILD (Graphic) */}
                {mode === 'build' && selectedTutorial && (
                    <div className="flex h-full gap-6">
                        {/* Workbench */}
                        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative overflow-hidden">
                            {/* Toolbar */}
                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-700">{selectedTutorial.id}</h3>
                                    <p className="text-xs text-gray-500">Modo Diseño Gráfico</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${step === 1 ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                                        <span className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-[10px]">1</span>
                                        Tablas
                                    </div>
                                    <div className="w-8 h-px bg-gray-300"></div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${step === 2 ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                                        <span className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-[10px]">2</span>
                                        Campos
                                    </div>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-gray-50 p-8 relative overflow-auto">

                                {/* Step 1 Instructions */}
                                {step === 1 && (
                                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 text-yellow-800 px-6 py-3 rounded-lg shadow-sm border border-yellow-200 max-w-lg text-center z-10">
                                        <p className="text-sm font-bold mb-1">Paso 1: Insertar Tablas</p>
                                        <p className="text-xs">Selecciona las tablas de la lista derecha. Necesitas agregar: <strong>{selectedTutorial.tables.join(', ')}</strong>.</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-12 items-start justify-center mt-20 relative z-0">
                                    {addedTables.map((table, idx) => (
                                        <div key={table} className="w-40 bg-white border-2 border-blue-600 rounded-lg shadow-lg relative group">
                                            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 text-center uppercase tracking-wider rounded-t-sm">{table}</div>
                                            <div className="p-3 space-y-2">
                                                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                                                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                                <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                                            </div>

                                            {/* Simulated Fields for connection */}
                                            {step === 2 && (
                                                <div className="absolute -right-1 top-8 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Joins Visualization (Step 2) */}
                                {step === 2 && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="bg-white/90 p-6 rounded-xl shadow-lg border border-green-200 max-w-lg text-center backdrop-blur-sm pointer-events-auto">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <GitMerge size={24} />
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-lg">Uniones Establecidas</h3>
                                            <ul className="text-left mt-4 space-y-3">
                                                {selectedTutorial.joins.map((join, i) => (
                                                    <li key={i} className="text-xs flex items-start gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                                                        <CircleCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-mono text-gray-600">{join.from}</span>
                                                            <span className="text-gray-400 mx-1">↔</span>
                                                            <span className="font-mono text-gray-600">{join.to}</span>
                                                            {join.note && (
                                                                <p className="text-orange-600 font-bold mt-1 text-[10px] bg-orange-50 px-1 py-0.5 rounded inline-block border border-orange-100">💡 {join.note}</p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-gray-400 mt-4 italic">El sistema ha detectado y aplicado las relaciones lógicas automáticamente.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                                <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4">Cancelar</button>

                                {step === 1 && (
                                    <button
                                        onClick={handleAutoJoin}
                                        className={`sap-btn flex items-center gap-2 ${addedTables.length === selectedTutorial.tables.length ? 'sap-btn-primary' : 'bg-gray-300 cursor-not-allowed text-white'}`}
                                        disabled={addedTables.length !== selectedTutorial.tables.length}
                                    >
                                        <GitMerge size={16} />
                                        Crear Uniones
                                    </button>
                                )}

                                {step === 2 && (
                                    <button onClick={handleExecute} className="sap-btn sap-btn-primary bg-green-600 hover:bg-green-700 border-green-600 text-white flex items-center gap-2 shadow-sm">
                                        <ArrowRight size={16} />
                                        Ejecutar Reporte
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Palette */}
                        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Tablas Disponibles</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {AVAILABLE_TABLES.map(t => {
                                    const isAdded = addedTables.includes(t.name);

                                    return (
                                        <div
                                            key={t.name}
                                            onClick={() => !isAdded && handleAddTable(t.name)}
                                            className={`p-3 rounded border text-sm cursor-pointer transition-all group ${isAdded
                                                ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-default opacity-60'
                                                : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold font-mono text-gray-700 group-hover:text-blue-600">{t.name}</span>
                                                {isAdded && <CircleCheck size={14} className="text-green-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-tight">{t.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE: SQL (Expert) */}
                {mode === 'sql' && selectedTutorial && (
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden flex flex-col flex-1 border border-gray-700">
                            <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Terminal size={18} className="text-green-400" />
                                    <span className="text-gray-300 text-sm font-mono">Editor SQL - {selectedTutorial.id}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                </div>
                            </div>
                            <div className="flex-1 p-6 relative">
                                <textarea
                                    className="w-full h-full bg-transparent text-green-300 font-mono text-sm resize-none focus:outline-none"
                                    value={sqlCode}
                                    onChange={(e) => setSqlCode(e.target.value)}
                                    spellCheck="false"
                                />
                            </div>
                            <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-between items-center">
                                <p className="text-xs text-gray-400">
                                    Transacción técnica: <span className="font-mono text-gray-300">DBACOCKPIT (Solo Lectura)</span> o Reporte Z en SE38.
                                </p>
                                <div className="space-x-4">
                                    <button onClick={() => setMode('menu')} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
                                    <button onClick={handleExecute} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold shadow-lg">
                                        Ejecutar Query (F8)
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-blue-800 text-sm">¿Cómo aplicar esto en SAP real?</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    Aunque SQVI genera este código internamente, puedes dárselo a un ABAPer para crear un reporte "Z" optimizado si el QuickViewer se queda corto en rendimiento.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE: RESULT */}
                {mode === 'result' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
                        <div className="p-4 border-b border-gray-200 bg-[#EFF4F9] flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-[#0854A0] flex items-center gap-2">
                                    <FileSpreadsheet size={18} />
                                    Resultado: {selectedTutorial?.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500 font-mono">
                                        {selectedTutorial?.tables.join(' + ')}
                                    </span>
                                    <span className="text-xs text-gray-400">• 500 registros encontrados (Simulado)</span>
                                </div>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => setMode('menu')} className="sap-btn sap-btn-secondary bg-white text-gray-600 hover:bg-gray-50">Volver al Menú</button>
                                <button
                                    onClick={() => setShowExportModal(true)}
                                    className="sap-btn sap-btn-primary flex items-center gap-2"
                                >
                                    <Download size={14} /> Exportar Excel
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            {/* Summary Cards for Filters / Columns */}
                            <div className="grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
                                <div className="bg-white p-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Filter size={10} /> Filtros Aplicados (Pantalla Selección)
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTutorial?.filters.map(f => (
                                            <span key={f} className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100 font-medium">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <List size={10} /> Columnas Reporte (Lista)
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTutorial?.columns.map(c => (
                                            <span key={c} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 font-medium">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mock Excel Grid */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0 shadow-sm z-10">
                                        <tr>
                                            {selectedTutorial?.columns.map(col => (
                                                <th key={col} className="px-4 py-3 text-left border-r border-b border-gray-300 last:border-r-0 whitespace-nowrap bg-gray-100">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <tr key={i} className="hover:bg-blue-50 transition-colors">
                                                {selectedTutorial?.columns.map(col => (
                                                    <td key={col} className="px-4 py-2 border-r border-gray-200 last:border-r-0 whitespace-nowrap text-gray-700">
                                                        {col.includes('MATNR') || col.includes('Material') ? <span className="font-mono text-blue-600">MAT-{1000 + i}</span> :
                                                            col.includes('LABST') || col.includes('Cantidad') ? <span className="font-bold">{Math.floor(Math.random() * 500)}</span> :
                                                                col.includes('MAKTX') || col.includes('Descripción') ? `Producto Simulado ${i}` :
                                                                    col.includes('Centro') ? '1000' :
                                                                        col.includes('WERKS') ? '1000' :
                                                                            col.includes('Excusa') ? (i % 2 === 0 ? 'Caja Mojada' : 'Golpe Transporte') :
                                                                                '...'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* EXPORT SIMULATION MODAL */}
                        {showExportModal && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="bg-[#ECECEC] rounded-sm shadow-2xl w-96 border border-gray-400 font-sans">
                                    {/* SAP GUI Title Bar */}
                                    <div className="bg-gradient-to-r from-[#002B55] to-[#004B8D] text-white px-2 py-1 flex justify-between items-center text-xs">
                                        <span className="font-bold drop-shadow-md">Select Spreadsheet</span>
                                        <button onClick={() => setShowExportModal(false)} className="hover:bg-red-500 px-2 rounded">✕</button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 text-xs text-gray-800">
                                        <div className="bg-white border border-gray-400 h-40 overflow-y-auto mb-4 p-1">
                                            <div className="hover:bg-[#FFD699] px-2 py-1 cursor-pointer select-none">Excel (In Existing XXL Format)</div>
                                            <div className="hover:bg-[#FFD699] px-2 py-1 cursor-pointer select-none bg-[#FFD699] border border-dotted border-gray-600">Excel - Office Open XML Format (XLSX)</div>
                                            <div className="hover:bg-[#FFD699] px-2 py-1 cursor-pointer select-none">OpenOffice Calc</div>
                                            <div className="hover:bg-[#FFD699] px-2 py-1 cursor-pointer select-none">Pivot Table (Excel)</div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowExportModal(false);
                                                    alert('⬇️ Simulando descarga de archivo .XLSX...');
                                                }}
                                                className="flex items-center gap-1 px-3 py-1 bg-[#E0E0E0] border border-gray-400 rounded shadow-sm hover:bg-[#D0D0D0] transition-colors"
                                            >
                                                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
                                                <span>Confirmar (Enter)</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Helper */}
                                    <div className="bg-[#D4D4D4] px-2 py-1 text-[10px] text-gray-600 border-t border-gray-300">
                                        SAP GUI for Windows 7.70
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
