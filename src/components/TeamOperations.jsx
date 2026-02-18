import { useState, useMemo } from 'react';
import {
    Users, User, Package, Barcode, AlertTriangle, CheckCircle,
    ClipboardList, TrendingDown, Scale, Search, ChevronRight,
    Briefcase, Target, ArrowRight, Settings, BarChart3,
    FileText, Truck, ShoppingCart, X, HelpCircle, Eye
} from 'lucide-react';

// Team structure
const TEAM = [
    {
        id: 'coord',
        role: 'Coordinador Supply Chain',
        name: 'TÚ',
        icon: Briefcase,
        color: '#0854A0',
        bgColor: '#E8F4FD',
        focus: 'Estrategia, KPIs, decisiones de compra',
        transactions: ['/nMD04', '/nME21N', '/nME28', '/nSTATS', '/nGERENTE'],
        tasks: [
            { id: 't1', label: 'Revisar MD04 de materiales críticos (Cat. A)', status: 'daily', transaction: '/nMD04', kpi: 'Fill Rate > 95%' },
            { id: 't2', label: 'Aprobar pedidos de compra pendientes', status: 'daily', transaction: '/nME28', kpi: 'Lead time < 3 días' },
            { id: 't3', label: 'Analizar rotación de inventario', status: 'weekly', transaction: '/nSTATS', kpi: 'Rotación > 8x/año' },
            { id: 't4', label: 'Revisar pronóstico de demanda', status: 'weekly', transaction: '/nMD04', kpi: 'Forecast Error < 15%' },
            { id: 't5', label: 'Negociar condiciones con proveedores clave', status: 'monthly', transaction: '/nXK03', kpi: 'Ahorro > 3% anual' },
            { id: 't6', label: 'Presentar dashboard gerencial', status: 'monthly', transaction: '/nGERENTE', kpi: 'KPIs en verde' },
        ]
    },
    {
        id: 'analyst1',
        role: 'Analista de Datos 1',
        name: 'Analista — Master Data',
        icon: Barcode,
        color: '#107E3E',
        bgColor: '#E8F5E9',
        focus: 'Limpieza de data maestra, EANs, duplicados, campos vacíos',
        transactions: ['/nMM02', '/nMM03', '/nEAN', '/nDUP', '/nSE16'],
        tasks: [
            { id: 'a1', label: 'Corregir materiales sin EAN', status: 'daily', transaction: '/nMM02', kpi: '0 materiales sin EAN', metric: 'sinEAN' },
            { id: 'a2', label: 'Eliminar EANs duplicados entre materiales', status: 'daily', transaction: '/nEAN', kpi: '0 EANs duplicados', metric: 'eanDup' },
            { id: 'a3', label: 'Completar descripciones faltantes', status: 'daily', transaction: '/nMM02', kpi: '0 descripciones vacías', metric: 'sinDesc' },
            { id: 'a4', label: 'Identificar y fusionar materiales duplicados', status: 'weekly', transaction: '/nDUP', kpi: '0 duplicados activos', metric: 'duplicados' },
            { id: 'a5', label: 'Verificar precios base vs. registro info', status: 'weekly', transaction: '/nSE16', kpi: '0 precios anómalos', metric: 'precioMalo' },
            { id: 'a6', label: 'Reporte semanal de calidad de datos', status: 'weekly', transaction: '/nSTATS', kpi: 'Data Quality > 90%' },
        ]
    },
    {
        id: 'analyst2',
        role: 'Analista de Datos 2',
        name: 'Analista — Compras & Reabastecimiento',
        icon: ShoppingCart,
        color: '#E9730C',
        bgColor: '#FFF3E0',
        focus: 'Puntos de reorden, MRP, stock de seguridad, lead times',
        transactions: ['/nMD04', '/nME21N', '/nME23N', '/nMMBE', '/nME2M'],
        tasks: [
            { id: 'b1', label: 'Revisar materiales bajo punto de reorden', status: 'daily', transaction: '/nMD04', kpi: '0 roturas de stock', metric: 'bajoReorden' },
            { id: 'b2', label: 'Generar pedidos para materiales críticos', status: 'daily', transaction: '/nME21N', kpi: 'Pedidos a tiempo' },
            { id: 'b3', label: 'Verificar entregas pendientes de proveedores', status: 'daily', transaction: '/nME23N', kpi: 'OTIF > 90%' },
            { id: 'b4', label: 'Ajustar puntos de reorden según demanda', status: 'weekly', transaction: '/nMM02', kpi: 'Service Level > 95%', metric: 'reordenMalo' },
            { id: 'b5', label: 'Analizar lead times reales vs. configurados', status: 'weekly', transaction: '/nSE16', kpi: 'Desviación < 2 días' },
            { id: 'b6', label: 'Cálculo de stock de seguridad', status: 'monthly', transaction: '/nMD04', kpi: 'SS optimizado' },
        ]
    },
    {
        id: 'packaging',
        role: 'Ingeniero de Empaque',
        name: 'Ingeniero — Empaque & Dimensiones',
        icon: Package,
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        focus: 'Pesos, dimensiones, cubicaje, factor de apilamiento, sobrepeso',
        transactions: ['/nMM02', '/nPACK', '/nOVERW', '/nMM03'],
        tasks: [
            { id: 'p1', label: 'Completar dimensiones faltantes (largo/ancho/alto)', status: 'daily', transaction: '/nMM02', kpi: '0 sin dimensiones', metric: 'sinDimensiones' },
            { id: 'p2', label: 'Corregir pesos neto/bruto incorrectos', status: 'daily', transaction: '/nMM02', kpi: '0 pesos vacíos', metric: 'sinPeso' },
            { id: 'p3', label: 'Verificar materiales con sobrepeso (>50kg)', status: 'daily', transaction: '/nOVERW', kpi: 'Todos etiquetados', metric: 'sobrepeso' },
            { id: 'p4', label: 'Calcular factor de apilamiento por categoría', status: 'weekly', transaction: '/nPACK', kpi: 'Utilización > 70%' },
            { id: 'p5', label: 'Optimizar packing list para despachos', status: 'weekly', transaction: '/nPACK', kpi: 'Pallets optimizados' },
            { id: 'p6', label: 'Reportar anomalías de empaque a proveedores', status: 'monthly', transaction: '/nSE16', kpi: 'Claims procesados' },
        ]
    }
];

const FREQ_COLORS = {
    daily: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Diaria' },
    weekly: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Semanal' },
    monthly: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Mensual' }
};

export default function TeamOperations({ materials = [], onNavigate, onClose, showStatus }) {
    const [selectedRole, setSelectedRole] = useState('coord');
    const [showMetrics, setShowMetrics] = useState(true);

    // Calculate real metrics from material data
    const metrics = useMemo(() => {
        let sinEAN = 0, eanDup = 0, sinDesc = 0, duplicados = 0, precioMalo = 0;
        let bajoReorden = 0, reordenMalo = 0;
        let sinDimensiones = 0, sinPeso = 0, sobrepeso = 0;

        const eanMap = new Map();

        for (const m of materials) {
            // Analyst 1 metrics
            if (!m.ean || m.ean === '') sinEAN++;
            if (m.ean) {
                if (eanMap.has(m.ean)) eanDup++;
                else eanMap.set(m.ean, m.id);
            }
            if (!m.descripcion || m.descripcion.trim() === '') sinDesc++;
            if (m.status === 'duplicate') duplicados++;
            if (m.precioBase === 0 || m.precioBase > 10000) precioMalo++;

            // Analyst 2 metrics
            if (m.stockActual !== null && m.puntoReorden && m.stockActual < m.puntoReorden) bajoReorden++;
            if (!m.puntoReorden || m.puntoReorden === 0) reordenMalo++;

            // Packaging metrics
            if (!m.largo || !m.ancho || !m.alto) sinDimensiones++;
            if (!m.pesoNeto || !m.pesoBruto) sinPeso++;
            if (m.pesoNeto && m.pesoNeto > 50) sobrepeso++;
        }

        return { sinEAN, eanDup, sinDesc, duplicados, precioMalo, bajoReorden, reordenMalo, sinDimensiones, sinPeso, sobrepeso };
    }, [materials]);

    const selectedTeamMember = TEAM.find(t => t.id === selectedRole);

    const getMetricValue = (metricKey) => {
        if (!metricKey) return null;
        return metrics[metricKey] || 0;
    };

    const handleGoToTransaction = (txCode) => {
        if (onNavigate) {
            onClose?.();
            setTimeout(() => onNavigate(txCode), 150);
        }
        showStatus?.(`Navegando a ${txCode}`, 'info');
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            {/* Header */}
            <div className="bg-[#354A5F] text-white px-4 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-mono bg-[#0854A0] px-2 py-0.5 rounded text-sm">/nTEAM</span>
                    <Users size={18} />
                    <span className="font-bold text-sm">Centro de Operaciones — Equipo Supply Chain Daka</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMetrics(!showMetrics)}
                        className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20"
                    >
                        <BarChart3 size={12} /> {showMetrics ? 'Ocultar' : 'Mostrar'} Métricas
                    </button>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
                </div>
            </div>

            {/* Team Tabs */}
            <div className="bg-white border-b border-[#C4C4C4] flex">
                {TEAM.map(member => {
                    const Icon = member.icon;
                    return (
                        <button
                            key={member.id}
                            onClick={() => setSelectedRole(member.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${selectedRole === member.id
                                ? `border-b-[${member.color}] text-[${member.color}]`
                                : 'border-b-transparent text-[#6A6D70] hover:text-[#32363A] hover:bg-gray-50'
                                }`}
                            style={selectedRole === member.id ? { borderBottomColor: member.color, color: member.color } : {}}
                        >
                            <Icon size={16} />
                            <span className="hidden sm:inline">{member.role}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {selectedTeamMember && (
                    <div className="max-w-5xl mx-auto space-y-4">

                        {/* Role Header */}
                        <div className="rounded-lg shadow-sm overflow-hidden border" style={{ borderColor: selectedTeamMember.color + '40' }}>
                            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: selectedTeamMember.bgColor }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedTeamMember.color }}>
                                        {(() => { const Icon = selectedTeamMember.icon; return <Icon size={24} className="text-white" />; })()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold" style={{ color: selectedTeamMember.color }}>
                                            {selectedTeamMember.name}
                                        </h2>
                                        <p className="text-sm text-[#6A6D70]">{selectedTeamMember.focus}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-[#6A6D70] mb-1">Transacciones Clave</div>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {selectedTeamMember.transactions.map(tx => (
                                            <button
                                                key={tx}
                                                onClick={() => handleGoToTransaction(tx)}
                                                className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                                            >
                                                {tx}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tasks by Frequency */}
                        {['daily', 'weekly', 'monthly'].map(freq => {
                            const freqStyle = FREQ_COLORS[freq];
                            const tasks = selectedTeamMember.tasks.filter(t => t.status === freq);
                            if (tasks.length === 0) return null;

                            return (
                                <div key={freq} className="bg-white border border-[#C4C4C4] rounded-lg shadow-sm overflow-hidden">
                                    <div className={`px-4 py-2 border-b ${freqStyle.bg} ${freqStyle.border} flex items-center justify-between`}>
                                        <div className="flex items-center gap-2">
                                            <Target size={14} className={freqStyle.text} />
                                            <span className={`text-xs font-bold uppercase ${freqStyle.text}`}>
                                                Tareas {freqStyle.label}s
                                            </span>
                                        </div>
                                        <span className={`text-xs ${freqStyle.text}`}>{tasks.length} actividades</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {tasks.map((task) => {
                                            const metricVal = getMetricValue(task.metric);
                                            return (
                                                <div key={task.id} className="px-4 py-3 flex items-center gap-4 hover:bg-[#FAFAFA] transition-colors">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-[#32363A]">{task.label}</div>
                                                        <div className="text-xs text-[#6A6D70] mt-0.5 flex items-center gap-3">
                                                            <span>KPI: <strong>{task.kpi}</strong></span>
                                                        </div>
                                                    </div>

                                                    {/* Live Metric */}
                                                    {showMetrics && metricVal !== null && (
                                                        <div className={`text-center px-3 py-1 rounded ${metricVal === 0
                                                            ? 'bg-green-50 text-green-700'
                                                            : metricVal < 10
                                                                ? 'bg-yellow-50 text-yellow-700'
                                                                : 'bg-red-50 text-red-700'
                                                            }`}>
                                                            <div className="text-lg font-bold font-mono">{metricVal.toLocaleString()}</div>
                                                            <div className="text-[10px]">pendientes</div>
                                                        </div>
                                                    )}

                                                    {/* Go Button */}
                                                    <button
                                                        onClick={() => handleGoToTransaction(task.transaction)}
                                                        className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded border border-[#0854A0] text-[#0854A0] hover:bg-[#0854A0] hover:text-white transition-all"
                                                    >
                                                        {task.transaction} <ArrowRight size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Org Chart */}
                        <div className="bg-white border border-[#C4C4C4] rounded-lg shadow-sm p-4">
                            <h3 className="text-xs font-bold text-[#6A6D70] uppercase mb-3 flex items-center gap-2">
                                <Users size={14} /> Estructura del Equipo
                            </h3>
                            <div className="flex flex-col items-center gap-2">
                                {/* Coordinator */}
                                <div className="w-64 rounded border-2 p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
                                    style={{ borderColor: TEAM[0].color, backgroundColor: TEAM[0].bgColor }}
                                    onClick={() => setSelectedRole('coord')}
                                >
                                    <div className="text-xs font-bold" style={{ color: TEAM[0].color }}>{TEAM[0].role}</div>
                                    <div className="text-[10px] text-[#6A6D70]">{TEAM[0].focus}</div>
                                </div>
                                <div className="w-px h-4 bg-[#C4C4C4]" />
                                <div className="flex gap-6">
                                    {/* Subordinates */}
                                    {TEAM.slice(1).map(member => (
                                        <div key={member.id} className="flex flex-col items-center gap-2">
                                            <div className="w-px h-4 bg-[#C4C4C4]" />
                                            <div
                                                className="w-52 rounded border-2 p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
                                                style={{ borderColor: member.color, backgroundColor: member.bgColor }}
                                                onClick={() => setSelectedRole(member.id)}
                                            >
                                                <div className="text-xs font-bold" style={{ color: member.color }}>{member.role}</div>
                                                <div className="text-[10px] text-[#6A6D70] mt-1">{member.focus}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
