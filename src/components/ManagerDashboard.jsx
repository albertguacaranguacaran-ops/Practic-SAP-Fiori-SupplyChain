import { useState } from 'react';
import {
    LayoutDashboard, Users, TrendingUp, BookOpen,
    Briefcase, Award, CircleCheck, Target, Package, Truck, ShoppingCart
} from 'lucide-react';

export default function ManagerDashboard({ onClose }) {
    const [activeTab, setActiveTab] = useState('kpi');

    // Mock Data for Dashboard
    const teamMembers = [
        {
            id: 1, name: 'Analista de Compras', role: 'Purchasing & Inventory',
            tasks: ['Revisar Stock Bajo (MMBE)', 'Crear Pedidos (ME21N)', 'Gestión Proveedores (XK01)'],
            status: 'Active', color: 'bg-green-100 text-green-800'
        },
        {
            id: 2, name: 'Analista de Logística', role: 'Planning & Distribution',
            tasks: ['Crear Entregas (VL01N)', 'Facturación (VF01)', 'Monitor de Pedidos (VA03)'],
            status: 'Active', color: 'bg-blue-100 text-blue-800'
        },
        {
            id: 3, name: 'Ingeniero de Empaque', role: 'Packaging Optimization',
            tasks: ['Modelos de Empaque (/nPACK)', 'Optimización de Carga', 'Control de Calidad'],
            status: 'Onboarding', color: 'bg-yellow-100 text-yellow-800'
        }
    ];

    const kpis = [
        { label: 'Valor Inventario', value: '$1.2M', change: '+5%', icon: Package, color: 'text-blue-600' },
        { label: 'Pedidos Abiertos', value: '23', change: '-2', icon: ShoppingCart, color: 'text-orange-600' },
        { label: 'Entregas del Mes', value: '145', change: '+12%', icon: Truck, color: 'text-green-600' },
        { label: 'Nivel de Servicio', value: '94%', change: '+1.5%', icon: TrendingUp, color: 'text-purple-600' }
    ];

    const roadmapSteps = [
        {
            stage: '1. SAP MM (Gestión de Materiales)', status: 'In Progress',
            desc: 'El Corazón de la Cadena: Datos Maestros, Compras e Inventarios.',
            items: [
                { label: 'Maestro de Materiales (MM01) - Listo ✅' },
                { label: 'Movimientos de Stock (MIGO) - Listo ✅' },
                { label: 'Órdenes de Compra (ME21N) - Listo ✅' },
                { label: 'Maestro de Proveedores (XK01) - Listo ✅' }
            ]
        },
        {
            stage: '2. SAP SD (Ventas y Distribución)', status: 'In Progress',
            desc: 'Salida al Cliente: Ciclo de Ventas, Entregas y Facturación.',
            items: [
                { label: 'Pedidos de Venta (VA01) - Listo ✅' },
                { label: 'Entregas (VL01N) - Listo ✅' },
                { label: 'Facturación (VF01) - Listo ✅' },
                { label: 'ATP Check - Parcial 🟧' }
            ]
        },
        {
            stage: '3. Strategic Management', status: 'Next',
            desc: 'Análisis y Toma de Decisiones: KPIs y Gestión de Equipo.',
            items: [
                { label: 'Dashboard Gerencial (/nGERENTE) - En Progreso 🚧' },
                { label: 'Reportes Avanzados (MC.9) - Pendiente ❌' },
                { label: 'Planificación (MD04) - Pendiente ❌' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            {/* Header */}
            <div className="bg-[#0854A0] text-white px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <LayoutDashboard size={20} />
                    <div>
                        <h1 className="font-bold text-sm">Tablero de Control - Gerencia Supply Chain</h1>
                        <p className="text-[10px] text-white/80">Dataelectric S/4HANA v1.0</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-[#C4C4C4] flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-[#E8F4FD] rounded-full flex items-center justify-center text-[#0854A0] font-bold text-xl">
                                G
                            </div>
                            <div>
                                <h3 className="font-bold text-[#32363A]">Gerente SCM</h3>
                                <p className="text-xs text-[#6A6D70]">Consultor01</p>
                            </div>
                        </div>
                    </div>

                    <nav className="p-2 space-y-1">
                        <button
                            onClick={() => setActiveTab('kpi')}
                            className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${activeTab === 'kpi' ? 'bg-[#EFF4F9] text-[#0854A0] font-semibold' : 'text-[#6A6D70] hover:bg-gray-50'}`}
                        >
                            <TrendingUp size={16} /> KPIs & Métricas
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${activeTab === 'team' ? 'bg-[#EFF4F9] text-[#0854A0] font-semibold' : 'text-[#6A6D70] hover:bg-gray-50'}`}
                        >
                            <Users size={16} /> Mi Equipo
                        </button>
                        <button
                            onClick={() => setActiveTab('roadmap')}
                            className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${activeTab === 'roadmap' ? 'bg-[#EFF4F9] text-[#0854A0] font-semibold' : 'text-[#6A6D70] hover:bg-gray-50'}`}
                        >
                            <Target size={16} /> Roadmap Estratégico
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">

                    {/* KPIs Section */}
                    {activeTab === 'kpi' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-[#32363A] flex items-center gap-2">
                                <TrendingUp className="text-[#0854A0]" /> Indicadores Clave de Desempeño
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {kpis.map((kpi, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm text-[#6A6D70] font-medium">{kpi.label}</span>
                                            <kpi.icon size={18} className={kpi.color} />
                                        </div>
                                        <div className="text-2xl font-bold text-[#32363A]">{kpi.value}</div>
                                        <div className="text-xs text-green-600 font-medium mt-1">{kpi.change} vs mes anterior</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                                <h3 className="font-bold text-[#32363A] mb-4">Resumen de Actividad Reciente</h3>
                                <div className="h-48 bg-gray-50 flex items-center justify-center text-gray-400 border border-dashed rounded">
                                    [Gráfico de Barras: Pedidos vs Entregas]
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team Section */}
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-[#32363A] flex items-center gap-2">
                                <Users className="text-[#0854A0]" /> Estructura del Equipo SCM
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                {teamMembers.map((member) => (
                                    <div key={member.id} className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#32363A]">{member.name}</h3>
                                                <p className="text-sm text-[#0854A0] font-medium">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-[#6A6D70] mb-1">Responsabilidades:</p>
                                                <div className="flex gap-1">
                                                    {member.tasks.map((task, i) => (
                                                        <span key={i} className="text-[10px] bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                            {task}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.color}`}>
                                                {member.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Roadmap Section */}
                    {activeTab === 'roadmap' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-[#32363A] flex items-center gap-2">
                                <Target className="text-[#0854A0]" /> Roadmap Estratégico 2026
                            </h2>
                            <div className="border-l-2 border-[#0854A0] ml-4 space-y-8 pl-6 relative">
                                {roadmapSteps.map((step, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ${step.status === 'In Progress' ? 'bg-[#E9730C]' : step.status === 'Done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <h3 className="font-bold text-lg text-[#32363A] mb-1">{step.stage}</h3>
                                        <p className="text-sm text-[#0854A0] font-medium mb-3">{step.desc}</p>
                                        <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                            <ul className="space-y-2">
                                                {step.items.map((item, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-[#6A6D70]">
                                                        {item.label.includes('Listo') ? <CircleCheck size={14} className="text-green-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300"></div>}
                                                        <span>{item.label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
