import { useState, useEffect } from 'react';
import {
    Users, Calendar, Activity, CircleCheck, TriangleAlert,
    ArrowRight, ShoppingCart, Database, Image, BarChart3,
    Clock, Target, ListChecks, ArrowDown, Search, Truck, Zap,
    FileText, X, Briefcase, UserCheck, ShieldCheck, Megaphone
} from 'lucide-react';

export default function EcommerceMonitor({ onClose }) {
    const [activeTab, setActiveTab] = useState('role'); // Default to role for now as requested
    const [expandedStep, setExpandedStep] = useState(null); // Track which step is expanded

    // Calculator States
    const [totalItems] = useState(36000);
    const [teamSize, setTeamSize] = useState(2);
    const [dailyRate, setDailyRate] = useState(50);
    const [projectedDays, setProjectedDays] = useState(0);
    const [projectedMonths, setProjectedMonths] = useState(0);

    // Timeline Calculation
    useEffect(() => {
        const totalDailyOutput = teamSize * dailyRate;
        const days = Math.ceil(totalItems / totalDailyOutput);
        const months = (days / 20).toFixed(1);
        setProjectedDays(days);
        setProjectedMonths(months);
    }, [teamSize, dailyRate, totalItems]);

    // Function to handle step expansion
    const toggleStep = (stepId) => {
        if (expandedStep === stepId) {
            setExpandedStep(null);
        } else {
            setExpandedStep(stepId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col font-sans">
            {/* Header */}
            <div className="bg-[#1a237e] text-white px-6 py-4 flex items-center justify-between shadow-lg flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <ShoppingCart size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Tablero Estratégico SCM (E-commerce)</h1>
                        <p className="text-xs text-white/70">Proyecto: Estandarización de Catálogo Maestro (36k SKUs)</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">✕</button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 flex gap-8 flex-shrink-0 overflow-x-auto">
                {[
                    { id: 'role', label: '1. Rol del Coordinador', icon: Briefcase },
                    { id: 'workflow', label: '2. Roadmap de Ejecución', icon: ListChecks },
                    { id: 'strategy', label: '3. Calculadora (Recursos)', icon: Target },
                    { id: 'audit', label: '4. Semáforo de Calidad', icon: CheckCircle },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-[#1a237e] text-[#1a237e]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-8 relative">

                {/* TAB 1: ROL DEL COORDINADOR (NEW) */}
                {activeTab === 'role' && (
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-left-8 duration-500">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">El Rol del Coordinador Supply Chain</h2>
                            <p className="text-gray-600">"No solo subimos fotos. Gestionamos la Estrategia de Catálogo."</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Card 1: Estrategia y Normas */}
                            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                        <Briefcase size={24} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-800">1. Guardián del Estándar</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Define y hace cumplir las reglas del juego. Si no hay regla, hay caos.
                                </p>
                                <ul className="text-sm space-y-2 text-gray-700">
                                    <li className="flex gap-2">🔹 <strong>Definir Naming Convention:</strong> Crear la "Fórmula Maestra" para cada categoría.</li>
                                    <li className="flex gap-2">🔹 <strong>Auditoría de Calidad:</strong> Aprobar/Rechazar lo que el equipo produce (El Semáforo).</li>
                                    <li className="flex gap-2">🔹 <strong>Manuales:</strong> Mantener actualizadas las guías de creación de items.</li>
                                </ul>
                            </div>

                            {/* Card 2: Gestión del Equipo */}
                            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-600 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                                        <UserCheck size={24} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-800">2. Líder de Ejecución</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Asegura que la "Fábrica de Datos" no se detenga.
                                </p>
                                <ul className="text-sm space-y-2 text-gray-700">
                                    <li className="flex gap-2">🔹 <strong>Asignación Semanal:</strong> Repartir lotes por especialidad (Tú haces TV, tú haces Línea Blanca).</li>
                                    <li className="flex gap-2">🔹 <strong>Resolución de "Misterios":</strong> Decidir qué hacer con los items en "Cuarentena" (Obsolescencia).</li>
                                    <li className="flex gap-2">🔹 <strong>Ritmo:</strong> Monitorear que se cumpla la meta diaria (Ej: 50 items/persona).</li>
                                </ul>
                            </div>

                            {/* Card 3: Enlace entre Áreas */}
                            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-600 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                                        <Megaphone size={24} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-800">3. Conector del Negocio</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    El catálogo no es una isla. Conecta Compras, Logística y Marketing.
                                </p>
                                <ul className="text-sm space-y-2 text-gray-700">
                                    <li className="flex gap-2">🔹 <strong>Compras:</strong> "Exige" al comprador la Ficha Técnica y Foto antes de crear el código.</li>
                                    <li className="flex gap-2">🔹 <strong>Logística:</strong> Valida que las medidas (Cubicaje) sean reales para evitar fletes perdidos.</li>
                                    <li className="flex gap-2">🔹 <strong>E-commerce:</strong> Entrega la data "lista para vender" (Fotos + EAN).</li>
                                </ul>
                            </div>

                            {/* Card 4: Reportes a Gerencia */}
                            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-orange-600 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-800">4. Dueño del KPI</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Lo que no se mide, no se mejora. Reportamos avance real.
                                </p>
                                <ul className="text-sm space-y-2 text-gray-700">
                                    <li className="flex gap-2">🔹 <strong>Avance %:</strong> "¿Cuánto nos falta para terminar el Pareto?".</li>
                                    <li className="flex gap-2">🔹 <strong>Calidad de Data:</strong> "¿Cuántos items sin EAN quedan?".</li>
                                    <li className="flex gap-2">🔹 <strong>Forecast:</strong> "¿Cuándo estaremos listos para la campaña de Navidad?".</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 bg-gray-900 text-gray-300 p-4 rounded-lg text-center text-sm italic">
                            "El Coordinador transforma datos brutos en activos digitales rentables."
                        </div>
                    </div>
                )}

                {/* TAB 2: WORKFLOW (ROADMAP INTERACTIVO) - Reordered */}
                {activeTab === 'workflow' && (
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Plan Maestro: "Operación Limpieza"</h2>
                            <p className="text-gray-600">Haz clic en cada fase para ver el detalle técnico.</p>
                        </div>

                        <div className="space-y-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-8 top-8 bottom-0 w-1 bg-gray-200 -z-10"></div>

                            {/* Phase 1: Diagnosis */}
                            <div
                                onClick={() => toggleStep(1)}
                                className={`bg-white p-6 rounded-xl shadow-md border-l-8 border-purple-600 relative ml-0 transition-all cursor-pointer group ${expandedStep === 1 ? 'ring-2 ring-purple-400 transform scale-[1.01]' : 'hover:translate-x-2'}`}
                            >
                                <div className="absolute -left-10 top-6 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-gray-100">1</div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">Semana 1: Diagnóstico y Reglas</h3>
                                        <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Tu Primer Punto de Acción</p>
                                    </div>
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        {expandedStep === 1 ? 'Ocultar Detalle' : 'Ver Detalle'} <ArrowDown size={14} className={`transform transition-transform ${expandedStep === 1 ? 'rotate-180' : ''}`} />
                                    </span>
                                </div>

                                {/* DETALLE EXPANDIDO SEMANA 1 */}
                                {expandedStep === 1 && (
                                    <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in zoom-in duration-300">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Columna Izquierda: La Cedula (Identidad) */}
                                            <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                                                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                                    <Search size={18} /> Paso 1.1: La Cédula (Triaje)
                                                </h4>
                                                <p className="text-xs text-purple-800 mb-3">
                                                    Antes de limpiar, debemos saber quién vive y quién muere.
                                                </p>
                                                <div className="bg-white p-3 rounded border border-purple-200 text-xs space-y-2 font-mono text-gray-700">
                                                    <div className="flex justify-between">
                                                        <span>1. Bajar Maestro:</span>
                                                        <strong className="text-purple-700">MM60</strong>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>2. Bajar Ventas (12m):</span>
                                                        <strong className="text-purple-700">MC.9 / MB51 (Mov 601)</strong>
                                                    </div>
                                                    <div className="border-t border-dashed my-2"></div>
                                                    <div className="text-center italic text-gray-500">
                                                        "Cruzar en Excel (BUSCARV)"
                                                    </div>
                                                </div>
                                                <ul className="mt-3 text-xs space-y-1 text-purple-900 font-medium">
                                                    <li>✅ Ventas {'>'} 0: <span className="bg-green-100 text-green-800 px-1 rounded">ACTIVO</span> (Prioridad)</li>
                                                    <li>❌ Ventas = 0: <span className="bg-red-100 text-red-800 px-1 rounded">OBSOLETO</span> (No Tocar)</li>
                                                </ul>
                                            </div>

                                            {/* Columna Derecha: Limpieza de Nombres */}
                                            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                                                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                    <FileText size={18} /> Paso 1.2: Estandarización
                                                </h4>
                                                <p className="text-xs text-blue-800 mb-3">
                                                    Prohibido "Lav.", "Ref.", "Pan.". Usamos nombres completos.
                                                </p>

                                                <div className="bg-white p-3 rounded border border-blue-200 mb-3">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fórmula Maestra</p>
                                                    <code className="text-xs font-bold text-blue-700 break-words">
                                                        [TIPO] + [MARCA] + [MOD] + [ATRIBUTOS]
                                                    </code>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-red-500 font-bold">❌ Mal:</span>
                                                        <span className="text-gray-500 line-through">LAV SAMS 19KG INV GRIS</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs p-1 bg-green-50 rounded border border-green-200">
                                                        <span className="text-green-600 font-bold">✅ Bien:</span>
                                                        <span className="text-gray-800 font-bold">LAVADORA SAMSUNG WA19 19KG GRIS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 bg-gray-800 text-white p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <h5 className="font-bold text-sm text-yellow-400">Herramienta Sugerida 🛠️</h5>
                                                <p className="text-xs text-gray-300">Usa CONCATENAR en Excel para armar los títulos masivamente.</p>
                                            </div>
                                            <Zap className="text-yellow-400" />
                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* Phase 2: Pareto execution */}
                            <div
                                onClick={() => toggleStep(2)}
                                className={`bg-white p-6 rounded-xl shadow-md border-l-8 border-yellow-500 relative ml-0 transition-all cursor-pointer group ${expandedStep === 2 ? 'ring-2 ring-yellow-400 transform scale-[1.01]' : 'hover:translate-x-2'}`}
                            >
                                <div className="absolute -left-10 top-6 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-gray-100">2</div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">Semanas 2-4: Impacto Rápido (Pareto)</h3>
                                        <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Facturar lo antes posible</p>
                                    </div>
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Top 20%</span>
                                </div>

                                {expandedStep === 2 && (
                                    <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in zoom-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                                <h4 className="font-bold text-yellow-800 text-sm mb-2">🔥 El Foco Sagrado</h4>
                                                <p className="text-xs text-yellow-900 mb-2">Solo trabajamos los 7,000 items que traen dinero.</p>
                                                <ul className="text-xs space-y-1 text-yellow-800 list-disc list-inside">
                                                    <li>Línea Blanca (Alto Valor)</li>
                                                    <li>Televisores (Alta Rotación)</li>
                                                    <li>Pequeños Electrodomésticos</li>
                                                </ul>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                                <h4 className="font-bold text-red-800 text-sm mb-2">⚠️ Trampas Mortales</h4>
                                                <ul className="text-xs space-y-1 text-red-800">
                                                    <li>• Sin Peso en SAP = Pérdida en Envío.</li>
                                                    <li>• Foto pixelada = Cliente no compra.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Phase 3: Mass Execution */}
                            <div
                                onClick={() => toggleStep(3)}
                                className={`bg-white p-6 rounded-xl shadow-md border-l-8 border-blue-500 relative ml-0 transition-all cursor-pointer group ${expandedStep === 3 ? 'ring-2 ring-blue-400 transform scale-[1.01]' : 'hover:translate-x-2'}`}
                            >
                                <div className="absolute -left-10 top-6 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-gray-100">3</div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">Mes 2+: "La Carpintería" (Masivo)</h3>
                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Fábrica de Datos (Long Tail)</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Volumen</span>
                                </div>

                                {expandedStep === 3 && (
                                    <div className="mt-6 border-t border-gray-100 pt-6 animate-in fade-in zoom-in duration-300">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="font-bold text-blue-900 text-sm mb-3">🏭 Industrialización del Proceso</h4>
                                            <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
                                                <div>
                                                    <strong>1. Lotes por Familia:</strong>
                                                    <p>Hoy solo cables. Mañana solo bombillos. (Repetición = Velocidad)</p>
                                                </div>
                                                <div>
                                                    <strong>2. Carga Masiva (LSMW/MASS):</strong>
                                                    <p>Cambiar 500 items en 10 segundos.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: STRATEGY CALCULATOR */}
                {activeTab === 'strategy' && (
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Title Section */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Calculadora de Recursos</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Escenario dinámico para negociar recursos con Gerencia.
                            </p>
                        </div>

                        {/* The Calculator Card */}
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                            {/* Inputs */}
                            <div className="p-8 md:w-1/3 bg-gray-50 border-r border-gray-100 space-y-6">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Users size={20} className="text-blue-600" /> Variables del Equipo
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Tamaño del Equipo (Personas)</label>
                                    <input
                                        type="range" min="1" max="10" step="1"
                                        value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer mb-2"
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">1 persona</span>
                                        <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{teamSize} Analistas</span>
                                        <span className="text-gray-400">10 personas</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Velocidad (Items/Día por persona)</label>
                                    <input
                                        type="range" min="10" max="200" step="10"
                                        value={dailyRate} onChange={(e) => setDailyRate(Number(e.target.value))}
                                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer mb-2"
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Lento (10)</span>
                                        <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">{dailyRate} Items/Día</span>
                                        <span className="text-gray-400">Rápido (200)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="p-8 md:w-2/3 flex flex-col justify-center items-center bg-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Calendar size={150} />
                                </div>

                                <h3 className="text-lg font-medium text-gray-500 uppercase tracking-wide mb-6">Tiempo Estimado de Finalización</h3>

                                <div className="flex items-baseline gap-4 mb-4">
                                    <span className="text-6xl font-black text-[#1a237e]">{projectedMonths}</span>
                                    <span className="text-2xl font-bold text-gray-600">Meses</span>
                                </div>
                                <div className="text-sm font-medium text-gray-400 bg-gray-100 px-4 py-2 rounded-full mb-8">
                                    ({projectedDays} días laborales aprox.)
                                </div>

                                {/* Scenarios / Milestones */}
                                <div className="w-full grid grid-cols-2 gap-4">
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 transition-all hover:bg-yellow-100">
                                        <h4 className="font-bold text-yellow-800 text-sm mb-1 flex items-center gap-1">
                                            <Target size={14} /> Fase 1: Top 20% (Prioridad)
                                        </h4>
                                        <p className="text-xs text-yellow-700 mb-2">7,200 Items Clave (Pareto)</p>
                                        <p className="font-bold text-lg text-yellow-900">{(projectedMonths * 0.2).toFixed(1)} Meses</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 transition-all hover:bg-blue-100">
                                        <h4 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-1">
                                            <Activity size={14} /> Fase 2: Long Tail (Masivo)
                                        </h4>
                                        <p className="text-xs text-blue-700 mb-2">28,800 Items Restantes</p>
                                        <p className="font-bold text-lg text-blue-900">{(projectedMonths * 0.8).toFixed(1)} Meses</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* TAB 4: AUDIT (SEMAFORO) */}
                {activeTab === 'audit' && (
                    <div className="max-w-4xl mx-auto animate-in zoom-in duration-300">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-gray-800">Criterios de Aceptación (Semáforo)</h2>
                            <p className="text-gray-500">¿Qué pasa si un producto no cumple?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* RED */}
                            <div className="bg-white rounded-xl shadow-lg border-t-8 border-red-500 overflow-hidden">
                                <div className="bg-red-50 p-6 flex flex-col items-center">
                                    <TriangleAlert size={48} className="text-red-500 mb-2" />
                                    <h3 className="font-black text-red-700 text-xl uppercase">Rechazado</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <ul className="text-sm space-y-2 text-gray-600">
                                        <li className="flex gap-2"><span className="text-red-500">✖</span> Sin Código EAN (Barras)</li>
                                        <li className="flex gap-2"><span className="text-red-500">✖</span> Sin Peso/Volumen</li>
                                        <li className="flex gap-2"><span className="text-red-500">✖</span> Nombre Genérico</li>
                                    </ul>
                                    <div className="mt-4 bg-gray-100 p-3 rounded text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Destino</span>
                                        <p className="font-bold text-gray-700">No sube a Web ⛔</p>
                                    </div>
                                </div>
                            </div>

                            {/* YELLOW */}
                            <div className="bg-white rounded-xl shadow-lg border-t-8 border-yellow-400 overflow-hidden">
                                <div className="bg-yellow-50 p-6 flex flex-col items-center">
                                    <Clock size={48} className="text-yellow-500 mb-2" />
                                    <h3 className="font-black text-yellow-700 text-xl uppercase">Pendiente</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <ul className="text-sm space-y-2 text-gray-600">
                                        <li className="flex gap-2"><span className="text-green-500">✔</span> Data Maestra (SAP) OK</li>
                                        <li className="flex gap-2"><span className="text-yellow-500">!</span> Falta Foto Alta Calidad</li>
                                        <li className="flex gap-2"><span className="text-yellow-500">!</span> Falta Desc. Comercial</li>
                                    </ul>
                                    <div className="mt-4 bg-gray-100 p-3 rounded text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Destino</span>
                                        <p className="font-bold text-gray-700">Sube Oculto 🙈</p>
                                    </div>
                                </div>
                            </div>

                            {/* GREEN */}
                            <div className="bg-white rounded-xl shadow-lg border-t-8 border-green-500 overflow-hidden transform md:-translate-y-4 md:scale-105 transition-transform">
                                <div className="bg-green-50 p-6 flex flex-col items-center">
                                    <CircleCheck size={48} className="text-green-500 mb-2" />
                                    <h3 className="font-black text-green-700 text-xl uppercase">Aprobado</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <ul className="text-sm space-y-2 text-gray-600">
                                        <li className="flex gap-2"><span className="text-green-500">✔</span> Data Logística 100%</li>
                                        <li className="flex gap-2"><span className="text-green-500">✔</span> Fotos HD + EAN</li>
                                        <li className="flex gap-2"><span className="text-green-500">✔</span> Naming Estandarizado</li>
                                    </ul>
                                    <div className="mt-4 bg-green-100 p-3 rounded text-center border border-green-200">
                                        <span className="text-[10px] font-bold text-green-600 uppercase">Destino</span>
                                        <p className="font-bold text-green-800">¡Venta Online! 🚀</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
