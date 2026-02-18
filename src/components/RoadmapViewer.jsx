import React from 'react';
import {
    Trophy, CheckCircle, Circle, ArrowRight,
    TrendingUp, BookOpen, AlertTriangle
} from 'lucide-react';

const ROADMAP_DATA = [
    {
        module: 'MM',
        title: 'Gestión de Materiales',
        description: 'El corazón de la cadena de suministro.',
        progress: 80,
        color: 'bg-blue-600',
        items: [
            {
                code: '/nMM01', name: 'Crear Material', status: 'ready', desc: 'Crear SKUs con pesos/volumen',
                theory: 'El Maestro de Materiales es la base de todo. Aquí defines si es Producto Terminado (FERT) o Materia Prima (ROH), su peso, precio y cómo se abastece.'
            },
            {
                code: '/nMM03', name: 'Visualizar Material', status: 'ready', desc: 'Consultar ficha técnica',
                theory: 'Permite ver la configuración de un material sin riesgo de cambiar nada. Es la transacción más usada por analistas.'
            },
            {
                code: '/nMIGO', name: 'Movimientos de Stock', status: 'ready', desc: 'Entradas de mercancía',
                theory: 'Todo lo que entra o sale del inventario pasa por aquí. 101: Entrada (Compra), 201: Salida (Consumo), 311: Traslado.'
            },
            {
                code: '/nMM17', name: 'Modificación Masiva', status: 'pending', desc: 'Cambios a gran escala',
                theory: 'Peligrosa pero útil. Permite cambiar el precio o la descripción de miles de materiales en un solo clic.'
            },
            {
                code: '/nXK01', name: 'Maestro Proveedores', status: 'ready', desc: 'Registro de acreedores',
                theory: 'Para comprar, necesitas a quién. Aquí creas al proveedor, le asignas su moneda, cuenta bancaria y condiciones de pago.'
            },
        ]
    },
    {
        module: 'PUR',
        title: 'Compras (Purchasing)',
        description: 'Reabastecimiento y gestión de proveedores.',
        progress: 80,
        color: 'bg-indigo-600',
        items: [
            {
                code: '/nME21N', name: 'Crear Pedido', status: 'ready', desc: 'Orden de compra a proveedor',
                theory: 'El contrato legal con el proveedor. Especifica qué queremos, cuánto cuesta y cuándo lo necesitamos (Fecha de Entrega).'
            },
            {
                code: '/nME28', name: 'Liberar Pedido', status: 'ready', desc: 'Aprobación gerencial',
                theory: 'Control de fraude. Los pedidos caros requieren la firma digital (Liberación) de un gerente antes de enviarse.'
            },
            {
                code: '/nME51N', name: 'Solicitud Pedido', status: 'pending', desc: 'Requisición interna (SolPed)',
                theory: 'Un empleado pide algo ("Necesito 10 laptops"). Compras lo revisa y, si está ok, lo convierte en Pedido (ME21N).'
            },
        ]
    },
    {
        module: 'SD',
        title: 'Ventas y Distribución',
        description: 'Ciclo comercial y logística de salida.',
        progress: 40,
        color: 'bg-orange-600',
        items: [
            {
                code: '/nVA01', name: 'Crear Pedido Venta', status: 'ready', desc: 'Registrar orden de cliente',
                theory: 'El inicio de la venta. Un cliente nos pide productos. Aquí fijamos precios, descuentos y fecha prometida.'
            },
            {
                code: '/nVL01N', name: 'Crear Entrega', status: 'pending', desc: 'Gestionar despacho',
                theory: 'La orden al almacén para que prepare el paquete (Picking) y lo suba al camión (Salida de Mercancía).'
            },
            {
                code: '/nVF01', name: 'Crear Factura', status: 'pending', desc: 'Facturación al cliente',
                theory: 'El paso final (o casi). Genera la cuenta por cobrar y el documento legal fiscal para el cliente.'
            },
        ]
    },
    {
        module: 'ANA',
        title: 'Analítica y Gerencia',
        description: 'Reportes y herramientas de decisión.',
        progress: 75,
        color: 'bg-emerald-600',
        items: [
            {
                code: '/nSE16N', name: 'Data Browser', status: 'ready', desc: 'Consultas SQL directas',
                theory: 'La navaja suiza. Permite ver los datos crudos de las tablas (MARA, EKKO). Solo para expertos.'
            },
            {
                code: '/nMM60', name: 'Índice Materiales', status: 'ready', desc: 'Listado y análisis precios',
                theory: 'Reporte básico para listar materiales por tipo, creador o precio. Útil para auditorías rápidas.'
            },
            {
                code: '/nGERENTE', name: 'Career Roadmap', status: 'ready', desc: 'Tracking de progreso personal',
                theory: 'Tu panel de control para dominar tu carrera como consultor SAP.'
            },
            {
                code: '/nMC.9', name: 'Análisis Stock', status: 'pending', desc: 'Rotación y cobertura',
                theory: 'Dashboard logístico. Muestra cuánto stock tienes y cuánto vale. Clave para reducir costos de inventario.'
            },
        ]
    }
];

export default function RoadmapViewer({ onClose }) {
    const [activeTheory, setActiveTheory] = React.useState(null);

    const printRoadmap = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Plan de Estudio SAP SCM - Dataelectric</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
                        h1 { color: #0854A0; border-bottom: 2px solid #0854A0; padding-bottom: 10px; }
                        .module { margin-bottom: 30px; page-break-inside: avoid; }
                        .module-title { font-size: 18px; font-weight: bold; background: #eee; padding: 5px 10px; margin-bottom: 10px; }
                        .transaction { margin-left: 20px; margin-bottom: 10px; border-left: 3px solid #ddd; padding-left: 10px; }
                        .code { font-weight: bold; font-family: monospace; color: #0854A0; }
                        .name { font-weight: bold; }
                        .desc { font-style: italic; color: #666; font-size: 12px; }
                        .theory { margin-top: 5px; background: #f9f9f9; padding: 5px; font-size: 12px; border-radius: 4px; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <h1>SAP SCM Career Roadmap - Plan de Estudio</h1>
                    <p>Generado el: ${new Date().toLocaleDateString()}</p>
                    
                    ${ROADMAP_DATA.map(mod => `
                        <div class="module">
                            <div class="module-title">${mod.module}: ${mod.title}</div>
                            ${mod.items.map(item => `
                                <div class="transaction">
                                    <div><span class="code">${item.code}</span> - <span class="name">${item.name}</span></div>
                                    <div class="desc">${item.desc}</div>
                                    <div class="theory"><strong>Teoría:</strong> ${item.theory || 'N/A'}</div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                    
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            {/* Theory Modal */}
            {activeTheory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setActiveTheory(null)}>
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-[500px] border-l-4 border-blue-600" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-3 text-blue-800">
                            <BookOpen size={24} />
                            <h3 className="text-xl font-bold">{activeTheory.code} - {activeTheory.name}</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4 text-justify">
                            {activeTheory.theory}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setActiveTheory(null)}
                                className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-slate-50 w-[95%] h-[90vh] shadow-2xl flex flex-col rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header Style Fiori */}
                <div className="bg-[#354A5F] text-white p-4 flex justify-between items-center shadow-lg z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-full">
                            <Trophy size={24} className="text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">SCM Career Roadmap</h2>
                            <p className="text-xs text-white/70">Plan de Carrera: Consultor Supply Chain Senior</p>
                            <div className="flex gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                                    <CheckCircle size={10} className="text-green-400" /> Funcional / Aprendido
                                </span>
                                <span className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded border border-white/20">
                                    <Circle size={10} className="text-slate-300" /> Pendiente por Estudiar
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={printRoadmap}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2"
                            title="Descargar Plan de Estudio"
                        >
                            <BookOpen size={14} /> Descargar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="hover:bg-white/10 p-2 rounded-full transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ROADMAP_DATA.map((mod, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            {/* Module Header */}
                            <div className={`${mod.color} p-4 text-white`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{mod.module}</h3>
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                                        {mod.progress}% Completado
                                    </span>
                                </div>
                                <h4 className="font-medium opacity-90">{mod.title}</h4>
                                <p className="text-xs opacity-75 mt-1 leading-relaxed">{mod.description}</p>

                                {/* Progress Bar */}
                                <div className="w-full bg-black/20 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-white h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${mod.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                                {mod.items.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${item.status === 'ready'
                                            ? 'bg-green-50 border-green-100'
                                            : 'bg-slate-50 border-slate-100 opacity-70'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {item.status === 'ready' ? (
                                                <CheckCircle size={16} className="text-green-600" />
                                            ) : (
                                                <Circle size={16} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-1 border rounded">
                                                    {item.code}
                                                </span>
                                                <span className={`text-sm font-medium ${item.status === 'ready' ? 'text-green-800' : 'text-slate-600'}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTheory(item);
                                            }}
                                            className="ml-auto p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Leer Teoría"
                                        >
                                            <BookOpen size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                {mod.progress === 100 ? (
                                    <span className="text-xs font-bold text-green-600 flex items-center justify-center gap-1">
                                        <Trophy size={12} /> Módulo Dominado
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                        <BookOpen size={12} /> En progreso
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* KPI Summary Card */}
                    <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-[#2C3E50] to-[#34495E] rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-1">Tu Progreso General</h3>
                            <p className="text-white/70 text-sm">Convertirse en Consultor SAP requiere práctica constante.</p>
                        </div>
                        <div className="flex gap-8 text-center">
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">11</div>
                                <div className="text-xs uppercase tracking-wider opacity-70">Transacciones</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-400">65%</div>
                                <div className="text-xs uppercase tracking-wider opacity-70">Roadmap</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-blue-400">Jr</div>
                                <div className="text-xs uppercase tracking-wider opacity-70">Nivel Actual</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
