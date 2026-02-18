import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
    ArrowRight, Zap, Play, X
} from 'lucide-react';

/*
 * ══════════════════════════════════════════════════════════════
 *   WORLD-CLASS PRESENTATION — /nPRES
 *   Standards applied:
 *   • McKinsey: Pyramid Principle, action titles, SCR flow
 *   • Apple:    1 idea per slide, 3-second comprehension
 *   • 2025:    Bold minimalism, big numbers, contrast
 * ══════════════════════════════════════════════════════════════
 */

// =============================================
//  SLIDE DATA BUILDER
// =============================================
function buildSlides(m) {
    const pctSinEAN = m.total ? ((m.sinEAN / m.total) * 100).toFixed(0) : 0;
    const pctSinPeso = m.total ? ((m.sinPeso / m.total) * 100).toFixed(0) : 0;
    const pctSinReorden = m.total ? ((m.sinReorden / m.total) * 100).toFixed(0) : 0;
    const costoFlete = (m.sinPeso * 0.15 * 12).toFixed(0); // Estimated annual impact

    return [
        // ── 0  OPENING ──────────────────────────────────
        {
            id: 'opening', layout: 'bigText',
            bg: 'from-[#0f172a] to-[#1e293b]',
            line1: 'DATAELECTRIC',
            line2: 'Plan de Gestión de Datos Maestros',
            line3: 'Coordinador Supply Chain · Daka Venezuela · 2026',
        },

        // ── 1  THE NUMBER ─────────────────────────────────
        {
            id: 'theNumber', layout: 'bigNumber',
            bg: 'from-[#0f172a] to-[#1e293b]',
            number: m.total.toLocaleString(),
            label: 'materiales en el sistema',
            sub: '¿Cuántos están realmente listos para operar?',
        },

        // ── 2  SITUATION ─────────────────────────────────
        {
            id: 'situation', layout: 'statRow',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'La calidad de datos maestros compromete la operación',
            stats: [
                { big: `${pctSinEAN}%`, label: 'sin código EAN', sub: 'No se escanean en POS', color: '#EF4444' },
                { big: `${pctSinPeso}%`, label: 'sin peso/dimensiones', sub: 'Flete sin calcular', color: '#F59E0B' },
                { big: `${pctSinReorden}%`, label: 'sin punto de reorden', sub: 'Sin alertas de compra', color: '#8B5CF6' },
            ],
        },

        // ── 3  COMPLICATION — MONEY ─────────────────────
        {
            id: 'money', layout: 'bigNumber',
            bg: 'from-[#7f1d1d] to-[#991b1b]',
            number: `$${Number(costoFlete).toLocaleString()}`,
            label: 'costo estimado anual en sobrecostos de flete',
            sub: 'Porque no tenemos pesos ni dimensiones para calcular cubicaje',
        },

        // ── 4  THE FIX — BEFORE vs AFTER ─────────────────
        {
            id: 'naming', layout: 'contrast',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'Estandarizar la descripción elimina duplicados y confusión',
            before: [
                'nevera gris',
                'cable',
                'tubo',
            ],
            after: [
                'REFRIGERADOR SAMSUNG RT38 380L INOX',
                'CABLE ELECTRICO THW 12AWG 100M',
                'TUBO PVC 1/2" SCH40 6M PAVCO',
            ],
            rule: 'TIPO + MARCA + MODELO + ESPECIFICACIÓN + MEDIDA',
        },

        // ── 5  CEDULACIÓN ────────────────────────────────
        {
            id: 'cedula', layout: 'process',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: '7 pasos dan identidad completa a cada material',
            steps: [
                { n: '01', icon: '📝', name: 'Solicitud', who: 'Compras' },
                { n: '02', icon: '🔍', name: 'Validar', who: 'Master Data' },
                { n: '03', icon: '🏗️', name: 'Crear MM01', who: 'Master Data' },
                { n: '04', icon: '📊', name: 'Asignar EAN', who: 'Master Data' },
                { n: '05', icon: '📦', name: 'Empaque', who: 'Ing. Empaque' },
                { n: '06', icon: '⚙️', name: 'MRP', who: 'Compras' },
                { n: '07', icon: '✅', name: 'Verificar', who: 'TÚ' },
            ],
        },

        // ── 6  WHAT WE BUILT ─────────────────────────────
        {
            id: 'tools', layout: 'grid6',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'Construimos 6 herramientas que no existían',
            items: [
                { icon: '📋', title: 'Plan Maestro', code: '/nPLAN', desc: 'Naming + Cedulación + Plan 30-60-90' },
                { icon: '👥', title: 'Mi Equipo', code: '/nTEAM', desc: 'Roles, tareas y KPIs' },
                { icon: '🔗', title: 'Data Browser+', code: '/nSE16N', desc: 'JOINs diagnósticos + Tutorial' },
                { icon: '📊', title: 'Gestor EAN', code: '/nEAN', desc: 'Múltiples códigos de barra' },
                { icon: '🚀', title: 'E-commerce', code: '/nECOMM', desc: 'Tablero estratégico 36k SKU' },
                { icon: '📥', title: 'Importador', code: '/nIMPORT', desc: 'Cargar datos reales de SAP' },
            ],
        },

        // ── 7  TEAM ──────────────────────────────────────
        {
            id: 'team', layout: 'team4',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'Un equipo de 4 personas ejecuta el plan completo',
            members: [
                { role: 'Coordinador SCM', focus: 'Estrategia y KPIs', emoji: '🎯', you: true },
                { role: 'Analista Datos 1', focus: 'Calidad: EAN y descripciones', emoji: '🔍', you: false },
                { role: 'Analista Datos 2', focus: 'Inventarios y reorden', emoji: '📦', you: false },
                { role: 'Ing. Empaque', focus: 'Pesos, medidas, cubicaje', emoji: '📐', you: false },
            ],
        },

        // ── 8  30-60-90 ──────────────────────────────────
        {
            id: 'plan309060', layout: 'timeline3',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'En 90 días pasamos de diagnóstico a proceso sostenible',
            phases: [
                {
                    day: '1-30', label: 'DIAGNÓSTICO', color: '#EF4444',
                    tasks: ['Exportar master data', 'Identificar campos vacíos', 'Contar duplicados', 'Diagnóstico presentado'],
                },
                {
                    day: '31-60', label: 'LIMPIEZA', color: '#F59E0B',
                    tasks: ['Corregir top 500 materiales', 'Asignar EANs Cat. A', 'Completar pesos', 'Naming convention'],
                },
                {
                    day: '61-90', label: 'OPTIMIZACIÓN', color: '#22C55E',
                    tasks: ['Control semanal automático', 'Reportes de calidad', 'Puntos de reorden', 'Antes vs Después'],
                },
            ],
        },

        // ── 9  BEFORE vs AFTER PROJECTION ─────────────
        {
            id: 'projection', layout: 'barCompare',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'Proyección: de caos a control en 90 días',
            metrics: [
                { label: 'Con EAN', today: 100 - Number(pctSinEAN), target: 95, unit: '%' },
                { label: 'Con Peso', today: 100 - Number(pctSinPeso), target: 90, unit: '%' },
                { label: 'Con Reorden', today: 100 - Number(pctSinReorden), target: 85, unit: '%' },
            ],
        },

        // ── 10  THE ASK ──────────────────────────────────
        {
            id: 'ask', layout: 'bigText',
            bg: 'from-[#0854A0] to-[#0A6ED1]',
            line1: '¿QUÉ NECESITAMOS?',
            line2: 'Acceso a SAP MM · 3 personas · 90 días',
            line3: 'Con eso, este plan se ejecuta y el ROI es inmediato',
        },

        // ── 11  DEMO ─────────────────────────────────────
        {
            id: 'demo', layout: 'demo',
            bg: 'from-[#0f172a] to-[#1e293b]',
            actionTitle: 'Demo en vivo — haz clic para explorar',
            buttons: [
                { label: 'Plan Maestro', tx: '/nPLAN', color: '#0854A0' },
                { label: 'Data Browser', tx: '/nSE16N', color: '#354A5F' },
                { label: 'Gestor EAN', tx: '/nEAN', color: '#D97706' },
                { label: 'Mi Equipo', tx: '/nTEAM', color: '#107E3E' },
                { label: 'Importar Excel', tx: '/nIMPORT', color: '#6F42C1' },
            ],
        },

        // ── 12  CLOSING ──────────────────────────────────
        {
            id: 'closing', layout: 'bigText',
            bg: 'from-[#0f172a] to-[#1e293b]',
            line1: 'DATAELECTRIC',
            line2: 'Datos limpios. Decisiones inteligentes.',
            line3: 'Gracias.',
        },
    ];
}

// =============================================
//  PRESENTATION COMPONENT
// =============================================
export default function Presentation({ materials = [], onNavigate, onClose }) {
    const [cur, setCur] = useState(0);
    const [anim, setAnim] = useState(false);

    const metrics = useMemo(() => {
        let sinEAN = 0, sinPeso = 0, sinReorden = 0, sinDesc = 0;
        for (const p of materials) {
            if (!p.ean || p.ean === '') sinEAN++;
            if (!p.pesoNeto || p.pesoNeto === 0) sinPeso++;
            if (!p.puntoReorden || p.puntoReorden === 0) sinReorden++;
            if (!p.descripcion || p.descripcion.trim() === '') sinDesc++;
        }
        return { sinEAN, sinPeso, sinReorden, sinDesc, total: materials.length };
    }, [materials]);

    const slides = useMemo(() => buildSlides(metrics), [metrics]);

    const go = useCallback((i) => {
        if (i >= 0 && i < slides.length && !anim) {
            setAnim(true);
            setCur(i);
            setTimeout(() => setAnim(false), 350);
        }
    }, [slides.length, anim]);

    useEffect(() => {
        const h = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(cur + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [cur, go, onClose]);

    const s = slides[cur];

    const goTx = (tx) => { onClose?.(); setTimeout(() => onNavigate?.(tx), 150); };

    // ─── RENDER ─────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#0f172a]">

            {/* ── SLIDE ─────────────────────────────────── */}
            <div
                key={s.id}
                className={`flex-1 flex items-center justify-center bg-gradient-to-br ${s.bg} relative overflow-hidden`}
            >
                {/* subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />

                <div className="relative z-10 w-full max-w-6xl mx-auto px-12 py-10 animate-[slideUp_0.45s_ease-out]">

                    {/* ===== LAYOUT: bigText ===== */}
                    {s.layout === 'bigText' && (
                        <div className="text-center space-y-6">
                            <p className="text-sm tracking-[0.4em] text-white/40 uppercase font-light">{s.line1}</p>
                            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] max-w-4xl mx-auto">{s.line2}</h1>
                            <p className="text-lg text-white/50 font-light max-w-2xl mx-auto">{s.line3}</p>
                        </div>
                    )}

                    {/* ===== LAYOUT: bigNumber ===== */}
                    {s.layout === 'bigNumber' && (
                        <div className="text-center space-y-4">
                            <div className="text-[120px] md:text-[160px] font-black text-white leading-none tracking-tighter">{s.number}</div>
                            <p className="text-2xl text-white/70 font-light">{s.label}</p>
                            {s.sub && <p className="text-base text-white/40 mt-4 max-w-lg mx-auto">{s.sub}</p>}
                        </div>
                    )}

                    {/* ===== LAYOUT: statRow ===== */}
                    {s.layout === 'statRow' && (
                        <div className="space-y-10">
                            <h2 className="text-3xl font-black text-white text-center leading-tight">{s.actionTitle}</h2>
                            <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
                                {s.stats.map((st, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-7xl font-black leading-none" style={{ color: st.color }}>{st.big}</div>
                                        <div className="text-lg text-white/80 font-medium mt-3">{st.label}</div>
                                        <div className="text-sm text-white/40 mt-1">{st.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: contrast (before/after) ===== */}
                    {s.layout === 'contrast' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {s.before.map((b, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_60px_1fr] items-center gap-0">
                                        <div className="text-right">
                                            <span className="inline-block bg-red-500/15 text-red-400 font-mono text-lg px-5 py-2.5 rounded-xl border border-red-500/20 line-through">
                                                {b}
                                            </span>
                                        </div>
                                        <ArrowRight className="text-white/20 mx-auto" size={20} />
                                        <div>
                                            <span className="inline-block bg-emerald-500/15 text-emerald-400 font-mono text-lg px-5 py-2.5 rounded-xl border border-emerald-500/20 font-bold">
                                                {s.after[i]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-sm text-white/30 mt-4 tracking-wide">{s.rule}</p>
                        </div>
                    )}

                    {/* ===== LAYOUT: process (cedulación) ===== */}
                    {s.layout === 'process' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                {s.steps.map((st, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="w-28 text-center">
                                            <div className="text-3xl mb-1">{st.icon}</div>
                                            <div className="text-xs font-bold text-white">{st.name}</div>
                                            <div className="text-[10px] text-white/40 mt-0.5">{st.who}</div>
                                            <div className="text-[10px] font-mono text-white/20 mt-1">{st.n}</div>
                                        </div>
                                        {i < s.steps.length - 1 && (
                                            <ChevronRight size={16} className="text-white/15 mx-0.5" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: grid6 (tools) ===== */}
                    {s.layout === 'grid6' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                                {s.items.map((it, i) => (
                                    <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.08] transition-colors">
                                        <span className="text-3xl">{it.icon}</span>
                                        <h3 className="text-white font-bold mt-3 text-sm">{it.title}</h3>
                                        <p className="text-white/40 text-xs mt-0.5">{it.desc}</p>
                                        <span className="text-[10px] font-mono text-white/20 mt-2 block">{it.code}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: team4 ===== */}
                    {s.layout === 'team4' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                                {s.members.map((mb, i) => (
                                    <div key={i} className={`rounded-2xl p-5 text-center border ${mb.you ? 'bg-white/10 border-yellow-500/30 ring-1 ring-yellow-500/20' : 'bg-white/[0.04] border-white/[0.08]'}`}>
                                        <span className="text-4xl">{mb.emoji}</span>
                                        <h3 className="text-white font-bold text-sm mt-3">{mb.role}</h3>
                                        <p className="text-white/40 text-xs mt-1">{mb.focus}</p>
                                        {mb.you && <span className="inline-block mt-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">TÚ</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: timeline3 (30-60-90) ===== */}
                    {s.layout === 'timeline3' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
                                {s.phases.map((ph, i) => (
                                    <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                                        <div className="p-4 text-center" style={{ backgroundColor: `${ph.color}15` }}>
                                            <div className="text-3xl font-black text-white">Día {ph.day}</div>
                                            <span className="inline-block text-[10px] font-bold px-3 py-0.5 rounded-full mt-1" style={{ backgroundColor: ph.color, color: 'white' }}>
                                                {ph.label}
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {ph.tasks.map((t, j) => (
                                                <div key={j} className="text-xs text-white/60 flex items-start gap-2">
                                                    <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: ph.color }} />
                                                    {t}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: barCompare (projection) ===== */}
                    {s.layout === 'barCompare' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="max-w-3xl mx-auto space-y-6">
                                {s.metrics.map((mt, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-sm text-white/60">
                                            <span>{mt.label}</span>
                                            <span>{mt.today}{mt.unit} → <strong className="text-emerald-400">{mt.target}{mt.unit}</strong></span>
                                        </div>
                                        <div className="relative h-8 bg-white/[0.06] rounded-full overflow-hidden">
                                            {/* Today bar */}
                                            <div
                                                className="absolute left-0 top-0 h-full rounded-full bg-white/20 transition-all duration-1000"
                                                style={{ width: `${mt.today}%` }}
                                            />
                                            {/* Target bar */}
                                            <div
                                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${mt.target}%`, background: `linear-gradient(90deg, #22C55E80, #22C55E)` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-between px-4">
                                                <span className="text-xs text-white/50 font-medium">Hoy: {mt.today}%</span>
                                                <span className="text-xs text-emerald-300 font-bold">Meta: {mt.target}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===== LAYOUT: demo ===== */}
                    {s.layout === 'demo' && (
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black text-white text-center">{s.actionTitle}</h2>
                            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
                                {s.buttons.map((btn, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goTx(btn.tx)}
                                        className="group relative px-8 py-5 rounded-2xl text-white border border-white/10 hover:border-white/30 hover:scale-105 transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08]"
                                    >
                                        <div className="text-base font-bold">{btn.label}</div>
                                        <div className="text-xs text-white/30 font-mono mt-1">{btn.tx}</div>
                                        <Play size={14} className="absolute top-3 right-3 text-white/20 group-hover:text-white/50 transition-colors" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-xs text-white/30">Haz clic en cualquiera para abrir la transacción en vivo</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM BAR ────────────────────────────── */}
            <div className="bg-black/60 backdrop-blur-xl px-8 py-3 flex items-center justify-between border-t border-white/[0.06]">
                {/* Counter */}
                <span className="text-xs font-mono text-white/30 w-24">
                    {String(cur + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>

                {/* Dots */}
                <div className="flex items-center gap-1.5">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => go(i)}
                            className={`rounded-full transition-all duration-300 cursor-pointer ${i === cur ? 'w-7 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 w-24 justify-end">
                    <button onClick={() => go(cur - 1)} disabled={cur === 0}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.08] hover:bg-white/[0.15] text-white disabled:opacity-20 transition-colors cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => go(cur + 1)} disabled={cur === slides.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.08] hover:bg-white/[0.15] text-white disabled:opacity-20 transition-colors cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={onClose} className="ml-1 text-[10px] text-white/30 hover:text-white/60 transition-colors cursor-pointer">ESC</button>
                </div>
            </div>

            {/* ── PROGRESS BAR ──────────────────────────── */}
            <div className="h-0.5 bg-white/[0.04]">
                <div className="h-full bg-white/30 transition-all duration-500" style={{ width: `${((cur + 1) / slides.length) * 100}%` }} />
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
