import { useState, useMemo } from 'react';
import {
    Play, CircleCheck, ChevronRight, BookOpen, Target,
    Trophy, TriangleAlert, ArrowRight, RefreshCw, X, CircleHelp,
    Package, ShoppingCart, Truck
} from 'lucide-react';

/*
 * ══════════════════════════════════════════════════════════════
 *   /nTRAIN — INTERACTIVE SAP TRAINING CENTER
 *   Guided scenarios to learn critical transactions by doing
 * ══════════════════════════════════════════════════════════════
 */

const SCENARIOS = [
    {
        id: 'sc1',
        title: 'Verificar Disponibilidad',
        code: 'MMBE',
        desc: 'Un cliente llama preguntando por "Nevera Samsung". Verifica si tenemos stock para vender.',
        difficulty: 'Fácil',
        time: '2 min',
        icon: Package,
        color: '#2563EB', // Blue
        steps: [
            { text: 'Abre la transacción de stock', cmd: '/nMMBE' },
            { text: 'Busca el material "NEVERA SAMSUNG"', action: 'search' },
            { text: 'Verifica la columna "Libre Utilización"', action: 'check' },
            { text: 'Confirma al cliente la cantidad disponible', action: 'confirm' }
        ]
    },
    {
        id: 'sc2',
        title: 'Entrada de Mercancía',
        code: 'MIGO',
        desc: 'Llegó el camión con 50 Neveras. Regístralas en el sistema para que estén disponibles.',
        difficulty: 'Medio',
        time: '5 min',
        icon: Truck,
        color: '#16A34A', // Green
        steps: [
            { text: 'Inicia la transacción de movimientos', cmd: '/nMIGO' },
            { text: 'Selecciona la Orden de Compra pendiente', action: 'select_po' },
            { text: 'Verifica que la cantidad sea 50 unidades', action: 'check_qty' },
            { text: 'Contabiliza la entrada (Post)', action: 'post' }
        ]
    },
    {
        id: 'sc3',
        title: 'Crear Pedido de Venta',
        code: 'VA01',
        desc: 'El cliente quiere comprar 2 Neveras. Crea el pedido para despachar.',
        difficulty: 'Difícil',
        time: '8 min',
        icon: ShoppingCart,
        color: '#EA580C', // Orange
        steps: [
            { text: 'Ve a creación de pedidos', cmd: '/nVA01' },
            { text: 'Ingresa el cliente y material', action: 'enter_data' },
            { text: 'Define cantidad: 2 unidades', action: 'qty' },
            { text: 'Guarda el pedido para generar entrega', action: 'save' }
        ]
    }
];

export default function Training({ onNavigate, onClose, activeScenario, onStartScenario, isOverlay, onQuit }) {
    const [step, setStep] = useState(0);
    const [completed, setCompleted] = useState({}); // { sc1: true }

    // Use prop if available, otherwise local state (for standalone testing)
    const currentScenario = activeScenario;

    // Start a scenario (delegated to parent)
    const startScenario = (sc) => {
        onStartScenario?.(sc);
        setStep(0);
    };

    // Quit current scenario
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
            // Complete
            setCompleted(prev => ({ ...prev, [activeScenario.id]: true }));
            setCompleted(prev => ({ ...prev, [currentScenario.id]: true }));
            onQuit?.(); // Also quit the overlay
        }
    };

    // Auto-progress if command matches
    const handleCommand = (cmd) => {
        if (!currentScenario) {
            onNavigate?.(cmd); // Normal navigation
            return;
        }

        const currentStepData = currentScenario.steps[step];
        // If step requires a specific command (e.g. /nMMBE)
        if (currentStepData.cmd && currentStepData.cmd === cmd) {
            // Execute command but keep overlay
            onNavigate?.(cmd);
            nextStep();
        } else {
            // Just navigate
            onNavigate?.(cmd);
        }
    };

    // Render detailed scenario view (overlay guide)
    if (isOverlay && currentScenario) {
        const s = currentScenario;
        const curStep = s.steps[step];
        const progress = ((step) / s.steps.length) * 100;

        return (
            <div className="fixed inset-0 z-[60] pointer-events-none flex flex-col justify-end pb-12 px-8">
                {/* Overlay UI - positioned at bottom to not block SAP headers */}
                <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-auto overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <Target size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white/90 uppercase tracking-wider">Entrenamiento Activo</h3>
                                <p className="font-bold text-lg">{s.title}</p>
                            </div>
                        </div>
                        <button onClick={quitScenario} className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="h-1 bg-gray-100 w-full">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((step + 1) / s.steps.length) * 100}%` }} />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex gap-6">
                            {/* Step Number */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full border-4 border-blue-100 text-blue-600 flex items-center justify-center font-black text-xl bg-white relative z-10">
                                    {step + 1}
                                </div>
                                <div className="w-0.5 bg-blue-100 h-full -mt-2 absolute" />
                            </div>

                            {/* Instruction */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-1">Paso {step + 1}: {curStep.text}</h4>
                                    <p className="text-gray-500 text-sm">
                                        {curStep.cmd ? `Escribe "${curStep.cmd}" en la barra de comandos.` : 'Realiza la acción en pantalla para continuar.'}
                                    </p>
                                </div>

                                {/* Hints / Action Button */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-blue-800 text-sm flex items-start gap-3">
                                    <BookOpen size={18} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p><strong>Tip SAP:</strong> {curStep.cmd ? `Las transacciones siempre empiezan con /n.` : `Busca el botón en la barra de herramientas.`}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={quitScenario} className="text-gray-400 hover:text-gray-600 text-sm font-medium px-4 py-2 cursor-pointer">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                        {step === s.steps.length - 1 ? 'Finalizar' : 'Siguiente Paso'} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // Render Scenario Selector (Mission Control)
    return (
        <div className="fixed inset-0 z-50 bg-[#F0F2F5] flex flex-col">
            {/* Header */}
            <div className="bg-[#0f172a] text-white px-8 py-6 shadow-lg relative z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <Trophy size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Centro de Entrenamiento SAP</h1>
                            <p className="text-blue-200 text-sm font-medium">Aprende haciendo — Simulador práctico Daka</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                        <X size={24} className="text-white/60 hover:text-white" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SCENARIOS.map((sc) => {
                        const Icon = sc.icon || CircleHelp;
                        const isDone = completed[sc.id];

                        return (
                            <div
                                key={sc.id}
                                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Active Strip */}
                                <div className="h-1.5 w-full" style={{ backgroundColor: sc.color }} />

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl transition-colors ${isDone ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                            {isDone ? <CircleCheck size={24} /> : <Icon size={24} />}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${sc.difficulty === 'Fácil' ? 'bg-green-50 text-green-600 border-green-100' :
                                            sc.difficulty === 'Medio' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            {sc.difficulty}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                                        {sc.code} — {sc.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 flex-1 dark:text-gray-400">
                                        {sc.desc}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <RefreshCw size={12} /> {sc.time} aprox
                                        </div>
                                        <button
                                            onClick={() => startScenario(sc)}
                                            className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-600 transition-all cursor-pointer flex items-center gap-2"
                                        >
                                            {isDone ? 'Repetir' : 'Iniciar'} <Play size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t p-4 text-center text-xs text-gray-400">
                Dataelectric SAP Training Simulator v2.0
            </div>
        </div>
    );
}
