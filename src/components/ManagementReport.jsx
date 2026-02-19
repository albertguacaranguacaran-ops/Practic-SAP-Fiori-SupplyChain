import { useState, useMemo } from 'react';
import {
    X, Download, Filter, Search, BarChart3,
    TrendingUp, TrendingDown, Package, ArrowUpDown,
    CircleAlert, CircleCheck, Minus, ChevronDown,
    HelpCircle, FileSpreadsheet, ShoppingCart, Upload, ArrowRight, CheckCircle2
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

/*
 * ══════════════════════════════════════════════════════════════
 *   /nREPORT — REPORTE DE GESTIÓN DE MATERIALES
 *   Cross-tab: Material + Proveedor + Stock + Compras/Ventas x Mes
 * ══════════════════════════════════════════════════════════════
 */

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ManagementReport({ materials = [], purchaseOrders = [], salesOrders = [], onClose, showStatus }) {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterStock, setFilterStock] = useState('all'); // all, low, ok, zero
    const [sortCol, setSortCol] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showGuide, setShowGuide] = useState(materials.length === 0);

    // ═══════════════════════════════════════════
    //  BUILD MONTHLY DATA FROM ORDERS
    // ═══════════════════════════════════════════
    const { purchasesByMaterial, salesByMaterial } = useMemo(() => {
        const purchases = {}; // { materialId: { 0: qty, 1: qty, ... 11: qty } }
        const sales = {};

        // Process Purchase Orders
        (purchaseOrders || []).forEach(po => {
            const poDate = po.AEDAT || po.BEDAT || po.date;
            if (!poDate) return;
            const d = new Date(poDate);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();

            (po.items || []).forEach(item => {
                const matId = item.material || item.MATNR;
                if (!matId) return;
                if (!purchases[matId]) purchases[matId] = {};
                purchases[matId][month] = (purchases[matId][month] || 0) + (parseInt(item.quantity || item.MENGE) || 0);
            });
        });

        // Process Sales Orders
        (salesOrders || []).forEach(so => {
            const soDate = so.ERDAT || so.date || so.AUDAT;
            if (!soDate) return;
            const d = new Date(soDate);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();

            (so.items || []).forEach(item => {
                const matId = item.material || item.MATNR;
                if (!matId) return;
                if (!sales[matId]) sales[matId] = {};
                sales[matId][month] = (sales[matId][month] || 0) + (parseInt(item.quantity || item.KWMENG) || 0);
            });
        });

        return { purchasesByMaterial: purchases, salesByMaterial: sales };
    }, [purchaseOrders, salesOrders, selectedYear]);

    // ═══════════════════════════════════════════
    //  BUILD REPORT ROWS
    // ═══════════════════════════════════════════
    const reportData = useMemo(() => {
        return materials.map(mat => {
            const pMonths = purchasesByMaterial[mat.id] || {};
            const sMonths = salesByMaterial[mat.id] || {};

            // Calculate totals
            let totalPurchases = 0, totalSales = 0;
            for (let m = 0; m < 12; m++) {
                totalPurchases += (pMonths[m] || 0);
                totalSales += (sMonths[m] || 0);
            }

            // Calculate margin
            const cost = mat.precioBase || 0;
            const salePrice = cost > 0 ? Math.round(cost * 1.35) : 0; // 35% margin estimate
            const margin = cost > 0 ? ((salePrice - cost) / cost * 100).toFixed(0) : 0;

            // Stock status
            const stock = mat.stockActual || 0;
            const reorder = mat.puntoReorden || 0;
            let stockStatus = 'ok';
            if (stock === 0) stockStatus = 'zero';
            else if (reorder > 0 && stock <= reorder) stockStatus = 'low';
            else if (stock > reorder * 3) stockStatus = 'high';

            return {
                id: mat.id,
                descripcion: mat.descripcion || '',
                proveedor: mat.proveedor || '—',
                marca: mat.marca || '',
                categoria: mat.categoria || 'Sin categoría',
                stock,
                reorder,
                cost,
                salePrice,
                margin,
                stockStatus,
                pMonths,
                sMonths,
                totalPurchases,
                totalSales,
                rotation: totalSales > 0 ? (totalSales / Math.max(stock, 1)).toFixed(1) : '0.0'
            };
        });
    }, [materials, purchasesByMaterial, salesByMaterial]);

    // ═══════════════════════════════════════════
    //  FILTERS & SORTING
    // ═══════════════════════════════════════════
    const categories = useMemo(() => [...new Set(materials.map(m => m.categoria).filter(Boolean))], [materials]);
    const vendors = useMemo(() => [...new Set(materials.map(m => m.proveedor).filter(Boolean))], [materials]);

    const filteredData = useMemo(() => {
        let data = reportData;

        if (search) {
            const q = search.toLowerCase();
            data = data.filter(r =>
                r.id.toLowerCase().includes(q) ||
                r.descripcion.toLowerCase().includes(q) ||
                r.proveedor.toLowerCase().includes(q)
            );
        }
        if (filterCategory) data = data.filter(r => r.categoria === filterCategory);
        if (filterVendor) data = data.filter(r => r.proveedor === filterVendor);
        if (filterStock === 'low') data = data.filter(r => r.stockStatus === 'low');
        if (filterStock === 'zero') data = data.filter(r => r.stockStatus === 'zero');
        if (filterStock === 'ok') data = data.filter(r => r.stockStatus === 'ok' || r.stockStatus === 'high');

        // Sort
        data = [...data].sort((a, b) => {
            let valA = a[sortCol], valB = b[sortCol];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [reportData, search, filterCategory, filterVendor, filterStock, sortCol, sortDir]);

    // ═══════════════════════════════════════════
    //  SUMMARY STATS
    // ═══════════════════════════════════════════
    const summary = useMemo(() => {
        const totalMaterials = filteredData.length;
        const totalStock = filteredData.reduce((s, r) => s + r.stock, 0);
        const totalInventoryValue = filteredData.reduce((s, r) => s + (r.stock * r.cost), 0);
        const totalPurchases = filteredData.reduce((s, r) => s + r.totalPurchases, 0);
        const totalSales = filteredData.reduce((s, r) => s + r.totalSales, 0);
        const lowStockCount = filteredData.filter(r => r.stockStatus === 'low' || r.stockStatus === 'zero').length;

        // Monthly totals
        const monthlyPurchases = Array(12).fill(0);
        const monthlySales = Array(12).fill(0);
        filteredData.forEach(r => {
            for (let m = 0; m < 12; m++) {
                monthlyPurchases[m] += (r.pMonths[m] || 0);
                monthlySales[m] += (r.sMonths[m] || 0);
            }
        });

        return { totalMaterials, totalStock, totalInventoryValue, totalPurchases, totalSales, lowStockCount, monthlyPurchases, monthlySales };
    }, [filteredData]);

    // Sort handler
    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    // Export handler
    const handleExport = async () => {
        try {
            const exportData = filteredData.map(r => {
                const row = {
                    'ID Material': r.id,
                    'Descripción': r.descripcion,
                    'Proveedor': r.proveedor,
                    'Categoría': r.categoria,
                    'Stock Actual': r.stock,
                    'Punto Reorden': r.reorder,
                    'Costo': r.cost,
                    'Precio Venta': r.salePrice,
                    'Margen %': r.margin,
                };
                // Add monthly columns
                MONTHS.forEach((m, i) => {
                    row[`Compras ${m}`] = r.pMonths[i] || 0;
                });
                MONTHS.forEach((m, i) => {
                    row[`Ventas ${m}`] = r.sMonths[i] || 0;
                });
                row['Total Compras'] = r.totalPurchases;
                row['Total Ventas'] = r.totalSales;
                row['Rotación'] = r.rotation;
                return row;
            });
            await exportToExcel(exportData);
            showStatus?.('Excel exportado correctamente', 'success');
        } catch (e) {
            showStatus?.('Error al exportar: ' + e.message, 'error');
        }
    };

    // Cell color for monthly values
    const getCellBg = (val) => {
        if (!val || val === 0) return '';
        if (val >= 50) return 'bg-green-100 text-green-800 font-bold';
        if (val >= 20) return 'bg-blue-50 text-blue-700';
        if (val >= 5) return 'bg-yellow-50 text-yellow-700';
        return 'text-gray-600';
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F0F2F5] flex flex-col">
            {/* ═══ HEADER ═══ */}
            <div className="bg-gradient-to-r from-[#0854A0] to-[#1873CC] text-white px-6 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                        <BarChart3 size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Reporte de Gestión de Materiales</h2>
                        <p className="text-xs text-white/60">/nREPORT — Análisis cruzado: Materiales × Proveedores × Compras × Ventas</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`${showGuide ? 'bg-yellow-400 text-gray-900' : 'bg-white/15 text-white hover:bg-white/25'} px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer`}
                    >
                        <HelpCircle size={16} /> {showGuide ? 'Ocultar Guía' : '❓ Guía'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Download size={16} /> Exportar Excel
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg cursor-pointer">
                        <X size={20} className="text-white/60 hover:text-white" />
                    </button>
                </div>
            </div>

            {/* ═══ SUMMARY CARDS ═══ */}
            <div className="px-6 py-3 bg-white border-b flex items-center gap-4 overflow-x-auto">
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 min-w-[120px]">
                    <div className="text-xs text-gray-500">Materiales</div>
                    <div className="text-xl font-black text-[#0854A0]">{summary.totalMaterials.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 rounded-xl px-4 py-2.5 min-w-[120px]">
                    <div className="text-xs text-gray-500">Stock Total</div>
                    <div className="text-xl font-black text-green-600">{summary.totalStock.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 rounded-xl px-4 py-2.5 min-w-[140px]">
                    <div className="text-xs text-gray-500">Valor Inventario</div>
                    <div className="text-xl font-black text-purple-600">${summary.totalInventoryValue.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl px-4 py-2.5 min-w-[120px]">
                    <div className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp size={12} /> Compras {selectedYear}</div>
                    <div className="text-xl font-black text-emerald-600">{summary.totalPurchases.toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 rounded-xl px-4 py-2.5 min-w-[120px]">
                    <div className="text-xs text-gray-500 flex items-center gap-1"><TrendingDown size={12} /> Ventas {selectedYear}</div>
                    <div className="text-xl font-black text-orange-600">{summary.totalSales.toLocaleString()}</div>
                </div>
                {summary.lowStockCount > 0 && (
                    <div className="bg-red-50 rounded-xl px-4 py-2.5 min-w-[120px]">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><CircleAlert size={12} /> Stock Bajo</div>
                        <div className="text-xl font-black text-red-600">{summary.lowStockCount}</div>
                    </div>
                )}
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="px-6 py-2.5 bg-white border-b flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar material, proveedor..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0854A0]"
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={filterVendor}
                    onChange={e => setFilterVendor(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="">Todos los Proveedores</option>
                    {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select
                    value={filterStock}
                    onChange={e => setFilterStock(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">Todo Stock</option>
                    <option value="low">🔴 Stock Bajo</option>
                    <option value="zero">⚫ Sin Stock</option>
                    <option value="ok">🟢 Stock OK</option>
                </select>

                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white font-mono"
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <div className="ml-auto text-xs text-gray-400">
                    {filteredData.length.toLocaleString()} de {materials.length.toLocaleString()} materiales
                </div>
            </div>

            {/* ═══ TUTORIAL GUIDE ═══ */}
            {showGuide && (
                <div className="px-6 py-4 bg-gradient-to-br from-blue-50 via-white to-yellow-50 border-b overflow-auto max-h-[60vh]">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <HelpCircle size={20} className="text-blue-500" />
                            ¿Cómo llenar este reporte?
                        </h3>

                        {/* Steps Flow */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* STEP 1 */}
                            <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span className="font-bold text-gray-800">Importar Materiales</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">
                                    Usa <code className="bg-blue-100 px-1.5 py-0.5 rounded font-bold text-blue-800">/nIMPORT</code> para cargar tu Excel de SAP con los datos maestros.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Columnas requeridas en tu Excel:</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>MATNR</b> — ID del material</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>MAKTX</b> — Descripción</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>LIFNR</b> — Proveedor</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>LABST</b> — Stock actual</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>STPRS</b> — Precio/Costo</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>MINBE</b> — Punto de reorden</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                            <span><b>MATKL</b> — Categoría/Grupo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2 */}
                            <div className="bg-white rounded-xl border-2 border-emerald-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span className="font-bold text-gray-800">Crear Pedidos de Compra</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">
                                    Usa <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-bold text-emerald-800">/nME21N</code> para registrar pedidos de compra. Las cantidades se acumularán automáticamente por mes.
                                </p>
                                <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Así se llenan las columnas:</p>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p>📦 <b>Compras Ene...Dic</b> → Se calculan del historial de pedidos (ME21N)</p>
                                        <p>📅 La fecha del pedido determina el mes</p>
                                        <p>🔢 La cantidad del ítem se suma al mes correspondiente</p>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3 */}
                            <div className="bg-white rounded-xl border-2 border-orange-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span className="font-bold text-gray-800">Crear Órdenes de Venta</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">
                                    Usa <code className="bg-orange-100 px-1.5 py-0.5 rounded font-bold text-orange-800">/nVA01</code> para registrar ventas. Igual que las compras, se acumulan por mes.
                                </p>
                                <div className="bg-orange-50 rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Así se llenan las columnas:</p>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p>🛒 <b>Ventas Ene...Dic</b> → Se calculan del historial de ventas (VA01)</p>
                                        <p>📅 La fecha de la orden determina el mes</p>
                                        <p>🔢 La cantidad vendida se suma al mes correspondiente</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Flow */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Flujo de datos del reporte</p>
                            <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                                    <FileSpreadsheet size={14} /> Excel SAP
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg font-bold">
                                    /nIMPORT
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                                <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-bold">
                                    Materiales cargados ✓
                                </div>
                                <span className="text-gray-300 mx-1">+</span>
                                <div className="bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                                    <ShoppingCart size={14} /> /nME21N
                                </div>
                                <span className="text-gray-300 mx-1">+</span>
                                <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                                    <Upload size={14} /> /nVA01
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                                <div className="bg-purple-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                                    <BarChart3 size={14} /> /nREPORT ✨
                                </div>
                            </div>
                        </div>

                        {/* ═══ READINESS CHECKER ═══ */}
                        <div className={`rounded-xl p-5 border-2 ${materials.length > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-4">
                                {/* Status indicators */}
                                <div className="flex-1">
                                    <div className="font-bold text-gray-700 uppercase text-xs mb-3">📋 Checklist de Preparación</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {materials.length > 0
                                                ? <CheckCircle2 size={18} className="text-green-500" />
                                                : <CircleAlert size={18} className="text-red-500" />
                                            }
                                            <span className={`text-sm font-bold ${materials.length > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {materials.length > 0
                                                    ? `✅ ${materials.length.toLocaleString()} materiales cargados`
                                                    : '❌ Sin materiales — Ejecuta /nIMPORT primero'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {purchaseOrders.length > 0
                                                ? <CheckCircle2 size={18} className="text-green-500" />
                                                : <CircleAlert size={18} className="text-yellow-500" />
                                            }
                                            <span className={`text-sm ${purchaseOrders.length > 0 ? 'font-bold text-green-700' : 'text-yellow-700'}`}>
                                                {purchaseOrders.length > 0
                                                    ? `✅ ${purchaseOrders.length} pedidos de compra registrados`
                                                    : '⚠️ Sin pedidos de compra — Columnas Compras Ene..Dic aparecerán vacías (usa /nME21N)'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {salesOrders.length > 0
                                                ? <CheckCircle2 size={18} className="text-green-500" />
                                                : <CircleAlert size={18} className="text-yellow-500" />
                                            }
                                            <span className={`text-sm ${salesOrders.length > 0 ? 'font-bold text-green-700' : 'text-yellow-700'}`}>
                                                {salesOrders.length > 0
                                                    ? `✅ ${salesOrders.length} órdenes de venta registradas`
                                                    : '⚠️ Sin órdenes de venta — Columnas Ventas Ene..Dic aparecerán vacías (usa /nVA01)'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    {materials.length > 0 ? (
                                        <>
                                            <div className="text-center mb-1">
                                                <span className="text-lg">🎉</span>
                                                <p className="text-sm font-bold text-green-700">¡Listo para generar!</p>
                                            </div>
                                            <button
                                                onClick={() => setShowGuide(false)}
                                                className="w-full bg-gradient-to-r from-[#0854A0] to-[#1873CC] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
                                            >
                                                <BarChart3 size={18} /> Ver Reporte Aquí
                                            </button>
                                            <button
                                                onClick={() => { handleExport(); }}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
                                            >
                                                <Download size={18} /> Exportar a Excel
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-3xl">📊</span>
                                            <p className="text-sm font-bold text-red-600 mt-2">Aún no hay datos</p>
                                            <p className="text-xs text-gray-500 mt-1">Importa tu Excel con <b>/nIMPORT</b> para comenzar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TABLE ═══ */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse min-w-[2200px]">
                    <thead className="sticky top-0 z-10">
                        {/* Group Headers */}
                        <tr className="bg-gray-800 text-white">
                            <th colSpan={6} className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-gray-700">
                                📋 Datos del Material
                            </th>
                            <th colSpan={3} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-gray-700">
                                💰 Precios
                            </th>
                            <th colSpan={12} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-gray-700 bg-emerald-800">
                                📦 Compras por Mes ({selectedYear})
                            </th>
                            <th colSpan={12} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-gray-700 bg-orange-800">
                                🛒 Ventas por Mes ({selectedYear})
                            </th>
                            <th colSpan={3} className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider bg-purple-800">
                                📊 Totales
                            </th>
                        </tr>

                        {/* Column Headers */}
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            {/* Material Data */}
                            <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap sticky left-0 bg-gray-100 z-20 min-w-[120px]" onClick={() => handleSort('id')}>
                                ID Material <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap min-w-[200px]" onClick={() => handleSort('descripcion')}>
                                Descripción <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap min-w-[120px]" onClick={() => handleSort('proveedor')}>
                                Proveedor <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap min-w-[80px]" onClick={() => handleSort('categoria')}>
                                Categoría
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('stock')}>
                                Stock <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                Pto. Reorden
                            </th>

                            {/* Prices */}
                            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('cost')}>
                                Costo <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                P. Venta
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-300 whitespace-nowrap">
                                Mrg%
                            </th>

                            {/* Purchase Months */}
                            {MONTHS.map((m, i) => (
                                <th key={`p${i}`} className="px-2 py-2 text-center font-bold text-emerald-700 border-r border-gray-200 whitespace-nowrap bg-emerald-50/50 w-[55px]">
                                    {m}
                                </th>
                            ))}

                            {/* Sales Months */}
                            {MONTHS.map((m, i) => (
                                <th key={`s${i}`} className="px-2 py-2 text-center font-bold text-orange-700 border-r border-gray-200 whitespace-nowrap bg-orange-50/50 w-[55px]">
                                    {m}
                                </th>
                            ))}

                            {/* Totals */}
                            <th className="px-3 py-2 text-right font-bold text-emerald-700 border-r border-gray-200 whitespace-nowrap bg-emerald-50 cursor-pointer hover:bg-emerald-100" onClick={() => handleSort('totalPurchases')}>
                                T.Comp <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-orange-700 border-r border-gray-200 whitespace-nowrap bg-orange-50 cursor-pointer hover:bg-orange-100" onClick={() => handleSort('totalSales')}>
                                T.Vent <ArrowUpDown size={10} className="inline" />
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-purple-700 whitespace-nowrap bg-purple-50 cursor-pointer hover:bg-purple-100" onClick={() => handleSort('rotation')}>
                                Rotación <ArrowUpDown size={10} className="inline" />
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.map((row, idx) => (
                            <tr key={row.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${row.stockStatus === 'zero' ? 'bg-red-50/30' :
                                row.stockStatus === 'low' ? 'bg-yellow-50/30' : ''
                                }`}>
                                {/* ID */}
                                <td className="px-3 py-1.5 font-mono font-bold text-[#0854A0] border-r border-gray-100 sticky left-0 bg-white z-10 whitespace-nowrap">
                                    {row.id}
                                </td>
                                {/* Description */}
                                <td className="px-3 py-1.5 text-gray-800 border-r border-gray-100 truncate max-w-[200px]" title={row.descripcion}>
                                    {row.descripcion}
                                </td>
                                {/* Vendor */}
                                <td className="px-3 py-1.5 text-gray-600 border-r border-gray-100 whitespace-nowrap">
                                    {row.proveedor}
                                </td>
                                {/* Category */}
                                <td className="px-3 py-1.5 border-r border-gray-100">
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600 whitespace-nowrap">
                                        {row.categoria}
                                    </span>
                                </td>
                                {/* Stock */}
                                <td className={`px-3 py-1.5 text-right border-r border-gray-100 font-bold ${row.stockStatus === 'zero' ? 'text-red-600 bg-red-50' :
                                    row.stockStatus === 'low' ? 'text-yellow-600 bg-yellow-50' :
                                        'text-gray-800'
                                    }`}>
                                    {row.stock.toLocaleString()}
                                    {row.stockStatus === 'low' && <CircleAlert size={10} className="inline ml-1 text-yellow-500" />}
                                    {row.stockStatus === 'zero' && <CircleAlert size={10} className="inline ml-1 text-red-500" />}
                                </td>
                                {/* Reorder Point */}
                                <td className="px-3 py-1.5 text-right text-gray-500 border-r border-gray-100">
                                    {row.reorder > 0 ? row.reorder.toLocaleString() : '—'}
                                </td>
                                {/* Cost */}
                                <td className="px-3 py-1.5 text-right text-gray-800 border-r border-gray-100 font-mono">
                                    {row.cost > 0 ? `$${row.cost.toLocaleString()}` : '—'}
                                </td>
                                {/* Sale Price */}
                                <td className="px-3 py-1.5 text-right text-gray-800 border-r border-gray-100 font-mono">
                                    {row.salePrice > 0 ? `$${row.salePrice.toLocaleString()}` : '—'}
                                </td>
                                {/* Margin */}
                                <td className={`px-3 py-1.5 text-right border-r border-gray-200 font-bold ${row.margin > 30 ? 'text-green-600' : row.margin > 0 ? 'text-gray-600' : 'text-gray-300'
                                    }`}>
                                    {row.margin > 0 ? `${row.margin}%` : '—'}
                                </td>

                                {/* Purchase Months */}
                                {MONTHS.map((_, i) => {
                                    const val = row.pMonths[i] || 0;
                                    return (
                                        <td key={`p${i}`} className={`px-2 py-1.5 text-center border-r border-gray-100 ${getCellBg(val)}`}>
                                            {val > 0 ? val : <span className="text-gray-200">·</span>}
                                        </td>
                                    );
                                })}

                                {/* Sales Months */}
                                {MONTHS.map((_, i) => {
                                    const val = row.sMonths[i] || 0;
                                    return (
                                        <td key={`s${i}`} className={`px-2 py-1.5 text-center border-r border-gray-100 ${getCellBg(val)}`}>
                                            {val > 0 ? val : <span className="text-gray-200">·</span>}
                                        </td>
                                    );
                                })}

                                {/* Total Purchases */}
                                <td className={`px-3 py-1.5 text-right border-r border-gray-100 font-bold bg-emerald-50/30 ${row.totalPurchases > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                                    {row.totalPurchases > 0 ? row.totalPurchases.toLocaleString() : '—'}
                                </td>
                                {/* Total Sales */}
                                <td className={`px-3 py-1.5 text-right border-r border-gray-100 font-bold bg-orange-50/30 ${row.totalSales > 0 ? 'text-orange-700' : 'text-gray-300'}`}>
                                    {row.totalSales > 0 ? row.totalSales.toLocaleString() : '—'}
                                </td>
                                {/* Rotation */}
                                <td className={`px-3 py-1.5 text-right font-bold bg-purple-50/30 ${parseFloat(row.rotation) > 2 ? 'text-purple-700' : parseFloat(row.rotation) > 0 ? 'text-purple-400' : 'text-gray-300'}`}>
                                    {parseFloat(row.rotation) > 0 ? `${row.rotation}x` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    {/* Footer with monthly totals */}
                    <tfoot className="sticky bottom-0">
                        <tr className="bg-gray-800 text-white font-bold">
                            <td className="px-3 py-2 sticky left-0 bg-gray-800 z-20" colSpan={5}>
                                TOTALES ({filteredData.length.toLocaleString()} materiales)
                            </td>
                            <td className="px-3 py-2 text-right border-r border-gray-700"></td>
                            <td className="px-3 py-2 text-right border-r border-gray-700"></td>
                            <td className="px-3 py-2 text-right border-r border-gray-700"></td>
                            <td className="px-3 py-2 text-right border-r border-gray-700"></td>

                            {/* Monthly purchase totals */}
                            {MONTHS.map((_, i) => (
                                <td key={`tp${i}`} className="px-2 py-2 text-center border-r border-gray-700 text-emerald-300 bg-emerald-900/30">
                                    {summary.monthlyPurchases[i] > 0 ? summary.monthlyPurchases[i].toLocaleString() : '·'}
                                </td>
                            ))}

                            {/* Monthly sales totals */}
                            {MONTHS.map((_, i) => (
                                <td key={`ts${i}`} className="px-2 py-2 text-center border-r border-gray-700 text-orange-300 bg-orange-900/30">
                                    {summary.monthlySales[i] > 0 ? summary.monthlySales[i].toLocaleString() : '·'}
                                </td>
                            ))}

                            <td className="px-3 py-2 text-right border-r border-gray-700 text-emerald-300">
                                {summary.totalPurchases.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right border-r border-gray-700 text-orange-300">
                                {summary.totalSales.toLocaleString()}
                            </td>
                            <td className="px-3 py-2"></td>
                        </tr>
                    </tfoot>
                </table>

                {filteredData.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-bold">No hay datos</p>
                        <p className="text-sm mt-2">Importa tus materiales con <code className="bg-gray-100 px-2 py-0.5 rounded">/nIMPORT</code> para generar el reporte</p>
                    </div>
                )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="bg-white border-t px-6 py-2 flex items-center justify-between text-xs text-gray-400">
                <span>Reporte generado: {new Date().toLocaleString('es-VE')}</span>
                <span>Scroll horizontal → para ver compras y ventas por mes</span>
            </div>
        </div>
    );
}
