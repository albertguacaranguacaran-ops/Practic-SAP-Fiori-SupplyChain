import { useState, useMemo } from 'react';
import {
    Search, TriangleAlert, CircleCheck, ChevronRight, ChevronDown,
    Download, Zap, Eye, X, Filter, BarChart3, Users, Tag, Layers, ClipboardList
} from 'lucide-react';

// ============================================================
//  UTILIDADES DE SIMILITUD DE TEXTO
// ============================================================

// Levenshtein distance
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

// Similarity 0-100
function similarity(a, b) {
    if (!a || !b) return 0;
    const na = normalize(a), nb = normalize(b);
    if (na === nb) return 100;
    const maxLen = Math.max(na.length, nb.length);
    if (maxLen === 0) return 100;
    return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}

// Normalize text for comparison
function normalize(s) {
    return (s || '')
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^A-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================================
//  DICCIONARIO DE ABREVIACIONES COMUNES
// ============================================================
const ABBREVIATIONS = {
    'NEV': 'NEVERA', 'REFRIG': 'REFRIGERADOR', 'REF': 'REFRIGERADOR',
    'LAV': 'LAVADORA', 'MICRO': 'MICROONDAS', 'TV': 'TELEVISOR',
    'CALC': 'CALENTADOR', 'CAL': 'CALENTADOR', 'VENT': 'VENTILADOR',
    'COMP': 'COMPRESOR', 'BOMB': 'BOMBA', 'TRANSF': 'TRANSFORMADOR',
    'COND': 'CONDENSADOR', 'TERM': 'TERMOSTATO', 'REG': 'REGULADOR',
    'PROT': 'PROTECTOR', 'ADAP': 'ADAPTADOR', 'CONEC': 'CONECTOR',
    'REGL': 'REGLETA', 'CABLE': 'CABLE', 'TUB': 'TUBO',
    'MANG': 'MANGUERA', 'TORN': 'TORNILLO', 'ARAND': 'ARANDELA',
    'VAL': 'VALVULA', 'LLAV': 'LLAVE', 'GRI': 'GRIFO',
    'ESTUFA': 'ESTUFA', 'HORNO': 'HORNO', 'SEC': 'SECADORA',
    'PLAN': 'PLANCHA', 'LICUAD': 'LICUADORA', 'EXTRAC': 'EXTRACTOR',
    'FILT': 'FILTRO', 'MOTOR': 'MOTOR', 'RESIS': 'RESISTENCIA',
    'CONTROL': 'CONTROL', 'CTRL': 'CONTROL', 'CONT': 'CONTROL',
    'SW': 'SWITCH', 'INT': 'INTERRUPTOR', 'BR': 'BREAKER',
    'BK': 'BREAKER', 'TAB': 'TABLERO', 'PNL': 'PANEL',
    'HERR': 'HERRAMIENTA', 'DEST': 'DESTORNILLADOR', 'ALICATE': 'ALICATE',
    'BCA': 'BLANCA', 'BCO': 'BLANCO', 'NGR': 'NEGRO', 'NGO': 'NEGRO',
    'AZ': 'AZUL', 'RJ': 'ROJO', 'GR': 'GRIS', 'VDE': 'VERDE',
    'AM': 'AMARILLO', 'AMAR': 'AMARILLO',
    'PQ': 'PEQUEÑO', 'GDE': 'GRANDE', 'MED': 'MEDIANO',
    'ACERO INOX': 'ACERO INOXIDABLE', 'INOX': 'INOXIDABLE',
    'ALU': 'ALUMINIO', 'GALV': 'GALVANIZADO',
};

// ============================================================
//  NAMING QUALITY RULES
// ============================================================
function analyzeNaming(desc) {
    const issues = [];
    const d = (desc || '').trim();
    let score = 100;

    // 1. Empty
    if (!d || d.length < 3) {
        return { score: 0, issues: [{ severity: 'critical', msg: 'Sin descripción' }] };
    }

    // 2. Too short
    if (d.length < 10) {
        issues.push({ severity: 'high', msg: 'Descripción muy corta (< 10 chars)' });
        score -= 25;
    }

    // 3. Not uppercase
    if (d !== d.toUpperCase()) {
        issues.push({ severity: 'medium', msg: 'No está en MAYÚSCULAS' });
        score -= 10;
    }

    // 4. Has accents
    if (/[áéíóúñ]/i.test(d)) {
        issues.push({ severity: 'low', msg: 'Contiene acentos/ñ (no estándar SAP)' });
        score -= 5;
    }

    // 5. Contains abbreviations
    const words = normalize(d).split(' ');
    const foundAbbrevs = words.filter(w => ABBREVIATIONS[w]);
    if (foundAbbrevs.length > 0) {
        issues.push({
            severity: 'medium',
            msg: `Abreviaciones: ${foundAbbrevs.map(a => `"${a}" → "${ABBREVIATIONS[a]}"`).join(', ')}`
        });
        score -= 10 * foundAbbrevs.length;
    }

    // 6. No numbers (might be missing model/size)
    if (!/\d/.test(d)) {
        issues.push({ severity: 'low', msg: 'Sin número de modelo/tamaño' });
        score -= 5;
    }

    // 7. Very generic (1-2 words)
    if (words.length <= 2 && d.length < 15) {
        issues.push({ severity: 'high', msg: 'Muy genérica — necesita MARCA + MODELO + SPECS' });
        score -= 20;
    }

    return { score: Math.max(0, score), issues };
}

// ============================================================
//  COMPONENT
// ============================================================
export default function DataQuality({ materials = [], onClose, onNavigate }) {
    const [tab, setTab] = useState('overview'); // overview, duplicates, naming, vendor
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // ── ANÁLISIS COMPLETO ────────────────────
    const analysis = useMemo(() => {
        const n = materials.length;
        if (n === 0) return null;

        // 1. Naming analysis for each material
        const namingResults = materials.map(m => ({
            ...m,
            naming: analyzeNaming(m.descripcion),
        }));

        // 2. Find similar pairs (potential duplicates)
        const pairs = [];
        const normalized = materials.map(m => ({ id: m.id, desc: normalize(m.descripcion), orig: m.descripcion, vendor: m.proveedor || '' }));

        // Compare — limit to first 2000 for performance
        const limit = Math.min(normalized.length, 2000);
        for (let i = 0; i < limit; i++) {
            for (let j = i + 1; j < limit; j++) {
                const sim = similarity(normalized[i].desc, normalized[j].desc);
                if (sim >= 65 && sim < 100) {
                    pairs.push({
                        a: normalized[i], b: normalized[j],
                        similarity: sim,
                        sameVendor: normalized[i].vendor && normalized[i].vendor === normalized[j].vendor,
                    });
                }
            }
        }
        pairs.sort((a, b) => b.similarity - a.similarity);

        // 3. Group by vendor
        const vendorMap = {};
        materials.forEach(m => {
            const v = m.proveedor || 'Sin proveedor';
            if (!vendorMap[v]) vendorMap[v] = [];
            vendorMap[v].push(m);
        });

        // 4. Vendor naming inconsistencies
        const vendorIssues = [];
        Object.entries(vendorMap).forEach(([vendor, items]) => {
            if (items.length < 2) return;
            const norms = items.map(it => ({ id: it.id, desc: normalize(it.descripcion), orig: it.descripcion }));
            const localPairs = [];
            for (let i = 0; i < norms.length; i++) {
                for (let j = i + 1; j < norms.length; j++) {
                    const sim = similarity(norms[i].desc, norms[j].desc);
                    if (sim >= 60 && sim < 100) {
                        localPairs.push({ a: norms[i], b: norms[j], sim });
                    }
                }
            }
            if (localPairs.length > 0) {
                vendorIssues.push({ vendor, total: items.length, conflicts: localPairs.sort((a, b) => b.sim - a.sim) });
            }
        });
        vendorIssues.sort((a, b) => b.conflicts.length - a.conflicts.length);

        // 5. Score global
        const avgScore = namingResults.reduce((s, r) => s + r.naming.score, 0) / n;
        const criticalCount = namingResults.filter(r => r.naming.score < 30).length;
        const highCount = namingResults.filter(r => r.naming.score >= 30 && r.naming.score < 60).length;
        const medCount = namingResults.filter(r => r.naming.score >= 60 && r.naming.score < 80).length;
        const goodCount = namingResults.filter(r => r.naming.score >= 80).length;

        // 6. Gaps criticos para eCommerce & Supply Chain
        const sinEAN = materials.filter(m => !m.ean || m.ean === '' || m.ean === '0').length;
        const sinPeso = materials.filter(m => !m.pesoNeto || m.pesoNeto === 0).length;
        const sinDimensiones = materials.filter(m => !m.largo || !m.ancho || !m.alto || m.largo === 0).length;
        const sinReorden = materials.filter(m => !m.puntoReorden || m.puntoReorden === 0).length;
        const sinCategoria = materials.filter(m => !m.categoria || m.categoria === '').length;
        const sinProveedor = materials.filter(m => !m.proveedor || m.proveedor === '').length;

        // 7. Materiales con TODOS los gaps (los peores)
        const sinTodo = materials.filter(m =>
            (!m.ean || m.ean === '' || m.ean === '0') &&
            (!m.pesoNeto || m.pesoNeto === 0) &&
            (!m.largo || m.largo === 0)
        ).length;

        // 8. Por categoria: los grupos con mas gaps
        const categoryGaps = {};
        materials.forEach(m => {
            const cat = m.categoria || m.matkl || 'Sin Categoría';
            if (!categoryGaps[cat]) categoryGaps[cat] = { total: 0, sinEAN: 0, sinDim: 0, sinPeso: 0 };
            categoryGaps[cat].total++;
            if (!m.ean || m.ean === '' || m.ean === '0') categoryGaps[cat].sinEAN++;
            if (!m.largo || m.largo === 0) categoryGaps[cat].sinDim++;
            if (!m.pesoNeto || m.pesoNeto === 0) categoryGaps[cat].sinPeso++;
        });
        const topCategoryGaps = Object.entries(categoryGaps)
            .map(([cat, g]) => ({ cat, ...g, score: Math.round(((g.sinEAN + g.sinDim + g.sinPeso) / (g.total * 3)) * 100) }))
            .filter(g => g.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);

        return {
            total: n, avgScore, namingResults, pairs,
            criticalCount, highCount, medCount, goodCount,
            vendorIssues, vendorMap,
            gaps: { sinEAN, sinPeso, sinDimensiones, sinReorden, sinCategoria, sinProveedor, sinTodo },
            topCategoryGaps,
        };
    }, [materials]);

    if (!analysis) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 text-center max-w-md">
                    <TriangleAlert size={48} className="text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Sin datos para analizar</h3>
                    <p className="text-sm text-gray-500 mb-4">Primero carga datos con /nIMPORT o usa el dataset de demostración</p>
                    <button onClick={onClose} className="px-4 py-2 bg-[#0854A0] text-white rounded-lg cursor-pointer">Cerrar</button>
                </div>
            </div>
        );
    }

    // Score color
    const scoreColor = analysis.avgScore >= 80 ? '#22C55E' : analysis.avgScore >= 60 ? '#F59E0B' : analysis.avgScore >= 40 ? '#E9730C' : '#EF4444';

    // Filtered naming results
    const filteredNaming = analysis.namingResults
        .filter(r => {
            if (filterSeverity === 'critical') return r.naming.score < 30;
            if (filterSeverity === 'high') return r.naming.score >= 30 && r.naming.score < 60;
            if (filterSeverity === 'medium') return r.naming.score >= 60 && r.naming.score < 80;
            return true;
        })
        .filter(r => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (r.descripcion || '').toLowerCase().includes(term) || (r.id || '').toLowerCase().includes(term);
        })
        .sort((a, b) => a.naming.score - b.naming.score)
        .slice(0, 100);

    const TABS = [
        { id: 'overview', label: 'Diagnóstico', icon: BarChart3 },
        { id: 'duplicates', label: `Duplicados (${analysis.pairs.length})`, icon: Layers },
        { id: 'naming', label: 'Naming', icon: Tag },
        { id: 'vendor', label: `Por Proveedor (${analysis.vendorIssues.length})`, icon: Users },
        { id: 'plan', label: 'Plan de Mejoras', icon: ClipboardList },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* ── HEADER ─────────────────────────── */}
                <div className="bg-gradient-to-r from-[#0854A0] to-[#0A6ED1] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Search size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Diagnóstico de Calidad de Datos</h2>
                            <p className="text-xs text-white/70">{analysis.total.toLocaleString()} materiales analizados</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* ── TABS ────────────────────────────── */}
                <div className="border-b flex">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-xs font-medium transition-colors cursor-pointer border-b-2 ${tab === t.id ? 'border-[#0854A0] text-[#0854A0]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon size={14} /> {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── CONTENT ─────────────────────────── */}
                <div className="flex-1 overflow-auto p-6">

                    {/* === OVERVIEW === */}
                    {tab === 'overview' && (
                        <div className="space-y-6">
                            {/* Score */}
                            <div className="flex items-center gap-8 bg-gray-50 rounded-2xl p-6">
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                                        <circle cx="60" cy="60" r="50" fill="none"
                                            stroke={scoreColor} strokeWidth="10"
                                            strokeDasharray={`${analysis.avgScore * 3.14} 314`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-black" style={{ color: scoreColor }}>{Math.round(analysis.avgScore)}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#32363A]">Score de Salud de Naming</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {analysis.avgScore >= 80 ? 'Tu naming está en buen estado' :
                                            analysis.avgScore >= 60 ? 'Hay problemas que corregir' :
                                                analysis.avgScore >= 40 ? 'Se necesita intervención urgente' :
                                                    'Estado crítico — muchos materiales tienen descripciones inadecuadas'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                    <div className="text-3xl font-black text-red-500">{analysis.criticalCount}</div>
                                    <div className="text-xs text-red-700 mt-1 font-medium">Crítico (&lt;30)</div>
                                    <p className="text-[10px] text-red-400 mt-0.5">Sin descripción o muy corta</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                                    <div className="text-3xl font-black text-amber-500">{analysis.highCount}</div>
                                    <div className="text-xs text-amber-700 mt-1 font-medium">Alto (30-59)</div>
                                    <p className="text-[10px] text-amber-400 mt-0.5">Abreviaciones o muy genérica</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                                    <div className="text-3xl font-black text-blue-500">{analysis.medCount}</div>
                                    <div className="text-xs text-blue-700 mt-1 font-medium">Medio (60-79)</div>
                                    <p className="text-[10px] text-blue-400 mt-0.5">Mayúsculas o acentos</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                                    <div className="text-3xl font-black text-green-500">{analysis.goodCount}</div>
                                    <div className="text-xs text-green-700 mt-1 font-medium">Bueno (80+)</div>
                                    <p className="text-[10px] text-green-400 mt-0.5">Cumple el estándar</p>
                                </div>
                            </div>

                            {/* Key findings */}
                            <div className="bg-white rounded-xl border p-5 space-y-3">
                                <h4 className="text-sm font-bold text-[#32363A] flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" /> Hallazgos Principales
                                </h4>
                                <div className="space-y-2">
                                    {analysis.pairs.length > 0 && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <TriangleAlert size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-red-600">{analysis.pairs.length} pares sospechosos</strong> de duplicados detectados por similitud de nombre</span>
                                        </div>
                                    )}
                                    {analysis.vendorIssues.length > 0 && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <TriangleAlert size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-amber-600">{analysis.vendorIssues.length} proveedores</strong> tienen materiales con nombres sospechosamente similares</span>
                                        </div>
                                    )}
                                    {analysis.criticalCount > 0 && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <TriangleAlert size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-red-600">{analysis.criticalCount} materiales</strong> tienen descripciones en estado crítico</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 text-sm">
                                        <CircleCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong className="text-green-600">{analysis.goodCount} materiales</strong> ({((analysis.goodCount / analysis.total) * 100).toFixed(0)}%) tienen naming correcto</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action plan */}
                            <div className="bg-gradient-to-r from-[#0854A0] to-[#0A6ED1] rounded-xl p-5 text-white">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <CircleCheck size={16} /> Plan de Ataque Recomendado
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <span className="font-bold text-red-300">Semana 1-2</span>
                                        <p className="text-white/80 mt-1">Corregir los {analysis.criticalCount} materiales críticos (sin descripción o muy corta)</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <span className="font-bold text-amber-300">Semana 3-4</span>
                                        <p className="text-white/80 mt-1">Resolver los {analysis.pairs.length} posibles duplicados y estandarizar abreviaciones</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <span className="font-bold text-green-300">Semana 5-6</span>
                                        <p className="text-white/80 mt-1">Revisar naming por proveedor y aplicar convención TIPO+MARCA+MODELO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === DUPLICATES === */}
                    {tab === 'duplicates' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-[#32363A]">Posibles Duplicados por Similitud</h3>
                                    <p className="text-xs text-gray-500">{analysis.pairs.length} pares con similitud ≥ 65% detectados</p>
                                </div>
                            </div>

                            {analysis.pairs.length === 0 ? (
                                <div className="text-center py-12">
                                    <CircleCheck size={48} className="text-green-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-500">No se detectaron duplicados sospechosos</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {analysis.pairs.slice(0, 50).map((pair, i) => (
                                        <div key={i} className={`rounded-xl border p-4 ${pair.sameVendor ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pair.similarity >= 85 ? 'bg-red-500 text-white' :
                                                        pair.similarity >= 75 ? 'bg-amber-500 text-white' :
                                                            'bg-yellow-400 text-yellow-900'
                                                        }`}>
                                                        {pair.similarity}% similar
                                                    </span>
                                                    {pair.sameVendor && (
                                                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">⚠ MISMO PROVEEDOR</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 font-mono">{pair.a.id}</span>
                                                    <p className="text-sm font-medium text-[#32363A] font-mono">{pair.a.orig}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-gray-400 font-mono">{pair.b.id}</span>
                                                    <p className="text-sm font-medium text-[#32363A] font-mono">{pair.b.orig}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === NAMING === */}
                    {tab === 'naming' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-[#32363A]">Análisis de Naming por Material</h3>
                                    <p className="text-xs text-gray-500">Cada material tiene un score de calidad de 0 a 100</p>
                                </div>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-700' },
                                        { val: 'critical', label: `Crítico (${analysis.criticalCount})`, color: 'bg-red-100 text-red-700' },
                                        { val: 'high', label: `Alto (${analysis.highCount})`, color: 'bg-amber-100 text-amber-700' },
                                        { val: 'medium', label: `Medio (${analysis.medCount})`, color: 'bg-blue-100 text-blue-700' },
                                    ].map(f => (
                                        <button
                                            key={f.val}
                                            onClick={() => setFilterSeverity(f.val)}
                                            className={`text-[10px] px-3 py-1 rounded-full font-medium cursor-pointer border transition-colors ${filterSeverity === f.val ? f.color + ' border-current' : 'bg-white border-gray-200 text-gray-500'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por ID o descripción..."
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                />
                            </div>

                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500">
                                            <th className="text-left px-3 py-2 w-16">Score</th>
                                            <th className="text-left px-3 py-2 w-24">ID</th>
                                            <th className="text-left px-3 py-2">Descripción</th>
                                            <th className="text-left px-3 py-2">Problemas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredNaming.map((r, i) => (
                                            <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-block w-10 text-center text-[10px] font-bold py-0.5 rounded-full ${r.naming.score < 30 ? 'bg-red-100 text-red-700' :
                                                        r.naming.score < 60 ? 'bg-amber-100 text-amber-700' :
                                                            r.naming.score < 80 ? 'bg-blue-100 text-blue-700' :
                                                                'bg-green-100 text-green-700'
                                                        }`}>
                                                        {r.naming.score}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 font-mono text-gray-500">{r.id}</td>
                                                <td className="px-3 py-2 font-mono text-[#32363A]">{r.descripcion || '⚠ vacío'}</td>
                                                <td className="px-3 py-2">
                                                    <div className="space-y-0.5">
                                                        {r.naming.issues.map((iss, j) => (
                                                            <span key={j} className={`inline-block text-[10px] px-2 py-0.5 rounded mr-1 ${iss.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                                iss.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                                                                    iss.severity === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {iss.msg}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-gray-400 text-right">Mostrando {filteredNaming.length} de {analysis.total}</p>
                        </div>
                    )}

                    {/* === VENDOR === */}
                    {tab === 'vendor' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-[#32363A]">Conflictos de Naming por Proveedor</h3>
                                <p className="text-xs text-gray-500">
                                    Proveedores con materiales que tienen nombres sospechosamente similares — posibles duplicados de compra
                                </p>
                            </div>

                            {analysis.vendorIssues.length === 0 ? (
                                <div className="text-center py-12">
                                    <CircleCheck size={48} className="text-green-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-500">No se detectaron conflictos por proveedor</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {analysis.vendorIssues.map((vi, i) => (
                                        <div key={i} className="rounded-xl border overflow-hidden">
                                            <button
                                                onClick={() => setExpandedGroup(expandedGroup === i ? null : i)}
                                                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users size={16} className="text-[#0854A0]" />
                                                    <div className="text-left">
                                                        <span className="text-sm font-bold text-[#32363A]">{vi.vendor}</span>
                                                        <span className="text-xs text-gray-500 ml-2">{vi.total} materiales</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                                        {vi.conflicts.length} conflictos
                                                    </span>
                                                    {expandedGroup === i ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                            </button>
                                            {expandedGroup === i && (
                                                <div className="p-4 space-y-2 bg-white">
                                                    {vi.conflicts.slice(0, 20).map((c, j) => (
                                                        <div key={j} className="bg-red-50 rounded-lg p-3 border border-red-100">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{c.sim}% similar</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                                <div>
                                                                    <span className="text-gray-400 font-mono">{c.a.id}</span>
                                                                    <p className="font-mono text-[#32363A] font-medium">{c.a.orig}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400 font-mono">{c.b.id}</span>
                                                                    <p className="font-mono text-[#32363A] font-medium">{c.b.orig}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === PLAN DE MEJORAS === */}
                    {tab === 'plan' && (() => {
                        const g = analysis.gaps;
                        const pct = (x) => ((x / analysis.total) * 100).toFixed(0);

                        const kpis = [
                            {
                                icon: '📦', label: 'Códigos EAN', count: g.sinEAN, pct: pct(g.sinEAN),
                                impact: 'eCommerce, Logística, Exportación', tx: '/nEAN → MM02',
                                priority: g.sinEAN > analysis.total * 0.3 ? 'CRÍTICO' : g.sinEAN > 0 ? 'ALTO' : 'OK',
                                color: g.sinEAN > analysis.total * 0.3 ? 'red' : g.sinEAN > 0 ? 'amber' : 'green',
                            },
                            {
                                icon: '📐', label: 'Dimensiones (L×A×H)', count: g.sinDimensiones, pct: pct(g.sinDimensiones),
                                impact: 'Flete, Estiba, Ficha eCommerce, WM', tx: 'MM02 → Vista Planta',
                                priority: g.sinDimensiones > analysis.total * 0.4 ? 'CRÍTICO' : g.sinDimensiones > 0 ? 'ALTO' : 'OK',
                                color: g.sinDimensiones > analysis.total * 0.4 ? 'red' : g.sinDimensiones > 0 ? 'amber' : 'green',
                            },
                            {
                                icon: '⚖️', label: 'Peso Neto / Bruto', count: g.sinPeso, pct: pct(g.sinPeso),
                                impact: 'Cálculo flete, Costo logístico, KPI almacén', tx: 'MM02 → Vista Planta',
                                priority: g.sinPeso > analysis.total * 0.3 ? 'CRÍTICO' : g.sinPeso > 0 ? 'ALTO' : 'OK',
                                color: g.sinPeso > analysis.total * 0.3 ? 'red' : g.sinPeso > 0 ? 'amber' : 'green',
                            },
                            {
                                icon: '🔄', label: 'Punto de Reorden (MINBE)', count: g.sinReorden, pct: pct(g.sinReorden),
                                impact: 'MRP, Propuestas automáticas MD04, Quiebre stock', tx: 'MM02 → MRP 1',
                                priority: g.sinReorden > analysis.total * 0.5 ? 'CRÍTICO' : g.sinReorden > 0 ? 'MEDIO' : 'OK',
                                color: g.sinReorden > analysis.total * 0.5 ? 'red' : g.sinReorden > 0 ? 'blue' : 'green',
                            },
                            {
                                icon: '🏷️', label: 'Naming / Descripción', count: analysis.criticalCount, pct: pct(analysis.criticalCount),
                                impact: 'Búsqueda SAP, Reporting, eCommerce', tx: '/nDQ → Naming',
                                priority: analysis.criticalCount > analysis.total * 0.2 ? 'CRÍTICO' : analysis.criticalCount > 0 ? 'MEDIO' : 'OK',
                                color: analysis.criticalCount > analysis.total * 0.2 ? 'red' : analysis.criticalCount > 0 ? 'blue' : 'green',
                            },
                        ];

                        const colorClass = {
                            red: { badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', border: 'border-red-200' },
                            amber: { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', border: 'border-amber-200' },
                            blue: { badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-400', border: 'border-blue-200' },
                            green: { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', border: 'border-green-200' },
                        };

                        return (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-[#32363A]">Plan de Mejoras — Datos Maestros</h3>
                                        <p className="text-xs text-gray-500">{analysis.total.toLocaleString()} materiales analizados · Calculado desde datos reales importados</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">Materiales sin ningún dato</div>
                                        <div className="text-2xl font-black text-red-500">{g.sinTodo.toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-400">sin EAN + sin peso + sin dimensiones</div>
                                    </div>
                                </div>

                                {/* KPI Gaps */}
                                <div className="space-y-2">
                                    {kpis.map((kpi, i) => (
                                        <div key={i} className={`border rounded-xl p-4 ${colorClass[kpi.color].border}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{kpi.icon}</span>
                                                    <div>
                                                        <span className="text-sm font-bold text-[#32363A]">{kpi.label}</span>
                                                        <p className="text-[10px] text-gray-400">Impacta: {kpi.impact}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass[kpi.color].badge}`}>{kpi.priority}</span>
                                                    <div className="text-right">
                                                        <div className="text-lg font-black text-[#32363A]">{kpi.count.toLocaleString()}</div>
                                                        <div className="text-[10px] text-gray-400">{kpi.pct}% del catálogo</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                    <div className={`h-1.5 rounded-full ${colorClass[kpi.color].bar}`} style={{ width: `${Math.min(kpi.pct, 100)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-400">{kpi.tx}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Por Categoría */}
                                {analysis.topCategoryGaps.length > 0 && (
                                    <div className="rounded-xl border overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b">
                                            <h4 className="text-xs font-bold text-gray-600">Categorías Más Afectadas — Prioridad de Ataque</h4>
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-gray-400 bg-gray-50 border-b">
                                                    <th className="text-left px-3 py-2">Categoría</th>
                                                    <th className="text-center px-3 py-2">Total</th>
                                                    <th className="text-center px-3 py-2">Sin EAN</th>
                                                    <th className="text-center px-3 py-2">Sin Dim.</th>
                                                    <th className="text-center px-3 py-2">Sin Peso</th>
                                                    <th className="text-center px-3 py-2">Gap%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.topCategoryGaps.map((g, i) => (
                                                    <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                        <td className="px-3 py-2 font-medium text-[#32363A]">{g.cat}</td>
                                                        <td className="px-3 py-2 text-center text-gray-500">{g.total}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={g.sinEAN > 0 ? 'text-red-600 font-bold' : 'text-green-500'}>{g.sinEAN}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={g.sinDim > 0 ? 'text-amber-600 font-bold' : 'text-green-500'}>{g.sinDim}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={g.sinPeso > 0 ? 'text-amber-600 font-bold' : 'text-green-500'}>{g.sinPeso}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${g.score}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-mono text-red-500 w-8">{g.score}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* 30-60-90 Plan */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        {
                                            fase: 'Días 1-30', color: '#EF4444', label: 'Diagnóstico & Quick Wins',
                                            tasks: [
                                                `Exportar MARA + MARM de SAP (SE16N)`,
                                                `Identificar los ${Math.min(g.sinTodo, 500)} artículos sin ningún dato`,
                                                `Fijar EAN en artículos de mayor rotación`,
                                                `Capturar dimensiones: TV, Neveras, Lavadoras (Categ. A)`,
                                                `Activar tipo de planificación VB en artículos clave`,
                                            ]
                                        },
                                        {
                                            fase: 'Días 31-60', color: '#F59E0B', label: 'Enriquecimiento Masivo',
                                            tasks: [
                                                `Completar dimensiones en ${g.sinDimensiones.toLocaleString()} artículos restantes`,
                                                `Completar peso neto/bruto: ${g.sinPeso.toLocaleString()} artículos`,
                                                `Asignar punto de reorden por categoría (VB/VM)`,
                                                `Corregir naming crítico: ${analysis.criticalCount} artículos`,
                                                `Validar ${analysis.pairs.length} posibles duplicados`,
                                            ]
                                        },
                                        {
                                            fase: 'Días 61-90', color: '#22C55E', label: 'eCommerce LIVE',
                                            tasks: [
                                                `100% artículos Categoría A con EAN + dimensiones`,
                                                `MRP activo: MD04 genera propuestas automáticas`,
                                                `Dashboard eCommerce muestra artículos listos`,
                                                `KPIs: % completitud por categoría (reporte semanal)`,
                                                `Publicar primeros 500 SKUs en plataforma digital`,
                                            ]
                                        },
                                    ].map((fase, i) => (
                                        <div key={i} className="rounded-xl border overflow-hidden">
                                            <div className="px-4 py-3 text-white text-xs font-bold" style={{ backgroundColor: fase.color }}>
                                                {fase.fase} — {fase.label}
                                            </div>
                                            <div className="p-4 space-y-2 bg-white">
                                                {fase.tasks.map((t, j) => (
                                                    <div key={j} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <span className="text-gray-300 mt-0.5 font-bold flex-shrink-0">{j + 1}.</span>
                                                        <span>{t}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
