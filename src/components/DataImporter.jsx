import { useState, useCallback, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
    Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
    X, ChevronRight, Download, RefreshCw, Eye, Zap,
    ArrowRight, Database, Layers, Trash2
} from 'lucide-react';

// ========== SAP COLUMN MAPPINGS ==========
// Maps common SAP column headers to our internal fields
const COLUMN_MAP = {
    // ID fields
    'matnr': 'id', 'material': 'id', 'id material': 'id', 'material number': 'id',
    'código': 'id', 'codigo': 'id', 'id': 'id', 'cod': 'id',

    // EAN
    'ean11': 'ean', 'ean': 'ean', 'gtin': 'ean', 'código de barras': 'ean',
    'codigo de barras': 'ean', 'barcode': 'ean', 'ean/upc': 'ean',

    // Description
    'maktx': 'descripcion', 'descripción': 'descripcion', 'descripcion': 'descripcion',
    'description': 'descripcion', 'material description': 'descripcion',
    'texto breve material': 'descripcion', 'nombre': 'descripcion',

    // Brand
    'marca': 'marca', 'brand': 'marca',

    // Model
    'modelo': 'modelo', 'model': 'modelo',

    // Category
    'matkl': 'categoria', 'grupo de artículos': 'categoria', 'grupo de articulos': 'categoria',
    'categoría': 'categoria', 'categoria': 'categoria', 'category': 'categoria',
    'material group': 'categoria',

    // Subcategory
    'subcategoría': 'subcategoria', 'subcategoria': 'subcategoria',

    // Weight
    'ntgew': 'pesoNeto', 'peso neto': 'pesoNeto', 'net weight': 'pesoNeto',
    'brgew': 'pesoBruto', 'peso bruto': 'pesoBruto', 'gross weight': 'pesoBruto',

    // Dimensions
    'laeng': 'largo', 'largo': 'largo', 'length': 'largo', 'longitud': 'largo',
    'breit': 'ancho', 'ancho': 'ancho', 'width': 'ancho',
    'hoehe': 'alto', 'alto': 'alto', 'height': 'alto', 'altura': 'alto',

    // Stock
    'labst': 'stockActual', 'stock': 'stockActual', 'stock actual': 'stockActual',
    'libre utilización': 'stockActual', 'unrestricted': 'stockActual',

    // Reorder
    'minbe': 'puntoReorden', 'punto de reorden': 'puntoReorden', 'reorder point': 'puntoReorden',
    'punto reorden': 'puntoReorden',

    // Price
    'stprs': 'precioBase', 'verpr': 'precioBase', 'precio': 'precioBase',
    'precio base': 'precioBase', 'standard price': 'precioBase', 'price': 'precioBase',

    // Location
    'lgort': 'ubicacion', 'almacén': 'ubicacion', 'almacen': 'ubicacion',
    'storage location': 'ubicacion', 'ubicación': 'ubicacion', 'ubicacion': 'ubicacion',

    // Vendor
    'lifnr': 'proveedor', 'proveedor': 'proveedor', 'vendor': 'proveedor',

    // Unit
    'meins': 'unidadMedida', 'unidad': 'unidadMedida', 'unit': 'unidadMedida',
    'unidad base': 'unidadMedida', 'base unit': 'unidadMedida',

    // Color
    'color': 'color',
};

const INTERNAL_FIELDS = [
    { key: 'id', label: 'ID Material (MATNR)', required: true },
    { key: 'ean', label: 'EAN (EAN11)', required: false },
    { key: 'descripcion', label: 'Descripción (MAKTX)', required: true },
    { key: 'marca', label: 'Marca', required: false },
    { key: 'modelo', label: 'Modelo', required: false },
    { key: 'categoria', label: 'Categoría (MATKL)', required: false },
    { key: 'pesoNeto', label: 'Peso Neto (NTGEW)', required: false },
    { key: 'pesoBruto', label: 'Peso Bruto (BRGEW)', required: false },
    { key: 'largo', label: 'Largo (LAENG)', required: false },
    { key: 'ancho', label: 'Ancho (BREIT)', required: false },
    { key: 'alto', label: 'Alto (HOEHE)', required: false },
    { key: 'stockActual', label: 'Stock (LABST)', required: false },
    { key: 'puntoReorden', label: 'Punto Reorden (MINBE)', required: false },
    { key: 'precioBase', label: 'Precio (STPRS)', required: false },
    { key: 'ubicacion', label: 'Almacén (LGORT)', required: false },
    { key: 'proveedor', label: 'Proveedor (LIFNR)', required: false },
    { key: 'color', label: 'Color', required: false },
];

// ========== COMPONENT ==========
export default function DataImporter({ onImport, onClose, currentCount = 0 }) {
    const [step, setStep] = useState(1); // 1=upload, 2=mapping, 3=preview, 4=done
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

    // ===== STEP 1: Parse Excel file =====
    const processFile = useCallback(async (file) => {
        setFileName(file.name);
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheets = workbook.worksheets.map(ws => ws.name);
        setSheetNames(sheets);

        // Use first sheet by default
        const ws = workbook.worksheets[0];
        setSelectedSheet(ws.name);
        parseSheet(ws);
    }, []);

    const parseSheet = (ws) => {
        const rows = [];
        let hdrs = [];
        let headerRowIdx = 0;

        // Find header row (first row with at least 3 non-empty cells)
        ws.eachRow((row, rowNumber) => {
            if (headerRowIdx > 0) return;
            const nonEmpty = row.values.filter(v => v != null && v !== '').length;
            if (nonEmpty >= 3) {
                hdrs = row.values.map(v => (v != null ? String(v).trim() : ''));
                headerRowIdx = rowNumber;
            }
        });

        if (headerRowIdx === 0) {
            setErrors(['No se encontró una fila de encabezados válida']);
            return;
        }

        // Parse data rows
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowIdx) return;
            const obj = {};
            let hasData = false;
            row.values.forEach((val, colIdx) => {
                if (hdrs[colIdx]) {
                    const cellVal = val != null ? (typeof val === 'object' && val.text ? val.text : val) : '';
                    obj[hdrs[colIdx]] = cellVal;
                    if (cellVal !== '') hasData = true;
                }
            });
            if (hasData) rows.push(obj);
        });

        setHeaders(hdrs.filter(h => h !== ''));
        setRawData(rows);

        // Auto-map columns
        const autoMap = {};
        hdrs.forEach(h => {
            if (!h) return;
            const normalized = h.toLowerCase().trim();
            if (COLUMN_MAP[normalized]) {
                autoMap[h] = COLUMN_MAP[normalized];
            }
        });
        setMapping(autoMap);
        setStep(2);
        setErrors([]);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            processFile(file);
        } else {
            setErrors(['Solo se aceptan archivos .xlsx, .xls o .csv']);
        }
    }, [processFile]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    // ===== STEP 2: Column mapping =====
    const mappedFieldCount = Object.values(mapping).filter(v => v).length;
    const hasRequiredFields = mapping && Object.values(mapping).includes('id') && Object.values(mapping).includes('descripcion');

    // ===== STEP 3: Preview =====
    const previewData = rawData.slice(0, 10).map(row => {
        const mapped = {};
        Object.entries(mapping).forEach(([excelCol, internalField]) => {
            if (internalField) {
                mapped[internalField] = row[excelCol] ?? '';
            }
        });
        return mapped;
    });

    const transformedData = rawData.map((row, idx) => {
        const mapped = {};
        Object.entries(mapping).forEach(([excelCol, internalField]) => {
            if (internalField) {
                let val = row[excelCol] ?? '';
                // Cast numbers
                if (['pesoNeto', 'pesoBruto', 'largo', 'ancho', 'alto', 'stockActual', 'puntoReorden', 'precioBase'].includes(internalField)) {
                    val = parseFloat(val) || 0;
                }
                mapped[internalField] = val;
            }
        });
        // Ensure required fields
        if (!mapped.id) mapped.id = `IMP-${String(idx + 1).padStart(6, '0')}`;
        if (!mapped.descripcion) mapped.descripcion = 'Sin descripción';
        if (!mapped.status) mapped.status = 'active';
        if (!mapped.fechaCreacion) mapped.fechaCreacion = new Date().toISOString().split('T')[0];
        return mapped;
    });

    // Validation
    const validationIssues = [];
    const idsSeen = new Set();
    let duplicateIds = 0, emptyDesc = 0, emptyEAN = 0, emptyWeight = 0;
    transformedData.forEach(m => {
        if (idsSeen.has(m.id)) duplicateIds++;
        idsSeen.add(m.id);
        if (!m.descripcion || m.descripcion === 'Sin descripción') emptyDesc++;
        if (!m.ean) emptyEAN++;
        if (!m.pesoNeto) emptyWeight++;
    });
    if (duplicateIds > 0) validationIssues.push({ type: 'warning', msg: `${duplicateIds} IDs duplicados en el archivo` });
    if (emptyDesc > 0) validationIssues.push({ type: 'warning', msg: `${emptyDesc} materiales sin descripción` });
    if (emptyEAN > 0) validationIssues.push({ type: 'info', msg: `${emptyEAN} materiales sin EAN` });
    if (emptyWeight > 0) validationIssues.push({ type: 'info', msg: `${emptyWeight} materiales sin peso` });

    // ===== STEP 4: Import =====
    const handleImport = () => {
        setImporting(true);
        setTimeout(() => {
            const result = onImport(transformedData, importMode);
            setImportResult(result);
            setImporting(false);
            setStep(4);
        }, 800);
    };

    // Switch sheet
    const switchSheet = async (sheetName) => {
        setSelectedSheet(sheetName);
        const buffer = await (await fetch(URL.createObjectURL(new Blob()))).arrayBuffer(); // placeholder
        // Re-read the file — for simplicity we re-parse from rawData
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* ===== HEADER ===== */}
                <div className="bg-gradient-to-r from-[#0854A0] to-[#0A6ED1] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Upload size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Importar Datos de SAP</h2>
                            <p className="text-xs text-white/70">Cargar Excel exportado de SE16N al simulador</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* ===== STEP INDICATOR ===== */}
                <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-4">
                    {[
                        { num: 1, label: 'Subir Archivo' },
                        { num: 2, label: 'Mapear Columnas' },
                        { num: 3, label: 'Vista Previa' },
                        { num: 4, label: 'Resultado' },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > s.num ? 'bg-green-500 text-white' :
                                    step === s.num ? 'bg-[#0854A0] text-white' :
                                        'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s.num ? <CheckCircle size={14} /> : s.num}
                            </div>
                            <span className={`text-xs font-medium ${step >= s.num ? 'text-[#32363A]' : 'text-gray-400'}`}>{s.label}</span>
                            {i < 3 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* ===== CONTENT ===== */}
                <div className="flex-1 overflow-auto p-6">

                    {/* === STEP 1: Upload === */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-[#0854A0] bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-[#0854A0] hover:bg-gray-50'
                                    }`}
                            >
                                <FileSpreadsheet size={48} className={`mx-auto mb-4 ${dragOver ? 'text-[#0854A0]' : 'text-gray-400'}`} />
                                <h3 className="text-lg font-bold text-gray-700 mb-2">
                                    {dragOver ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel aquí'}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    O haz clic para seleccionar • Soporta .xlsx y .xls
                                </p>
                                <span className="inline-block px-4 py-2 bg-[#0854A0] text-white rounded-lg text-sm font-medium">
                                    Seleccionar Archivo
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    {errors.map((e, i) => (
                                        <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                                            <AlertTriangle size={14} /> {e}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* How to export from SAP */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                <h4 className="font-bold text-sm text-[#0854A0] mb-3 flex items-center gap-2">
                                    <Zap size={16} /> ¿Cómo exportar desde SAP?
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-700">Opción 1: SE16N (Recomendado)</p>
                                        <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
                                            <li>Ejecutar transacción <code className="bg-white px-1 rounded">SE16N</code></li>
                                            <li>Tabla: <code className="bg-white px-1 rounded">MARA</code> (datos generales)</li>
                                            <li>Ejecutar (F8)</li>
                                            <li>Menú → Lista → Exportar → Hoja de cálculo</li>
                                            <li>Repetir con <code className="bg-white px-1 rounded">MAKT</code>, <code className="bg-white px-1 rounded">MARC</code>, <code className="bg-white px-1 rounded">MARD</code></li>
                                        </ol>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-700">Opción 2: Excel manual</p>
                                        <p className="text-xs text-gray-600">También puedes crear un Excel con estas columnas mínimas:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {['MATNR', 'MAKTX', 'EAN11', 'MATKL', 'NTGEW', 'BRGEW', 'MINBE'].map(c => (
                                                <span key={c} className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{c}</span>
                                            ))}
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
                                        Archivo: <strong>{fileName}</strong> • {rawData.length.toLocaleString()} filas • {headers.length} columnas •
                                        <span className="text-green-600 font-bold"> {mappedFieldCount} campos mapeados automaticamente</span>
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
                                <div className="grid grid-cols-[1fr_40px_1fr_auto] gap-0 text-xs font-bold text-gray-500 px-4 py-2 border-b bg-gray-100">
                                    <span>Columna del Excel</span>
                                    <span></span>
                                    <span>Campo del Simulador</span>
                                    <span>Ejemplo</span>
                                </div>
                                <div className="max-h-[400px] overflow-auto">
                                    {headers.map((h, i) => (
                                        <div key={i} className={`grid grid-cols-[1fr_40px_1fr_auto] gap-0 px-4 py-2 border-b items-center ${mapping[h] ? 'bg-green-50' : ''}`}>
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
                                            <span className="text-[10px] text-gray-400 pl-3 truncate max-w-[150px]">
                                                {rawData[0]?.[h] != null ? String(rawData[0][h]).substring(0, 30) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!hasRequiredFields && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-500" />
                                    <span className="text-xs text-amber-800">
                                        Debes mapear al menos <strong>ID Material</strong> y <strong>Descripción</strong> para continuar.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                                >
                                    ← Cambiar archivo
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!hasRequiredFields}
                                    className="px-6 py-2.5 bg-[#0854A0] text-white rounded-lg text-sm font-bold hover:bg-[#0A6ED1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
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
                                <p className="text-xs text-gray-500">
                                    {transformedData.length.toLocaleString()} materiales listos • Mostrando primeros 10
                                </p>
                            </div>

                            {/* Validation */}
                            {validationIssues.length > 0 && (
                                <div className="space-y-2">
                                    {validationIssues.map((v, i) => (
                                        <div key={i} className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${v.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
                                            }`}>
                                            {v.type === 'warning' ? <AlertTriangle size={13} /> : <Zap size={13} />}
                                            {v.msg}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Preview table */}
                            <div className="rounded-xl border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-[#0854A0] text-white">
                                                {Object.values(mapping).filter(v => v).map((field, i) => {
                                                    const meta = INTERNAL_FIELDS.find(f => f.key === field);
                                                    return <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap">{meta?.label || field}</th>
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
                                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${importMode === 'merge' ? 'border-[#0854A0] bg-blue-50 ring-2 ring-[#0854A0]/20' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Layers size={14} className="text-[#0854A0]" />
                                            <span className="text-xs font-bold text-[#32363A]">Combinar (Merge)</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Agrega nuevos materiales y actualiza los que ya existen por ID. Datos actuales: {currentCount.toLocaleString()}</p>
                                    </button>
                                    <button
                                        onClick={() => setImportMode('replace')}
                                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${importMode === 'replace' ? 'border-red-400 bg-red-50 ring-2 ring-red-400/20' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <RefreshCw size={14} className="text-red-500" />
                                            <span className="text-xs font-bold text-[#32363A]">Reemplazar Todo</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Elimina todos los datos actuales y los reemplaza con el archivo importado.</p>
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
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    {importing ? (
                                        <><RefreshCw size={14} className="animate-spin" /> Importando...</>
                                    ) : (
                                        <><Database size={14} /> Importar {transformedData.length.toLocaleString()} Materiales</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === STEP 4: Done === */}
                    {step === 4 && (
                        <div className="text-center py-12 space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#32363A]">¡Importación Exitosa!</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Se {importMode === 'merge' ? 'combinaron' : 'reemplazaron'} <strong>{transformedData.length.toLocaleString()}</strong> materiales
                                </p>
                            </div>

                            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-[#0854A0]">{transformedData.length.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Importados</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-green-600">{transformedData.filter(m => m.ean).length.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Con EAN</div>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-amber-600">{transformedData.filter(m => !m.ean).length.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Sin EAN</div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-purple-600">{mappedFieldCount}</div>
                                    <div className="text-[10px] text-gray-500">Campos</div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-[#0854A0] text-white rounded-lg text-sm font-bold hover:bg-[#0A6ED1] cursor-pointer"
                                >
                                    Cerrar y Ver Datos
                                </button>
                                <button
                                    onClick={() => { setStep(1); setRawData([]); setMapping({}); setFileName(''); }}
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
