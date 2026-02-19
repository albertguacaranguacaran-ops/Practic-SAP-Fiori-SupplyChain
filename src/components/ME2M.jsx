import { useState, useMemo } from 'react';
import {
    X, Search, Filter, Package, ArrowUpDown, FileText,
    CircleCheck, Clock, CircleAlert, Download, Eye,
    ShoppingCart, Truck, ChevronDown
} from 'lucide-react';

/*
 * ══════════════════════════════════════════════════════════════
 *   /nME2M — PURCHASE ORDERS BY MATERIAL
 *   SAP Standard: Lista de pedidos por material (EKKO/EKPO)
 * ══════════════════════════════════════════════════════════════
 */

const STATUS_MAP = {
    'Hold': { label: 'Retenido', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    'Released': { label: 'Liberado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CircleCheck },
    'Received': { label: 'Recibido', color: 'bg-green-100 text-green-800 border-green-200', icon: Package },
};

export default function ME2M({ purchaseOrders = [], materials = [], vendors = [], onClose, showStatus }) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [sortCol, setSortCol] = useState('BEDAT');
    const [sortDir, setSortDir] = useState('desc');
    const [expandedPO, setExpandedPO] = useState(null);
    const [viewMode, setViewMode] = useState('byMaterial'); // 'byMaterial' | 'byPO'

    // ═══════════════════════════════════════════
    //  FLATTEN PO ITEMS & ENRICH WITH MATERIAL DATA
    // ═══════════════════════════════════════════
    const materialMap = useMemo(() => {
        const map = {};
        materials.forEach(m => { map[m.id] = m; });
        return map;
    }, [materials]);

    // View: By Material — Flatten all PO items grouped by material
    const byMaterialData = useMemo(() => {
        const grouped = {}; // materialId -> [{ po fields + item fields }]

        purchaseOrders.forEach(po => {
            (po.ITEMS || []).forEach(item => {
                const matId = item.MATNR || '—';
                if (!grouped[matId]) grouped[matId] = [];
                grouped[matId].push({
                    EBELN: po.EBELN,
                    EBELP: item.EBELP,
                    MATNR: matId,
                    MAKTX: materialMap[matId]?.descripcion || '—',
                    LIFNR: po.LIFNR || '—',
                    MENGE: item.MENGE || 0,
                    NETPR: item.NETPR || 0,
                    NETWR: (item.MENGE || 0) * (item.NETPR || 0),
                    WERKS: item.WERKS || '—',
                    LGORT: item.LGORT || '—',
                    BEDAT: po.BEDAT || '—',
                    WAERS: po.WAERS || 'USD',
                    STATUS: po.STATUS || 'Hold',
                    BSART: po.BSART || 'NB',
                });
            });
        });

        return grouped;
    }, [purchaseOrders, materialMap]);

    // View: By PO — Standard PO list
    const byPOData = useMemo(() => {
        return purchaseOrders.map(po => ({
            ...po,
            itemCount: (po.ITEMS || []).length,
            vendorName: po.LIFNR || '—',
        }));
    }, [purchaseOrders]);

    // ═══════════════════════════════════════════
    //  FLAT LIST FOR TABLE (by material view)
    // ═══════════════════════════════════════════
    const flatList = useMemo(() => {
        const rows = [];
        Object.entries(byMaterialData).forEach(([matId, items]) => {
            items.forEach(item => rows.push(item));
        });
        return rows;
    }, [byMaterialData]);

    // ═══════════════════════════════════════════
    //  FILTERS & SORT
    // ═══════════════════════════════════════════
    const filteredRows = useMemo(() => {
        let data = viewMode === 'byMaterial' ? [...flatList] : [...byPOData];

        if (search) {
            const q = search.toLowerCase();
            if (viewMode === 'byMaterial') {
                data = data.filter(r =>
                    r.MATNR.toLowerCase().includes(q) ||
                    r.MAKTX.toLowerCase().includes(q) ||
                    r.EBELN.includes(q) ||
                    r.LIFNR.toLowerCase().includes(q)
                );
            } else {
                data = data.filter(r =>
                    r.EBELN.includes(q) ||
                    (r.LIFNR || '').toLowerCase().includes(q)
                );
            }
        }

        if (filterStatus) {
            data = data.filter(r => r.STATUS === filterStatus);
        }

        if (filterVendor) {
            data = data.filter(r => (r.LIFNR || '') === filterVendor);
        }

        // Sort
        data.sort((a, b) => {
            let valA = a[sortCol], valB = b[sortCol];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [flatList, byPOData, viewMode, search, filterStatus, filterVendor, sortCol, sortDir]);

    // Summary stats
    const summary = useMemo(() => {
        const totalPOs = new Set(flatList.map(r => r.EBELN)).size;
        const totalItems = flatList.length;
        const totalValue = flatList.reduce((s, r) => s + r.NETWR, 0);
        const uniqueMaterials = new Set(flatList.map(r => r.MATNR)).size;
        const uniqueVendors = new Set(flatList.map(r => r.LIFNR)).size;
        const statusCounts = {
            Hold: flatList.filter(r => r.STATUS === 'Hold').length,
            Released: flatList.filter(r => r.STATUS === 'Released').length,
            Received: flatList.filter(r => r.STATUS === 'Received').length,
        };
        return { totalPOs, totalItems, totalValue, uniqueMaterials, uniqueVendors, statusCounts };
    }, [flatList]);

    // Available vendors for filter
    const vendorList = useMemo(() => [...new Set(flatList.map(r => r.LIFNR).filter(Boolean))], [flatList]);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const renderStatus = (status) => {
        const cfg = STATUS_MAP[status] || STATUS_MAP['Hold'];
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.color}`}>
                <Icon size={10} /> {cfg.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F0F2F5] flex flex-col">
            {/* ═══ HEADER ═══ */}
            <div className="bg-gradient-to-r from-[#354A5F] to-[#2C3E50] text-white px-6 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">ME2M — Pedidos por Material</h2>
                        <p className="text-xs text-white/60">Lista de pedidos de compra agrupados por material (EKKO/EKPO)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-white/10 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('byMaterial')}
                            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${viewMode === 'byMaterial' ? 'bg-white text-[#354A5F]' : 'text-white/70 hover:text-white'}`}
                        >
                            Por Material
                        </button>
                        <button
                            onClick={() => setViewMode('byPO')}
                            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${viewMode === 'byPO' ? 'bg-white text-[#354A5F]' : 'text-white/70 hover:text-white'}`}
                        >
                            Por Pedido
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg cursor-pointer">
                        <X size={20} className="text-white/60 hover:text-white" />
                    </button>
                </div>
            </div>

            {/* ═══ SUMMARY ═══ */}
            <div className="px-6 py-3 bg-white border-b flex items-center gap-4 overflow-x-auto">
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 min-w-[110px]">
                    <div className="text-xs text-gray-500">Pedidos</div>
                    <div className="text-xl font-black text-[#0854A0]">{summary.totalPOs}</div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 min-w-[110px]">
                    <div className="text-xs text-gray-500">Posiciones</div>
                    <div className="text-xl font-black text-gray-700">{summary.totalItems}</div>
                </div>
                <div className="bg-green-50 rounded-xl px-4 py-2.5 min-w-[130px]">
                    <div className="text-xs text-gray-500">Valor Total</div>
                    <div className="text-xl font-black text-green-600">${summary.totalValue.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 rounded-xl px-4 py-2.5 min-w-[110px]">
                    <div className="text-xs text-gray-500">Materiales</div>
                    <div className="text-xl font-black text-purple-600">{summary.uniqueMaterials}</div>
                </div>
                <div className="bg-orange-50 rounded-xl px-4 py-2.5 min-w-[110px]">
                    <div className="text-xs text-gray-500">Proveedores</div>
                    <div className="text-xl font-black text-orange-600">{summary.uniqueVendors}</div>
                </div>

                {/* Status pills */}
                <div className="ml-auto flex items-center gap-2">
                    {Object.entries(summary.statusCounts).map(([status, count]) => {
                        if (count === 0) return null;
                        const cfg = STATUS_MAP[status];
                        return (
                            <span key={status} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${cfg.color}`}>
                                {cfg.label}: {count}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="px-6 py-2.5 bg-white border-b flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por material, pedido, proveedor..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0854A0]"
                    />
                </div>

                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Todos los Status</option>
                    <option value="Hold">🟡 Retenido</option>
                    <option value="Released">🔵 Liberado</option>
                    <option value="Received">🟢 Recibido</option>
                </select>

                <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Todos Proveedores</option>
                    {vendorList.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <div className="ml-auto text-xs text-gray-400">
                    {filteredRows.length} {viewMode === 'byMaterial' ? 'posiciones' : 'pedidos'}
                </div>
            </div>

            {/* ═══ TABLE ═══ */}
            <div className="flex-1 overflow-auto">
                {viewMode === 'byMaterial' ? (
                    /* ─── BY MATERIAL VIEW ─── */
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('MATNR')}>
                                    Material <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap min-w-[180px]">
                                    Descripción
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('EBELN')}>
                                    Nº Pedido <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                    Pos
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('LIFNR')}>
                                    Proveedor <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('MENGE')}>
                                    Cantidad <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('NETPR')}>
                                    Precio <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('NETWR')}>
                                    Valor Neto <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                    Mon.
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                    Centro
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                    Almacén
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('BEDAT')}>
                                    Fecha <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-center font-bold text-gray-700 whitespace-nowrap">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row, idx) => (
                                <tr key={`${row.EBELN}-${row.EBELP}-${idx}`} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="px-3 py-2 font-mono font-bold text-[#0854A0] border-r border-gray-100 whitespace-nowrap">{row.MATNR}</td>
                                    <td className="px-3 py-2 text-gray-700 border-r border-gray-100 truncate max-w-[180px]" title={row.MAKTX}>{row.MAKTX}</td>
                                    <td className="px-3 py-2 font-mono text-gray-600 border-r border-gray-100 whitespace-nowrap">{row.EBELN}</td>
                                    <td className="px-3 py-2 text-gray-500 border-r border-gray-100 text-center">{row.EBELP}</td>
                                    <td className="px-3 py-2 text-gray-600 border-r border-gray-100 whitespace-nowrap">{row.LIFNR}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-800 border-r border-gray-100">{row.MENGE.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-gray-700 border-r border-gray-100 font-mono">${row.NETPR.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-800 border-r border-gray-100 font-mono">${row.NETWR.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-gray-500 border-r border-gray-100">{row.WAERS}</td>
                                    <td className="px-3 py-2 text-gray-500 border-r border-gray-100">{row.WERKS}</td>
                                    <td className="px-3 py-2 text-gray-500 border-r border-gray-100">{row.LGORT}</td>
                                    <td className="px-3 py-2 text-gray-600 border-r border-gray-100 font-mono whitespace-nowrap">{row.BEDAT}</td>
                                    <td className="px-3 py-2 text-center">{renderStatus(row.STATUS)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    /* ─── BY PO VIEW ─── */
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('EBELN')}>
                                    Nº Pedido <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200">Tipo</th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('LIFNR')}>
                                    Proveedor <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-200">Posiciones</th>
                                <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('NETWR')}>
                                    Valor Neto <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200">Moneda</th>
                                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('BEDAT')}>
                                    Fecha Doc <ArrowUpDown size={10} className="inline" />
                                </th>
                                <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-r border-gray-200">Status</th>
                                <th className="px-3 py-2.5 text-center font-bold text-gray-700">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((po, idx) => (
                                <>
                                    <tr key={po.EBELN} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                        onClick={() => setExpandedPO(expandedPO === po.EBELN ? null : po.EBELN)}>
                                        <td className="px-3 py-2.5 font-mono font-bold text-[#0854A0] border-r border-gray-100">{po.EBELN}</td>
                                        <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">{po.BSART || 'NB'}</td>
                                        <td className="px-3 py-2.5 text-gray-700 border-r border-gray-100">{po.LIFNR || '—'}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700 border-r border-gray-100 font-bold">{po.itemCount}</td>
                                        <td className="px-3 py-2.5 text-right font-bold text-gray-800 border-r border-gray-100 font-mono">${(po.NETWR || 0).toLocaleString()}</td>
                                        <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">{po.WAERS || 'USD'}</td>
                                        <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100 font-mono">{po.BEDAT || '—'}</td>
                                        <td className="px-3 py-2.5 text-center border-r border-gray-100">{renderStatus(po.STATUS)}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <ChevronDown size={14} className={`inline transition-transform ${expandedPO === po.EBELN ? 'rotate-180' : ''}`} />
                                        </td>
                                    </tr>
                                    {/* Expanded item rows */}
                                    {expandedPO === po.EBELN && (po.ITEMS || []).map((item, ii) => (
                                        <tr key={`${po.EBELN}-${ii}`} className="bg-blue-50/30 border-b border-blue-100">
                                            <td className="px-3 py-1.5 pl-8 text-gray-400 border-r border-gray-100">└ Pos {item.EBELP || ii + 1}</td>
                                            <td className="px-3 py-1.5 border-r border-gray-100"></td>
                                            <td className="px-3 py-1.5 border-r border-gray-100 font-mono text-[#0854A0] font-bold" colSpan={2}>
                                                {item.MATNR || '—'} — {materialMap[item.MATNR]?.descripcion || ''}
                                            </td>
                                            <td className="px-3 py-1.5 text-right border-r border-gray-100">
                                                <span className="font-bold">{(item.MENGE || 0).toLocaleString()}</span> × ${(item.NETPR || 0).toLocaleString()} = <span className="font-bold">${((item.MENGE || 0) * (item.NETPR || 0)).toLocaleString()}</span>
                                            </td>
                                            <td className="px-3 py-1.5 border-r border-gray-100"></td>
                                            <td className="px-3 py-1.5 text-gray-500 border-r border-gray-100">{item.WERKS || '—'} / {item.LGORT || '—'}</td>
                                            <td className="px-3 py-1.5 border-r border-gray-100" colSpan={2}></td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}

                {filteredRows.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-bold">No hay pedidos de compra</p>
                        <p className="text-sm mt-2">
                            Crea pedidos con <code className="bg-gray-100 px-2 py-0.5 rounded">/nME21N</code> para verlos aquí
                        </p>
                    </div>
                )}
            </div>

            {/* ═══ STATUS BAR ═══ */}
            <div className="bg-white border-t px-6 py-2 flex items-center justify-between text-xs text-gray-400">
                <span>Tabla: EKKO / EKPO — {filteredRows.length} registros</span>
                <span>Vista: {viewMode === 'byMaterial' ? 'Por Material' : 'Por Pedido'}</span>
            </div>
        </div>
    );
}
