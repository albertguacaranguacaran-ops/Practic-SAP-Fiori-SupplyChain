import { useState, useEffect } from 'react';
import { Save, CircleAlert, Plus, Trash2, Calendar, Layout } from 'lucide-react';

export default function PurchaseOrder({ onSave, onCancel, showStatus, vendors = [], materials = [] }) {
    const [header, setHeader] = useState({
        proveedor: '',
        orgCompras: '1000',
        gpoCompras: 'A01',
        empresa: '1000',
        fechaDoc: new Date().toISOString().split('T')[0]
    });

    const [items, setItems] = useState([
        { pos: 10, material: '', cantidad: 1, precio: 0, centro: '1000', almacen: '0001' }
    ]);

    const handleHeaderChange = (e) => {
        setHeader({ ...header, [e.target.name]: e.target.value });
    };

    const addItem = () => {
        const newPos = items.length > 0 ? items[items.length - 1].pos + 10 : 10;
        setItems([...items, { pos: newPos, material: '', cantidad: 1, precio: 0, centro: '1000', almacen: '0001' }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    // Validar material al perder foco o cambiar
    const validateMaterial = (index, matId) => {
        if (!matId) return;
        const product = materials.find(m => m.id === matId);
        if (product) {
            // Auto-fill precio si existe (simulado)
            handleItemChange(index, 'precio', product.precioBase || 100);
        } else {
            showStatus && showStatus(`Material ${matId} no existe en centro 1000`, 'warning');
        }
    };

    const handleSubmit = async () => {
        if (!header.proveedor) {
            showStatus && showStatus('Por favor seleccione un proveedor', 'error');
            return;
        }

        // Validar items
        const invalidItem = items.find(i => !i.material || i.cantidad <= 0);
        if (invalidItem) {
            showStatus && showStatus('Complete todos los materiales y cantidades', 'error');
            return;
        }

        showStatus && showStatus('Creando pedido estándar...', 'warning');

        try {
            const result = await onSave(header, items);
            if (result.success) {
                showStatus && showStatus(`Pedido estándar ${result.id} creado`, 'success');
                // Reset form optionally or close
            }
        } catch (err) {
            showStatus && showStatus('Error al crear pedido: ' + err.message, 'error');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA]">
            {/* Toolbar Standard de SAP */}
            <div className="bg-[#E5E9F0] p-1 flex items-center gap-2 border-b border-[#C4C4C4]">
                <button
                    onClick={handleSubmit}
                    className="sap-btn-icon text-[#b00] hover:bg-[#D0D4DA]"
                    title="Grabar (Ctrl+S)">
                    <Save size={16} />
                </button>
                <div className="w-px h-5 bg-gray-400 mx-1"></div>
                <span className="text-xs font-bold text-[#32363A]">Crear Pedido Estándar</span>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">

                {/* CABECERA (Header) */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center gap-2">
                        <Layout size={14} className="text-[#0854A0]" />
                        <span className="text-xs font-bold text-[#32363A] uppercase">Cabecera del Pedido</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Clase Pedido</label>
                            <input type="text" value="NB - Pedido Estándar" disabled className="sap-input bg-gray-100" />
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs font-bold">Proveedor</label>
                            <select
                                name="proveedor"
                                value={header.proveedor}
                                onChange={handleHeaderChange}
                                className="sap-input border-l-4 border-l-[#E9730C]" // Naranja indica obligatorio
                            >
                                <option value="">-- Seleccionar --</option>
                                {vendors.map(p => (
                                    <option key={p.LIFNR} value={p.LIFNR}>{p.LIFNR} - {p.NAME1}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Org. Compras</label>
                            <input type="text" value="1000" disabled className="sap-input bg-gray-100" />
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Fecha Doc.</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="fechaDoc"
                                    value={header.fechaDoc}
                                    onChange={handleHeaderChange}
                                    className="sap-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESUMEN DE POSICIONES (Items) */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm flex-1">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layout size={14} className="text-[#0854A0]" />
                            <span className="text-xs font-bold text-[#32363A] uppercase">Resumen de Posiciones</span>
                        </div>
                        <button
                            onClick={addItem}
                            className="text-xs flex items-center gap-1 text-[#0854A0] hover:underline"
                        >
                            <Plus size={12} /> Agregar Posición
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F5F7FA] text-[#6A6D70] text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-3 py-2 text-left w-12">E</th>
                                    <th className="px-3 py-2 text-left w-16">Pos</th>
                                    <th className="px-3 py-2 text-left w-48">Material</th>
                                    <th className="px-3 py-2 text-left w-24">Cantidad</th>
                                    <th className="px-3 py-2 text-left w-32">Precio Neto</th>
                                    <th className="px-3 py-2 text-left w-20">Centro</th>
                                    <th className="px-3 py-2 text-center w-12">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-[#E8F4FD]">
                                        <td className="px-3 py-1">
                                            {header.proveedor && item.material ?
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div> :
                                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            }
                                        </td>
                                        <td className="px-3 py-1 font-mono text-xs">{item.pos}</td>
                                        <td className="px-3 py-1">
                                            <input
                                                type="text"
                                                value={item.material}
                                                onChange={(e) => handleItemChange(index, 'material', e.target.value.toUpperCase())}
                                                onBlur={(e) => validateMaterial(index, e.target.value.toUpperCase())}
                                                className="sap-input h-7 uppercase font-mono"
                                                placeholder="Ej: LB-000001"
                                                list="material-list"
                                            />
                                            <datalist id="material-list">
                                                {materials.slice(0, 10).map(m => (
                                                    <option key={m.id} value={m.id}>{m.descripcion}</option>
                                                ))}
                                            </datalist>
                                        </td>
                                        <td className="px-3 py-1">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.cantidad}
                                                onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                                                className="sap-input h-7 text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-1">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.precio}
                                                onChange={(e) => handleItemChange(index, 'precio', parseFloat(e.target.value) || 0)}
                                                className="sap-input h-7 text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-1">
                                            <input type="text" value={item.centro} disabled className="sap-input h-7 bg-gray-50 text-center" />
                                        </td>
                                        <td className="px-3 py-1 text-center">
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-2 border-t text-xs text-gray-500 bg-[#FAFAFA]">
                        Total Calculado: USD {items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0).toFixed(2)}
                    </div>
                </div>

            </div>
        </div>
    );
}
