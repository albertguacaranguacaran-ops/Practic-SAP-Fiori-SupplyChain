import { useState, useEffect } from 'react';
import {
    Save, X, Edit, Eye, Package, Scale, Ruler,
    AlertTriangle, CheckCircle, Box, Truck, ShoppingCart,
    BarChart2, Warehouse, DollarSign, Settings, HelpCircle
} from 'lucide-react';
import { calculateVolume, calculateStackingFactor, validateWeight } from '../utils/packagingCalc';

// SAP MM01 Views - Identical to real SAP S/4HANA
const SAP_VIEWS = [
    { id: 'basic1', label: 'Datos Básicos 1', icon: Package, required: true },
    { id: 'basic2', label: 'Datos Básicos 2', icon: Scale },
    { id: 'purchasing', label: 'Compras', icon: ShoppingCart },
    { id: 'mrp1', label: 'Planif. Necesidades 1', icon: BarChart2 },
    { id: 'mrp2', label: 'Planif. Necesidades 2', icon: Settings },
    { id: 'storage', label: 'Almacenamiento', icon: Warehouse },
    { id: 'accounting', label: 'Contabilidad', icon: DollarSign },
    { id: 'packaging', label: 'Modelo Empaque', icon: Box },
];

// SAP Field Labels - Authentic SAP naming
const FIELD_LABELS = {
    matnr: 'Número de Material',
    maktx: 'Descripción',
    meins: 'Unidad de Medida Base',
    matkl: 'Grupo de Artículos',
    mtart: 'Tipo de Material',
    ean11: 'EAN/UPC',
    brgew: 'Peso Bruto',
    ntgew: 'Peso Neto',
    gewei: 'Unidad de Peso',
    volum: 'Volumen',
    voleh: 'Unidad de Volumen',
    laeng: 'Longitud',
    breit: 'Anchura',
    hoehe: 'Altura',
    meabm: 'Unidad de Dimensión',
    ekgrp: 'Grupo de Compras',
    infnr: 'Registro Info Compras',
    webaz: 'Tiempo Trat. EM (días)',
    dismm: 'Tipo de MRP',
    dislo: 'Tamaño de Lote MRP',
    minbe: 'Punto de Pedido',
    bstmi: 'Cantidad Mínima Pedido',
    bstma: 'Cantidad Máxima Pedido',
    lgpro: 'Almacén Producción',
    lgort: 'Almacén',
    werks: 'Centro',
    bwkey: 'Área de Valoración',
    bklas: 'Clase de Valoración',
    vprsv: 'Control de Precios',
    stprs: 'Precio Estándar',
    verpr: 'Precio Medio Móvil',
};

// Material Types like real SAP
const MATERIAL_TYPES = [
    { value: 'FERT', label: 'FERT - Producto Terminado' },
    { value: 'HALB', label: 'HALB - Producto Semiterminado' },
    { value: 'ROH', label: 'ROH - Materia Prima' },
    { value: 'HIBE', label: 'HIBE - Material de Operación' },
    { value: 'HAWA', label: 'HAWA - Mercancía Comercial' },
];

// MRP Types
const MRP_TYPES = [
    { value: 'PD', label: 'PD - MRP' },
    { value: 'VB', label: 'VB - Punto de Pedido Manual' },
    { value: 'VM', label: 'VM - Punto de Pedido Automático' },
    { value: 'ND', label: 'ND - Sin Planificación' },
];

// Price Control
const PRICE_CONTROL = [
    { value: 'S', label: 'S - Precio Estándar' },
    { value: 'V', label: 'V - Precio Medio Móvil' },
];

export default function MaterialDetail({
    material,
    mode = 'view',
    onSave,
    onClose,
    transactionCode
}) {
    console.log('🔵 MaterialDetail MOUNTED - mode:', mode, 'material:', material);

    // Initialize form data with SAP field structure
    const [formData, setFormData] = useState({
        // Basic Data 1
        matnr: material?.id || '',
        maktx: material?.descripcion || '',
        meins: 'UN',
        matkl: material?.categoria || 'LB',
        mtart: 'FERT',
        mbrsh: 'M',
        // Basic Data 2
        ean11: material?.ean || '',
        brgew: material?.pesoBruto || null,
        ntgew: material?.pesoNeto || null,
        gewei: 'KG',
        volum: null,
        voleh: 'M3',
        laeng: material?.largo || null,
        breit: material?.ancho || null,
        hoehe: material?.alto || null,
        meabm: 'CM',
        // Purchasing
        ekgrp: '001',
        infnr: '',
        webaz: 2,
        autopo: true,
        // MRP
        dismm: 'PD',
        dislo: 'EX',
        minbe: material?.puntoReorden || 10,
        bstmi: 1,
        bstma: 9999,
        plifz: 7,
        webaz2: 2,
        // Storage
        lgpro: '0001',
        lgort: material?.ubicacion || '0001',
        werks: '1000',
        // Accounting
        bwkey: '1000',
        bklas: '7920',
        vprsv: 'S',
        stprs: 0,
        verpr: 0,
        // Additional
        status: material?.status || 'active',
        stockActual: material?.stockActual || 0,
        proveedor: material?.proveedor || '',
    });

    const [activeView, setActiveView] = useState('basic1');
    const [selectedViews, setSelectedViews] = useState(['basic1', 'basic2', 'purchasing', 'mrp1', 'storage', 'packaging']);
    const [showViewSelector, setShowViewSelector] = useState(mode === 'create' && !material);
    const isReadOnly = mode === 'view';

    // Calculate derived values
    const volumen = calculateVolume(formData.laeng, formData.breit, formData.hoehe);
    const stacking = calculateStackingFactor(formData.laeng, formData.breit, formData.hoehe);
    const weightCheck = validateWeight(formData.ntgew);

    // Update volume when dimensions change
    useEffect(() => {
        if (volumen) {
            setFormData(prev => ({ ...prev, volum: volumen }));
        }
    }, [volumen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        // Transform back to frontend format for compatibility
        const frontendData = {
            id: formData.matnr,
            ean: formData.ean11,
            descripcion: formData.maktx,
            marca: formData.maktx.split(' ')[1] || '',
            modelo: '',
            categoria: formData.matkl,
            subcategoria: '',
            color: '',
            pesoNeto: formData.ntgew,
            pesoBruto: formData.brgew,
            largo: formData.laeng,
            ancho: formData.breit,
            alto: formData.hoehe,
            stockActual: formData.stockActual,
            puntoReorden: formData.minbe,
            ubicacion: formData.lgort,
            proveedor: formData.proveedor,
            status: formData.status
        };
        if (onSave) {
            onSave(frontendData);
        }
    };

    const toggleView = (viewId) => {
        if (viewId === 'basic1') return; // Required
        setSelectedViews(prev =>
            prev.includes(viewId)
                ? prev.filter(v => v !== viewId)
                : [...prev, viewId]
        );
    };

    // SAP-style help popup (simulated F1)
    const showFieldHelp = (fieldName) => {
        const label = FIELD_LABELS[fieldName] || fieldName;
        alert(`Campo: ${fieldName}\n\nDescripción: ${label}\n\nPresione F1 en SAP para obtener ayuda detallada.`);
    };

    // View Selector Screen (shown on create before main form)
    if (showViewSelector) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content w-[600px]" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[#0854A0] bg-[#E8F4FD] px-2 py-0.5 rounded">
                                {transactionCode}
                            </span>
                            <span className="font-semibold">Crear Material - Selección de Vistas</span>
                        </div>
                        <button onClick={onClose} className="hover:bg-[#E0E0E0] p-1 rounded">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4 p-3 bg-[#FFFACD] border border-[#E9730C] rounded text-sm">
                            <strong>Nota:</strong> Seleccione las vistas organizativas que desea mantener para este material.
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {SAP_VIEWS.map(view => {
                                const Icon = view.icon;
                                const isSelected = selectedViews.includes(view.id);
                                return (
                                    <label
                                        key={view.id}
                                        className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${isSelected ? 'bg-[#E8F4FD] border-[#0854A0]' : 'bg-white border-[#D1D1D1] hover:bg-[#F5F5F5]'
                                            } ${view.required ? 'opacity-75' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={view.required}
                                            onChange={() => toggleView(view.id)}
                                            className="w-4 h-4"
                                        />
                                        <Icon size={18} className={isSelected ? 'text-[#0854A0]' : 'text-[#6A6D70]'} />
                                        <span className={isSelected ? 'text-[#0854A0] font-medium' : ''}>
                                            {view.label}
                                            {view.required && <span className="text-[#BB0000]"> *</span>}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            onClick={() => setShowViewSelector(false)}
                            className="sap-btn sap-btn-primary"
                        >
                            <CheckCircle size={14} />
                            Continuar
                        </button>
                        <button onClick={onClose} className="sap-btn sap-btn-secondary">
                            <X size={14} />
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Form
    const visibleViews = SAP_VIEWS.filter(v => selectedViews.includes(v.id));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content w-[1000px] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* SAP-style Header */}
                <div className="modal-header bg-[#354A5F] text-white">
                    <div className="flex items-center gap-3">
                        <span className="font-mono bg-[#0854A0] px-2 py-0.5 rounded text-sm">
                            {transactionCode}
                        </span>
                        <span className="font-semibold">
                            {mode === 'create' ? 'Crear Material' :
                                mode === 'edit' ? 'Modificar Material' : 'Visualizar Material'}
                        </span>
                        {formData.matnr && (
                            <span className="bg-[#0854A0] px-2 py-0.5 rounded text-sm">{formData.matnr}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => showFieldHelp('general')}
                            className="hover:bg-[#4A6178] p-1 rounded"
                            title="Ayuda (F1)"
                        >
                            <HelpCircle size={16} />
                        </button>
                        <button onClick={onClose} className="hover:bg-[#4A6178] p-1 rounded">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* SAP-style View Tabs */}
                <div className="flex bg-[#F5F5F5] border-b overflow-x-auto">
                    {visibleViews.map(view => {
                        const Icon = view.icon;
                        return (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${activeView === view.id
                                    ? 'bg-white border-[#0854A0] text-[#0854A0] font-semibold'
                                    : 'border-transparent text-[#32363A] hover:bg-[#E9E9E9]'
                                    }`}
                            >
                                <Icon size={14} />
                                {view.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">

                    {/* Basic Data 1 */}
                    {activeView === 'basic1' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Datos Básicos 1</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.matnr}</label>
                                    <input
                                        type="text"
                                        value={formData.matnr}
                                        onChange={(e) => handleChange('matnr', e.target.value)}
                                        disabled={mode !== 'create'}
                                        className="sap-input font-mono"
                                        placeholder="Asignación automática"
                                    />
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.mtart} *</label>
                                    <select
                                        value={formData.mtart}
                                        onChange={(e) => handleChange('mtart', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        {MATERIAL_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sap-form-group">
                                <label className="sap-label">{FIELD_LABELS.maktx} *</label>
                                <input
                                    type="text"
                                    value={formData.maktx}
                                    onChange={(e) => handleChange('maktx', e.target.value.toUpperCase())}
                                    disabled={isReadOnly}
                                    className="sap-input"
                                    placeholder="DESCRIPCIÓN DEL MATERIAL"
                                    maxLength={40}
                                />
                                <span className="text-xs text-[#6A6D70]">{formData.maktx.length}/40 caracteres</span>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.meins} *</label>
                                    <select
                                        value={formData.meins}
                                        onChange={(e) => handleChange('meins', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="UN">UN - Unidad</option>
                                        <option value="KG">KG - Kilogramo</option>
                                        <option value="L">L - Litro</option>
                                        <option value="M">M - Metro</option>
                                        <option value="PAR">PAR - Par</option>
                                        <option value="CJ">CJ - Caja</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.matkl} *</label>
                                    <select
                                        value={formData.matkl}
                                        onChange={(e) => handleChange('matkl', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="LB">LB - Línea Blanca</option>
                                        <option value="LM">LM - Línea Marrón</option>
                                        <option value="PE">PE - Pequeños Electro</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">Sector Industrial</label>
                                    <input
                                        type="text"
                                        value="M - Mecánico"
                                        disabled
                                        className="sap-input bg-[#F5F5F5]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Data 2 - Dimensions & Weights */}
                    {activeView === 'basic2' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Datos Básicos 2</h3>

                            {/* EAN/UPC Section */}
                            <div className="bg-[#F5F5F5] p-4 rounded">
                                <h4 className="font-semibold mb-3">Números de Identificación (EAN/UPC)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.ean11}</label>
                                        <input
                                            type="text"
                                            value={formData.ean11}
                                            onChange={(e) => handleChange('ean11', e.target.value)}
                                            disabled={isReadOnly}
                                            className="sap-input font-mono"
                                            placeholder="7591234567890"
                                            maxLength={13}
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">Categoría EAN</label>
                                        <input
                                            type="text"
                                            value="EAN-13"
                                            disabled
                                            className="sap-input bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Weight Section */}
                            <div className="bg-[#F5F5F5] p-4 rounded">
                                <h4 className="font-semibold mb-3">Pesos</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.ntgew}</label>
                                        <input
                                            type="number"
                                            value={formData.ntgew || ''}
                                            onChange={(e) => handleChange('ntgew', parseFloat(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.brgew}</label>
                                        <input
                                            type="number"
                                            value={formData.brgew || ''}
                                            onChange={(e) => handleChange('brgew', parseFloat(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.gewei}</label>
                                        <select
                                            value={formData.gewei}
                                            onChange={(e) => handleChange('gewei', e.target.value)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                        >
                                            <option value="KG">KG</option>
                                            <option value="G">G</option>
                                            <option value="LB">LB</option>
                                        </select>
                                    </div>
                                </div>
                                {weightCheck && weightCheck.nivel !== 'ok' && (
                                    <div className={`mt-2 p-2 rounded text-sm ${weightCheck.nivel === 'warning' ? 'bg-[#FFEBEE] text-[#BB0000]' : 'bg-[#FFF8E1] text-[#E9730C]'
                                        }`}>
                                        <AlertTriangle size={14} className="inline mr-2" />
                                        {weightCheck.message}
                                    </div>
                                )}
                            </div>

                            {/* Dimensions Section */}
                            <div className="bg-[#F5F5F5] p-4 rounded">
                                <h4 className="font-semibold mb-3">Dimensiones</h4>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.laeng}</label>
                                        <input
                                            type="number"
                                            value={formData.laeng || ''}
                                            onChange={(e) => handleChange('laeng', parseFloat(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.breit}</label>
                                        <input
                                            type="number"
                                            value={formData.breit || ''}
                                            onChange={(e) => handleChange('breit', parseFloat(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.hoehe}</label>
                                        <input
                                            type="number"
                                            value={formData.hoehe || ''}
                                            onChange={(e) => handleChange('hoehe', parseFloat(e.target.value) || null)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.meabm}</label>
                                        <select
                                            value={formData.meabm}
                                            onChange={(e) => handleChange('meabm', e.target.value)}
                                            disabled={isReadOnly}
                                            className="sap-input"
                                        >
                                            <option value="CM">CM</option>
                                            <option value="M">M</option>
                                            <option value="MM">MM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.volum}</label>
                                        <input
                                            type="text"
                                            value={volumen ? `${volumen}` : ''}
                                            disabled
                                            className="sap-input bg-white font-mono"
                                        />
                                    </div>
                                    <div className="sap-form-group">
                                        <label className="sap-label">{FIELD_LABELS.voleh}</label>
                                        <input
                                            type="text"
                                            value="M3"
                                            disabled
                                            className="sap-input bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchasing View */}
                    {activeView === 'purchasing' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Datos de Compras</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.ekgrp}</label>
                                    <select
                                        value={formData.ekgrp}
                                        onChange={(e) => handleChange('ekgrp', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="001">001 - Compras Generales</option>
                                        <option value="002">002 - Compras Electro</option>
                                        <option value="003">003 - Compras Importación</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">Unidad de Pedido</label>
                                    <input
                                        type="text"
                                        value={formData.meins}
                                        disabled
                                        className="sap-input bg-[#F5F5F5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.webaz}</label>
                                    <input
                                        type="number"
                                        value={formData.webaz}
                                        onChange={(e) => handleChange('webaz', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    />
                                </div>
                                <div className="sap-form-group flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        checked={formData.autopo}
                                        onChange={(e) => handleChange('autopo', e.target.checked)}
                                        disabled={isReadOnly}
                                        className="w-4 h-4"
                                    />
                                    <label className="sap-label">Pedido Automático Permitido</label>
                                </div>
                            </div>

                            <div className="sap-form-group">
                                <label className="sap-label">Proveedor Principal</label>
                                <input
                                    type="text"
                                    value={formData.proveedor}
                                    onChange={(e) => handleChange('proveedor', e.target.value)}
                                    disabled={isReadOnly}
                                    className="sap-input"
                                    placeholder="PROV001"
                                />
                            </div>
                        </div>
                    )}

                    {/* MRP 1 View */}
                    {activeView === 'mrp1' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Planificación de Necesidades 1</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.dismm}</label>
                                    <select
                                        value={formData.dismm}
                                        onChange={(e) => handleChange('dismm', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        {MRP_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.minbe}</label>
                                    <input
                                        type="number"
                                        value={formData.minbe}
                                        onChange={(e) => handleChange('minbe', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="sap-form-group">
                                    <label className="sap-label">Tamaño de Lote</label>
                                    <select
                                        value={formData.dislo}
                                        onChange={(e) => handleChange('dislo', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="EX">EX - Lote Exacto</option>
                                        <option value="FX">FX - Lote Fijo</option>
                                        <option value="HB">HB - Cantidad Reposición</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.bstmi}</label>
                                    <input
                                        type="number"
                                        value={formData.bstmi}
                                        onChange={(e) => handleChange('bstmi', parseInt(e.target.value) || 1)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    />
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.bstma}</label>
                                    <input
                                        type="number"
                                        value={formData.bstma}
                                        onChange={(e) => handleChange('bstma', parseInt(e.target.value) || 9999)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    />
                                </div>
                            </div>

                            {/* Stock Alert */}
                            {formData.stockActual < formData.minbe && (
                                <div className="bg-[#FFEBEE] border border-[#BB0000] p-4 rounded">
                                    <div className="flex items-center gap-2 text-[#BB0000]">
                                        <AlertTriangle size={18} />
                                        <span className="font-semibold">¡Alerta de Punto de Pedido!</span>
                                    </div>
                                    <p className="text-sm mt-1">
                                        Stock actual ({formData.stockActual}) está por debajo del punto de pedido ({formData.minbe}).
                                        Se recomienda generar orden de compra (ME21N).
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MRP 2 View */}
                    {activeView === 'mrp2' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Planificación de Necesidades 2</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">Tipo de Aprovisionamiento</label>
                                    <select
                                        value="F"
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="F">F - Aprovisionamiento Externo</option>
                                        <option value="E">E - Fabricación Propia</option>
                                        <option value="X">X - Ambos</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">Plazo de Entrega Previsto (días)</label>
                                    <input
                                        type="number"
                                        value={formData.plifz}
                                        onChange={(e) => handleChange('plifz', parseInt(e.target.value) || 0)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Storage View */}
                    {activeView === 'storage' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Datos de Almacenamiento</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.werks}</label>
                                    <select
                                        value={formData.werks}
                                        onChange={(e) => handleChange('werks', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="1000">1000 - Centro Principal</option>
                                        <option value="2000">2000 - Centro Secundario</option>
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.lgort}</label>
                                    <select
                                        value={formData.lgort}
                                        onChange={(e) => handleChange('lgort', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="0001">0001 - Almacén Principal</option>
                                        <option value="0002">0002 - Almacén Secundario</option>
                                        <option value="0003">0003 - Zona de Picking</option>
                                        <option value="0004">0004 - Almacén Externo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-[#E8F4FD] p-4 rounded">
                                <h4 className="font-semibold mb-2">Stock Actual</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-[#6A6D70]">Libre Utilización:</span>
                                        <span className="ml-2 font-mono font-bold">{formData.stockActual}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#6A6D70]">En Control Calidad:</span>
                                        <span className="ml-2 font-mono">0</span>
                                    </div>
                                    <div>
                                        <span className="text-[#6A6D70]">Bloqueado:</span>
                                        <span className="ml-2 font-mono">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounting View */}
                    {activeView === 'accounting' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Datos de Contabilidad</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.bwkey}</label>
                                    <input
                                        type="text"
                                        value={formData.bwkey}
                                        disabled
                                        className="sap-input bg-[#F5F5F5]"
                                    />
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.bklas}</label>
                                    <select
                                        value={formData.bklas}
                                        onChange={(e) => handleChange('bklas', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        <option value="7920">7920 - Mercancía Comercial</option>
                                        <option value="7900">7900 - Producto Terminado</option>
                                        <option value="3000">3000 - Materia Prima</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.vprsv}</label>
                                    <select
                                        value={formData.vprsv}
                                        onChange={(e) => handleChange('vprsv', e.target.value)}
                                        disabled={isReadOnly}
                                        className="sap-input"
                                    >
                                        {PRICE_CONTROL.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.stprs}</label>
                                    <input
                                        type="number"
                                        value={formData.stprs}
                                        onChange={(e) => handleChange('stprs', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || formData.vprsv !== 'S'}
                                        className="sap-input"
                                        step="0.01"
                                    />
                                </div>
                                <div className="sap-form-group">
                                    <label className="sap-label">{FIELD_LABELS.verpr}</label>
                                    <input
                                        type="number"
                                        value={formData.verpr}
                                        onChange={(e) => handleChange('verpr', parseFloat(e.target.value) || 0)}
                                        disabled={isReadOnly || formData.vprsv !== 'V'}
                                        className="sap-input"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Packaging Model View */}
                    {activeView === 'packaging' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[#32363A] border-b pb-2">Modelo de Empaque</h3>

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
                                        <h4 className="font-semibold mb-2">Información del Pallet (Euro Pallet)</h4>
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
                                                <span className="text-[#6A6D70]">Volumen Total Pallet:</span>
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
                                            Representación: {stacking.cajasBase} base × {stacking.niveles} niveles = {stacking.factorApilamiento} cajas
                                        </p>
                                    </div>

                                    {/* Weight per pallet */}
                                    {formData.brgew && (
                                        <div className="bg-[#FFF8E1] p-4 rounded">
                                            <h4 className="font-semibold mb-2">Peso del Pallet Cargado</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-[#6A6D70]">Peso por Caja:</span>
                                                    <span className="ml-2 font-mono">{formData.brgew} kg</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#6A6D70]">Peso Total Pallet:</span>
                                                    <span className={`ml-2 font-mono font-bold ${formData.brgew * stacking.factorApilamiento > 1000 ? 'text-[#BB0000]' : 'text-[#107E3E]'
                                                        }`}>
                                                        {(formData.brgew * stacking.factorApilamiento).toFixed(2)} kg
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-[#6A6D70]">
                                    <Box size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>Ingrese las dimensiones en "Datos Básicos 2" para calcular el modelo de empaque.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SAP-style Footer */}
                <div className="modal-footer bg-[#F5F5F5] border-t">
                    <div className="flex justify-between w-full">
                        <div className="text-xs text-[#6A6D70]">
                            {mode === 'view' ? 'Modo: Visualización' :
                                mode === 'edit' ? 'Modo: Modificación' : 'Modo: Creación'}
                        </div>
                        <div className="flex gap-2">
                            {!isReadOnly && (
                                <button onClick={handleSubmit} className="sap-btn sap-btn-primary">
                                    <Save size={14} />
                                    Guardar (Ctrl+S)
                                </button>
                            )}
                            <button onClick={onClose} className="sap-btn sap-btn-secondary">
                                <X size={14} />
                                {isReadOnly ? 'Cerrar' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
