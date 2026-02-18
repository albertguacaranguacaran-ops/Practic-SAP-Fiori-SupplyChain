import { useState } from 'react';
import { CheckCircle, AlertCircle, Filter, Layout } from 'lucide-react';

export default function ReleaseOrder({ orders, onRelease, showStatus, onClose }) {
    const [filterCode, setFilterCode] = useState('M1'); // Release Code (e.g., M1 Manager)

    // Solo mostrar pedidos pendientes (Hold)
    const pendingOrders = orders.filter(o => o.STATUS === 'Hold');

    const handleRelease = async (poNumber) => {
        try {
            await onRelease(poNumber);
            showStatus(`Pedido ${poNumber} liberado con éxito`, 'success');
        } catch (err) {
            showStatus('Error al liberar: ' + err.message, 'error');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA]">
            {/* Toolbar Standard */}
            <div className="bg-[#E5E9F0] p-1 flex items-center gap-2 border-b border-[#C4C4C4]">
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-bold text-[#32363A]">Liberar Documentos de Compra</span>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-auto">
                {/* Selection Criteria */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm mb-4">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center gap-2">
                        <Filter size={14} className="text-[#0854A0]" />
                        <span className="text-xs font-bold text-[#32363A] uppercase">Criterios de Selección</span>
                    </div>
                    <div className="p-4 flex gap-4 items-end">
                        <div className="w-1/3">
                            <label className="block text-[#6A6D70] mb-1 text-xs font-bold">Código de Liberación</label>
                            <select
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                className="sap-input w-full"
                            >
                                <option value="M1">M1 - Gerente de Compras</option>
                                <option value="D1">D1 - Director Financiero</option>
                            </select>
                        </div>
                        <div className="text-xs text-gray-500 pb-2">
                            Mostrando pedidos pendientes de aprobación para el código <strong>{filterCode}</strong>.
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layout size={14} className="text-[#0854A0]" />
                            <span className="text-xs font-bold text-[#32363A] uppercase">Documentos a Liberar</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded-full">
                            {pendingOrders.length} Pendientes
                        </span>
                    </div>

                    <table className="w-full text-sm">
                        <thead className="bg-[#F5F7FA] text-[#6A6D70] text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-3 py-2 text-left">Pedido</th>
                                <th className="px-3 py-2 text-left">Fecha</th>
                                <th className="px-3 py-2 text-left">Prov.</th>
                                <th className="px-3 py-2 text-left">Org. Comp.</th>
                                <th className="px-3 py-2 text-right">Valor Neto</th>
                                <th className="px-3 py-2 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                                        No hay documentos pendientes de liberación para este código.
                                    </td>
                                </tr>
                            ) : (
                                pendingOrders.map(order => (
                                    <tr key={order.EBELN} className="hover:bg-[#E8F4FD]">
                                        <td className="px-3 py-2 font-mono font-bold text-[#0854A0]">{order.EBELN}</td>
                                        <td className="px-3 py-2">{order.BEDAT}</td>
                                        <td className="px-3 py-2">{order.LIFNR}</td>
                                        <td className="px-3 py-2">{order.EKORG}</td>
                                        <td className="px-3 py-2 text-right font-mono">
                                            {order.NETWR.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => handleRelease(order.EBELN)}
                                                className="bg-white border border-green-500 text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto transition-colors"
                                                title="Liberar (Aprobar)"
                                            >
                                                <CheckCircle size={14} /> Liberar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
