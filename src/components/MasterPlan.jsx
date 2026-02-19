import { useState, useMemo } from 'react';
import {
    FileText, Tag, Hash, Calendar, ClipboardList,
    CircleCheck, Circle, ChevronRight, Download, Eye,
    Briefcase, Target, BookOpen, Zap, TriangleAlert,
    Package, BarChart3, ArrowRight, Search, Layers
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

// ========== NAMING CONVENTIONS ==========
const NAMING_RULES = [
    {
        field: 'MAKTX (Descripción)',
        maxLen: 40,
        format: 'TIPO + MARCA + MODELO + CAPACIDAD + UNIDAD',
        examples: [
            { bad: 'nevera gris', good: 'REFRIGERADOR SAMSUNG RT38 380L INOX', why: 'Incluye tipo, marca, modelo, capacidad y acabado' },
            { bad: 'cable', good: 'CABLE ELECTRICO THW 12AWG 100M ROLLOS', why: 'Especifica tipo, calibre, longitud y presentación' },
            { bad: 'tubo', good: 'TUBO PVC 1/2" SCH40 6M PAVCO', why: 'Material, medida, clasificación, largo y marca' },
        ],
        rules: [
            'TODO en MAYÚSCULAS (SAP convierte automáticamente)',
            'No usar acentos ni caracteres especiales (ñ → N)',
            'No abreviar innecesariamente (REF → REFRIGERADOR)',
            'Incluir la unidad de medida cuando aplique',
            'Máximo 40 caracteres (limitación de SAP)',
        ]
    },
    {
        field: 'MATNR (Código Material)',
        maxLen: 18,
        format: 'Numérico secuencial asignado por SAP',
        examples: [
            { bad: 'NEV-001', good: '000000000050001234', why: 'SAP genera códigos numéricos de 18 dígitos' },
        ],
        rules: [
            'Nunca modificar el código manualmente',
            'SAP asigna secuencialmente con rango numérico',
            'El rango debe estar configurado en SNUM/SNRO',
        ]
    },
    {
        field: 'EAN11 (Código de Barras)',
        maxLen: 13,
        format: 'GTIN-13 (EAN-13) o GTIN-8 (EAN-8)',
        examples: [
            { bad: '123', good: '7591234567890', why: 'País (759=VE) + empresa + producto + dígito control' },
        ],
        rules: [
            'Debe ser único por material (1 material = 1 EAN principal)',
            'Validar el dígito de control (último dígito)',
            'Si el producto tiene varios EANs → usar tabla MEAN (transacción /nEAN)',
            'Sin EAN = No se puede escanear en punto de venta',
        ]
    },
    {
        field: 'MATKL (Grupo de Materiales)',
        maxLen: 9,
        format: 'CATEGORIA-SUBCATEGORIA',
        examples: [
            { bad: 'varios', good: 'ELECT-REF', why: 'Electro + Refrigeración → filtrado eficiente' },
            { bad: 'otro', good: 'FERR-PLOM', why: 'Ferretería + Plomería → reportes por categoría' },
        ],
        rules: [
            'Usar categorías consistentes en toda la base',
            'Permite reportes y filtros por grupo',
            'Debe alinearse con la estructura comercial de Daka',
        ]
    }
];

// ========== CEDULACIÓN / MATERIAL CREATION FLOW ==========
const CREATION_FLOW = [
    {
        step: 1,
        title: 'Solicitud de Código',
        who: 'Área Comercial / Compras',
        icon: '📝',
        color: '#6366F1',
        roleColor: '#EEF2FF',
        roleBorder: '#C7D2FE',
        action: 'Llenar formulario de solicitud de material nuevo',
        sapTx: null,
        fields: ['Descripción del producto', 'Categoría sugerida', 'Proveedor', 'EAN si existe', 'Unidad de medida'],
        tips: 'Debe incluir foto del producto y ficha técnica si está disponible.'
    },
    {
        step: 2,
        title: 'Validación de Duplicados',
        who: 'Analista Master Data',
        icon: '🔍',
        color: '#0891B2',
        roleColor: '#ECFEFF',
        roleBorder: '#A5F3FC',
        action: 'Verificar que no exista ya en SAP',
        sapTx: '/nSE16',
        fields: ['Buscar por EAN en MARA', 'Buscar por descripción en MAKT', 'Buscar por proveedor en EINA'],
        tips: 'Usar SE16N → MAKT → MAKTX LIKE "%TÉRMINO%" para buscar por descripción parcial.'
    },
    {
        step: 3,
        title: 'Creación del Material (MM01)',
        who: 'Analista Master Data',
        icon: '🏗️',
        color: '#0854A0',
        roleColor: '#E8F4FD',
        roleBorder: '#B3D7F2',
        action: 'Crear el registro maestro con todos los datos obligatorios',
        sapTx: '/nMM01',
        fields: [
            'Vista Básica: MAKTX, MEINS, MATKL',
            'Vista Compras: EKGRP, plazo entrega',
            'Vista Contabilidad: Clase valoración, precio',
            'Vista MRP: MINBE, MABST',
        ],
        tips: 'TODAS las vistas deben estar completas. Un material incompleto genera errores en compras y ventas.'
    },
    {
        step: 4,
        title: 'Asignar Código EAN',
        who: 'Analista Master Data',
        icon: '📊',
        color: '#7C3AED',
        roleColor: '#F5F3FF',
        roleBorder: '#DDD6FE',
        action: 'Asignar EAN principal y secundarios si aplica',
        sapTx: '/nEAN',
        fields: ['EAN principal (GTIN-13)', 'EANs de caja/pack (GTIN-14)', 'Tipo EAN (HE, HK, etc.)'],
        tips: 'Si el producto se vende en unidades Y en cajas, necesita 2 EANs diferentes.'
    },
    {
        step: 5,
        title: 'Datos de Empaque y Peso',
        who: 'Ingeniero de Empaque',
        icon: '📦',
        color: '#D97706',
        roleColor: '#FFFBEB',
        roleBorder: '#FDE68A',
        action: 'Medir y pesar el producto, registrar dimensiones',
        sapTx: '/nMM02',
        fields: ['NTGEW (peso neto kg)', 'BRGEW (peso bruto kg)', 'GEWEI (unidad peso)', 'Largo, Ancho, Alto (cm)'],
        tips: 'Estos datos son CRÍTICOS para cubicaje y cálculo de flete. Sin ellos no puedes calcular costos de transporte.'
    },
    {
        step: 6,
        title: 'Parametrizar MRP',
        who: 'Analista de Compras',
        icon: '⚙️',
        color: '#059669',
        roleColor: '#ECFDF5',
        roleBorder: '#A7F3D0',
        action: 'Definir punto de reorden y stock de seguridad',
        sapTx: '/nMD04',
        fields: ['MINBE (punto de reorden)', 'MABST (stock de seguridad)', 'PLIFZ (plazo de entrega)', 'DISMM (tipo MRP)'],
        tips: 'Sin punto de reorden, SAP no genera alertas de reabastecimiento. Cada material categoría A debe tener MINBE > 0.'
    },
    {
        step: 7,
        title: 'Verificación Final',
        who: 'Coordinador Supply Chain (TÚ)',
        icon: '✅',
        color: '#DC2626',
        roleColor: '#FEF2F2',
        roleBorder: '#FECACA',
        action: 'Revisar que el material esté completo en todas las vistas',
        sapTx: '/nSE16',
        fields: ['Verificar EAN asignado', 'Verificar peso y dimensiones', 'Verificar punto de reorden', 'Verificar precio'],
        tips: 'Exportar con SE16N la master data completa del material y verificar que no haya campos vacíos.'
    }
];

// ========== 30-60-90 DAY PLAN ==========
const PLAN_30_60_90 = [
    {
        phase: 'Días 1-30: DIAGNÓSTICO',
        color: '#E53935',
        bgColor: '#FFEBEE',
        borderColor: '#EF9A9A',
        icon: '🔍',
        objective: 'Entender el estado actual de la data y mapear los problemas',
        tasks: [
            { task: 'Exportar master data completa con SE16N', tx: '/nSE16', done: false, week: 1 },
            { task: 'Contar materiales sin EAN', tx: '/nSE16', done: false, week: 1 },
            { task: 'Contar materiales sin peso/dimensiones', tx: '/nSE16', done: false, week: 1 },
            { task: 'Identificar EANs duplicados', tx: '/nSE16', done: false, week: 1 },
            { task: 'Mapear materiales sin punto de reorden', tx: '/nMD04', done: false, week: 2 },
            { task: 'Identificar materiales bajo stock mínimo', tx: '/nMD04', done: false, week: 2 },
            { task: 'Documentar el naming actual (bueno y malo)', tx: '/nSE16', done: false, week: 3 },
            { task: 'Presentar diagnóstico al jefe con números', tx: null, done: false, week: 4 },
        ],
        deliverables: ['Informe diagnóstico con conteos', 'Plan de acción priorizado', 'Propuesta de naming convention']
    },
    {
        phase: 'Días 31-60: LIMPIEZA',
        color: '#F57C00',
        bgColor: '#FFF3E0',
        borderColor: '#FFE0B2',
        icon: '🧹',
        objective: 'Corregir los datos críticos y establecer procesos',
        tasks: [
            { task: 'Corregir los 500 materiales más vendidos primero', tx: '/nMM02', done: false, week: 5 },
            { task: 'Asignar EAN faltantes a materiales categoría A', tx: '/nEAN', done: false, week: 5 },
            { task: 'Completar pesos de materiales sin peso', tx: '/nMM02', done: false, week: 6 },
            { task: 'Definir puntos de reorden para cat. A y B', tx: '/nMD04', done: false, week: 6 },
            { task: 'Implementar naming convention en materiales nuevos', tx: '/nMM01', done: false, week: 7 },
            { task: 'Entrenar al equipo en el proceso de cedulación', tx: '/nPLAN', done: false, week: 7 },
            { task: 'Validar con reportes el progreso de limpieza', tx: '/nSE16', done: false, week: 8 },
        ],
        deliverables: ['500+ materiales corregidos', 'Proceso de cedulación documentado', 'Equipo entrenado']
    },
    {
        phase: 'Días 61-90: OPTIMIZACIÓN',
        color: '#2E7D32',
        bgColor: '#E8F5E9',
        borderColor: '#C8E6C9',
        icon: '🚀',
        objective: 'Automatizar procesos y mantener la calidad',
        tasks: [
            { task: 'Limpiar materiales restantes por categoría', tx: '/nMM02', done: false, week: 9 },
            { task: 'Implementar control semanal con SE16N', tx: '/nSE16', done: false, week: 9 },
            { task: 'Crear reportes automáticos de calidad de data', tx: '/nSQVI', done: false, week: 10 },
            { task: 'Optimizar puntos de reorden con datos históricos', tx: '/nMD04', done: false, week: 10 },
            { task: 'Presentar resultados: antes vs después', tx: null, done: false, week: 12 },
            { task: 'Proponer inversión en e-commerce basada en datos', tx: '/nECOMM', done: false, week: 12 },
        ],
        deliverables: ['100% materiales cat. A limpios', 'Proceso sostenible implementado', 'Propuesta de expansión']
    }
];

// ========== MANDATORY FIELDS CHECKLIST ==========
const MANDATORY_FIELDS = [
    { field: 'MAKTX', name: 'Descripción', vista: 'Básica', critical: true },
    { field: 'MEINS', name: 'Unidad Base', vista: 'Básica', critical: true },
    { field: 'MATKL', name: 'Grupo Materiales', vista: 'Básica', critical: true },
    { field: 'EAN11', name: 'Código EAN', vista: 'Básica', critical: true },
    { field: 'NTGEW', name: 'Peso Neto', vista: 'Básica', critical: true },
    { field: 'BRGEW', name: 'Peso Bruto', vista: 'Básica', critical: true },
    { field: 'VOLUM', name: 'Volumen', vista: 'Básica', critical: false },
    { field: 'EKGRP', name: 'Grupo Compras', vista: 'Compras', critical: true },
    { field: 'PLIFZ', name: 'Plazo Entrega', vista: 'Compras', critical: false },
    { field: 'BKLAS', name: 'Clase Valoración', vista: 'Contabilidad', critical: true },
    { field: 'STPRS', name: 'Precio Estándar', vista: 'Contabilidad', critical: true },
    { field: 'MINBE', name: 'Punto de Reorden', vista: 'MRP', critical: true },
    { field: 'MABST', name: 'Stock Seguridad', vista: 'MRP', critical: false },
    { field: 'DISMM', name: 'Tipo MRP', vista: 'MRP', critical: false },
];

export default function MasterPlan({ materials = [], onNavigate, onClose, showStatus }) {
    const [activeSection, setActiveSection] = useState('naming');

    // Metrics from live data
    const metrics = useMemo(() => {
        let sinEAN = 0, sinPeso = 0, sinReorden = 0, sinDesc = 0, total = materials.length;
        for (const m of materials) {
            if (!m.ean || m.ean === '') sinEAN++;
            if (!m.pesoNeto || m.pesoNeto === 0) sinPeso++;
            if (!m.puntoReorden || m.puntoReorden === 0) sinReorden++;
            if (!m.descripcion || m.descripcion.trim() === '') sinDesc++;
        }
        return { sinEAN, sinPeso, sinReorden, sinDesc, total };
    }, [materials]);

    const SECTIONS = [
        { id: 'naming', label: 'Naming Convention', icon: Tag, badge: null },
        { id: 'cedula', label: 'Cedulación (Creación)', icon: ClipboardList, badge: null },
        { id: 'fields', label: 'Campos Obligatorios', icon: FileText, badge: null },
        { id: 'plan', label: 'Plan 30-60-90', icon: Calendar, badge: null },
        { id: 'status', label: 'Estado Actual', icon: BarChart3, badge: `${metrics.sinEAN + metrics.sinPeso + metrics.sinReorden}` },
    ];

    const handleGoToTx = (tx) => {
        if (tx && onNavigate) {
            onClose?.();
            setTimeout(() => onNavigate(tx), 150);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#F5F7FA] w-[96%] h-[93vh] shadow-2xl flex flex-col border border-[#0854A0] rounded-sm" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#354A5F] text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-mono bg-[#0854A0] px-2 py-0.5 rounded text-xs">PLAN</span>
                        <Briefcase size={16} />
                        <div>
                            <span className="font-bold text-sm">Plan Maestro — Coordinador Supply Chain Daka</span>
                            <span className="text-[10px] text-white/70 ml-3">Naming • Cedulación • 30-60-90</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded text-lg">✕</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-56 bg-white border-r border-[#C4C4C4] flex flex-col flex-shrink-0">
                        <div className="bg-[#EFF4F9] px-3 py-2 text-xs font-bold text-[#0854A0] border-b">
                            Secciones
                        </div>
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm border-b border-gray-50 transition-colors ${activeSection === s.id ? 'bg-[#E8F4FD] text-[#0854A0] font-medium border-l-2 border-l-[#0854A0]' : 'text-[#6A6D70] hover:bg-gray-50'}`}
                                >
                                    <Icon size={15} />
                                    <span className="flex-1">{s.label}</span>
                                    {s.badge && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{s.badge}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-5">
                        {/* ======== NAMING CONVENTION ======== */}
                        {activeSection === 'naming' && (
                            <div className="max-w-4xl space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <Tag className="text-[#0854A0]" size={22} />
                                    <h2 className="text-lg font-bold text-[#32363A]">Convención de Nombres (Naming Convention)</h2>
                                </div>
                                <div className="bg-[#E8F4FD] rounded-lg p-4 border border-[#B3D7F2] text-sm text-[#32363A]">
                                    <strong>¿Por qué importa?</strong> Un material mal descrito no se encuentra en búsquedas, genera duplicados, y confunde al comprador.
                                    Las reglas de naming aseguran que cualquier persona pueda identificar un producto con solo leer su descripción.
                                </div>

                                {NAMING_RULES.map((nr, idx) => (
                                    <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="bg-[#F5F7FA] px-4 py-2 border-b flex items-center justify-between">
                                            <span className="font-bold text-sm text-[#0854A0]">{nr.field}</span>
                                            <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-mono">Máx: {nr.maxLen} chars</span>
                                        </div>
                                        <div className="px-4 py-3 text-xs text-[#6A6D70] border-b bg-[#FAFAFA]">
                                            <strong>Formato:</strong> <code className="bg-gray-100 px-1 rounded">{nr.format}</code>
                                        </div>

                                        {/* Bad vs Good examples */}
                                        {nr.examples.map((ex, i) => (
                                            <div key={i} className="px-4 py-2 border-b border-gray-100 grid grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <span className="text-red-500 font-bold">✗ MAL:</span>
                                                    <div className="font-mono bg-red-50 px-2 py-1 rounded mt-0.5 text-red-700">{ex.bad}</div>
                                                </div>
                                                <div>
                                                    <span className="text-green-600 font-bold">✓ BIEN:</span>
                                                    <div className="font-mono bg-green-50 px-2 py-1 rounded mt-0.5 text-green-700">{ex.good}</div>
                                                </div>
                                                <div className="text-[#6A6D70] self-center italic">{ex.why}</div>
                                            </div>
                                        ))}

                                        {/* Rules */}
                                        <div className="px-4 py-3">
                                            <span className="text-[10px] font-bold text-[#6A6D70] uppercase">Reglas:</span>
                                            <ul className="mt-1 space-y-1">
                                                {nr.rules.map((r, i) => (
                                                    <li key={i} className="text-xs text-[#32363A] flex items-start gap-2">
                                                        <ChevronRight size={11} className="text-[#0854A0] mt-0.5 flex-shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ======== CEDULACIÓN ======== */}
                        {activeSection === 'cedula' && (
                            <div className="max-w-5xl space-y-5">
                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0854A0] to-[#0A6ED1] flex items-center justify-center shadow-lg">
                                        <ClipboardList className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#32363A]">Proceso de Cedulación</h2>
                                        <p className="text-xs text-[#6A6D70]">7 pasos para dar identidad a cada material en SAP</p>
                                    </div>
                                </div>

                                {/* Intro banner */}
                                <div className="rounded-xl p-4 border border-[#FFE082] bg-gradient-to-r from-[#FFF8E1] to-[#FFFDE7] flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div className="text-sm text-[#795548]">
                                        <strong>La cedulación es como darle "cédula de identidad" a un material.</strong> Sin ella, existe en el sistema pero no puede comprar, no puede vender, no puede moverse. Cada paso agrega datos críticos.
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-4">
                                    {CREATION_FLOW.map((cf, idx) => (
                                        <div key={idx} className="group">
                                            <div
                                                className="bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                                style={{ borderLeftColor: cf.color }}
                                            >
                                                {/* Card header */}
                                                <div className="px-5 py-3 flex items-center gap-4">
                                                    {/* Step badge */}
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                                        style={{ background: `linear-gradient(135deg, ${cf.color}15, ${cf.color}25)` }}
                                                    >
                                                        <span className="text-2xl">{cf.icon}</span>
                                                    </div>

                                                    {/* Title + Action */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span
                                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                style={{ backgroundColor: cf.color, color: 'white' }}
                                                            >
                                                                PASO {cf.step}
                                                            </span>
                                                            <h3 className="font-bold text-[#32363A]">{cf.title}</h3>
                                                        </div>
                                                        <p className="text-xs text-[#6A6D70] mt-0.5">{cf.action}</p>
                                                    </div>

                                                    {/* Role + SAP Tx */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span
                                                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border"
                                                            style={{ backgroundColor: cf.roleColor, borderColor: cf.roleBorder, color: cf.color }}
                                                        >
                                                            👤 {cf.who}
                                                        </span>
                                                        {cf.sapTx && (
                                                            <button
                                                                onClick={() => handleGoToTx(cf.sapTx)}
                                                                className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                                                                style={{ backgroundColor: cf.color }}
                                                            >
                                                                {cf.sapTx} →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Fields grid */}
                                                <div className="px-5 pb-3">
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                        {cf.fields.map((f, i) => (
                                                            <div
                                                                key={i}
                                                                className="text-xs px-3 py-2 rounded-lg border flex items-start gap-1.5"
                                                                style={{ backgroundColor: `${cf.color}08`, borderColor: `${cf.color}20` }}
                                                            >
                                                                <CircleCheck size={12} className="mt-0.5 flex-shrink-0" style={{ color: cf.color }} />
                                                                <span className="text-[#32363A]">{f}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tip */}
                                                <div className="mx-5 mb-4 rounded-lg px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-2">
                                                    <Zap size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-[11px] text-amber-800"><strong>Tip:</strong> {cf.tips}</span>
                                                </div>
                                            </div>

                                            {/* Connector arrow between steps */}
                                            {idx < CREATION_FLOW.length - 1 && (
                                                <div className="flex justify-center py-1">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-0.5 h-3 bg-gray-300" />
                                                        <ChevronRight size={14} className="text-gray-400 rotate-90" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Summary box */}
                                <div className="bg-gradient-to-r from-[#0854A0] to-[#0A6ED1] rounded-xl p-5 text-white shadow-lg">
                                    <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                                        <CircleCheck size={16} /> Resultado Final
                                    </h3>
                                    <p className="text-xs text-white/90">
                                        Cuando los 7 pasos están completos, el material tiene su <strong>cédula completa</strong>: puede ser comprado, almacenado, vendido, transportado y facturado sin errores. Cada campo vacío es un riesgo operacional.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ======== MANDATORY FIELDS ======== */}
                        {activeSection === 'fields' && (
                            <div className="max-w-4xl space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="text-[#0854A0]" size={22} />
                                    <h2 className="text-lg font-bold text-[#32363A]">Campos Obligatorios por Vista</h2>
                                </div>
                                <div className="bg-[#FFEBEE] rounded-lg p-4 border border-[#EF9A9A] text-sm text-[#C62828]">
                                    <strong>⚠️ Regla de Oro:</strong> Un material con campos vacíos es un material roto. Los campos marcados como CRÍTICO deben estar llenos al 100%.
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-[#F5F7FA] border-b">
                                                <th className="text-left px-4 py-2 text-xs font-bold text-[#6A6D70]">Campo SAP</th>
                                                <th className="text-left px-4 py-2 text-xs font-bold text-[#6A6D70]">Nombre</th>
                                                <th className="text-left px-4 py-2 text-xs font-bold text-[#6A6D70]">Vista</th>
                                                <th className="text-center px-4 py-2 text-xs font-bold text-[#6A6D70]">Nivel</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MANDATORY_FIELDS.map((f, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-xs font-mono font-bold text-[#0854A0]">{f.field}</td>
                                                    <td className="px-4 py-2 text-xs text-[#32363A]">{f.name}</td>
                                                    <td className="px-4 py-2 text-xs text-[#6A6D70]">{f.vista}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {f.critical
                                                            ? <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">CRÍTICO</span>
                                                            : <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">RECOMENDADO</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ======== PLAN 30-60-90 ======== */}
                        {activeSection === 'plan' && (
                            <div className="max-w-4xl space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="text-[#0854A0]" size={22} />
                                    <h2 className="text-lg font-bold text-[#32363A]">Plan de Acción 30-60-90 Días</h2>
                                </div>

                                {PLAN_30_60_90.map((phase, pIdx) => (
                                    <div key={pIdx} className="rounded-lg border overflow-hidden" style={{ borderColor: phase.borderColor }}>
                                        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: phase.bgColor }}>
                                            <span className="text-2xl">{phase.icon}</span>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm" style={{ color: phase.color }}>{phase.phase}</h3>
                                                <p className="text-xs text-[#6A6D70]">{phase.objective}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white divide-y divide-gray-100">
                                            {phase.tasks.map((t, tIdx) => (
                                                <div key={tIdx} className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50">
                                                    <Circle size={14} className="text-gray-300 flex-shrink-0" />
                                                    <span className="text-xs text-[#32363A] flex-1">{t.task}</span>
                                                    {t.tx && (
                                                        <button
                                                            onClick={() => handleGoToTx(t.tx)}
                                                            className="text-[10px] font-mono text-[#0854A0] hover:underline cursor-pointer"
                                                        >
                                                            {t.tx}
                                                        </button>
                                                    )}
                                                    <span className="text-[10px] text-[#6A6D70]">Sem {t.week}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-4 py-2 border-t" style={{ backgroundColor: phase.bgColor }}>
                                            <span className="text-[10px] font-bold text-[#6A6D70] uppercase">Entregables: </span>
                                            <span className="text-[10px] text-[#32363A]">{phase.deliverables.join(' • ')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ======== STATUS ACTUAL ======== */}
                        {activeSection === 'status' && (
                            <div className="max-w-4xl space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="text-[#0854A0]" size={22} />
                                    <h2 className="text-lg font-bold text-[#32363A]">Estado Actual de la Data</h2>
                                </div>
                                <div className="bg-[#E8F4FD] rounded-lg p-4 border border-[#B3D7F2] text-sm text-[#32363A]">
                                    Estas métricas se calculan <strong>en vivo</strong> de los {metrics.total.toLocaleString()} materiales en el simulador. En SAP real, obtendrías estos números con /nSE16N.
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Sin EAN', count: metrics.sinEAN, color: '#E53935', bg: '#FFEBEE', pct: ((metrics.sinEAN / metrics.total) * 100).toFixed(1) },
                                        { label: 'Sin Peso', count: metrics.sinPeso, color: '#F57C00', bg: '#FFF3E0', pct: ((metrics.sinPeso / metrics.total) * 100).toFixed(1) },
                                        { label: 'Sin Reorden', count: metrics.sinReorden, color: '#FBC02D', bg: '#FFFDE7', pct: ((metrics.sinReorden / metrics.total) * 100).toFixed(1) },
                                        { label: 'Sin Descripción', count: metrics.sinDesc, color: '#7B1FA2', bg: '#F3E5F5', pct: ((metrics.sinDesc / metrics.total) * 100).toFixed(1) },
                                    ].map((m, i) => (
                                        <div key={i} className="rounded-lg p-4 border" style={{ backgroundColor: m.bg, borderColor: m.color + '40' }}>
                                            <div className="text-3xl font-bold" style={{ color: m.color }}>{m.count.toLocaleString()}</div>
                                            <div className="text-sm font-medium" style={{ color: m.color }}>{m.label}</div>
                                            <div className="text-xs text-[#6A6D70] mt-1">{m.pct}% del total</div>
                                            {/* Progress bar (inverted — shows % complete) */}
                                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${100 - parseFloat(m.pct)}%`, backgroundColor: m.color }} />
                                            </div>
                                            <div className="text-[10px] text-[#6A6D70] mt-0.5">{(100 - parseFloat(m.pct)).toFixed(1)}% completo</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-lg border p-4 shadow-sm">
                                    <h3 className="font-bold text-sm text-[#32363A] mb-3">Acciones Rápidas</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {[
                                            { label: 'Ver materiales sin EAN', tx: '/nSE16' },
                                            { label: 'Gestionar EANs', tx: '/nEAN' },
                                            { label: 'Ver stock bajo reorden', tx: '/nMD04' },
                                            { label: 'Crear pedido de compra', tx: '/nME21N' },
                                            { label: 'Exportar master data', tx: '/nSE16' },
                                            { label: 'Ver equipo y tareas', tx: '/nTEAM' },
                                        ].map((a, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleGoToTx(a.tx)}
                                                className="text-xs text-left px-3 py-2 bg-[#F5F7FA] rounded border border-gray-200 hover:bg-[#E8F4FD] hover:border-[#0854A0] transition-colors flex items-center gap-2"
                                            >
                                                <span className="font-mono text-[#0854A0] font-bold">{a.tx}</span>
                                                <span className="text-[#6A6D70]">{a.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#F5F7FA] border-t border-[#C4C4C4] px-3 py-1 text-[10px] text-[#6A6D70] flex justify-between">
                    <span>Coordinador Supply Chain — Daka Venezuela</span>
                    <span>{metrics.total.toLocaleString()} materiales | {metrics.sinEAN + metrics.sinPeso + metrics.sinReorden} problemas detectados</span>
                </div>
            </div>
        </div>
    );
}
