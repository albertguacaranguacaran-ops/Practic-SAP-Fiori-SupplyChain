import { useState } from 'react';
import {
    Plus, Trash2, Save, X, ShoppingCart, Package,
    Calculator, Truck, AlertTriangle, CheckCircle
} from 'lucide-react';
import { calculateStackingFactor, calculateOrderLogistics } from '../utils/packagingCalc';

export default function SalesOrder({
    products,
    onClose,
    onStatusMessage
}) {
    const [orderLines, setOrderLines] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter products for search
    const filteredProducts = products.filter(p =>
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ean.includes(searchTerm)
    ).slice(0, 20);

    // Add line to order
    const addLine = () => {
        if (!selectedProduct || cantidad < 1) return;

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        // Check if product already in order
        const existingIndex = orderLines.findIndex(l => l.product.id === selectedProduct);
        if (existingIndex >= 0) {
            const updated = [...orderLines];
            updated[existingIndex].cantidad += cantidad;
            setOrderLines(updated);
        } else {
            setOrderLines([...orderLines, { product, cantidad }]);
        }

        setSelectedProduct('');
        setCantidad(1);
        setSearchTerm('');
    };

    // Remove line
    const removeLine = (index) => {
        setOrderLines(orderLines.filter((_, i) => i !== index));
    };

    // Update quantity
    const updateQuantity = (index, newQty) => {
        if (newQty < 1) return;
        const updated = [...orderLines];
        updated[index].cantidad = newQty;
        setOrderLines(updated);
    };

    // Calculate logistics
    const logistics = orderLines.length > 0 ? calculateOrderLogistics(orderLines) : null;

    // Calculate totals
    const totalUnits = orderLines.reduce((sum, l) => sum + l.cantidad, 0);
    const totalValue = orderLines.reduce((sum, l) => sum + (l.product.precioBase * l.cantidad), 0);

    // Save order
    const handleSave = () => {
        if (orderLines.length === 0) {
            onStatusMessage?.('No hay líneas en el pedido', 'error');
            return;
        }

        // Simulate save
        const orderNumber = `PV-${Date.now().toString().slice(-8)}`;
        onStatusMessage?.(`Pedido ${orderNumber} creado exitosamente. ${logistics?.totalPallets} pallets.`, 'success');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content w-[1000px]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[#0854A0] bg-[#E8F4FD] px-2 py-0.5 rounded">/nVA01</span>
                        <ShoppingCart size={18} className="text-[#0854A0]" />
                        <span className="font-semibold">Crear Pedido de Venta</span>
                    </div>
                    <button onClick={onClose} className="hover:bg-[#E0E0E0] p-1 rounded">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left: Order Lines */}
                        <div className="col-span-2">
                            {/* Add Line Form */}
                            <div className="bg-[#F2F2F2] p-4 rounded mb-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Plus size={16} />
                                    Agregar Línea de Pedido
                                </h4>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar material (ID, EAN o descripción)..."
                                            className="form-input w-full"
                                        />
                                        {searchTerm && filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-[#C4C4C4] 
                                      rounded-b shadow-lg z-10 max-h-48 overflow-auto">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedProduct(p.id);
                                                            setSearchTerm(p.descripcion);
                                                        }}
                                                        className="px-3 py-2 hover:bg-[#E8F4FD] cursor-pointer text-sm"
                                                    >
                                                        <span className="font-mono text-[#0854A0]">{p.id}</span>
                                                        <span className="mx-2">-</span>
                                                        <span className="truncate">{p.descripcion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                                        min="1"
                                        className="form-input w-24 text-center"
                                        placeholder="Cant."
                                    />
                                    <button
                                        onClick={addLine}
                                        disabled={!selectedProduct}
                                        className="sap-btn sap-btn-primary disabled:opacity-50"
                                    >
                                        <Plus size={14} />
                                        Agregar
                                    </button>
                                </div>
                            </div>

                            {/* Order Lines Table */}
                            <div className="border rounded overflow-hidden">
                                <table className="alv-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}>#</th>
                                            <th style={{ width: 100 }}>Material</th>
                                            <th>Descripción</th>
                                            <th style={{ width: 80 }} className="text-right">Cantidad</th>
                                            <th style={{ width: 90 }} className="text-right">Precio</th>
                                            <th style={{ width: 100 }} className="text-right">Subtotal</th>
                                            <th style={{ width: 70 }} className="text-right">Pallets</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderLines.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-[#6A6D70]">
                                                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                                                    No hay líneas de pedido
                                                </td>
                                            </tr>
                                        ) : (
                                            orderLines.map((line, idx) => {
                                                const stacking = calculateStackingFactor(line.product.largo, line.product.ancho, line.product.alto);
                                                const pallets = stacking ? Math.ceil(line.cantidad / stacking.factorApilamiento) : '—';

                                                return (
                                                    <tr key={idx}>
                                                        <td className="text-center">{idx + 1}</td>
                                                        <td className="font-mono text-[#0854A0]">{line.product.id}</td>
                                                        <td className="truncate max-w-48">{line.product.descripcion}</td>
                                                        <td className="text-right">
                                                            <input
                                                                type="number"
                                                                value={line.cantidad}
                                                                onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                                                min="1"
                                                                className="w-16 text-right border border-[#C4C4C4] rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="text-right">${line.product.precioBase.toFixed(2)}</td>
                                                        <td className="text-right font-semibold">
                                                            ${(line.product.precioBase * line.cantidad).toFixed(2)}
                                                        </td>
                                                        <td className="text-right">{pallets}</td>
                                                        <td>
                                                            <button
                                                                onClick={() => removeLine(idx)}
                                                                className="p-1 text-[#BB0000] hover:bg-[#FFEBEE] rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right: Summary & Logistics */}
                        <div className="space-y-4">
                            {/* Order Summary */}
                            <div className="bg-[#E8F4FD] p-4 rounded">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#0854A0]">
                                    <Calculator size={16} />
                                    Resumen del Pedido
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Líneas:</span>
                                        <span className="font-semibold">{orderLines.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Unidades:</span>
                                        <span className="font-semibold">{totalUnits.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-2">
                                        <span>Total:</span>
                                        <span className="font-bold text-lg">${totalValue.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Summary */}
                            {logistics && (
                                <div className="bg-[#F2F2F2] p-4 rounded">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Truck size={16} />
                                        Ocupación Logística
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Volumen Total:</span>
                                            <span className="font-mono">{logistics.totalVolume} m³</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Peso Total:</span>
                                            <span className="font-mono">{logistics.totalWeight} kg</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                            <span className="font-semibold">Pallets Necesarios:</span>
                                            <span className="text-2xl font-bold text-[#0854A0]">{logistics.totalPallets}</span>
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    {logistics.details.some(d => d.error) && (
                                        <div className="mt-3 p-2 bg-[#FFF3CD] rounded text-sm flex items-start gap-2">
                                            <AlertTriangle size={16} className="text-[#856404] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-[#856404]">Advertencia:</span>
                                                <span className="text-[#856404]"> Algunos materiales no tienen dimensiones completas.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Stats */}
                            {orderLines.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#107E3E] text-white p-3 rounded text-center">
                                        <p className="text-xs opacity-80">Con Datos</p>
                                        <p className="text-xl font-bold">
                                            {logistics?.details.filter(d => !d.error).length || 0}
                                        </p>
                                    </div>
                                    <div className="bg-[#E9730C] text-white p-3 rounded text-center">
                                        <p className="text-xs opacity-80">Sin Datos</p>
                                        <p className="text-xl font-bold">
                                            {logistics?.details.filter(d => d.error).length || 0}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={handleSave} className="sap-btn sap-btn-primary" disabled={orderLines.length === 0}>
                        <Save size={14} />
                        Crear Pedido
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
