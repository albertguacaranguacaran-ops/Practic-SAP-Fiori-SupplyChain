import { useState } from 'react';
import {
    Play, CircleCheck, ChevronRight, BookOpen, Target,
    Trophy, ArrowRight, RefreshCw, X, CircleHelp,
    Package, ShoppingCart, Truck, Sparkles, Zap,
    ArrowUp, Clock, Star, Award
} from 'lucide-react';

/*
 * ══════════════════════════════════════════════════════════════
 *   /nTRAIN — INTERACTIVE SAP TRAINING CENTER (v3.0)
 *   Guided scenarios to learn critical transactions by doing
 * ══════════════════════════════════════════════════════════════
 */

const SCENARIOS = [
    {
        id: 'sc1',
        title: 'Verificar Disponibilidad',
        code: 'MMBE',
        emoji: '📦',
        desc: 'Un cliente llama preguntando por "Nevera Samsung". Verifica si tenemos stock para vender.',
        context: '🎯 Situación real: El teléfono suena. Un cliente pregunta cuántas neveras hay disponibles para comprar.',
        difficulty: 'Fácil',
        time: '2 min',
        icon: Package,
        gradient: 'from-blue-500 to-indigo-600',
        glowColor: 'shadow-blue-500/25',
        steps: [
            { text: 'Abre la transacción de stock', cmd: '/nMMBE', hint: 'MMBE = Material Management Balance/Stock. Es la transacción para ver inventarios.' },
            { text: 'Observa la tabla de materiales con su stock actual', action: 'search', hint: 'En SAP real, aquí ingresarías el número de material. En el simulador, los datos ya están visibles.' },
            { text: 'Ubica la columna "Stock Actual" y verifica cantidad disponible', action: 'check', hint: 'La columna "Stock Actual" muestra unidades en "Libre Utilización" — listas para vender.' },
            { text: '¡Listo! Confirma al cliente la cantidad disponible', action: 'confirm', hint: '✅ Si hay stock suficiente, puedes proceder a crear el pedido de venta con /nVA01.' }
        ]
    },
    {
        id: 'sc2',
        title: 'Entrada de Mercancía',
        code: 'MIGO',
        emoji: '🚛',
        desc: 'Llegó el camión con 50 Neveras. Regístralas en el sistema para que estén disponibles.',
        context: '🏭 Situación real: El almacén avisa que llegó un camión. Hay que registrar la entrada para actualizar el inventario.',
        difficulty: 'Medio',
        time: '5 min',
        icon: Truck,
        gradient: 'from-emerald-500 to-green-600',
        glowColor: 'shadow-green-500/25',
        steps: [
            { text: 'Inicia la transacción de movimientos', cmd: '/nMIGO', hint: 'MIGO = Movement In/Goods Out. Es la central de movimientos de almacén en SAP.' },
            { text: 'Selecciona la Orden de Compra pendiente', action: 'select_po', hint: 'Busca una OC con estatus "Liberada" o "Released". Solo estas se pueden recepcionar.' },
            { text: 'Verifica que la cantidad sea correcta', action: 'check_qty', hint: 'Siempre confirma la cantidad vs. el documento de transporte. Las diferencias generan reclamos.' },
            { text: 'Contabiliza la entrada (Post)', action: 'post', hint: '📄 Al contabilizar, SAP genera un Documento Material y actualiza el stock automáticamente.' }
        ]
    },
    {
        id: 'sc3',
        title: 'Crear Pedido de Venta',
        code: 'VA01',
        emoji: '🛒',
        desc: 'El cliente quiere comprar 2 Neveras. Crea el pedido para despachar.',
        context: '💼 Situación real: Ventas confirma que el cliente quiere 2 unidades. Necesitamos el pedido formal.',
        difficulty: 'Difícil',
        time: '8 min',
        icon: ShoppingCart,
        gradient: 'from-orange-500 to-red-500',
        glowColor: 'shadow-orange-500/25',
        steps: [
            { text: 'Ve a creación de pedidos', cmd: '/nVA01', hint: 'VA01 = Ventas/Pedido/Crear. Es el inicio del ciclo SD (Sales & Distribution).' },
            { text: 'Ingresa el cliente y selecciona el material', action: 'enter_data', hint: 'En SAP real necesitas: Clase de pedido (ZOR), Org. Ventas, Canal, y Sector.' },
            { text: 'Define cantidad: 2 unidades y verifica precio', action: 'qty', hint: 'SAP calcula automáticamente el precio desde la condición de precio (PR00 en EKKO).' },
            { text: 'Guarda el pedido para generar entrega', action: 'save', hint: '🎉 Al guardar, SAP genera un VBELN (número de pedido). Desde aquí puedes crear la entrega con /nVL01N.' }
        ]
    }
];

export default function Training({ onNavigate, onClose, activeScenario, onStartScenario, isOverlay, onQuit }) {
    const [step, setStep] = useState(0);
    const [completed, setCompleted] = useState({});
    const [showCelebration, setShowCelebration] = useState(false);

    const currentScenario = activeScenario;

    // Start scenario
    const startScenario = (sc) => {
        onStartScenario?.(sc);
        setStep(0);
    };

    // Quit
    const quitScenario = () => {
        onQuit?.();
        setStep(0);
    };

    // Next step
    const nextStep = () => {
        if (!activeScenario) return;
        if (step < activeScenario.steps.length - 1) {
            setStep(step + 1);
        } else {
            // Complete!
            setCompleted(prev => ({ ...prev, [activeScenario.id]: true }));
            setShowCelebration(true);
            setTimeout(() => {
                setShowCelebration(false);
                onQuit?.();
            }, 2500);
        }
    };

    // Auto-execute command
    const executeCommand = (cmd) => {
        onNavigate?.(cmd);
        // Auto-advance if this step had a cmd
        const curStepData = activeScenario?.steps[step];
        if (curStepData?.cmd === cmd) {
            setTimeout(() => nextStep(), 500);
        }
    };

    // ═══════════════════════════════════════════
    //  CELEBRATION SCREEN
    // ═══════════════════════════════════════════
    if (showCelebration) {
        return (
            <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl animate-bounce-in">
                    <div className="text-7xl mb-4">🎉</div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">¡Escenario Completado!</h2>
                    <p className="text-gray-500 mb-6">Has dominado {activeScenario?.title}. ¡Excelente trabajo!</p>
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                        <Trophy size={20} />
                        <span>+100 XP</span>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  OVERLAY — Active Training Guide
    // ═══════════════════════════════════════════
    if (isOverlay && currentScenario) {
        const s = currentScenario;
        const curStep = s.steps[step];
        const progressPct = ((step + 1) / s.steps.length) * 100;

        return (
            <div className="fixed inset-0 z-[60] pointer-events-none flex flex-col justify-end pb-6 px-4">
                {/* Pointing Arrow to Command Bar */}
                {curStep.cmd && (
                    <div className="pointer-events-none flex justify-center mb-2 animate-bounce">
                        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                            <ArrowUp size={16} /> Escribe <code className="bg-yellow-300 px-2 py-0.5 rounded font-mono">{curStep.cmd}</code> en la barra de comandos
                        </div>
                    </div>
                )}

                {/* Main Overlay Card */}
                <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl mx-auto overflow-hidden">

                    {/* Header with gradient */}
                    <div className={`bg-gradient-to-r ${s.gradient} text-white px-6 py-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">{s.emoji}</div>
                            <div>
                                <div className="text-white/70 text-xs font-bold uppercase tracking-widest">
                                    Entrenamiento Activo — {s.code}
                                </div>
                                <h3 className="font-bold text-lg">{s.title}</h3>
                            </div>
                        </div>
                        <button onClick={quitScenario} className="text-white/50 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step Timeline */}
                    <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-1">
                        {s.steps.map((st, i) => (
                            <div key={i} className="flex items-center gap-1 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < step ? 'bg-green-500 text-white scale-90' :
                                        i === step ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-110' :
                                            'bg-gray-200 text-gray-400'
                                    }`}>
                                    {i < step ? <CircleCheck size={16} /> : i + 1}
                                </div>
                                {i < s.steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded transition-all duration-500 ${i < step ? 'bg-green-400' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex gap-5">
                            {/* Step Number - Large */}
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-600/30">
                                    {step + 1}
                                </div>
                            </div>

                            {/* Instruction */}
                            <div className="flex-1 space-y-3">
                                <h4 className="text-xl font-black text-gray-900">
                                    {curStep.text}
                                </h4>

                                {/* SAP Tip */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-blue-800 text-sm flex items-start gap-3">
                                    <BookOpen size={18} className="mt-0.5 flex-shrink-0 text-blue-500" />
                                    <div>
                                        <p className="font-bold text-blue-700 mb-1">💡 Tip SAP:</p>
                                        <p>{curStep.hint}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                        <Clock size={12} />
                                        Paso {step + 1} de {s.steps.length}
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={quitScenario} className="text-gray-400 hover:text-gray-600 text-sm font-medium px-4 py-2 cursor-pointer">
                                            Salir
                                        </button>

                                        {curStep.cmd ? (
                                            <button
                                                onClick={() => executeCommand(curStep.cmd)}
                                                className={`bg-gradient-to-r ${s.gradient} text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse-subtle`}
                                            >
                                                <Zap size={16} /> Ejecutar {curStep.cmd}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={nextStep}
                                                className="bg-gray-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                            >
                                                {step === s.steps.length - 1 ? (
                                                    <><Trophy size={16} /> Completar</>
                                                ) : (
                                                    <>Siguiente <ChevronRight size={18} /></>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  SCENARIO SELECTOR — Mission Control
    // ═══════════════════════════════════════════
    const completedCount = Object.keys(completed).length;
    const totalXP = completedCount * 100;

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 px-8 pt-8 pb-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Trophy size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                Centro de Entrenamiento SAP
                            </h1>
                            <p className="text-blue-300/80 text-sm font-medium mt-1">
                                Aprende haciendo — Practica transacciones reales paso a paso
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* XP Counter */}
                        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
                            <Star size={20} className="text-yellow-400" />
                            <div>
                                <div className="text-yellow-400 font-black text-lg leading-none">{totalXP} XP</div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Progreso</div>
                            </div>
                        </div>
                        {/* Progress */}
                        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
                            <Award size={20} className="text-emerald-400" />
                            <div>
                                <div className="text-emerald-400 font-black text-lg leading-none">{completedCount}/{SCENARIOS.length}</div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Completados</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                            <X size={24} className="text-white/40 hover:text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 overflow-auto px-8 pb-8">
                <div className="max-w-6xl mx-auto">

                    {/* Context Banner */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-8 flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <Sparkles size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">¿Cómo funciona?</h3>
                            <p className="text-white/50 text-sm">
                                Elige un escenario → Sigue los pasos guiados → El sistema te lleva por cada transacción SAP con explicaciones
                            </p>
                        </div>
                    </div>

                    {/* Scenario Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {SCENARIOS.map((sc, idx) => {
                            const Icon = sc.icon || CircleHelp;
                            const isDone = completed[sc.id];

                            return (
                                <div
                                    key={sc.id}
                                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    {/* Top Gradient Bar */}
                                    <div className={`h-1.5 bg-gradient-to-r ${sc.gradient}`} />

                                    {/* Emoji Hero */}
                                    <div className="px-6 pt-8 pb-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${sc.gradient} shadow-xl ${sc.glowColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <span className="text-4xl">{sc.emoji}</span>
                                        </div>

                                        {isDone && (
                                            <div className="absolute top-4 right-4 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                                <CircleCheck size={18} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="px-6 pb-6 flex-1 flex flex-col">
                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${sc.difficulty === 'Fácil' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    sc.difficulty === 'Medio' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}>
                                                {sc.difficulty}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/50 border border-white/10">
                                                <Clock size={10} className="inline mr-1" />{sc.time}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/50 border border-white/10">
                                                {sc.steps.length} pasos
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-300 transition-colors">
                                            {sc.title}
                                        </h3>
                                        <div className="text-blue-400/60 text-xs font-mono font-bold mb-3">{sc.code}</div>

                                        {/* Description */}
                                        <p className="text-white/40 text-sm mb-4 flex-1 leading-relaxed">
                                            {sc.desc}
                                        </p>

                                        {/* Context */}
                                        <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/5">
                                            <p className="text-white/50 text-xs leading-relaxed">{sc.context}</p>
                                        </div>

                                        {/* Steps Preview */}
                                        <div className="mb-5 space-y-1.5">
                                            {sc.steps.map((st, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                                                        }`}>
                                                        {isDone ? <CircleCheck size={10} /> : i + 1}
                                                    </div>
                                                    <span className="truncate">{st.text}</span>
                                                    {st.cmd && <code className="text-blue-400/50 text-[10px] ml-auto">{st.cmd}</code>}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => startScenario(sc)}
                                            className={`w-full bg-gradient-to-r ${sc.gradient} text-white py-3 rounded-xl text-sm font-bold shadow-lg ${sc.glowColor} hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:brightness-110`}
                                        >
                                            {isDone ? (
                                                <><RefreshCw size={16} /> Repetir Escenario</>
                                            ) : (
                                                <><Play size={16} /> Comenzar Entrenamiento</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 border-t border-white/5 p-4 text-center">
                <p className="text-white/20 text-xs">Dataelectric SAP Training Simulator v3.0 — Aprende haciendo</p>
            </div>
        </div>
    );
}
