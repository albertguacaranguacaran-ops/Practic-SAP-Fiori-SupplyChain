import { useState, useRef, useEffect } from 'react';
import {
    Terminal, Play, Clock, Search, HelpCircle,
    ChevronDown, Star, History
} from 'lucide-react';

// SAP Transaction definitions with realistic codes and descriptions
const TRANSACTIONS = {
    // Material Master (MM)
    '/nMM01': { name: 'Crear Material', module: 'MM', description: 'Crear nuevo registro de material' },
    '/nMM02': { name: 'Modificar Material', module: 'MM', description: 'Modificar datos de material existente' },
    '/nMM03': { name: 'Visualizar Material', module: 'MM', description: 'Visualizar datos de material (solo lectura)' },
    '/nMM04': { name: 'Modificaciones Material', module: 'MM', description: 'Ver historial de cambios' },
    '/nMM60': { name: 'Lista Precios', module: 'MM', description: 'Análisis de precios de materiales' },
    '/nMMBE': { name: 'Resumen Stocks', module: 'MM', description: 'Resumen de stocks por material' },

    // Warehouse/Logistics
    '/nMIGO': { name: 'Movigo Mercancía', module: 'MM', description: 'Entrada/Salida de mercancías' },
    '/nXK01': { name: 'Crear Acreedor', module: 'MM', description: 'Crear acreedor (Central)' },
    '/nLT01': { name: 'Crear Transfer.', module: 'WM', description: 'Crear orden de transferencia' },
    '/nLT21': { name: 'Visual. Transfer.', module: 'WM', description: 'Visualizar órdenes de transferencia' },

    // Sales (SD)
    '/nVA01': { name: 'Crear Pedido', module: 'SD', description: 'Crear pedido de venta estándar' },
    '/nVA02': { name: 'Modificar Pedido', module: 'SD', description: 'Modificar pedido existente' },
    '/nVA03': { name: 'Visualizar Pedido', module: 'SD', description: 'Visualizar pedido de venta' },
    '/nVL01N': { name: 'Crear Entrega', module: 'SD', description: 'Crear entrega con referencia' },
    '/nVL02N': { name: 'Modificar Entrega', module: 'SD', description: 'Modificar entrega existente' },
    '/nVF01': { name: 'Crear Factura', module: 'SD', description: 'Crear factura para entrega' },

    // Purchasing (MM)
    '/nME21N': { name: 'Crear Pedido', module: 'MM', description: 'Crear pedido de compra a proveedor' },
    '/nME28': { name: 'Liberar Pedido', module: 'MM', description: 'Autorizar pedidos de compra' },
    '/nME23N': { name: 'Visualizar Pedido', module: 'MM', description: 'Visualizar pedido de compra' },

    // Inventory Management (MM-IM)
    '/nMIGO': { name: 'Movigo Mercancía', module: 'MM', description: 'Entrada/Salida de mercancías' },

    // Custom Dakafacil
    '/nPACK': { name: 'Modelo Empaque', module: 'LOG', description: 'Calcular modelo de empaque y apilamiento' },
    '/nDUP': { name: 'Ver Duplicados', module: 'QM', description: 'Filtrar materiales duplicados' },
    '/nREORD': { name: 'Punto Reorden', module: 'MM', description: 'Materiales bajo punto de recompra' },
    '/nOVERW': { name: 'Sobrepeso', module: 'EHS', description: 'Materiales que exceden 50kg' },
    '/nSTATS': { name: 'Estadísticas', module: 'BI', description: 'Dashboard de estadísticas' },

    // System
    '/nSE16': { name: 'Browser Datos', module: 'ABAP', description: 'Data Browser - Ver tablas (Estándar)' },
    '/nSE16N': { name: 'General Table Display', module: 'ABAP', description: 'Visualización general de tablas (Modo Experto)' },
    '/nSQVI': { name: 'QuickViewer', module: 'ABAP', description: 'Generador de Reportes (Entrenamiento)' },
    '/nECOMM': { name: 'E-commerce Strategy', description: 'Tablero Estratégico SCM' },
    '/nMD04': { name: 'Stock Requirements List', description: 'Monitor de Disponibilidad (MRP)' },
    '/nEAN': { name: 'Gestor EAN', module: 'MM', description: 'Gestión de múltiples códigos de barra (MEAN)' },
    '/nTEAM': { name: 'Equipo SCM', module: 'SCM', description: 'Centro de Operaciones del Equipo Supply Chain' },
    '/nPLAN': { name: 'Plan Maestro', module: 'SCM', description: 'Naming, Cedulación y Plan 30-60-90' },
    '/nPRES': { name: 'Presentación', module: 'SCM', description: 'Presentación profesional paso a paso' },
    '/nGERENTE': { name: 'Descripción de Cargo', module: 'HR', description: 'Dashboard y Responsabilidades SCM' },
    '/nJOB': { name: 'Descripción de Cargo', module: 'HR', description: 'Dashboard y Responsabilidades SCM' },
    '/nMENU': { name: 'Menú SAP (Launchpad)', description: 'Ver todas las transacciones disponibles' },
    '/nDIC': { name: 'Diccionario ABAP', module: 'BASIS', description: 'Referencia de Tablas y Campos' },
    '/nJOB': { name: 'Descripción de Cargo', module: 'HR', description: 'Dashboard y Responsabilidades SCM' },
    '/nSU01': { name: 'Mant. Usuarios', module: 'BC', description: 'Mantenimiento de usuarios' },
    '/n': { name: 'Cancelar Trans.', module: 'SYS', description: 'Cancelar transacción actual' },
    '/nEX': { name: 'Salir Sistema', module: 'SYS', description: 'Cerrar sesión SAP' },
};

const RECENT_TRANSACTIONS = ['/nMM03', '/nVA01', '/nPACK'];
const FAVORITE_TRANSACTIONS = ['/nMM01', '/nMM02', '/nMM03', '/nVA01'];

export default function CommandBar({ onExecute, currentTransaction }) {
    const [command, setCommand] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [history, setHistory] = useState(RECENT_TRANSACTIONS);
    const inputRef = useRef(null);

    // Filter transactions based on input
    useEffect(() => {
        if (command.startsWith('/')) {
            const filtered = Object.entries(TRANSACTIONS)
                .filter(([code]) => code.toLowerCase().includes(command.toLowerCase()))
                .slice(0, 8);
            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0);
        } else {
            setShowDropdown(false);
        }
    }, [command]);

    const executeCommand = (cmd = command) => {
        // Normalizar comando - muy flexible
        let normalizedCmd = cmd.trim();

        // Corrección automática de typos comunes de teclado (Shift+7, AltGr+Q, etc)
        normalizedCmd = normalizedCmd.replace(/^¾/, '/'); // Shift+6 en algunos teclados
        normalizedCmd = normalizedCmd.replace(/^&/, '/');  // Shift+6
        normalizedCmd = normalizedCmd.replace(/^7/, '/');  // Shift+7 (teclado español)
        normalizedCmd = normalizedCmd.replace(/^'/, '/');  // Tecla ? en algunos layout
        normalizedCmd = normalizedCmd.replace(/^\\/, '/'); // Backslash común


        // Si no empieza con /, agregarlo
        if (!normalizedCmd.startsWith('/')) {
            normalizedCmd = '/n' + normalizedCmd.toUpperCase();
        }
        // Si empieza con / pero no /n, agregar la n
        else if (normalizedCmd.startsWith('/') && !normalizedCmd.toLowerCase().startsWith('/n')) {
            normalizedCmd = '/n' + normalizedCmd.slice(1).toUpperCase();
        }
        // Si empieza con /n, normalizar
        else if (normalizedCmd.toLowerCase().startsWith('/n')) {
            normalizedCmd = '/n' + normalizedCmd.slice(2).toUpperCase();
        }

        if (TRANSACTIONS[normalizedCmd]) {
            // Add to history
            setHistory(prev => [normalizedCmd, ...prev.filter(h => h !== normalizedCmd)].slice(0, 10));
            onExecute(normalizedCmd, TRANSACTIONS[normalizedCmd]);
            // Mantener la transacción visible como en SAP real
            setCommand(normalizedCmd);
            setShowDropdown(false);
        } else {
            // Fallback: Check without specific matching logic or retry
            // Unknown transaction
            onExecute('ERROR', { name: 'Error', description: `Transacción "${normalizedCmd}" no existe` });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeCommand();
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setCommand('');
        }
    };

    return (
        <div className="command-bar relative">
            {/* SAP Logo Section */}
            <div className="flex items-center gap-3 mr-6 border-r border-gray-300 pr-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0854A0] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">DE</span>
                    </div>
                    <div className="text-sm">
                        <div className="font-semibold text-[#32363A]">Dataelectric S/4HANA</div>
                        <div className="text-[10px] text-[#6A6D70]">Training Simulator v1.0</div>
                    </div>
                </div>
            </div>

            {/* Command Field */}
            <div className="relative flex-1 max-w-md">
                <div className="flex items-center">
                    <Terminal size={14} className="absolute left-3 text-[#6A6D70]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => command.startsWith('/') && setShowDropdown(true)}
                        placeholder="Ingrese transacción (ej: /nMM03, /nVA01, /nPACK)"
                        className="command-input pl-9 pr-3 w-full"
                    />
                </div>

                {/* Dropdown Suggestions */}
                {showDropdown && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-[#C4C4C4] 
                          rounded-b shadow-xl max-h-64 overflow-auto"
                        style={{ zIndex: 9999 }}>
                        {suggestions.map(([code, info]) => (
                            <div
                                key={code}
                                onClick={() => executeCommand(code)}
                                className="px-3 py-2 hover:bg-[#E8F4FD] cursor-pointer flex items-center justify-between border-b border-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[#0854A0] font-semibold text-sm">{code}</span>
                                    <span className="text-sm text-[#32363A]">{info.name}</span>
                                </div>
                                <span className="text-xs text-[#6A6D70] bg-[#F2F2F2] px-2 py-0.5 rounded">
                                    {info.module}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Execute Button */}
            <button
                onClick={() => executeCommand()}
                className="sap-btn sap-btn-primary ml-2"
                title="Ejecutar transacción (Enter)"
            >
                <Play size={14} />
                Ejecutar
            </button>

            {/* Quick Access Buttons */}
            <div className="flex items-center gap-1 ml-4 border-l border-gray-300 pl-4">
                {/* Favorites */}
                <div className="relative">
                    <button
                        onClick={() => setShowFavorites(!showFavorites)}
                        className="sap-btn sap-btn-ghost flex items-center gap-1"
                        title="Favoritos"
                    >
                        <Star size={14} className="text-[#E9730C]" />
                        <ChevronDown size={12} />
                    </button>
                    {showFavorites && (
                        <div className="absolute top-full right-0 bg-white border border-[#C4C4C4] rounded shadow-lg z-50 min-w-48">
                            <div className="px-3 py-2 border-b bg-[#F2F2F2] text-xs font-semibold">
                                Transacciones Favoritas
                            </div>
                            {FAVORITE_TRANSACTIONS.map(code => (
                                <div
                                    key={code}
                                    onClick={() => { executeCommand(code); setShowFavorites(false); }}
                                    className="px-3 py-2 hover:bg-[#E8F4FD] cursor-pointer flex items-center gap-2"
                                >
                                    <Star size={12} className="text-[#E9730C]" />
                                    <span className="font-mono text-sm">{code}</span>
                                    <span className="text-xs text-[#6A6D70]">- {TRANSACTIONS[code]?.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History */}
                <div className="relative group">
                    <button className="sap-btn sap-btn-ghost" title="Historial">
                        <History size={14} />
                    </button>
                    <div className="hidden group-hover:block absolute top-full right-0 bg-white border 
                          border-[#C4C4C4] rounded shadow-lg z-50 min-w-48">
                        <div className="px-3 py-2 border-b bg-[#F2F2F2] text-xs font-semibold">
                            Transacciones Recientes
                        </div>
                        {history.map(code => (
                            <div
                                key={code}
                                onClick={() => executeCommand(code)}
                                className="px-3 py-2 hover:bg-[#E8F4FD] cursor-pointer flex items-center gap-2"
                            >
                                <Clock size={12} className="text-[#6A6D70]" />
                                <span className="font-mono text-sm">{code}</span>
                                <span className="text-xs text-[#6A6D70]">- {TRANSACTIONS[code]?.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Help */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="sap-btn sap-btn-ghost"
                    title="Ayuda de transacciones"
                >
                    <HelpCircle size={14} />
                </button>
            </div>

            {/* Current Transaction Display */}
            {currentTransaction && (
                <div className="ml-auto flex items-center gap-2 bg-[#E8F4FD] px-3 py-1 rounded">
                    <span className="font-mono text-[#0854A0] font-semibold">
                        {currentTransaction}
                    </span>
                    <span className="text-sm text-[#32363A]">
                        {TRANSACTIONS[currentTransaction]?.name}
                    </span>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="flex items-center gap-2">
                                <HelpCircle size={18} />
                                Guía de Transacciones SAP - Dataelectric Training
                            </span>
                            <button onClick={() => setShowHelp(false)} className="text-[#6A6D70] hover:text-[#32363A]">✕</button>
                        </div>
                        <div className="modal-body max-h-[60vh] overflow-auto">
                            <p className="text-sm text-[#6A6D70] mb-4">
                                Utilice estas transacciones para navegar por el sistema como un consultor SAP real.
                                Los códigos siguen el estándar SAP con prefijo /n para nueva sesión.
                            </p>

                            <div className="space-y-4">
                                {Object.entries(
                                    Object.entries(TRANSACTIONS).reduce((acc, [code, info]) => {
                                        if (!acc[info.module]) acc[info.module] = [];
                                        acc[info.module].push({ code, ...info });
                                        return acc;
                                    }, {})
                                ).map(([module, transactions]) => (
                                    <div key={module}>
                                        <h3 className="font-semibold text-[#0854A0] mb-2 flex items-center gap-2">
                                            <span className="bg-[#0854A0] text-white px-2 py-0.5 rounded text-xs">{module}</span>
                                            {module === 'MM' && 'Material Management'}
                                            {module === 'SD' && 'Sales & Distribution'}
                                            {module === 'WM' && 'Warehouse Management'}
                                            {module === 'LOG' && 'Logistics'}
                                            {module === 'QM' && 'Quality Management'}
                                            {module === 'EHS' && 'Environment, Health & Safety'}
                                            {module === 'BI' && 'Business Intelligence'}
                                            {module === 'SYS' && 'System'}
                                        </h3>
                                        <table className="w-full text-sm">
                                            <tbody>
                                                {transactions.map(t => (
                                                    <tr key={t.code} className="border-b border-[#E0E0E0]">
                                                        <td className="py-2 pr-4 font-mono text-[#0854A0] font-semibold w-24">{t.code}</td>
                                                        <td className="py-2 pr-4 font-semibold w-40">{t.name}</td>
                                                        <td className="py-2 text-[#6A6D70]">{t.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-[#E8F4FD] rounded">
                                <h4 className="font-semibold mb-2">💡 Consejos para Practicar:</h4>
                                <ul className="text-sm space-y-1 text-[#32363A]">
                                    <li>• Escriba el código de transacción y presione <kbd className="bg-white px-1 rounded border">Enter</kbd></li>
                                    <li>• Use <kbd className="bg-white px-1 rounded border">/n</kbd> seguido del código para abrir en nueva ventana</li>
                                    <li>• Familiarícese con MM01, MM02, MM03 (Material Master)</li>
                                    <li>• Practique VA01 para crear pedidos de venta</li>
                                    <li>• Use /nDUP para encontrar duplicados y /nREORD para alertas de stock</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowHelp(false)} className="sap-btn sap-btn-primary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export { TRANSACTIONS };
