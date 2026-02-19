import { useState } from 'react';
import { Truck, Package, CircleCheck, Search, Save, X } from 'lucide-react';

export default function OutboundDelivery({ orders, products, onPost, onClose, showStatus }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [pickedItems, setPickedItems] = useState({}); // { materialId: quantity }
    const [isPosting, setIsPosting] = useState(false);

    // Find Open Orders
    const handleSearch = () => {
        const order = orders.find(o => o.VBELN === searchTerm && o.STATUS === 'Open');
        if (order) {
            setSelectedOrder(order);
            // Initialize pick quantities (default to 0 or full?)
            // Let's default to full for speed, user can adjust
            const initialPick = {};
            order.items.forEach(item => {
                initialPick[item.material] = item.quantity;
            });
            setPickedItems(initialPick);
            showStatus('Pedido encontrado. Verifique picking.', 'success');
        } else {
            setSelectedOrder(null);
            showStatus('Pedido no encontrado o ya procesado.', 'error');
        }
    };

    const handlePickChange = (materialId, qty) => {
        setPickedItems(prev => ({
            ...prev,
            [materialId]: qty
        }));
    };

    const handlePostGoodsIssue = async () => {
        if (!selectedOrder) return;

        setIsPosting(true);
        try {
            // 1. Update Order Status
            await onPost(selectedOrder.VBELN, pickedItems);

            showStatus(`Entrega de salida creada y contabilizada para pedido ${selectedOrder.VBELN}`, 'success');
            setTimeout(onClose, 1500);
        } catch (err) {
            showStatus('Error al contabilizar: ' + err.message, 'error');
            setIsPosting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            {/* Header */}
            <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <Truck size={18} />
                    <span className="font-bold text-sm">Crear Entrega de Salida con Referencia a Pedido</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded border border-[#C4C4C4] shadow-sm mb-4">
                    <label className="block text-xs font-bold text-[#6A6D70] mb-2 uppercase">Pedido de Cliente</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="sap-input w-48"
                            placeholder="Ej: 10000001"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <button onClick={handleSearch} className="sap-btn sap-btn-primary">
                            <Search size={14} /> Buscar
                        </button>
                    </div>
                </div>

                {/* Picking Table */}
                {selectedOrder && (
                    <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                        <div className="bg-[#EFF4F9] px-3 py-2 border-b border-[#C4C4C4] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-[#0854A0]">Resumen de Picking</h3>
                            <span className="text-xs text-gray-500">Cliente: {selectedOrder.kunnr}</span>
                        </div>

                        <table className="w-full text-sm">
                            <thead className="bg-[#F5F7FA] text-[#6A6D70] text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left">Material</th>
                                    <th className="px-3 py-2 text-left">Descripción</th>
                                    <th className="px-3 py-2 text-right">Cant. Pedida</th>
                                    <th className="px-3 py-2 text-right">Cant. Pickeada</th>
                                    <th className="px-3 py-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedOrder.items.map(item => {
                                    const picked = pickedItems[item.material] || 0;
                                    const isFull = picked >= item.quantity;
                                    return (
                                        <tr key={item.material}>
                                            <td className="px-3 py-2 font-mono text-[#0854A0]">{item.material}</td>
                                            <td className="px-3 py-2">{item.description}</td>
                                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right">
                                                <input
                                                    type="number"
                                                    className={`w-20 text-right border rounded px-1 ${isFull ? 'bg-green-50 border-green-200' : 'border-gray-300'}`}
                                                    value={picked}
                                                    onChange={e => handlePickChange(item.material, parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {isFull ? <CircleCheck size={16} className="text-green-500 mx-auto" /> : <span className="text-xs text-orange-500">Pendiente</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="p-4 bg-[#F5F7FA] border-t border-[#C4C4C4] flex justify-end gap-3">
                            <button
                                onClick={handlePostGoodsIssue}
                                disabled={isPosting}
                                className="sap-btn sap-btn-primary bg-[#E9730C] border-[#E9730C] text-white hover:bg-[#D36605]"
                            >
                                <Save size={14} /> Contabilizar Salida de Mercancías
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
