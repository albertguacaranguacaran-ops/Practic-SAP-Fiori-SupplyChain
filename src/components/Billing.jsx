import { useState } from 'react';
import { Receipt, Search, Save, CircleCheck, CircleAlert } from 'lucide-react';

export default function Billing({ orders, onCreateInvoice, onClose, showStatus }) {
    const [deliveryId, setDeliveryId] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = () => {
        // En nuestro modelo simplificado, la Entrega tiene el mismo ID que el Pedido
        // pero buscamos uno que ya haya pasado por VL01N (podríamos agregar status 'Delivered' luego)
        // Por ahora, buscamos el Pedido por ID.
        const order = orders.find(o => o.VBELN === deliveryId);

        if (!order) {
            showStatus('Documento no encontrado', 'error');
            setSelectedOrder(null);
            return;
        }

        if (order.STATUS === 'Invoiced') {
            showStatus('Este documento ya fue facturado', 'warning');
            setSelectedOrder(null); // O mostrarlo en modo lectura? Mejor null para simplificar
            return;
        }

        setSelectedOrder(order);
        showStatus('Documento encontrado. Listo para facturar.', 'success');
    };

    const handleSave = async () => {
        if (!selectedOrder) return;

        setIsProcessing(true);
        try {
            const result = await onCreateInvoice(selectedOrder.VBELN);

            showStatus(`Factura ${result.id} guardada correctamente.`, 'success');
            setTimeout(onClose, 2000);
        } catch (err) {
            showStatus('Error al facturar: ' + err.message, 'error');
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            {/* Header */}
            <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <Receipt size={18} />
                    <span className="font-bold text-sm">Crear Factura (VF01)</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {/* Search / Input Area */}
                <div className="bg-white p-4 rounded border border-[#C4C4C4] shadow-sm mb-4">
                    <h3 className="text-sm font-bold text-[#6A6D70] mb-3 uppercase">Selección de Documentos</h3>

                    <div className="flex gap-4 items-end">
                        <div className="flex-1 max-w-md">
                            <label className="block text-xs font-bold text-[#6A6D70] mb-1">Documento de Entrega</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="sap-input w-full"
                                    placeholder="Ej: 10000001"
                                    value={deliveryId}
                                    onChange={e => setDeliveryId(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} className="sap-btn sap-btn-secondary">
                                    <Search size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            {/* Extras like Billing Type could go here */}
                            <label className="block text-xs text-[#6A6D70] mb-1">Clase de Factura</label>
                            <input type="text" className="sap-input w-24 bg-gray-100" value="F2 (Factura)" disabled />
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                {selectedOrder && (
                    <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                        <div className="bg-[#EFF4F9] px-3 py-2 border-b border-[#C4C4C4] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-[#0854A0]">Resumen de Facturación</h3>
                            <span className="text-xs font-mono">Cliente: {selectedOrder.kunnr}</span>
                        </div>

                        <table className="w-full text-sm">
                            <thead className="bg-[#F5F7FA] text-[#6A6D70] text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left">Pos</th>
                                    <th className="px-3 py-2 text-left">Material</th>
                                    <th className="px-3 py-2 text-left">Descripción</th>
                                    <th className="px-3 py-2 text-right">Cantidad</th>
                                    <th className="px-3 py-2 text-right">Valor Neto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedOrder.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2 text-gray-500">{(idx + 1) * 10}</td>
                                        <td className="px-3 py-2 font-mono text-[#0854A0]">{item.material}</td>
                                        <td className="px-3 py-2">{item.description}</td>
                                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                                        <td className="px-3 py-2 text-right font-mono">
                                            {(item.price * item.quantity).toLocaleString()} USD
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-[#FFFFCC] font-bold border-t border-[#C4C4C4]">
                                <tr>
                                    <td colSpan={4} className="px-3 py-2 text-right">Total Neto:</td>
                                    <td className="px-3 py-2 text-right">
                                        {selectedOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()} USD
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="bg-[#F5F7FA] border-t border-[#C4C4C4] p-3 flex justify-end gap-2">
                <button
                    onClick={handleSave}
                    disabled={!selectedOrder || isProcessing}
                    className="sap-btn sap-btn-primary bg-[#E9730C] border-[#E9730C] text-white hover:bg-[#D36605]"
                >
                    <Save size={14} /> Contabilizar Factura
                </button>
            </div>
        </div>
    );
}
