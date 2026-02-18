import { useState } from 'react';
import { Book, Search, Download, X, Database, Key } from 'lucide-react';

const DICTIONARY_DATA = {
    tables: [
        { name: 'MARA', module: 'MM', desc: 'Maestro de Materiales (General)', key: 'MATNR' },
        { name: 'MAKT', module: 'MM', desc: 'Descripciones de Materiales', key: 'MATNR' },
        { name: 'MARC', module: 'MM', desc: 'Datos de Material por Centro', key: 'MATNR, WERKS' },
        { name: 'MARD', module: 'MM', desc: 'Datos de Almacenamiento (Stock)', key: 'MATNR, WERKS, LGORT' },
        { name: 'LFA1', module: 'MM', desc: 'Maestro de Proveedores (General)', key: 'LIFNR' },
        { name: 'EKKO', module: 'MM', desc: 'Cabecera del Pedido de Compra', key: 'EBELN' },
        { name: 'EKPO', module: 'MM', desc: 'Posición del Pedido de Compra', key: 'EBELN, EBELP' },
        { name: 'MKPF', module: 'MM', desc: 'Cabecera Documento Material (MIGO)', key: 'MBLNR' },
        { name: 'VBAK', module: 'SD', desc: 'Cabecera Pedido de Venta', key: 'VBELN' },
        { name: 'VBAP', module: 'SD', desc: 'Posición Pedido de Venta', key: 'VBELN, POSNR' },
        { name: 'KNA1', module: 'SD', desc: 'Maestro de Clientes (General)', key: 'KUNNR' },
        { name: 'LIKP', module: 'SD', desc: 'Cabecera de Entrega', key: 'VBELN' },
    ],
    fields: [
        { name: 'MATNR', desc: 'Número de Material' },
        { name: 'LIFNR', desc: 'Número de Cuenta del Proveedor' },
        { name: 'KUNNR', desc: 'Número de Cliente' },
        { name: 'EBELN', desc: 'Número del Documento de Compras' },
        { name: 'VBELN', desc: 'Documento de Ventas y Distribución' },
        { name: 'WERKS', desc: 'Centro (Planta)' },
        { name: 'LGORT', desc: 'Almacén' },
        { name: 'VKORG', desc: 'Organización de Ventas' },
        { name: 'VTWEG', desc: 'Canal de Distribución' },
        { name: 'SPART', desc: 'Sector' },
        { name: 'BUKRS', desc: 'Sociedad' },
        { name: 'GJAHR', desc: 'Ejercicio (Año Fiscal)' },
        { name: 'NETWR', desc: 'Valor Neto del Pedido' },
        { name: 'MENGE', desc: 'Cantidad' },
        { name: 'MEINS', desc: 'Unidad de Medida Base' }
    ]
};

export default function DataDictionary({ onClose }) {
    const [activeTab, setActiveTab] = useState('tables');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTables = DICTIONARY_DATA.tables.filter(t =>
        t.name.includes(searchTerm.toUpperCase()) ||
        t.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFields = DICTIONARY_DATA.fields.filter(f =>
        f.name.includes(searchTerm.toUpperCase()) ||
        f.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col print:absolute print:inset-0 print:bg-white print:z-[9999]">
            {/* Header - Hidden in Print */}
            <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md print:hidden">
                <div className="flex items-center gap-2">
                    <Book size={18} />
                    <span className="font-bold text-sm">Diccionario de Datos ABAP (/nDIC)</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>

            {/* Print Header - Visible only in Print */}
            <div className="hidden print:block p-8 pb-4 border-b">
                <h1 className="text-2xl font-bold text-[#0854A0] mb-2">Diccionario de Datos SAP</h1>
                <p className="text-sm text-gray-600">Referencia Técnica para Consultores Funcionales</p>
                <p className="text-xs text-gray-400 mt-1">Generado el: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex-1 overflow-auto p-4 print:overflow-visible">
                {/* Search & Tabs - Hidden in Print */}
                <div className="print:hidden">
                    <div className="bg-white p-4 rounded border border-[#C4C4C4] shadow-sm mb-4">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    className="sap-input w-full pl-9"
                                    placeholder="Buscar Tabla o Campo (ej: MARA, Material, WERKS)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={handlePrint} className="sap-btn sap-btn-secondary flex items-center gap-2">
                                <Download size={16} />
                                Exportar PDF
                            </button>
                        </div>

                        <div className="flex gap-2 border-b border-[#C4C4C4]">
                            <button
                                onClick={() => setActiveTab('tables')}
                                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'tables' ? 'border-[#0854A0] text-[#0854A0]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Tablas Comunes
                            </button>
                            <button
                                onClick={() => setActiveTab('fields')}
                                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'fields' ? 'border-[#0854A0] text-[#0854A0]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Campos Clave
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm print:border-none print:shadow-none">
                    {/* Tables Section */}
                    {(activeTab === 'tables' || searchTerm) && (
                        <div className="p-4">
                            <h3 className="font-bold text-[#0854A0] mb-3 flex items-center gap-2">
                                <Database size={16} />
                                Tablas del Sistema
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#F5F7FA] text-[#6A6D70] uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="px-3 py-2">Tabla</th>
                                            <th className="px-3 py-2">Módulo</th>
                                            <th className="px-3 py-2">Descripción</th>
                                            <th className="px-3 py-2">Clave Primaria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTables.map(t => (
                                            <tr key={t.name} className="hover:bg-[#E8F4FD]">
                                                <td className="px-3 py-2 font-mono font-bold text-[#0854A0]">{t.name}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${t.module === 'MM' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                                                        {t.module}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">{t.desc}</td>
                                                <td className="px-3 py-2 font-mono text-xs">{t.key}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Separator for Print if showing both */}
                    <div className="hidden print:block h-8"></div>

                    {/* Fields Section */}
                    {(activeTab === 'fields' || searchTerm) && (
                        <div className="p-4 border-t border-[#C4C4C4] print:border-none">
                            <h3 className="font-bold text-[#0854A0] mb-3 flex items-center gap-2">
                                <Key size={16} />
                                Campos Técnicos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredFields.map(f => (
                                    <div key={f.name} className="flex flex-col p-3 bg-[#F9FAFB] rounded border border-gray-100">
                                        <span className="font-mono font-bold text-[#0854A0]">{f.name}</span>
                                        <span className="text-gray-600 text-xs mt-1">{f.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    body > *:not(.fixed) {
                        display: none !important;
                    }
                    .fixed.print\\:absolute {
                        position: absolute !important;
                        display: flex !important;
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
}
