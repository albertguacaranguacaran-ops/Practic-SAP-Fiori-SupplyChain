import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Maximize2, Minimize2,
    CheckCircle, AlertTriangle, Package, Users, BarChart3,
    Target, Briefcase, Tag, ClipboardList, Calendar,
    Database, TrendingUp, ArrowRight, Zap, Shield,
    Layers, BookOpen, Play
} from 'lucide-react';

// ========== SLIDE DATA ==========
function buildSlides(metrics) {
    return [
        // ===== SLIDE 0: TITLE =====
        {
            id: 'title',
            layout: 'hero',
            bg: 'from-[#0854A0] via-[#0A6ED1] to-[#354A5F]',
            content: {
                overtitle: 'DATAELECTRIC — SAP S/4HANA Training Simulator',
                title: 'Plan de Gestión de Datos Maestros',
                subtitle: 'Coordinador Supply Chain — Daka Venezuela',
                caption: 'Estrategia de limpieza, estandarización y control de +36,000 materiales',
                footer: 'Febrero 2026'
            }
        },

        // ===== SLIDE 1: THE PROBLEM =====
        {
            id: 'problem',
            layout: 'cards',
            bg: 'from-[#1a1a2e] to-[#16213e]',
            content: {
                overtitle: 'EL DESAFÍO',
                title: '¿Cuál es el problema actual?',
                subtitle: 'Cada campo vacío en SAP es un riesgo operacional que cuesta dinero',
                cards: [
                    {
                        icon: '🔴', value: metrics.sinEAN.toLocaleString(),
                        label: 'Sin Código EAN',
                        desc: 'No se pueden escanear en punto de venta. Ventas perdidas.',
                        color: '#EF4444'
                    },
                    {
                        icon: '🟠', value: metrics.sinPeso.toLocaleString(),
                        label: 'Sin Peso / Dimensiones',
                        desc: 'No se puede calcular flete ni cubicaje. Sobrecostos.',
                        color: '#F59E0B'
                    },
                    {
                        icon: '🟡', value: metrics.sinReorden.toLocaleString(),
                        label: 'Sin Punto de Reorden',
                        desc: 'SAP no alerta cuando hay que comprar. Quiebres de stock.',
                        color: '#EAB308'
                    },
                    {
                        icon: '🟣', value: metrics.sinDesc.toLocaleString(),
                        label: 'Sin Descripción',
                        desc: 'Nadie sabe qué es. Genera duplicados y confusión.',
                        color: '#8B5CF6'
                    }
                ]
            }
        },

        // ===== SLIDE 2: THE SOLUTION =====
        {
            id: 'solution',
            layout: 'split',
            bg: 'from-[#0854A0] to-[#0A6ED1]',
            content: {
                overtitle: 'LA SOLUCIÓN',
                title: 'Un simulador para aprender y planificar',
                left: {
                    title: 'Lo que construimos',
                    items: [
                        { icon: '📋', text: 'Plan Maestro con naming y cedulación (/nPLAN)' },
                        { icon: '👥', text: 'Centro de Operaciones del Equipo (/nTEAM)' },
                        { icon: '🔗', text: 'Data Browser con JOINs diagnósticos (/nSE16N)' },
                        { icon: '📊', text: 'Gestor de códigos EAN múltiples (/nEAN)' },
                        { icon: '🚀', text: 'Tablero estratégico E-commerce (/nECOMM)' },
                        { icon: '📈', text: 'Monitor MRP y disponibilidad (/nMD04)' },
                    ]
                },
                right: {
                    title: '¿Por qué un simulador?',
                    items: [
                        'Practicar sin tocar datos reales de producción',
                        'Entender cada transacción SAP antes de usarla',
                        'Probar estrategias de limpieza de datos',
                        'Entrenar al equipo en un entorno seguro',
                        'Demostrar resultados antes de implementar',
                    ]
                }
            }
        },

        // ===== SLIDE 3: NAMING =====
        {
            id: 'naming',
            layout: 'comparison',
            bg: 'from-[#16213e] to-[#1a1a2e]',
            content: {
                overtitle: 'ESTÁNDAR #1',
                title: 'Convención de Nombres (Naming)',
                subtitle: 'Un material bien descrito se encuentra, se compra y se vende sin confusión',
                comparisons: [
                    {
                        bad: 'nevera gris',
                        good: 'REFRIGERADOR SAMSUNG RT38 380L INOX',
                        rule: 'TIPO + MARCA + MODELO + CAPACIDAD + ACABADO'
                    },
                    {
                        bad: 'cable',
                        good: 'CABLE ELECTRICO THW 12AWG 100M',
                        rule: 'TIPO + ESPECIFICACIÓN + CALIBRE + LONGITUD'
                    },
                    {
                        bad: 'tubo',
                        good: 'TUBO PVC 1/2" SCH40 6M PAVCO',
                        rule: 'MATERIAL + MEDIDA + CLASIFICACIÓN + LARGO + MARCA'
                    }
                ],
                rules: [
                    'TODO en MAYÚSCULAS',
                    'Sin acentos ni ñ (SAP)',
                    'Máximo 40 caracteres',
                    'Nunca abreviar innecesariamente',
                    'Incluir unidad de medida',
                ]
            }
        },

        // ===== SLIDE 4: CEDULACIÓN =====
        {
            id: 'cedula',
            layout: 'steps',
            bg: 'from-[#0854A0] via-[#0A6ED1] to-[#1873CC]',
            content: {
                overtitle: 'PROCESO CLAVE',
                title: 'Cedulación — 7 pasos para dar identidad a cada material',
                subtitle: 'Sin cédula completa, un material no puede operar en SAP',
                steps: [
                    { num: 1, title: 'Solicitud', who: 'Compras', icon: '📝' },
                    { num: 2, title: 'Validar Duplicados', who: 'Master Data', icon: '🔍' },
                    { num: 3, title: 'Crear Material (MM01)', who: 'Master Data', icon: '🏗️' },
                    { num: 4, title: 'Asignar EAN', who: 'Master Data', icon: '📊' },
                    { num: 5, title: 'Peso y Empaque', who: 'Ing. Empaque', icon: '📦' },
                    { num: 6, title: 'Parametrizar MRP', who: 'Compras', icon: '⚙️' },
                    { num: 7, title: 'Verificación Final', who: 'Coordinador (TÚ)', icon: '✅' },
                ]
            }
        },

        // ===== SLIDE 5: TEAM =====
        {
            id: 'team',
            layout: 'team',
            bg: 'from-[#16213e] to-[#0f3460]',
            content: {
                overtitle: 'ESTRUCTURA',
                title: 'Equipo Supply Chain — Daka',
                members: [
                    {
                        role: 'Coordinador Supply Chain',
                        name: 'TÚ',
                        color: '#0854A0',
                        tasks: ['Estrategia y KPIs', 'Decisiones de compra', 'Supervisión del equipo', 'Reportes a gerencia'],
                        highlight: true
                    },
                    {
                        role: 'Analista de Datos 1',
                        name: 'Enfoque: Calidad de Datos',
                        color: '#107E3E',
                        tasks: ['Limpiar EANs y descripciones', 'Eliminar duplicados', 'Validar precios'],
                        highlight: false
                    },
                    {
                        role: 'Analista de Datos 2',
                        name: 'Enfoque: Inventarios',
                        color: '#E9730C',
                        tasks: ['Gestionar puntos de reorden', 'Monitorear stock', 'Alertas de quiebre'],
                        highlight: false
                    },
                    {
                        role: 'Ingeniero de Empaque',
                        name: 'Enfoque: Logística',
                        color: '#6F42C1',
                        tasks: ['Medir y pesar productos', 'Calcular cubicaje', 'Optimizar empaque'],
                        highlight: false
                    }
                ]
            }
        },

        // ===== SLIDE 6: 30-60-90 PLAN =====
        {
            id: 'plan',
            layout: 'timeline',
            bg: 'from-[#0854A0] to-[#354A5F]',
            content: {
                overtitle: 'ROADMAP',
                title: 'Plan de Acción 30-60-90 Días',
                phases: [
                    {
                        name: 'Días 1-30', label: 'DIAGNÓSTICO', icon: '🔍', color: '#EF4444',
                        tasks: [
                            'Exportar master data completa',
                            'Contar materiales con campos vacíos',
                            'Identificar duplicados y EANs faltantes',
                            'Presentar diagnóstico con números reales'
                        ],
                        deliverable: 'Informe diagnóstico + Plan priorizado'
                    },
                    {
                        name: 'Días 31-60', label: 'LIMPIEZA', icon: '🧹', color: '#F59E0B',
                        tasks: [
                            'Corregir 500 materiales más vendidos',
                            'Asignar EANs faltantes (Cat. A)',
                            'Completar pesos y dimensiones',
                            'Implementar naming convention'
                        ],
                        deliverable: '500+ materiales corregidos'
                    },
                    {
                        name: 'Días 61-90', label: 'OPTIMIZACIÓN', icon: '🚀', color: '#22C55E',
                        tasks: [
                            'Control semanal automatizado',
                            'Reportes de calidad de data',
                            'Optimizar puntos de reorden',
                            'Presentar antes vs después'
                        ],
                        deliverable: 'Proceso sostenible implementado'
                    }
                ]
            }
        },

        // ===== SLIDE 7: LIVE DATA =====
        {
            id: 'live',
            layout: 'metrics',
            bg: 'from-[#16213e] to-[#1a1a2e]',
            content: {
                overtitle: 'DATOS EN VIVO',
                title: 'Estado Actual del Simulador',
                subtitle: `${metrics.total.toLocaleString()} materiales cargados — métricas calculadas en tiempo real`,
                metrics: [
                    { label: 'Total Materiales', value: metrics.total.toLocaleString(), color: '#0854A0', pct: 100 },
                    { label: 'Con EAN', value: (metrics.total - metrics.sinEAN).toLocaleString(), color: '#22C55E', pct: ((metrics.total - metrics.sinEAN) / metrics.total * 100) },
                    { label: 'Con Peso', value: (metrics.total - metrics.sinPeso).toLocaleString(), color: '#3B82F6', pct: ((metrics.total - metrics.sinPeso) / metrics.total * 100) },
                    { label: 'Con Reorden', value: (metrics.total - metrics.sinReorden).toLocaleString(), color: '#8B5CF6', pct: ((metrics.total - metrics.sinReorden) / metrics.total * 100) },
                ],
                actions: [
                    { label: 'Ver datos completos', tx: '/nSE16N' },
                    { label: 'Ver plan detallado', tx: '/nPLAN' },
                    { label: 'Ver equipo', tx: '/nTEAM' },
                ]
            }
        },

        // ===== SLIDE 8: CLOSING =====
        {
            id: 'closing',
            layout: 'hero',
            bg: 'from-[#0854A0] via-[#0A6ED1] to-[#107E3E]',
            content: {
                overtitle: 'SIGUIENTE PASO',
                title: '¿Qué necesitamos?',
                subtitle: 'Con acceso al sistema productivo, este plan se ejecuta en 90 días',
                caption: '• Acceso a SAP MM y SE16N • Permisos de lectura en MARA, MAKT, MARC, MARD • Apoyo para el equipo de 3 personas',
                footer: 'Dataelectric — Supply Chain Management — 2026'
            }
        },
    ];
}

export default function Presentation({ materials = [], onNavigate, onClose }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [animating, setAnimating] = useState(false);

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

    const slides = useMemo(() => buildSlides(metrics), [metrics]);

    const goTo = useCallback((idx) => {
        if (idx >= 0 && idx < slides.length && !animating) {
            setAnimating(true);
            setCurrentSlide(idx);
            setTimeout(() => setAnimating(false), 400);
        }
    }, [slides.length, animating]);

    // Keyboard nav
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(currentSlide + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentSlide - 1); }
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentSlide, goTo, onClose]);

    const slide = slides[currentSlide];

    const handleTxClick = (tx) => {
        if (tx && onNavigate) {
            onClose?.();
            setTimeout(() => onNavigate(tx), 150);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            {/* ===== SLIDE CONTENT ===== */}
            <div
                className={`flex-1 flex items-center justify-center bg-gradient-to-br ${slide.bg} transition-all duration-500 overflow-hidden relative`}
                key={slide.id}
            >
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

                <div className="relative z-10 w-full max-w-6xl mx-auto px-10 py-8 animate-[fadeIn_0.5s_ease-out]">

                    {/* ===== HERO LAYOUT ===== */}
                    {slide.layout === 'hero' && (
                        <div className="text-center space-y-6">
                            <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                            <h1 className="text-5xl font-black text-white leading-tight">{slide.content.title}</h1>
                            <p className="text-xl text-white/80 max-w-2xl mx-auto">{slide.content.subtitle}</p>
                            {slide.content.caption && (
                                <p className="text-sm text-white/50 max-w-xl mx-auto mt-4 leading-relaxed">{slide.content.caption}</p>
                            )}
                            {slide.content.footer && (
                                <p className="text-xs text-white/30 mt-8 tracking-wider">{slide.content.footer}</p>
                            )}
                        </div>
                    )}

                    {/* ===== CARDS LAYOUT (Problem) ===== */}
                    {slide.layout === 'cards' && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                                <p className="text-base text-white/60 mt-2">{slide.content.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
                                {slide.content.cards.map((card, i) => (
                                    <div
                                        key={i}
                                        className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors text-center"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <span className="text-3xl">{card.icon}</span>
                                        <div className="text-4xl font-black mt-3" style={{ color: card.color }}>{card.value}</div>
                                        <div className="text-sm font-bold text-white mt-1">{card.label}</div>
                                        <p className="text-xs text-white/50 mt-2 leading-relaxed">{card.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== SPLIT LAYOUT (Solution) ===== */}
                    {slide.layout === 'split' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mt-6">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <Zap size={18} className="text-yellow-400" /> {slide.content.left.title}
                                    </h3>
                                    <div className="space-y-3">
                                        {slide.content.left.items.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 text-white/90">
                                                <span className="text-lg">{item.icon}</span>
                                                <span className="text-sm">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <Shield size={18} className="text-green-400" /> {slide.content.right.title}
                                    </h3>
                                    <div className="space-y-3">
                                        {slide.content.right.items.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 text-white/80">
                                                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== COMPARISON LAYOUT (Naming) ===== */}
                    {slide.layout === 'comparison' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                                <p className="text-base text-white/60 mt-2">{slide.content.subtitle}</p>
                            </div>
                            <div className="space-y-4 mt-6">
                                {slide.content.comparisons.map((c, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="text-xs text-white/40 uppercase mb-1">Antes (MAL)</div>
                                            <div className="text-lg font-mono bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30 line-through">
                                                {c.bad}
                                            </div>
                                        </div>
                                        <ArrowRight size={24} className="text-white/30 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-xs text-white/40 uppercase mb-1">Después (BIEN)</div>
                                            <div className="text-lg font-mono bg-green-500/20 text-green-300 px-3 py-1.5 rounded-lg border border-green-500/30 font-bold">
                                                {c.good}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-xs text-white/50 italic pl-4 border-l border-white/10">
                                            {c.rule}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 justify-center mt-4 flex-wrap">
                                {slide.content.rules.map((r, i) => (
                                    <span key={i} className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== STEPS LAYOUT (Cedulación) ===== */}
                    {slide.layout === 'steps' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-3xl font-black text-white mt-2">{slide.content.title}</h2>
                                <p className="text-base text-white/60 mt-2">{slide.content.subtitle}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-8">
                                {slide.content.steps.map((s, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center w-36 hover:bg-white/15 transition-colors">
                                            <span className="text-3xl">{s.icon}</span>
                                            <div className="text-white font-bold text-xs mt-2">{s.title}</div>
                                            <div className="text-[10px] text-white/50 mt-1">{s.who}</div>
                                            <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center mx-auto mt-2">
                                                {s.num}
                                            </div>
                                        </div>
                                        {i < slide.content.steps.length - 1 && (
                                            <ChevronRight size={16} className="text-white/30 mx-1 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== TEAM LAYOUT ===== */}
                    {slide.layout === 'team' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-8">
                                {slide.content.members.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-2xl p-5 border text-center ${m.highlight ? 'bg-white/20 border-white/30 ring-2 ring-yellow-400/50' : 'bg-white/10 border-white/10'}`}
                                    >
                                        <div
                                            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-white shadow-lg"
                                            style={{ backgroundColor: m.color }}
                                        >
                                            {m.highlight ? '👤' : m.role.charAt(0)}
                                        </div>
                                        <h3 className="font-bold text-white text-sm mt-3">{m.role}</h3>
                                        <p className="text-xs text-white/50 mt-0.5">{m.name}</p>
                                        <div className="mt-3 space-y-1.5">
                                            {m.tasks.map((t, j) => (
                                                <div key={j} className="text-[11px] text-white/70 flex items-start gap-1.5">
                                                    <CheckCircle size={10} className="text-green-400 mt-0.5 flex-shrink-0" />
                                                    {t}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== TIMELINE LAYOUT (30-60-90) ===== */}
                    {slide.layout === 'timeline' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-5 mt-8">
                                {slide.content.phases.map((p, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                                        <div className="p-4 text-center" style={{ backgroundColor: p.color + '30' }}>
                                            <span className="text-3xl">{p.icon}</span>
                                            <h3 className="font-black text-white text-lg mt-1">{p.name}</h3>
                                            <span
                                                className="inline-block text-[10px] font-bold px-3 py-0.5 rounded-full mt-1"
                                                style={{ backgroundColor: p.color, color: 'white' }}
                                            >
                                                {p.label}
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {p.tasks.map((t, j) => (
                                                <div key={j} className="text-xs text-white/80 flex items-start gap-2">
                                                    <ChevronRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: p.color }} />
                                                    {t}
                                                </div>
                                            ))}
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="text-[10px] text-white/40 uppercase">Entregable:</div>
                                                <div className="text-xs text-white/70 font-medium mt-0.5">{p.deliverable}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== METRICS LAYOUT (Live Data) ===== */}
                    {slide.layout === 'metrics' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/50 tracking-[0.3em] uppercase">{slide.content.overtitle}</p>
                                <h2 className="text-4xl font-black text-white mt-2">{slide.content.title}</h2>
                                <p className="text-base text-white/60 mt-2">{slide.content.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-5 mt-8">
                                {slide.content.metrics.map((m, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                                        <div className="text-4xl font-black" style={{ color: m.color }}>{m.value}</div>
                                        <div className="text-sm text-white/80 font-medium mt-1">{m.label}</div>
                                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${m.pct.toFixed(0)}%`, backgroundColor: m.color }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-white/40 mt-1">{m.pct.toFixed(1)}%</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-3 mt-6">
                                {slide.content.actions.map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleTxClick(a.tx)}
                                        className="text-xs bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg border border-white/20 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                        <Play size={12} /> {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== BOTTOM CONTROLS ===== */}
            <div className="bg-black/80 backdrop-blur-md px-6 py-3 flex items-center justify-between border-t border-white/10">
                {/* Slide counter */}
                <div className="text-sm text-white/50 font-mono w-32">
                    {currentSlide + 1} / {slides.length}
                </div>

                {/* Dot indicators */}
                <div className="flex items-center gap-2">
                    {slides.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${i === currentSlide
                                ? 'w-8 h-2 bg-white'
                                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                }`}
                            title={s.id}
                        />
                    ))}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center gap-2 w-32 justify-end">
                    <button
                        onClick={() => goTo(currentSlide - 1)}
                        disabled={currentSlide === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => goTo(currentSlide + 1)}
                        disabled={currentSlide === slides.length - 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-2 text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                    >
                        ESC
                    </button>
                </div>
            </div>

            {/* Keyframe animation */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
