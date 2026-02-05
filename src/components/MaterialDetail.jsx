import { useState } from 'react';
import {
    Save, X, Edit, Eye, Package, Scale, Ruler,
    AlertTriangle, CheckCircle, Box, Truck
} from 'lucide-react';
import { calculateVolume, calculateStackingFactor, validateWeight } from '../utils/packagingCalc';

export default function MaterialDetail({
    material,
    mode = 'view', // 'view', 'edit', 'create'
    onSave,
    onClose,
    transactionCode
}) {
    const [formData, setFormData] = useState(material || {
        id: '',
        ean: '',
        descripcion: '',
        marca: '',
        modelo: '',
        categoria: '',
        subcategoria: '',
        color: '',
        pesoNeto: null,
        pesoBruto: null,
        largo: null,
        ancho: null,
        alto: null,
        stockActual: 0,
        puntoReorden: 5,
        ubicacion: '',
        proveedor: '',
        status: 'active'
    });

    const [activeTab, setActiveTab] = useState('basico');
    const isReadOnly = mode === 'view';

    // Calculate derived values
    const volumen = calculateVolume(formData.largo, formData.ancho, formData.alto);
    const stacking = calculateStackingFactor(formData.largo, formData.ancho, formData.alto);
    const weightCheck = validateWeight(formData.pesoNeto);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (onSave) {
            onSave(formData);
        }
    };

    const tabs = [
        { id: 'basico', label: 'Datos Básicos', icon: Package },
        { id: 'dimensiones', label: 'Dimensiones', icon: Ruler },
        { id: 'logistica', label: 'Logística', icon: Truck },
        { id: 'empaque', label: 'Modelo Empaque', icon: Box },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content w-[900px]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[#0854A0] bg-[#E8F4FD] px-2 py-0.5 rounded">
                            {transactionCode}
                        </span>
                        <span className="font-semibold">
                            {mode === 'create' ? 'Crear Material' :
                                mode === 'edit' ? 'Modificar Material' : 'Visualizar Material'}
                        </span>
                        {formData.id && (
                            <span className="text-[#6A6D70]">- {formData.id}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === 'view' && (
                            <Eye size={16} className="text-[#6A6D70]" />
                        )}
                        {mode === 'edit' && (
                            <Edit size={16} className="text-[#E9730C]" />
                        )}
                        <button onClick={onClose} className="hover:bg-[#E0E0E0] p-1 rounded">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="modal-body">
                    {/* Basic Data Tab */}
                    {activeTab === 'basico' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">ID Material</label>
                                <input
                                    type="text"
                                    value={formData.id}
                                    onChange={(e) => handleChange('id', e.target.value)}
                                    disabled={mode !== 'create'}
                                    className="form-input font-mono"
                                    placeholder="LB-000001"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Código EAN</label>
                                <input
                                    type="text"
                                    value={formData.ean}
                                    onChange={(e) => handleChange('ean', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input font-mono"
                                    placeholder="7591234567890"
                                />
                            </div>

                            <div className="form-group col-span-2">
                                <label className="form-label">Descripción</label>
                                <input
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={(e) => handleChange('descripcion', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                    placeholder="NEVERA SAMSUNG 18 PIES BLANCO"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Marca</label>
                                <input
                                    type="text"
                                    value={formData.marca}
                                    onChange={(e) => handleChange('marca', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Modelo</label>
                                <input
                                    type="text"
                                    value={formData.modelo}
                                    onChange={(e) => handleChange('modelo', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => handleChange('categoria', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Línea Blanca">Línea Blanca</option>
                                    <option value="Línea Marrón">Línea Marrón</option>
                                    <option value="Pequeños Electrodomésticos">Pequeños Electrodomésticos</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subcategoría</label>
                                <input
                                    type="text"
                                    value={formData.subcategoria}
                                    onChange={(e) => handleChange('subcategoria', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Estado</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                >
                                    <option value="active">Activo</option>
                                    <option value="discontinued">Descontinuado</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Dimensions Tab */}
                    {activeTab === 'dimensiones' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label flex items-center gap-2">
                                        <Scale size={14} />
                                        Peso Neto (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.pesoNeto || ''}
                                        onChange={(e) => handleChange('pesoNeto', parseFloat(e.target.value) || null)}
                                        disabled={isReadOnly}
                                        className={`form-input ${weightCheck.nivel === 'warning' ? 'error' : ''}`}
                                    />
                                    {weightCheck.nivel !== 'ok' && formData.pesoNeto && (
                                        <p className={`text-xs mt-1 ${weightCheck.nivel === 'warning' ? 'text-[#BB0000]' : 'text-[#E9730C]'}`}>
                                            <AlertTriangle size={12} className="inline mr-1" />
                                            {weightCheck.message}
                                        </p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label flex items-center gap-2">
                                        <Scale size={14} />
                                        Peso Bruto (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.pesoBruto || ''}
                                        onChange={(e) => handleChange('pesoBruto', parseFloat(e.target.value) || null)}
                                        disabled={isReadOnly}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Ruler size={16} />
                                    Dimensiones del Empaque
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Largo (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.largo || ''}
                                            onChange={(e) => handleChange('largo', parseInt(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ancho (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.ancho || ''}
                                            onChange={(e) => handleChange('ancho', parseInt(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Alto (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.alto || ''}
                                            onChange={(e) => handleChange('alto', parseInt(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calculated Volume */}
                            {volumen && (
                                <div className="bg-[#E8F4FD] p-4 rounded">
                                    <h4 className="font-semibold mb-2 text-[#0854A0]">Volumen Calculado</h4>
                                    <p className="text-2xl font-bold text-[#0854A0]">
                                        {volumen} m³
                                    </p>
                                    <p className="text-sm text-[#6A6D70]">
                                        {formData.largo} × {formData.ancho} × {formData.alto} cm = {(formData.largo * formData.ancho * formData.alto).toLocaleString()} cm³
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logistics Tab */}
                    {activeTab === 'logistica' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Stock Actual</label>
                                <input
                                    type="number"
                                    value={formData.stockActual}
                                    onChange={(e) => handleChange('stockActual', parseInt(e.target.value) || 0)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Punto de Reorden</label>
                                <input
                                    type="number"
                                    value={formData.puntoReorden}
                                    onChange={(e) => handleChange('puntoReorden', parseInt(e.target.value) || 0)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ubicación Almacén</label>
                                <input
                                    type="text"
                                    value={formData.ubicacion}
                                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input font-mono"
                                    placeholder="A12-3-1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Proveedor</label>
                                <input
                                    type="text"
                                    value={formData.proveedor}
                                    onChange={(e) => handleChange('proveedor', e.target.value)}
                                    disabled={isReadOnly}
                                    className="form-input"
                                />
                            </div>

                            {/* Stock Alert */}
                            {formData.stockActual < formData.puntoReorden && (
                                <div className="col-span-2 bg-[#FFEBEE] border border-[#BB0000] p-4 rounded">
                                    <div className="flex items-center gap-2 text-[#BB0000]">
                                        <AlertTriangle size={18} />
                                        <span className="font-semibold">¡Alerta de Stock Bajo!</span>
                                    </div>
                                    <p className="text-sm mt-1">
                                        Stock actual ({formData.stockActual}) está por debajo del punto de reorden ({formData.puntoReorden}).
                                        Genere orden de compra.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Packaging Model Tab */}
                    {activeTab === 'empaque' && (
                        <div className="space-y-6">
                            {stacking ? (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#F2F2F2] p-4 rounded text-center">
                                            <p className="text-sm text-[#6A6D70]">Cajas por Base</p>
                                            <p className="text-3xl font-bold text-[#32363A]">{stacking.cajasBase}</p>
                                        </div>
                                        <div className="bg-[#F2F2F2] p-4 rounded text-center">
                                            <p className="text-sm text-[#6A6D70]">Niveles</p>
                                            <p className="text-3xl font-bold text-[#32363A]">{stacking.niveles}</p>
                                        </div>
                                        <div className="bg-[#0854A0] p-4 rounded text-center text-white">
                                            <p className="text-sm opacity-80">Factor Apilamiento</p>
                                            <p className="text-3xl font-bold">{stacking.factorApilamiento}</p>
                                            <p className="text-xs opacity-80">cajas/pallet</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#E8F4FD] p-4 rounded">
                                        <h4 className="font-semibold mb-2">Información del Pallet</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-[#6A6D70]">Dimensiones Pallet:</span>
                                                <span className="ml-2 font-mono">{stacking.dimensionesPallet}</span>
                                            </div>
                                            <div>
                                                <span className="text-[#6A6D70]">Utilización:</span>
                                                <span className={`ml-2 font-semibold ${stacking.utilizacion > 70 ? 'text-[#107E3E]' : 'text-[#E9730C]'}`}>
                                                    {stacking.utilizacion}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#6A6D70]">Volumen Unitario:</span>
                                                <span className="ml-2 font-mono">{volumen} m³</span>
                                            </div>
                                            <div>
                                                <span className="text-[#6A6D70]">Volumen Pallet:</span>
                                                <span className="ml-2 font-mono">{(volumen * stacking.factorApilamiento).toFixed(4)} m³</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual pallet representation */}
                                    <div className="border rounded p-4">
                                        <h4 className="font-semibold mb-3">Visualización del Pallet</h4>
                                        <div className="flex items-end justify-center gap-1 h-32">
                                            {Array.from({ length: Math.min(stacking.niveles, 5) }).map((_, nivel) => (
                                                <div key={nivel} className="flex gap-0.5">
                                                    {Array.from({ length: Math.min(stacking.cajasBase, 8) }).map((_, caja) => (
                                                        <div
                                                            key={caja}
                                                            className="w-3 h-4 bg-[#0854A0] border border-[#003E6C]"
                                                            style={{ opacity: 0.3 + (nivel * 0.15) }}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-xs text-[#6A6D70] mt-2">
                                            Representación simplificada ({stacking.cajasBase} base × {stacking.niveles} niveles)
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-[#6A6D70]">
                                    <Box size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>Ingrese las dimensiones en la pestaña "Dimensiones" para calcular el modelo de empaque.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {!isReadOnly && (
                        <button onClick={handleSubmit} className="sap-btn sap-btn-primary">
                            <Save size={14} />
                            Guardar
                        </button>
                    )}
                    <button onClick={onClose} className="sap-btn sap-btn-secondary">
                        <X size={14} />
                        {isReadOnly ? 'Cerrar' : 'Cancelar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
