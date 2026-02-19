import { useState, useMemo } from 'react';
import {
    ChevronUp, ChevronDown, Filter, Download, RefreshCw,
    CheckSquare, Square, TriangleAlert, CircleAlert,
    Package, Copy, TrendingDown, Ban
} from 'lucide-react';

// Status icons and colors
const STATUS_CONFIG = {
    active: { icon: null, color: 'text-[#107E3E]', bg: 'bg-[#E8F5E9]', label: 'Activo' },
    duplicate: { icon: Copy, color: 'text-[#856404]', bg: 'bg-[#FFF3CD]', label: 'Duplicado' },
    low_stock: { icon: TrendingDown, color: 'text-[#BB0000]', bg: 'bg-[#FFEBEE]', label: 'Stock Bajo' },
    discontinued: { icon: Ban, color: 'text-[#6A6D70]', bg: 'bg-[#E0E0E0]', label: 'Descontinuado' },
    missing_data: { icon: CircleAlert, color: 'text-[#E9730C]', bg: 'bg-[#FFF3E0]', label: 'Datos Faltantes' },
    overweight: { icon: TriangleAlert, color: 'text-[#BB0000]', bg: 'bg-[#FFEBEE]', label: 'Sobrepeso' }
};

const COLUMNS = [
    { key: 'select', label: '', width: 40, sortable: false },
    { key: 'status_icon', label: '!', width: 35, sortable: false },
    { key: 'id', label: 'ID Material', width: 110, sortable: true },
    { key: 'ean', label: 'EAN', width: 130, sortable: true },
    { key: 'descripcion', label: 'Descripción', width: 280, sortable: true },
    { key: 'marca', label: 'Marca', width: 100, sortable: true },
    { key: 'categoria', label: 'Categoría', width: 140, sortable: true },
    { key: 'pesoNeto', label: 'Peso Neto', width: 90, sortable: true, align: 'right', unit: 'kg' },
    { key: 'pesoBruto', label: 'Peso Bruto', width: 90, sortable: true, align: 'right', unit: 'kg' },
    { key: 'largo', label: 'L (cm)', width: 70, sortable: true, align: 'right' },
    { key: 'ancho', label: 'A (cm)', width: 70, sortable: true, align: 'right' },
    { key: 'alto', label: 'H (cm)', width: 70, sortable: true, align: 'right' },
    { key: 'stockActual', label: 'Stock', width: 70, sortable: true, align: 'right' },
    { key: 'puntoReorden', label: 'P.Reorden', width: 80, sortable: true, align: 'right' },
    { key: 'status', label: 'Estado', width: 110, sortable: true }
];

export default function ALVGrid({
    data,
    onRowClick,
    onRowDoubleClick,
    onSelectionChange,
    onExport,
    onRefresh,
    title = 'Lista de Materiales',
    loading = false
}) {
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [filter, setFilter] = useState('');
    const [visibleColumns, setVisibleColumns] = useState(COLUMNS.map(c => c.key));
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Sort function
    const handleSort = (key) => {
        const column = COLUMNS.find(c => c.key === key);
        if (!column?.sortable) return;

        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter and sort data
    const processedData = useMemo(() => {
        let result = [...data];

        // Filter
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            result = result.filter(item =>
                item.id?.toLowerCase().includes(lowerFilter) ||
                item.ean?.toLowerCase().includes(lowerFilter) ||
                item.descripcion?.toLowerCase().includes(lowerFilter) ||
                item.marca?.toLowerCase().includes(lowerFilter) ||
                item.categoria?.toLowerCase().includes(lowerFilter)
            );
        }

        // Sort
        result.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = typeof aVal === 'string'
                ? aVal.localeCompare(bVal)
                : aVal - bVal;

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [data, filter, sortConfig]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = page * pageSize;
        return processedData.slice(start, start + pageSize);
    }, [processedData, page]);

    const totalPages = Math.ceil(processedData.length / pageSize);

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(paginatedData.map(p => p.id)));
        }
        onSelectionChange?.(selectedRows);
    };

    const toggleRow = (id) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
        onSelectionChange?.(newSelected);
    };

    // Get row class based on status
    const getRowClass = (item) => {
        const classes = ['cursor-pointer'];
        if (selectedRows.has(item.id)) classes.push('selected');
        if (item.status === 'duplicate') classes.push('duplicate');
        if (item.status === 'low_stock') classes.push('low-stock');
        if (item.status === 'discontinued') classes.push('discontinued');
        return classes.join(' ');
    };

    // Render cell value
    const renderCell = (item, column) => {
        const value = item[column.key];

        switch (column.key) {
            case 'select':
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleRow(item.id); }}
                        className="p-1"
                    >
                        {selectedRows.has(item.id)
                            ? <CheckSquare size={14} className="text-[#0854A0]" />
                            : <Square size={14} className="text-[#C4C4C4]" />
                        }
                    </button>
                );

            case 'status_icon':
                const hasAlert = item.alertas?.length > 0 || item.status !== 'active';
                if (hasAlert) {
                    return (
                        <div className="flex items-center justify-center" title={item.alertas?.join('\n') || item.status}>
                            <TriangleAlert size={14} className={
                                item.status === 'duplicate' ? 'text-[#856404]' :
                                    item.status === 'low_stock' ? 'text-[#BB0000]' :
                                        'text-[#E9730C]'
                            } />
                        </div>
                    );
                }
                return null;

            case 'status':
                const config = STATUS_CONFIG[value] || STATUS_CONFIG.active;
                const Icon = config.icon;
                return (
                    <span className={`status-badge ${config.bg} ${config.color}`}>
                        {Icon && <Icon size={12} />}
                        {config.label}
                    </span>
                );

            case 'pesoNeto':
            case 'pesoBruto':
                if (value === null) return <span className="text-[#C4C4C4]">—</span>;
                const isOverweight = column.key === 'pesoNeto' && value > 50;
                return (
                    <span className={isOverweight ? 'text-[#BB0000] font-semibold' : ''}>
                        {value?.toFixed(2)} {column.unit}
                        {isOverweight && <TriangleAlert size={12} className="inline ml-1" />}
                    </span>
                );

            case 'stockActual':
                const isLowStock = value < item.puntoReorden;
                return (
                    <span className={isLowStock ? 'text-[#BB0000] font-semibold' : ''}>
                        {value}
                        {isLowStock && <TrendingDown size={12} className="inline ml-1" />}
                    </span>
                );

            case 'largo':
            case 'ancho':
            case 'alto':
                if (value === null) return <span className="text-[#C4C4C4]">—</span>;
                return value;

            default:
                return value ?? <span className="text-[#C4C4C4]">—</span>;
        }
    };

    return (
        <div className="alv-grid">
            {/* Toolbar */}
            <div className="alv-toolbar">
                <div className="flex items-center gap-2 flex-1">
                    <Package size={16} className="text-[#0854A0]" />
                    <span className="font-semibold text-[#32363A]">{title}</span>
                    <span className="text-sm text-[#6A6D70]">
                        ({processedData.length.toLocaleString()} registros
                        {selectedRows.size > 0 && `, ${selectedRows.size} seleccionados`})
                    </span>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Filter size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6A6D70]" />
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                            placeholder="Filtrar..."
                            className="pl-7 pr-3 py-1 text-sm border border-[#C4C4C4] rounded w-48"
                        />
                    </div>

                    <button onClick={onRefresh} className="sap-btn sap-btn-secondary" title="Actualizar">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => onExport?.(Array.from(selectedRows).length > 0
                            ? data.filter(d => selectedRows.has(d.id))
                            : data
                        )}
                        className="sap-btn sap-btn-secondary"
                        title="Exportar a Excel"
                    >
                        <Download size={14} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-auto max-h-[calc(100vh-250px)]">
                <table className="alv-table">
                    <thead>
                        <tr>
                            {COLUMNS.filter(c => visibleColumns.includes(c.key)).map(column => (
                                <th
                                    key={column.key}
                                    style={{ width: column.width, minWidth: column.width }}
                                    onClick={() => handleSort(column.key)}
                                    className={column.sortable ? 'cursor-pointer' : ''}
                                >
                                    <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`}>
                                        {column.key === 'select' ? (
                                            <button onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}>
                                                {selectedRows.size === paginatedData.length && paginatedData.length > 0
                                                    ? <CheckSquare size={14} className="text-[#0854A0]" />
                                                    : <Square size={14} className="text-[#C4C4C4]" />
                                                }
                                            </button>
                                        ) : (
                                            <>
                                                {column.label}
                                                {sortConfig.key === column.key && (
                                                    sortConfig.direction === 'asc'
                                                        ? <ChevronUp size={14} />
                                                        : <ChevronDown size={14} />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="text-center py-8">
                                    <div className="loading-spinner mx-auto mb-2" />
                                    <span className="text-[#6A6D70]">Cargando materiales...</span>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="text-center py-8 text-[#6A6D70]">
                                    No se encontraron materiales
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map(item => (
                                <tr
                                    key={item.id}
                                    className={getRowClass(item)}
                                    onClick={() => onRowClick?.(item)}
                                    onDoubleClick={() => onRowDoubleClick?.(item)}
                                >
                                    {COLUMNS.filter(c => visibleColumns.includes(c.key)).map(column => (
                                        <td
                                            key={column.key}
                                            className={column.align === 'right' ? 'text-right' : ''}
                                            style={{ maxWidth: column.width }}
                                        >
                                            <div className="truncate">
                                                {renderCell(item, column)}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#F2F2F2] border-t border-[#C4C4C4]">
                <span className="text-sm text-[#6A6D70]">
                    Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, processedData.length)} de {processedData.length.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        className="sap-btn sap-btn-ghost disabled:opacity-50"
                    >
                        ⟨⟨
                    </button>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="sap-btn sap-btn-ghost disabled:opacity-50"
                    >
                        ⟨
                    </button>
                    <span className="text-sm">
                        Página {page + 1} de {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="sap-btn sap-btn-ghost disabled:opacity-50"
                    >
                        ⟩
                    </button>
                    <button
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                        className="sap-btn sap-btn-ghost disabled:opacity-50"
                    >
                        ⟩⟩
                    </button>
                </div>
            </div>
        </div>
    );
}
