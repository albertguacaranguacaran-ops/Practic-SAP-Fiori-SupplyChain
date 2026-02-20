import { useState, useCallback, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
    Upload, FileSpreadsheet, CircleCheck, TriangleAlert,
    X, ChevronRight, Download, RefreshCw, Eye, Zap,
    ArrowRight, Database, Layers, Trash2, Package
} from 'lucide-react';

// ========== SAP COLUMN MAPPINGS ==========
// Maps common SAP column headers → internal fields
const COLUMN_MAP = {
    // ID
    'matnr': 'id', 'material': 'id', 'id material': 'id', 'material number': 'id',
    'código': 'id', 'codigo': 'id', 'id': 'id', 'cod': 'id', 'num. material': 'id',
    'número de material': 'id', 'numero de material': 'id',

    // EAN
    'ean11': 'ean', 'ean': 'ean', 'gtin': 'ean', 'código de barras': 'ean',
    'codigo de barras': 'ean', 'barcode': 'ean', 'ean/upc': 'ean',
    'código ean': 'ean', 'codigo ean': 'ean',

    // Description
    'maktx': 'descripcion', 'descripción': 'descripcion', 'descripcion': 'descripcion',
    'description': 'descripcion', 'material description': 'descripcion',
    'texto breve material': 'descripcion', 'nombre': 'descripcion',
    'texto breve de material': 'descripcion', 'denominación': 'descripcion',

    // Brand
    'marca': 'marca', 'brand': 'marca',

    // Model
    'modelo': 'modelo', 'model': 'modelo', 'num. modelo': 'modelo',

    // Category / Material Group
    'matkl': 'categoria', 'grupo de artículos': 'categoria', 'grupo de articulos': 'categoria',
    'categoría': 'categoria', 'categoria': 'categoria', 'category': 'categoria',
    'material group': 'categoria', 'grupo materiales': 'categoria',
    'grp.artículos': 'categoria', 'grp. artículos': 'categoria',

    // Subcategory
    'subcategoría': 'subcategoria', 'subcategoria': 'subcategoria',

    // Material type
    'mtart': 'tipoMaterial', 'tipo de material': 'tipoMaterial', 'material type': 'tipoMaterial',

    // Weight
    'ntgew': 'pesoNeto', 'peso neto': 'pesoNeto', 'net weight': 'pesoNeto', 'peso neto (kg)': 'pesoNeto',
    'brgew': 'pesoBruto', 'peso bruto': 'pesoBruto', 'gross weight': 'pesoBruto', 'peso bruto (kg)': 'pesoBruto',

    // Dimensions (SAP field names + Spanish variants)
    'laeng': 'largo', 'largo': 'largo', 'length': 'largo', 'longitud': 'largo', 'long.': 'largo',
    'breit': 'ancho', 'ancho': 'ancho', 'width': 'ancho', 'anchura': 'ancho',
    'hoehe': 'alto', 'alto': 'alto', 'height': 'alto', 'altura': 'alto',
    'volum': 'volumen', 'volumen': 'volumen', 'volume': 'volumen',

    // Stock
    'labst': 'stockActual', 'stock': 'stockActual', 'stock actual': 'stockActual',
    'libre utilización': 'stockActual', 'unrestricted': 'stockActual',
    'libre utilizacion': 'stockActual', 'cantidad en libre utilización': 'stockActual',

    // Reorder / MRP
    'minbe': 'puntoReorden', 'punto de reorden': 'puntoReorden', 'reorder point': 'puntoReorden',
    'punto reorden': 'puntoReorden', 'nivel de reorden': 'puntoReorden',
    'eisbe': 'stockSeguridad', 'stock de seguridad': 'stockSeguridad', 'safety stock': 'stockSeguridad',

    // Price
    'stprs': 'precioBase', 'verpr': 'precioBase', 'precio': 'precioBase',
    'precio base': 'precioBase', 'standard price': 'precioBase', 'price': 'precioBase',
    'precio estándar': 'precioBase', 'precio estandar': 'precioBase',

    // Plant / Center
    'werks': 'centro', 'centro': 'centro', 'plant': 'centro',

    // Location
    'lgort': 'ubicacion', 'almacén': 'ubicacion', 'almacen': 'ubicacion',
    'storage location': 'ubicacion', 'ubicación': 'ubicacion', 'ubicacion': 'ubicacion',

    // Vendor
    'lifnr': 'proveedor', 'proveedor': 'proveedor', 'vendor': 'proveedor',
    'acreedor': 'proveedor', 'proveedor (lifnr)': 'proveedor',

    // Purchasing group
    'ekgrp': 'grupoCompras', 'grupo de compras': 'grupoCompras', 'purchasing group': 'grupoCompras',

    // Sales org
    'vkorg': 'orgVentas', 'organización de ventas': 'orgVentas', 'sales org': 'orgVentas',

    // Unit
    'meins': 'unidadMedida', 'unidad': 'unidadMedida', 'unit': 'unidadMedida',
    'unidad base': 'unidadMedida', 'base unit': 'unidadMedida', 'um': 'unidadMedida',

    // Color
    'color': 'color',
};

const INTERNAL_FIELDS = [
    { key: 'id', label: 'ID Material (MATNR)', required: true },
    { key: 'descripcion', label: 'Descripción (MAKTX)', required: true },
    { key: 'ean', label: 'EAN (EAN11)', required: false },
    { key: 'marca', label: 'Marca', required: false },
    { key: 'modelo', label: 'Modelo', required: false },
    { key: 'categoria', label: 'Categoría (MATKL)', required: false },
    { key: 'tipoMaterial', label: 'Tipo Material (MTART)', required: false },
    { key: 'pesoNeto', label: 'Peso Neto kg (NTGEW)', required: false },
    { key: 'pesoBruto', label: 'Peso Bruto kg (BRGEW)', required: false },
    { key: 'largo', label: 'Largo cm (LAENG)', required: false },
    { key: 'ancho', label: 'Ancho cm (BREIT)', required: false },
    { key: 'alto', label: 'Alto cm (HOEHE)', required: false },
    { key: 'volumen', label: 'Volumen m³ (VOLUM)', required: false },
    { key: 'stockActual', label: 'Stock (LABST)', required: false },
    { key: 'puntoReorden', label: 'Punto Reorden (MINBE)', required: false },
    { key: 'stockSeguridad', label: 'Stock Seguridad (EISBE)', required: false },
    { key: 'precioBase', label: 'Precio (STPRS)', required: false },
    { key: 'centro', label: 'Centro (WERKS)', required: false },
    { key: 'ubicacion', label: 'Almacén (LGORT)', required: false },
    { key: 'proveedor', label: 'Proveedor (LIFNR)', required: false },
    { key: 'grupoCompras', label: 'Grupo Compras (EKGRP)', required: false },
    { key: 'orgVentas', label: 'Org. Ventas (VKORG)', required: false },
    { key: 'unidadMedida', label: 'Unidad Medida (MEINS)', required: false },
    { key: 'color', label: 'Color', required: false },
];

const NUM_FIELDS = ['pesoNeto', 'pesoBruto', 'largo', 'ancho', 'alto', 'volumen', 'stockActual', 'puntoReorden', 'stockSeguridad', 'precioBase'];

// ========== CSV PARSER ==========
// Handles SAP SE16N / ALV exports (tab-separated or comma-separated)
function parseCSVText(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    // Detect separator: tab wins if first line has tabs, else comma
    const sep = lines[0].includes('\t') ? '\t' : ',';

    const parseRow = (line) =>
        line.split(sep).map(cell => {
            // Remove surrounding quotes if present
            const c = cell.trim();
            return c.startsWith('"') && c.endsWith('"') ? c.slice(1, -1).trim() : c;
        });

    // Find header row (first row with ≥ 3 non-empty cells)
    let headerIdx = 0;
    let headers = [];
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const cells = parseRow(lines[i]);
        if (cells.filter(c => c !== '').length >= 3) {
            headers = cells;
            headerIdx = i;
            break;
        }
    }
    if (!headers.length) return { headers: [], rows: [] };

    const rows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const cells = parseRow(lines[i]);
        if (cells.every(c => c === '')) continue;
        const obj = {};
        let hasData = false;
        headers.forEach((h, idx) => {
            if (h) {
                obj[h] = cells[idx] ?? '';
                if (cells[idx]) hasData = true;
            }
        });
        if (hasData) rows.push(obj);
    }
    return { headers: headers.filter(h => h !== ''), rows };
}

// ========== COMPONENT ==========
export default function DataImporter({ onImport, onClose, currentCount = 0 }) {
    const [step, setStep] = useState(1);
    const [rawData, setRawData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [fileName, setFileName] = useState('');
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importMode, setImportMode] = useState('merge');
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors] = useState([]);
    const fileInputRef = useRef(null);
    const workbookRef = useRef(null); // store workbook for sheet switching

    // ── Auto-map helper ───────────────────────────────────────
    const autoMapHeaders = (hdrs) => {
        const autoMap = {};
        hdrs.forEach(h => {
            if (!h) return;
            const norm = h.toLowerCase().trim();
            if (COLUMN_MAP[norm]) autoMap[h] = COLUMN_MAP[norm];
        });
        return autoMap;
    };

    // ── Parse an ExcelJS worksheet ────────────────────────────
    const parseWorksheet = (ws) => {
        const rows = [];
        let hdrs = [];
        let headerRowIdx = 0;

        ws.eachRow((row, rowNumber) => {
            if (headerRowIdx > 0) return;
            const nonEmpty = row.values.filter(v => v != null && v !== '').length;
            if (nonEmpty >= 3) {
                hdrs = row.values.map(v => (v != null ? String(v).trim() : ''));
                headerRowIdx = rowNumber;
            }
        });

        if (headerRowIdx === 0) { setErrors(['No se encontró fila de encabezados válida']); return; }

        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowIdx) return;
            const obj = {};
            let hasData = false;
            row.values.forEach((val, colIdx) => {
                if (hdrs[colIdx]) {
                    const cellVal = val != null ? (typeof val === 'object' && val.text ? val.text : String(val)) : '';
                    obj[hdrs[colIdx]] = cellVal;
                    if (cellVal !== '') hasData = true;
                }
            });
            if (hasData) rows.push(obj);
        });

        const cleanHeaders = hdrs.filter(h => h !== '');
        setHeaders(cleanHeaders);
        setRawData(rows);
        setMapping(autoMapHeaders(cleanHeaders));
        setStep(2);
        setErrors([]);
    };

    // ── Process uploaded file ─────────────────────────────────
    const processFile = useCallback(async (file) => {
        setFileName(file.name);
        setErrors([]);

        try {
            // ── CSV ───────────────────────────────────────────
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                const { headers: hdrs, rows } = parseCSVText(text);
                if (!hdrs.length) { setErrors(['CSV vacío o sin encabezados reconocibles']); return; }
                setHeaders(hdrs);
                setRawData(rows);
                setSheetNames([]);
                setSelectedSheet('CSV');
                setMapping(autoMapHeaders(hdrs));
                setStep(2);
                return;
            }

            // ── Excel (.xlsx / .xls) ──────────────────────────
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            workbookRef.current = workbook; // store for sheet switching

            const sheets = workbook.worksheets.map(ws => ws.name);
            setSheetNames(sheets);

            const ws = workbook.worksheets[0];
            setSelectedSheet(ws.name);
            parseWorksheet(ws);
        } catch (err) {
            setErrors([`Error al leer el archivo: ${err.message}`]);
        }
    }, []);

    // ── Switch sheet (now actually works) ────────────────────
    const switchSheet = (sheetName) => {
        if (!workbookRef.current) return;
        const ws = workbookRef.current.getWorksheet(sheetName);
        if (!ws) return;
        setSelectedSheet(sheetName);
        parseWorksheet(ws);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
            processFile(file);
        } else {
            setErrors(['Solo se aceptan archivos .xlsx, .xls o .csv']);
        }
    }, [processFile]);

    const handleFileSelect = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };

    // ── Data transform ────────────────────────────────────────
    const mappedFieldCount = Object.values(mapping).filter(v => v).length;
    const hasRequiredFields = Object.values(mapping).includes('id') && Object.values(mapping).includes('descripcion');

    const previewData = rawData.slice(0, 10).map(row => {
        const mapped = {};
        Object.entries(mapping).forEach(([col, field]) => { if (field) mapped[field] = row[col] ?? ''; });
        return mapped;
    });

    const transformedData = rawData.map((row, idx) => {
        const mapped = {};
        Object.entries(mapping).forEach(([col, field]) => {
            if (!field) return;
            let val = row[col] ?? '';
            if (NUM_FIELDS.includes(field)) val = parseFloat(String(val).replace(',', '.')) || 0;
            mapped[field] = val;
        });
        if (!mapped.id) mapped.id = `IMP-${String(idx + 1).padStart(6, '0')}`;
        if (!mapped.descripcion) mapped.descripcion = 'Sin descripción';
        if (!mapped.status) mapped.status = 'active';
        if (!mapped.fechaCreacion) mapped.fechaCreacion = new Date().toISOString().split('T')[0];
        return mapped;
    });

    // ── Validation ────────────────────────────────────────────
    const validationIssues = [];
    const idsSeen = new Set();
    let dupIds = 0, emptyDesc = 0, emptyEAN = 0, emptyWeight = 0, emptyDim = 0, emptyReorder = 0;
    transformedData.forEach(m => {
        if (idsSeen.has(m.id)) dupIds++;
        idsSeen.add(m.id);
        if (!m.descripcion || m.descripcion === 'Sin descripción') emptyDesc++;
        if (!m.ean) emptyEAN++;
        if (!m.pesoNeto) emptyWeight++;
        if (!m.largo || !m.ancho || !m.alto) emptyDim++;
        if (!m.puntoReorden) emptyReorder++;
    });
    if (dupIds > 0) validationIssues.push({ type: 'warning', msg: `${dupIds} IDs duplicados en el archivo` });
    if (emptyDesc > 0) validationIssues.push({ type: 'warning', msg: `${emptyDesc} materiales sin descripción` });
    if (emptyEAN > 0) validationIssues.push({ type: 'info', msg: `${emptyEAN} materiales sin EAN — se detectarán en /nDQ` });
    if (emptyWeight > 0) validationIssues.push({ type: 'info', msg: `${emptyWeight} materiales sin peso — impacta flete y eCommerce` });
    if (emptyDim > 0) validationIssues.push({ type: 'info', msg: `${emptyDim} materiales sin dimensiones (L×A×H)` });
    if (emptyReorder > 0) validationIssues.push({ type: 'info', msg: `${emptyReorder} sin punto de reorden — MRP inactivo` });

    // ── Import ────────────────────────────────────────────────
    const handleImport = () => {
        setImporting(true);
        setTimeout(() => {
            const result = onImport(transformedData, importMode);
            setImportResult(result);
            setImporting(false);
            setStep(4);
        }, 800);
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#0854A0] to-[#0A6ED1] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Upload size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Importar Datos de SAP</h2>
                            <p className="text-xs text-white/70">SE16N → Excel / CSV → Simulador</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* STEP INDICATOR */}
                <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-4">
                    {[
                        { num: 1, label: 'Subir Archivo' },
                        { num: 2, label: 'Mapear Columnas' },
                        { num: 3, label: 'Vista Previa' },
                        { num: 4, label: 'Resultado' },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > s.num ? 'bg-green-500 text-white' : step === s.num ? 'bg-[#0854A0] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {step > s.num ? <CircleCheck size={14} /> : s.num}
                            </div>
                            <span className={`text-xs font-medium ${step >= s.num ? 'text-[#32363A]' : 'text-gray-400'}`}>{s.label}</span>
                            {i < 3 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-6">

                    {/* === STEP 1: Upload === */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-[#0854A0] bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-[#0854A0] hover:bg-gray-50'}`}
                            >
                                <FileSpreadsheet size={48} className={`mx-auto mb-4 ${dragOver ? 'text-[#0854A0]' : 'text-gray-400'}`} />
                                <h3 className="text-lg font-bold text-gray-700 mb-2">
                                    {dragOver ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo aquí'}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">Soporta <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong> (export SAP SE16N)</p>
                                <span className="inline-block px-4 py-2 bg-[#0854A0] text-white rounded-lg text-sm font-medium">Seleccionar Archivo</span>
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
                            </div>

                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    {errors.map((e, i) => <p key={i} className="text-sm text-red-700 flex items-center gap-2"><TriangleAlert size={14} /> {e}</p>)}
                                </div>
                            )}

                            {/* SAP Export Guide */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                <h4 className="font-bold text-sm text-[#0854A0] mb-3 flex items-center gap-2">
                                    <Zap size={16} /> ¿Cómo exportar desde SAP? (SE16N)
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-700">📋 Tablas recomendadas:</p>
                                        <div className="space-y-1 text-xs text-gray-600">
                                            {[
                                                ['MARA', 'Datos generales: peso, dimensiones, grupo'],
                                                ['MAKT', 'Descripciones del material'],
                                                ['MARC', 'Datos de centro: MRP, punto reorden'],
                                                ['MARD', 'Stock por almacén'],
                                                ['MEAN', 'Códigos EAN/GTIN'],
                                            ].map(([t, d]) => (
                                                <div key={t} className="flex gap-2">
                                                    <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-[10px] flex-shrink-0">{t}</code>
                                                    <span>{d}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-700">🔢 Pasos para exportar:</p>
                                        <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
                                            <li>Transacción <code className="bg-white px-1 rounded">SE16N</code> → Tabla <code className="bg-white px-1 rounded">MARA</code></li>
                                            <li>Ejecutar <kbd className="bg-white px-1 rounded border text-[10px]">F8</kbd></li>
                                            <li>Menú → <strong>Lista → Exportar → Hoja de cálculo</strong></li>
                                            <li>Guardar como <strong>.xlsx</strong> o <strong>.csv</strong></li>
                                        </ol>
                                        <div className="mt-2">
                                            <p className="text-[10px] text-gray-500 mb-1">Columnas mínimas necesarias:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {['MATNR', 'MAKTX', 'EAN11', 'MATKL', 'NTGEW', 'BRGEW', 'LAENG', 'BREIT', 'HOEHE', 'MINBE'].map(c => (
                                                    <span key={c} className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-gray-400">
                                Materiales actuales en el simulador: <strong>{currentCount.toLocaleString()}</strong>
                            </div>
                        </div>
                    )}

                    {/* === STEP 2: Column Mapping === */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-[#32363A]">Mapeo de Columnas</h3>
                                    <p className="text-xs text-gray-500">
                                        <strong>{fileName}</strong> • {rawData.length.toLocaleString()} filas • {headers.length} columnas •
                                        <span className="text-green-600 font-bold"> {mappedFieldCount} mapeados automáticamente</span>
                                    </p>
                                </div>
                                {sheetNames.length > 1 && (
                                    <select
                                        value={selectedSheet}
                                        onChange={(e) => switchSheet(e.target.value)}
                                        className="text-xs border rounded-lg px-3 py-1.5"
                                    >
                                        {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl border overflow-hidden">
                                <div className="grid grid-cols-[1fr_36px_1fr_160px] gap-0 text-xs font-bold text-gray-500 px-4 py-2 border-b bg-gray-100">
                                    <span>Columna del Archivo</span>
                                    <span></span>
                                    <span>Campo SAP / Simulador</span>
                                    <span>Ejemplo (fila 1)</span>
                                </div>
                                <div className="max-h-[380px] overflow-auto">
                                    {headers.map((h, i) => (
                                        <div key={i} className={`grid grid-cols-[1fr_36px_1fr_160px] gap-0 px-4 py-2 border-b items-center ${mapping[h] ? 'bg-green-50' : ''}`}>
                                            <span className="text-xs font-mono font-medium text-[#32363A]">{h}</span>
                                            <ArrowRight size={14} className={`mx-auto ${mapping[h] ? 'text-green-500' : 'text-gray-300'}`} />
                                            <select
                                                value={mapping[h] || ''}
                                                onChange={(e) => setMapping(prev => ({ ...prev, [h]: e.target.value || undefined }))}
                                                className={`text-xs border rounded-lg px-2 py-1.5 w-full ${mapping[h] ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                                            >
                                                <option value="">— Ignorar —</option>
                                                {INTERNAL_FIELDS.map(f => (
                                                    <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                                                ))}
                                            </select>
                                            <span className="text-[10px] text-gray-400 pl-3 truncate">
                                                {rawData[0]?.[h] != null ? String(rawData[0][h]).substring(0, 25) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!hasRequiredFields && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                    <TriangleAlert size={16} className="text-amber-500" />
                                    <span className="text-xs text-amber-800">
                                        Mapea al menos <strong>ID Material</strong> y <strong>Descripción</strong> para continuar.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                                    ← Cambiar archivo
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!hasRequiredFields}
                                    className="px-6 py-2.5 bg-[#0854A0] text-white rounded-lg text-sm font-bold hover:bg-[#0A6ED1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                >
                                    Vista Previa <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === STEP 3: Preview === */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold text-[#32363A]">Vista Previa de Importación</h3>
                                <p className="text-xs text-gray-500">{transformedData.length.toLocaleString()} materiales listos • Primeros 10 filas</p>
                            </div>

                            {validationIssues.length > 0 && (
                                <div className="space-y-2">
                                    {validationIssues.map((v, i) => (
                                        <div key={i} className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${v.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                                            {v.type === 'warning' ? <TriangleAlert size={13} /> : <Zap size={13} />}
                                            {v.msg}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-xl border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-[#0854A0] text-white">
                                                {Object.values(mapping).filter(v => v).map((field, i) => {
                                                    const meta = INTERNAL_FIELDS.find(f => f.key === field);
                                                    return <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap">{meta?.label || field}</th>;
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, i) => (
                                                <tr key={i} className={`border-b ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    {Object.values(mapping).filter(v => v).map((field, j) => {
                                                        const val = row[field];
                                                        const isEmpty = val == null || val === '' || val === 0;
                                                        return (
                                                            <td key={j} className={`px-3 py-1.5 whitespace-nowrap ${isEmpty ? 'text-red-400 italic' : 'text-[#32363A]'}`}>
                                                                {isEmpty ? '⚠ vacío' : String(val).substring(0, 40)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Import mode */}
                            <div className="bg-gray-50 rounded-xl p-4 border">
                                <h4 className="text-xs font-bold text-gray-700 mb-3">Modo de Importación</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setImportMode('merge')}
                                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${importMode === 'merge' ? 'border-[#0854A0] bg-blue-50 ring-2 ring-[#0854A0]/20' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Layers size={14} className="text-[#0854A0]" />
                                            <span className="text-xs font-bold text-[#32363A]">Combinar (Merge) ✅ Recomendado</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Agrega nuevos y actualiza existentes por ID. Actuales: {currentCount.toLocaleString()}</p>
                                    </button>
                                    <button
                                        onClick={() => setImportMode('replace')}
                                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${importMode === 'replace' ? 'border-red-400 bg-red-50 ring-2 ring-red-400/20' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <RefreshCw size={14} className="text-red-500" />
                                            <span className="text-xs font-bold text-[#32363A]">Reemplazar Todo ⚠ Borra datos actuales</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Elimina todos los datos actuales y los reemplaza con este archivo.</p>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 cursor-pointer">
                                    ← Volver al mapeo
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                                >
                                    {importing
                                        ? <><RefreshCw size={14} className="animate-spin" /> Importando...</>
                                        : <><Database size={14} /> Importar {transformedData.length.toLocaleString()} Materiales</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === STEP 4: Done === */}
                    {step === 4 && (
                        <div className="space-y-6 py-4">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CircleCheck size={40} className="text-green-500" />
                                </div>
                                <h3 className="text-2xl font-black text-[#32363A]">¡Importación Exitosa!</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {transformedData.length.toLocaleString()} materiales {importMode === 'merge' ? 'combinados' : 'reemplazados'} en el simulador
                                </p>
                            </div>

                            {/* Rich stats grid */}
                            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                                {[
                                    { label: 'Total Importados', val: transformedData.length, color: 'blue', icon: '📦' },
                                    { label: 'Con EAN', val: transformedData.filter(m => m.ean && m.ean !== '0').length, color: 'green', icon: '✅' },
                                    { label: 'Sin EAN', val: transformedData.filter(m => !m.ean || m.ean === '0').length, color: 'amber', icon: '⚠️' },
                                    { label: 'Con Dimensiones', val: transformedData.filter(m => m.largo && m.ancho && m.alto).length, color: 'green', icon: '📐' },
                                    { label: 'Sin Dimensiones', val: transformedData.filter(m => !m.largo || !m.ancho || !m.alto).length, color: 'red', icon: '❌' },
                                    { label: 'Con Peso', val: transformedData.filter(m => m.pesoNeto > 0).length, color: 'green', icon: '⚖️' },
                                    { label: 'Sin Peso', val: transformedData.filter(m => !m.pesoNeto).length, color: 'amber', icon: '⚠️' },
                                    { label: 'Con Punto Reorden', val: transformedData.filter(m => m.puntoReorden > 0).length, color: 'green', icon: '🔄' },
                                    { label: 'Sin Pto. Reorden', val: transformedData.filter(m => !m.puntoReorden).length, color: 'red', icon: '❌' },
                                ].map((stat, i) => {
                                    const cls = {
                                        blue: 'bg-blue-50 text-blue-600',
                                        green: 'bg-green-50 text-green-600',
                                        amber: 'bg-amber-50 text-amber-600',
                                        red: 'bg-red-50 text-red-500',
                                    };
                                    return (
                                        <div key={i} className={`${cls[stat.color]} rounded-xl p-3 text-center`}>
                                            <div className="text-lg mb-0.5">{stat.icon}</div>
                                            <div className="text-xl font-black">{stat.val.toLocaleString()}</div>
                                            <div className="text-[10px] font-medium mt-0.5">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto text-center">
                                <p className="text-xs text-blue-700 font-medium">
                                    💡 Abre <strong>/nDQ → Plan de Mejoras</strong> para ver el plan de ataque priorizado con estos datos
                                </p>
                            </div>

                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-[#0854A0] text-white rounded-lg text-sm font-bold hover:bg-[#0A6ED1] cursor-pointer"
                                >
                                    Ver Datos en Simulador
                                </button>
                                <button
                                    onClick={() => { setStep(1); setRawData([]); setMapping({}); setFileName(''); workbookRef.current = null; }}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer"
                                >
                                    Importar Otro Archivo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
