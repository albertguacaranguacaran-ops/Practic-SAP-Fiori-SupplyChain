import { useState, useMemo } from 'react';
import {
    Search, Barcode, Trash2, Star, Plus, X, TriangleAlert,
    CircleCheck, Info, ArrowRightLeft, CircleHelp, ChevronRight
} from 'lucide-react';

// Tutorial steps for guided learning
const TUTORIAL_STEPS = [
    {
        title: '1. Identificar el Problema',
        description: 'Busca un material por su ID o descripción. Los materiales con múltiples EAN aparecerán resaltados.',
        icon: Search
    },
    {
        title: '2. Analizar la Lista de EANs',
        description: 'Revisa la tabla de EANs. El EAN Principal (★) es el que se usa en punto de venta. Los adicionales pueden ser errores o variantes.',
        icon: Barcode
    },
    {
        title: '3. Corregir los Datos',
        description: 'Elimina EANs incorrectos, agrega los correctos, o intercambia el EAN principal si es necesario.',
        icon: CheckCircle
    }
];

// Validate EAN-13 checksum
function validateEAN13(ean) {
    if (!ean || ean.length !== 13 || !/^\d{13}$/.test(ean)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(ean[12]) === checkDigit;
}

export default function EANManager({ materials = [], onUpdateMaterial, onClose, showStatus }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [newEAN, setNewEAN] = useState('');
    const [newEANReason, setNewEANReason] = useState('Error de captura');
    const [showTutorial, setShowTutorial] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Find materials with multiple EANs for the alert list
    const materialsWithMultiEAN = useMemo(() => {
        return materials.filter(m => m.additionalEans && m.additionalEans.length > 0);
    }, [materials]);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const term = searchTerm.toUpperCase();
        return materials
            .filter(m =>
                m.id.toUpperCase().includes(term) ||
                m.descripcion.toUpperCase().includes(term) ||
                m.ean.includes(term) ||
                (m.additionalEans || []).some(e => e.ean.includes(term))
            )
            .slice(0, 15);
    }, [searchTerm, materials]);

    // Select a material for editing
    const selectMaterial = (mat) => {
        setSelectedMaterial({ ...mat });
        setSearchTerm('');
        setShowAddForm(false);
        setNewEAN('');
    };

    // Add a new EAN
    const handleAddEAN = () => {
        if (!newEAN) {
            showStatus?.('Ingrese un código EAN', 'error');
            return;
        }
        if (!validateEAN13(newEAN)) {
            showStatus?.('EAN-13 inválido: dígito de control incorrecto', 'error');
            return;
        }
        // Check if already exists in this material
        if (selectedMaterial.ean === newEAN || selectedMaterial.additionalEans?.some(e => e.ean === newEAN)) {
            showStatus?.('Este EAN ya está asignado a este material', 'warning');
            return;
        }
        // Check if exists in another material
        const otherMat = materials.find(m => m.id !== selectedMaterial.id && (m.ean === newEAN || m.additionalEans?.some(e => e.ean === newEAN)));
        if (otherMat) {
            showStatus?.(`⚠ EAN ${newEAN} ya asignado a material ${otherMat.id}`, 'warning');
        }

        const updated = {
            ...selectedMaterial,
            additionalEans: [
                ...(selectedMaterial.additionalEans || []),
                {
                    ean: newEAN,
                    type: 'HK',
                    reason: newEANReason,
                    createdAt: new Date().toISOString().split('T')[0]
                }
            ]
        };
        setSelectedMaterial(updated);
        onUpdateMaterial?.(updated);
        showStatus?.(`EAN ${newEAN} agregado correctamente`, 'success');
        setNewEAN('');
        setShowAddForm(false);
    };

    // Delete an additional EAN
    const handleDeleteEAN = (eanToDelete) => {
        const updated = {
            ...selectedMaterial,
            additionalEans: (selectedMaterial.additionalEans || []).filter(e => e.ean !== eanToDelete)
        };
        setSelectedMaterial(updated);
        onUpdateMaterial?.(updated);
        showStatus?.(`EAN ${eanToDelete} eliminado`, 'success');
    };

    // Swap: set an additional EAN as the main one
    const handleSetAsMain = (additionalEan) => {
        const oldMain = selectedMaterial.ean;
        const updated = {
            ...selectedMaterial,
            ean: additionalEan.ean,
            additionalEans: [
                ...(selectedMaterial.additionalEans || []).filter(e => e.ean !== additionalEan.ean),
                {
                    ean: oldMain,
                    type: 'HK',
                    reason: 'Anterior EAN principal',
                    createdAt: new Date().toISOString().split('T')[0]
                }
            ]
        };
        setSelectedMaterial(updated);
        onUpdateMaterial?.(updated);
        showStatus?.(`EAN principal cambiado a ${additionalEan.ean}`, 'success');
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            {/* Header */}
            <div className="bg-[#354A5F] text-white px-4 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-mono bg-[#0854A0] px-2 py-0.5 rounded text-sm">/nEAN</span>
                    <Barcode size={18} />
                    <span className="font-bold text-sm">Gestión de Códigos EAN - Múltiples Códigos de Barra</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTutorial(!showTutorial)}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                        title="Tutorial"
                    >
                        <CircleHelp size={16} />
                    </button>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[#E5E9F0] px-4 py-1.5 flex items-center gap-3 border-b border-[#C4C4C4]">
                <div className="relative flex-1 max-w-lg">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A6D70]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar material por ID, descripción o EAN..."
                        className="sap-input pl-9 pr-3 w-full h-8 text-sm"
                        autoFocus
                    />
                    {/* Search dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-[#C4C4C4] rounded-b shadow-xl max-h-64 overflow-auto" style={{ zIndex: 9999 }}>
                            {searchResults.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => selectMaterial(m)}
                                    className="px-3 py-2 hover:bg-[#E8F4FD] cursor-pointer flex items-center justify-between border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[#0854A0] font-semibold text-sm">{m.id}</span>
                                        <span className="text-sm text-[#32363A] truncate max-w-xs">{m.descripcion}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-[#6A6D70]">{m.ean}</span>
                                        {m.additionalEans?.length > 0 && (
                                            <span className="text-xs bg-[#FFF3CD] text-[#856404] px-2 py-0.5 rounded font-semibold">
                                                +{m.additionalEans.length} EAN
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6A6D70]">
                    <TriangleAlert size={14} className="text-[#E9730C]" />
                    <span>{materialsWithMultiEAN.length} material(es) con múltiples EAN</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex gap-4">
                {/* Left Panel: Tutorial or Material List */}
                <div className="w-80 flex-shrink-0 space-y-3">

                    {/* Tutorial Panel */}
                    {showTutorial && (
                        <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                            <div className="bg-[#E8F4FD] px-3 py-2 border-b border-[#C4C4C4] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CircleHelp size={14} className="text-[#0854A0]" />
                                    <span className="text-xs font-bold text-[#0854A0] uppercase">Tutorial: Limpieza EAN</span>
                                </div>
                                <button onClick={() => setShowTutorial(false)} className="text-[#6A6D70] hover:text-[#32363A]">
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="p-3 space-y-3">
                                {TUTORIAL_STEPS.map((step, idx) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#0854A0] text-white flex items-center justify-center flex-shrink-0">
                                                <Icon size={14} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-[#32363A]">{step.title}</div>
                                                <div className="text-xs text-[#6A6D70] leading-relaxed">{step.description}</div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="mt-3 p-2 bg-[#FFF8E1] border border-[#E9730C] rounded text-xs">
                                    <strong>💡 Tip SAP:</strong> En SAP real, esta gestión se hace en la tabla MEAN
                                    (Material EAN). Cada material puede tener múltiples EANs para diferentes
                                    unidades de medida y empaques.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick List: Materials with multi-EAN */}
                    <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                        <div className="bg-[#FFF3CD] px-3 py-2 border-b border-[#C4C4C4] flex items-center gap-2">
                            <TriangleAlert size={14} className="text-[#856404]" />
                            <span className="text-xs font-bold text-[#856404] uppercase">
                                Materiales con Múltiples EAN ({materialsWithMultiEAN.length})
                            </span>
                        </div>
                        <div className="max-h-60 overflow-auto divide-y divide-gray-100">
                            {materialsWithMultiEAN.slice(0, 20).map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => selectMaterial(m)}
                                    className={`px-3 py-2 cursor-pointer hover:bg-[#E8F4FD] transition-colors flex items-center justify-between ${selectedMaterial?.id === m.id ? 'bg-[#E8F4FD] border-l-3 border-l-[#0854A0]' : ''
                                        }`}
                                >
                                    <div>
                                        <div className="font-mono text-xs font-semibold text-[#0854A0]">{m.id}</div>
                                        <div className="text-xs text-[#6A6D70] truncate max-w-[200px]">{m.descripcion}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs bg-[#FFEBEE] text-[#BB0000] px-1.5 py-0.5 rounded font-mono">
                                            +{m.additionalEans.length}
                                        </span>
                                        <ChevronRight size={12} className="text-[#6A6D70]" />
                                    </div>
                                </div>
                            ))}
                            {materialsWithMultiEAN.length === 0 && (
                                <div className="p-4 text-center text-xs text-[#6A6D70]">
                                    No se encontraron materiales con múltiples EAN.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Detail */}
                <div className="flex-1">
                    {!selectedMaterial ? (
                        /* Empty State */
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <Barcode size={64} className="mx-auto text-[#C4C4C4]" />
                                <div>
                                    <h3 className="text-lg font-semibold text-[#32363A]">Gestión de Códigos EAN</h3>
                                    <p className="text-sm text-[#6A6D70] mt-1">
                                        Busque un material o seleccione uno de la lista para gestionar sus códigos de barra.
                                    </p>
                                </div>
                                <div className="text-xs text-[#6A6D70] space-y-1">
                                    <p>Tabla SAP: <span className="font-mono bg-[#F2F2F2] px-1 rounded">MEAN</span> (Material EAN)</p>
                                    <p>Campos clave: <span className="font-mono bg-[#F2F2F2] px-1 rounded">MATNR</span>,
                                        <span className="font-mono bg-[#F2F2F2] px-1 rounded ml-1">EAN11</span>,
                                        <span className="font-mono bg-[#F2F2F2] px-1 rounded ml-1">EANTP</span>,
                                        <span className="font-mono bg-[#F2F2F2] px-1 rounded ml-1">HPEAN</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Material Detail */
                        <div className="space-y-4">
                            {/* Material Header */}
                            <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                                <div className="bg-[#EFF4F9] px-4 py-2 border-b border-[#C4C4C4] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[#0854A0] font-bold">{selectedMaterial.id}</span>
                                        <span className="text-sm text-[#32363A]">{selectedMaterial.descripcion}</span>
                                    </div>
                                    <span className="text-xs bg-[#F2F2F2] px-2 py-0.5 rounded text-[#6A6D70]">
                                        {selectedMaterial.categoria}
                                    </span>
                                </div>
                                <div className="p-4 grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-[#6A6D70] text-xs block">Marca</span>
                                        <span className="font-semibold">{selectedMaterial.marca}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#6A6D70] text-xs block">Stock</span>
                                        <span className="font-semibold font-mono">{selectedMaterial.stockActual}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#6A6D70] text-xs block">Proveedor</span>
                                        <span className="font-semibold text-xs">{selectedMaterial.proveedor}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#6A6D70] text-xs block">Status</span>
                                        <span className={`font-semibold text-xs px-2 py-0.5 rounded ${selectedMaterial.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {selectedMaterial.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main EAN */}
                            <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                                <div className="bg-[#E8F4FD] px-4 py-2 border-b border-[#C4C4C4] flex items-center gap-2">
                                    <Star size={14} className="text-[#E9730C] fill-[#E9730C]" />
                                    <span className="text-xs font-bold text-[#0854A0] uppercase">EAN Principal (HPEAN = ✓)</span>
                                </div>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="font-mono text-2xl font-bold text-[#32363A] tracking-wider">
                                            {selectedMaterial.ean}
                                        </div>
                                        <div className="text-xs text-[#6A6D70] mt-1">
                                            Tipo: <span className="font-mono">HE</span> (Unidad Base) | Categoría: EAN-13
                                            {validateEAN13(selectedMaterial.ean)
                                                ? <span className="ml-2 text-green-600">✓ Válido</span>
                                                : <span className="ml-2 text-red-600">✗ Checksum inválido</span>
                                            }
                                        </div>
                                    </div>
                                    <Barcode size={40} className="text-[#C4C4C4]" />
                                </div>
                            </div>

                            {/* Additional EANs Table */}
                            <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                                <div className="bg-[#FFF3CD] px-4 py-2 border-b border-[#C4C4C4] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TriangleAlert size={14} className="text-[#856404]" />
                                        <span className="text-xs font-bold text-[#856404] uppercase">
                                            EANs Adicionales ({(selectedMaterial.additionalEans || []).length})
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowAddForm(!showAddForm)}
                                        className="text-xs flex items-center gap-1 text-[#0854A0] hover:underline font-semibold"
                                    >
                                        <Plus size={12} /> Agregar EAN
                                    </button>
                                </div>

                                {/* Add Form */}
                                {showAddForm && (
                                    <div className="p-3 bg-[#FAFAFA] border-b border-[#C4C4C4] flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-[#6A6D70] block mb-1">Nuevo EAN-13</label>
                                            <input
                                                type="text"
                                                value={newEAN}
                                                onChange={(e) => setNewEAN(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                                placeholder="7591234567890"
                                                className="sap-input font-mono h-8 text-sm"
                                                maxLength={13}
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label className="text-xs text-[#6A6D70] block mb-1">Motivo</label>
                                            <select
                                                value={newEANReason}
                                                onChange={(e) => setNewEANReason(e.target.value)}
                                                className="sap-input h-8 text-sm"
                                            >
                                                <option>Error de captura</option>
                                                <option>Empaque diferente</option>
                                                <option>Código proveedor</option>
                                                <option>Re-etiquetado</option>
                                                <option>Importación</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleAddEAN}
                                            className="sap-btn sap-btn-primary h-8 text-xs"
                                        >
                                            <Plus size={12} /> Agregar
                                        </button>
                                        <button
                                            onClick={() => { setShowAddForm(false); setNewEAN(''); }}
                                            className="sap-btn sap-btn-secondary h-8 text-xs"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}

                                {/* Table */}
                                {(selectedMaterial.additionalEans || []).length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#F5F7FA] text-[#6A6D70] text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-2 text-left">EAN</th>
                                                <th className="px-4 py-2 text-left">Tipo</th>
                                                <th className="px-4 py-2 text-left">Motivo</th>
                                                <th className="px-4 py-2 text-left">Fecha</th>
                                                <th className="px-4 py-2 text-left">Válido</th>
                                                <th className="px-4 py-2 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(selectedMaterial.additionalEans || []).map((entry, idx) => (
                                                <tr key={idx} className="hover:bg-[#E8F4FD] transition-colors">
                                                    <td className="px-4 py-2 font-mono font-semibold text-[#32363A]">
                                                        {entry.ean}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${entry.type === 'HK' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {entry.type === 'HK' ? 'Alterno' : 'U. Base'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-xs text-[#6A6D70]">{entry.reason}</td>
                                                    <td className="px-4 py-2 text-xs font-mono text-[#6A6D70]">{entry.createdAt}</td>
                                                    <td className="px-4 py-2">
                                                        {validateEAN13(entry.ean)
                                                            ? <CircleCheck size={14} className="text-green-500" />
                                                            : <TriangleAlert size={14} className="text-red-500" />
                                                        }
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleSetAsMain(entry)}
                                                                className="p-1 hover:bg-[#E8F4FD] rounded text-[#0854A0] transition-colors"
                                                                title="Fijar como EAN Principal"
                                                            >
                                                                <ArrowRightLeft size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEAN(entry.ean)}
                                                                className="p-1 hover:bg-[#FFEBEE] rounded text-red-500 transition-colors"
                                                                title="Eliminar EAN"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-6 text-center text-sm text-[#6A6D70]">
                                        <CircleCheck size={24} className="mx-auto mb-2 text-green-400" />
                                        Este material no tiene EANs adicionales. ¡Datos limpios!
                                    </div>
                                )}
                            </div>

                            {/* SAP Context Info */}
                            <div className="bg-[#E8F4FD] border border-[#0854A0]/20 rounded p-3">
                                <div className="flex items-start gap-2">
                                    <Info size={16} className="text-[#0854A0] mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-[#32363A] space-y-1">
                                        <p><strong>Contexto SAP:</strong> En SAP S/4HANA, los EANs adicionales se almacenan en la tabla <code className="bg-white px-1 rounded">MEAN</code>.</p>
                                        <p>El campo <code className="bg-white px-1 rounded">HPEAN</code> indica si es el EAN principal. Los tipos comunes son:</p>
                                        <ul className="list-disc list-inside ml-2">
                                            <li><strong>HE</strong> - EAN para Unidad Base</li>
                                            <li><strong>HK</strong> - EAN Alterno / Caja</li>
                                            <li><strong>HV</strong> - EAN para Pallet</li>
                                        </ul>
                                        <p className="mt-1">Transacciones relacionadas:
                                            <code className="bg-white px-1 rounded ml-1">MM02</code> (vista Datos Básicos 2),
                                            <code className="bg-white px-1 rounded ml-1">SE16</code> →tabla MEAN
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
