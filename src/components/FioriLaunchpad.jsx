import { useState } from 'react';
import {
    Package, ShoppingCart, Truck, FileText, BarChart2,
    Warehouse, DollarSign, Users, Settings, Database,
    Box, AlertTriangle, TrendingDown, Scale, Search,
    Grid, Home, Star, Clock, ChevronRight
} from 'lucide-react';

// SAP Fiori Tile Groups - Organized like real SAP Fiori Launchpad
const TILE_GROUPS = [
    {
        id: 'mm',
        title: 'Gestión de Materiales',
        subtitle: 'MM - Materials Management',
        tiles: [
            {
                id: 'mm01',
                code: '/nMM01',
                title: 'Crear Material',
                subtitle: 'Nuevo registro maestro',
                icon: Package,
                color: '#0854A0',
                count: null
            },
            {
                id: 'mm02',
                code: '/nMM02',
                title: 'Modificar Material',
                subtitle: 'Editar datos existentes',
                icon: Package,
                color: '#1873CC',
                count: null
            },
            {
                id: 'mm03',
                code: '/nMM03',
                title: 'Visualizar Material',
                subtitle: 'Ver lista completa',
                icon: Search,
                color: '#107E3E',
                count: '36K'
            },
            {
                id: 'mmbe',
                code: '/nMMBE',
                title: 'Resumen Stocks',
                subtitle: 'Inventario por almacén',
                icon: Warehouse,
                color: '#E9730C',
                count: null
            },
        ]
    },
    {
        id: 'sd',
        title: 'Ventas y Distribución',
        subtitle: 'SD - Sales & Distribution',
        tiles: [
            {
                id: 'va01',
                code: '/nVA01',
                title: 'Crear Pedido',
                subtitle: 'Pedido de venta estándar',
                icon: ShoppingCart,
                color: '#0854A0',
                count: null
            },
            {
                id: 'va02',
                code: '/nVA02',
                title: 'Modificar Pedido',
                subtitle: 'Cambiar pedido existente',
                icon: FileText,
                color: '#1873CC',
                count: null
            },
            {
                id: 'va03',
                code: '/nVA03',
                title: 'Visualizar Pedido',
                subtitle: 'Ver detalles de pedido',
                icon: Search,
                color: '#107E3E',
                count: null
            },
            {
                id: 'vl01n',
                code: '/nVL01N',
                title: 'Crear Entrega',
                subtitle: 'Generar entrega',
                icon: Truck,
                color: '#E9730C',
                count: null
            },
        ]
    },
    {
        id: 'analytics',
        title: 'Análisis y Reportes',
        subtitle: 'Dakafacil Analytics',
        tiles: [
            {
                id: 'dup',
                code: '/nDUP',
                title: 'Duplicados',
                subtitle: 'Materiales duplicados',
                icon: AlertTriangle,
                color: '#BB0000',
                count: '0'
            },
            {
                id: 'reord',
                code: '/nREORD',
                title: 'Punto Reorden',
                subtitle: 'Stock bajo mínimo',
                icon: TrendingDown,
                color: '#E9730C',
                count: null
            },
            {
                id: 'overw',
                code: '/nOVERW',
                title: 'Sobrepeso',
                subtitle: 'Materiales >50kg',
                icon: Scale,
                color: '#BB0000',
                count: null
            },
            {
                id: 'pack',
                code: '/nPACK',
                title: 'Modelo Empaque',
                subtitle: 'Cálculo de empaque',
                icon: Box,
                color: '#0854A0',
                count: null
            },
        ]
    },
    {
        id: 'system',
        title: 'Herramientas',
        subtitle: 'System Administration',
        tiles: [
            {
                id: 'se16',
                code: '/nSE16',
                title: 'Data Browser',
                subtitle: 'Consultar tablas SQL',
                icon: Database,
                color: '#354A5F',
                count: null
            },
            {
                id: 'su01',
                code: '/nSU01',
                title: 'Usuarios',
                subtitle: 'Gestión de usuarios',
                icon: Users,
                color: '#354A5F',
                count: null
            },
        ]
    }
];

export default function FioriLaunchpad({ onExecuteTransaction, onClose, stats = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState(['mm01', 'mm03', 'va01']);

    const handleTileClick = (tile) => {
        onExecuteTransaction(tile.code);
        onClose();
    };

    const toggleFavorite = (e, tileId) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(tileId)
                ? prev.filter(f => f !== tileId)
                : [...prev, tileId]
        );
    };

    // Filter tiles based on search
    const filteredGroups = TILE_GROUPS.map(group => ({
        ...group,
        tiles: group.tiles.filter(tile =>
            tile.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tile.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tile.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.tiles.length > 0);

    // Get favorite tiles
    const favoriteTiles = TILE_GROUPS.flatMap(g => g.tiles).filter(t => favorites.includes(t.id));

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #354A5F 0%, #1a2634 100%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Grid size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">SAP Fiori Launchpad</h1>
                        <p className="text-sm text-white/60">Dakafacil Training Simulator</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar apps..."
                            className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 w-64 focus:outline-none focus:border-white/40"
                        />
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="overflow-auto h-[calc(100vh-80px)] p-6">
                {/* Favorites Section */}
                {favoriteTiles.length > 0 && !searchTerm && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                            <h2 className="text-lg font-semibold text-white">Favoritos</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {favoriteTiles.map(tile => (
                                <TileCard
                                    key={tile.id}
                                    tile={tile}
                                    onClick={() => handleTileClick(tile)}
                                    isFavorite={true}
                                    onToggleFavorite={(e) => toggleFavorite(e, tile.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tile Groups */}
                {filteredGroups.map(group => (
                    <div key={group.id} className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-white">{group.title}</h2>
                            <span className="text-sm text-white/50">• {group.subtitle}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {group.tiles.map(tile => (
                                <TileCard
                                    key={tile.id}
                                    tile={tile}
                                    onClick={() => handleTileClick(tile)}
                                    isFavorite={favorites.includes(tile.id)}
                                    onToggleFavorite={(e) => toggleFavorite(e, tile.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* No results */}
                {filteredGroups.length === 0 && (
                    <div className="text-center py-16">
                        <Search size={48} className="mx-auto text-white/30 mb-4" />
                        <p className="text-white/60">No se encontraron aplicaciones</p>
                    </div>
                )}

                {/* Quick Tips */}
                <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 mb-2">💡 Tip de SAP</h3>
                    <p className="text-sm text-white/60">
                        También puedes escribir códigos de transacción directamente: <code className="bg-white/10 px-2 py-0.5 rounded">MM01</code>, <code className="bg-white/10 px-2 py-0.5 rounded">VA01</code>, <code className="bg-white/10 px-2 py-0.5 rounded">SE16</code>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Tile Card Component
function TileCard({ tile, onClick, isFavorite, onToggleFavorite }) {
    const Icon = tile.icon;

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            style={{ minHeight: '140px' }}
        >
            {/* Favorite button */}
            <button
                onClick={onToggleFavorite}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Star
                    size={16}
                    className={isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-500"}
                />
            </button>

            {/* Icon */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: tile.color + '15' }}
            >
                <Icon size={20} style={{ color: tile.color }} />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{tile.title}</h3>
            <p className="text-xs text-gray-500 mb-2">{tile.subtitle}</p>

            {/* Transaction code */}
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-mono text-gray-400">{tile.code}</span>
                {tile.count && (
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: tile.color + '20', color: tile.color }}
                    >
                        {tile.count}
                    </span>
                )}
            </div>

            {/* Hover indicator */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: tile.color }}
            />
        </div>
    );
}
