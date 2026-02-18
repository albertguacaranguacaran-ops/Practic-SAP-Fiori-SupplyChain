import React, { useState } from 'react';
import { Save, X, Building, Globe, CreditCard } from 'lucide-react';

export default function VendorMaster({ onClose, onSave, onStatusMessage }) {
    const [activeTab, setActiveTab] = useState('general'); // general, company, purchase
    const [formData, setFormData] = useState({
        NAME1: '',      // Nombre
        ORT01: '',      // Ciudad
        LAND1: '',      // País
        STRAS: '',      // Dirección
        TELF1: '',      // Teléfono
        AKONT: '160000',// Cuenta Asociada (Recon. Account)
        ZTERM: '0001',  // Condiciones de Pago
        WAERS: 'USD'    // Moneda de Pedido
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Validaciones básicas
        if (!formData.NAME1 || !formData.LAND1) {
            onStatusMessage?.('Complete los campos obligatorios (Nombre, País)', 'error');
            return;
        }

        onStatusMessage?.('Guardando acreedor...', 'warning');

        try {
            const result = await onSave(formData);
            if (result.success) {
                onStatusMessage?.(`Acreedor ${result.id} creado en la sociedad 1000`, 'success');
                setTimeout(onClose, 2000);
            }
        } catch (err) {
            onStatusMessage?.('Error al crear acreedor: ' + err.message, 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#F5F7FA] w-[800px] h-[600px] shadow-2xl flex flex-col border border-[#0854A0]" onClick={e => e.stopPropagation()}>

                {/* SAP Header */}
                <div className="bg-[#E5E9F0] border-b border-[#C4C4C4] px-4 py-2 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-[#6A6D70] font-bold text-xs">Crear acreedor: Acceso</span>
                        <span className="text-black font-normal text-xs bg-white px-2 py-0.5 border border-gray-300 shadow-inner">
                            XK01
                        </span>
                    </div>
                    <button onClick={onClose} className="hover:bg-red-100 p-1 rounded">
                        <X size={16} className="text-gray-500 hover:text-red-600" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-[#F5F7FA] border-b border-[#C4C4C4] p-2 flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1 rounded hover:bg-blue-50 transition-colors shadow-sm"
                        title="Guardar (Ctrl+S)"
                    >
                        <Save size={14} className="text-[#0854A0]" />
                        <span className="text-xs font-bold text-[#333]">Grabar</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-[#E8F1F8] px-4 pt-4 border-b border-[#C4C4C4] flex gap-1">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${activeTab === 'general'
                                ? 'bg-white text-[#0854A0] border-t border-x border-[#C4C4C4] relative top-[1px]'
                                : 'bg-[#DDE4EB] text-gray-500 hover:bg-[#E2E8F0]'
                            }`}
                    >
                        Datos Generales
                    </button>
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${activeTab === 'company'
                                ? 'bg-white text-[#0854A0] border-t border-x border-[#C4C4C4] relative top-[1px]'
                                : 'bg-[#DDE4EB] text-gray-500 hover:bg-[#E2E8F0]'
                            }`}
                    >
                        Datos de Sociedad
                    </button>
                    <button
                        onClick={() => setActiveTab('purchase')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${activeTab === 'purchase'
                                ? 'bg-white text-[#0854A0] border-t border-x border-[#C4C4C4] relative top-[1px]'
                                : 'bg-[#DDE4EB] text-gray-500 hover:bg-[#E2E8F0]'
                            }`}
                    >
                        Datos de Compras
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 bg-white p-6 overflow-y-auto">

                    {/* General Data Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4 text-[#0854A0] border-b pb-2">
                                <Building size={18} />
                                <h3 className="font-bold text-sm">Dirección del Acreedor</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-xs font-bold text-gray-600 text-right">Nombre *</label>
                                <div className="col-span-9">
                                    <input
                                        type="text"
                                        name="NAME1"
                                        value={formData.NAME1}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none bg-[#FFF8E1]"
                                        placeholder="Ej: Samsung Electronics"
                                    />
                                </div>

                                <label className="col-span-3 text-xs font-bold text-gray-600 text-right">Calle / Nro</label>
                                <div className="col-span-9">
                                    <input
                                        type="text"
                                        name="STRAS"
                                        value={formData.STRAS}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none"
                                        placeholder="Calle Principal 123"
                                    />
                                </div>

                                <label className="col-span-3 text-xs font-bold text-gray-600 text-right">Código Postal / Ciudad</label>
                                <div className="col-span-3">
                                    <input className="w-full border border-[#89A7C2] p-1.5 text-sm outline-none" placeholder="CP" disabled />
                                </div>
                                <div className="col-span-6">
                                    <input
                                        type="text"
                                        name="ORT01"
                                        value={formData.ORT01}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none"
                                        placeholder="Ciudad"
                                    />
                                </div>

                                <label className="col-span-3 text-xs font-bold text-gray-600 text-right">País *</label>
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        name="LAND1"
                                        value={formData.LAND1}
                                        onChange={handleChange}
                                        maxLength={2}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none uppercase text-center bg-[#FFF8E1]"
                                        placeholder="VE"
                                    />
                                </div>
                                <div className="col-span-7 text-xs text-gray-400 italic">
                                    (VE=Venezuela, US=USA, KR=Corea, CN=China)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Data Tab */}
                    {activeTab === 'company' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4 text-[#0854A0] border-b pb-2">
                                <CreditCard size={18} />
                                <h3 className="font-bold text-sm">Gestión de Cuenta (Sociedad 1000)</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-4 text-xs font-bold text-gray-600 text-right">Cuenta Asociada *</label>
                                <div className="col-span-8">
                                    <select
                                        name="AKONT"
                                        value={formData.AKONT}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none bg-[#FFF8E1]"
                                    >
                                        <option value="160000">160000 - Proveedores Nacionales</option>
                                        <option value="161000">161000 - Proveedores del Exterior</option>
                                        <option value="162000">162000 - Proveedores Intercompany</option>
                                    </select>
                                </div>

                                <label className="col-span-4 text-xs font-bold text-gray-600 text-right">Condición de Pago</label>
                                <div className="col-span-8">
                                    <select
                                        name="ZTERM"
                                        value={formData.ZTERM}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none"
                                    >
                                        <option value="0001">0001 - Contado inmediato</option>
                                        <option value="0002">0002 - 30 días neto</option>
                                        <option value="0003">0003 - 60 días neto</option>
                                        <option value="NT00">NT00 - Inmediato</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchasing Data Tab */}
                    {activeTab === 'purchase' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4 text-[#0854A0] border-b pb-2">
                                <Globe size={18} />
                                <h3 className="font-bold text-sm">Datos de Compras (Org. Compra 1000)</h3>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-4 text-xs font-bold text-gray-600 text-right">Moneda de Pedido</label>
                                <div className="col-span-8">
                                    <select
                                        name="WAERS"
                                        value={formData.WAERS}
                                        onChange={handleChange}
                                        className="w-full border border-[#89A7C2] p-1.5 text-sm focus:ring-1 focus:ring-[#0854A0] outline-none"
                                    >
                                        <option value="USD">USD - Dolar Americano</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="VES">VES - Bolivar Soberano</option>
                                        <option value="CNY">CNY - Yuan Chino</option>
                                    </select>
                                </div>

                                <label className="col-span-4 text-xs font-bold text-gray-600 text-right">Grupo Esquema Prov.</label>
                                <div className="col-span-8">
                                    <input
                                        type="text"
                                        value="01 (Normal)"
                                        disabled
                                        className="w-full border border-gray-200 bg-gray-50 p-1.5 text-sm text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer status */}
                <div className="bg-[#F5F7FA] border-t border-[#C4C4C4] px-2 py-0.5 text-[10px] text-[#6A6D70] flex justify-between">
                    <span>Sistema: PRD (300)</span>
                    <span>Modo: Crear</span>
                </div>
            </div>
        </div>
    );
}
