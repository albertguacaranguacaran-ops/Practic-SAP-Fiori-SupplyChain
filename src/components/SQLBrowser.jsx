import { useState, useEffect, useRef } from 'react';
import {
    Play, Download, Clock, Database, Table,
    Columns, AlertCircle, CheckCircle, Copy,
    ChevronRight, RotateCcw, Save
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

// SQL Keywords for highlighting
const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'ORDER', 'BY',
    'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE',
    'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'VIEW',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'NULL', 'TRUE', 'FALSE', 'ASC', 'DESC', 'COALESCE', 'CAST'
];

// SAP Table descriptions
const SAP_TABLES = {
    'MARA': 'Datos Generales del Material',
    'MAKT': 'Textos de Material',
    'MARC': 'Datos del Material por Centro',
    'MARD': 'Stock por Almacén',
    'MVKE': 'Datos de Ventas del Material',
    'VBAK': 'Cabecera de Documento de Ventas',
    'VBAP': 'Posiciones de Documento de Ventas',
    'CDHDR': 'Cabecera Historial de Cambios',
    'CDPOS': 'Posiciones Historial de Cambios',
    'T023': 'Grupos de Mercancías',
    'LFA1': 'Proveedores'
};

// Example queries
const EXAMPLE_QUERIES = [
    { label: 'Ver todos los materiales', query: 'SELECT * FROM V_MATERIAL_COMPLETO LIMIT 100' },
    { label: 'Materiales con stock bajo', query: 'SELECT * FROM MARD d JOIN MARC c ON d.MATNR = c.MATNR WHERE d.LABST < c.MINBE' },
    { label: 'Materiales pesados (>50kg)', query: 'SELECT MATNR, EAN11, NTGEW FROM MARA WHERE NTGEW > 50 ORDER BY NTGEW DESC' },
    { label: 'Conteo por categoría', query: 'SELECT m.MATKL, t.WGBEZ, COUNT(*) as total FROM MARA m JOIN T023 t ON m.MATKL = t.MATKL GROUP BY m.MATKL, t.WGBEZ' },
    { label: 'Últimos cambios (Audit)', query: 'SELECT * FROM CDHDR ORDER BY UDATE DESC, UTIME DESC LIMIT 50' },
];

const API_URL = 'http://localhost:3001';

export default function SQLBrowser({ onClose, onStatusMessage }) {
    const [query, setQuery] = useState('SELECT * FROM MARA LIMIT 50');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [columns, setColumns] = useState([]);
    const [history, setHistory] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);
    const textareaRef = useRef(null);

    // Load tables on mount
    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await fetch(`${API_URL}/api/sql/tables`);
            if (response.ok) {
                const data = await response.json();
                setTables(data);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
        }
    };

    const fetchColumns = async (tableName) => {
        try {
            const response = await fetch(`${API_URL}/api/sql/tables/${tableName}/columns`);
            if (response.ok) {
                const data = await response.json();
                setColumns(data);
                setSelectedTable(tableName);
            }
        } catch (err) {
            console.error('Error fetching columns:', err);
        }
    };

    const executeQuery = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/sql/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            if (data.success) {
                setResults(data);
                setExecutionTime(data.executionTimeMs);
                setHistory(prev => [{ query, timestamp: new Date(), rowCount: data.rowCount }, ...prev.slice(0, 19)]);
                onStatusMessage?.(`Query ejecutada: ${data.rowCount} fila(s) en ${data.executionTimeMs}ms`, 'success');
            } else {
                setError(data.error);
                setResults(null);
                onStatusMessage?.(`Error SQL: ${data.error}`, 'error');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            onStatusMessage?.('Error de conexión con el backend', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            executeQuery();
        }
        // Tab for indent
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            setQuery(query.substring(0, start) + '  ' + query.substring(end));
            setTimeout(() => {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            }, 0);
        }
    };

    const insertTableName = (tableName) => {
        const newQuery = query + (query.endsWith(' ') || !query ? '' : ' ') + tableName;
        setQuery(newQuery);
        textareaRef.current?.focus();
    };

    const handleExport = async () => {
        if (!results?.rows?.length) return;

        try {
            // Transform rows for export
            const exportData = results.rows.map(row => {
                const obj = {};
                results.fields.forEach((field, idx) => {
                    obj[field.name] = row[field.name];
                });
                return obj;
            });

            await exportToExcel(exportData, 'SQL_Query_Result');
            onStatusMessage?.('Resultados exportados a Excel', 'success');
        } catch (err) {
            onStatusMessage?.('Error al exportar', 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content w-[1200px] h-[85vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[#0854A0] bg-[#E8F4FD] px-2 py-0.5 rounded">/nSE16</span>
                        <Database size={18} className="text-[#0854A0]" />
                        <span className="font-semibold">Data Browser - SQL Query Tool</span>
                    </div>
                    <button onClick={onClose} className="hover:bg-[#E0E0E0] p-1 rounded">✕</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Tables */}
                    <div className="w-64 border-r border-[#C4C4C4] bg-[#FAFAFA] overflow-auto">
                        <div className="p-3 border-b bg-[#F2F2F2]">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Table size={14} />
                                Tablas SAP
                            </h3>
                        </div>
                        <div className="p-2">
                            {tables.map(table => (
                                <div key={table.table_name}>
                                    <button
                                        onClick={() => fetchColumns(table.table_name)}
                                        onDoubleClick={() => insertTableName(table.table_name.toUpperCase())}
                                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between
                      ${selectedTable === table.table_name ? 'bg-[#E8F4FD] text-[#0854A0]' : 'hover:bg-[#E0E0E0]'}`}
                                    >
                                        <span className="font-mono">{table.table_name.toUpperCase()}</span>
                                        <span className="text-xs text-[#6A6D70]">{table.column_count}cols</span>
                                    </button>
                                    {selectedTable === table.table_name && columns.length > 0 && (
                                        <div className="ml-4 mt-1 mb-2 text-xs">
                                            {columns.map(col => (
                                                <div
                                                    key={col.column_name}
                                                    className="py-0.5 px-2 hover:bg-[#E8F4FD] cursor-pointer rounded flex justify-between"
                                                    onClick={() => insertTableName(col.column_name.toUpperCase())}
                                                >
                                                    <span>{col.column_name}</span>
                                                    <span className="text-[#6A6D70]">{col.data_type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {tables.length === 0 && (
                                <p className="text-sm text-[#6A6D70] p-2">
                                    Conectando al servidor...
                                </p>
                            )}
                        </div>

                        {/* Table Descriptions */}
                        <div className="p-3 border-t bg-[#F2F2F2] mt-auto">
                            <h4 className="font-semibold text-xs mb-2">Referencia SAP</h4>
                            <div className="text-xs space-y-1 max-h-32 overflow-auto">
                                {Object.entries(SAP_TABLES).map(([code, desc]) => (
                                    <div key={code} className="flex gap-2">
                                        <span className="font-mono text-[#0854A0]">{code}</span>
                                        <span className="text-[#6A6D70] truncate">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Query Editor */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold">SQL Query</span>
                                <div className="ml-auto flex gap-1">
                                    {EXAMPLE_QUERIES.map((ex, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setQuery(ex.query)}
                                            className="text-xs px-2 py-1 bg-[#E8F4FD] text-[#0854A0] rounded hover:bg-[#D4E8FA]"
                                            title={ex.query}
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
                                    placeholder="SELECT * FROM MARA LIMIT 100"
                                    className="w-full h-28 p-3 font-mono text-sm border border-[#C4C4C4] rounded 
                           focus:border-[#0854A0] focus:ring-1 focus:ring-[#0854A0] resize-none"
                                    spellCheck={false}
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-[#6A6D70]">
                                    Ctrl+Enter para ejecutar
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={executeQuery}
                                    disabled={loading || !query.trim()}
                                    className="sap-btn sap-btn-primary disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="loading-spinner" />
                                    ) : (
                                        <Play size={14} />
                                    )}
                                    Ejecutar (F8)
                                </button>

                                <button
                                    onClick={() => setQuery('')}
                                    className="sap-btn sap-btn-secondary"
                                >
                                    <RotateCcw size={14} />
                                    Limpiar
                                </button>

                                {results?.rows?.length > 0 && (
                                    <button onClick={handleExport} className="sap-btn sap-btn-secondary ml-auto">
                                        <Download size={14} />
                                        Exportar a Excel
                                    </button>
                                )}

                                {executionTime && (
                                    <span className="text-xs text-[#6A6D70] ml-auto flex items-center gap-1">
                                        <Clock size={12} />
                                        {executionTime}ms
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-auto">
                            {error && (
                                <div className="m-4 p-4 bg-[#FFEBEE] border border-[#BB0000] rounded">
                                    <div className="flex items-center gap-2 text-[#BB0000]">
                                        <AlertCircle size={18} />
                                        <span className="font-semibold">Error SQL</span>
                                    </div>
                                    <pre className="mt-2 text-sm font-mono whitespace-pre-wrap">{error}</pre>
                                </div>
                            )}

                            {results && (
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle size={16} className="text-[#107E3E]" />
                                        <span className="text-sm">
                                            {results.command} - {results.rowCount} fila(s) afectada(s)
                                        </span>
                                    </div>

                                    {results.rows?.length > 0 && (
                                        <div className="border rounded overflow-auto max-h-[400px]">
                                            <table className="alv-table">
                                                <thead>
                                                    <tr>
                                                        {results.fields?.map((field, idx) => (
                                                            <th key={idx} className="sticky top-0">
                                                                {field.name}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.rows.map((row, rowIdx) => (
                                                        <tr key={rowIdx}>
                                                            {results.fields?.map((field, colIdx) => (
                                                                <td key={colIdx} className="max-w-xs truncate">
                                                                    {row[field.name]?.toString() ?? <span className="text-[#C4C4C4]">NULL</span>}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!results && !error && !loading && (
                                <div className="flex items-center justify-center h-full text-[#6A6D70]">
                                    <div className="text-center">
                                        <Database size={48} className="mx-auto mb-3 opacity-30" />
                                        <p>Escriba una consulta SQL y presione Ejecutar</p>
                                        <p className="text-sm mt-1">ou doble-click en una tabla para insertarla</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="border-t p-2 bg-[#FAFAFA] max-h-24 overflow-auto">
                                <div className="text-xs font-semibold mb-1 text-[#6A6D70]">Historial</div>
                                {history.slice(0, 5).map((h, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setQuery(h.query)}
                                        className="text-xs font-mono truncate py-0.5 px-1 hover:bg-[#E0E0E0] cursor-pointer rounded"
                                    >
                                        <Clock size={10} className="inline mr-1" />
                                        {h.query}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
