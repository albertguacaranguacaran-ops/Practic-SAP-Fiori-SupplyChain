import { useState } from 'react';
import { Save, Truck, Box, Layers, ClipboardCheck } from 'lucide-react';

export default function GoodsMovement({ onPost, onClose, showStatus, onFindPO }) {
    const [header, setHeader] = useState({
        fechaDoc: new Date().toISOString().split('T')[0],
        fechaCont: new Date().toISOString().split('T')[0],
        notaEntrega: '',
        textoCabecera: ''
    });

    const [item, setItem] = useState({
        material: '',
        cantidad: 1,
        claseMov: '101', // 101 Entrada de mercancías
        centro: '1000',
        almacen: '0001',
        lote: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleHeaderChange = (e) => {
        const value = e.target.name === 'notaEntrega' ? e.target.value.toUpperCase() : e.target.value;
        setHeader({ ...header, [e.target.name]: value });
    };

    const handleItemChange = (e) => {
        const upperFields = ['material', 'almacen', 'centro'];
        const value = upperFields.includes(e.target.name) ? e.target.value.toUpperCase() : e.target.value;
        setItem({ ...item, [e.target.name]: value });
    };

    const [action, setAction] = useState('A01'); // A01 Receipt, A07 Issue
    const [refDoc, setRefDoc] = useState('R10'); // R10 Others, R01 Purchase Order
    const [poNumber, setPoNumber] = useState('');

    const handleRefChange = (e) => {
        setRefDoc(e.target.value);
        // Reset item if switching reference
        setItem(prev => ({ ...prev, material: '', quantity: 1 }));
    };

    const findPO = async () => {
        if (!poNumber) return;
        try {
            // This needs to be passed from parent or context. 
            // For now, we will receive a "onFindPO" prop or similar.
            // But to keep it simple, let's assume the parent passes the "orders" list 
            // OR we bubble up the request.
            // Better approach: The parent passes `orders` prop.
            if (onFindPO) {
                const order = onFindPO(poNumber);
                if (order) {
                    // Pre-fill from first item (Simplified for demo)
                    const firstItem = order.ITEMS[0];
                    if (firstItem) {
                        setItem(prev => ({
                            ...prev,
                            material: firstItem.MATNR,
                            cantidad: firstItem.MENGE,
                            claseMov: '101'
                        }));
                        showStatus(`Pedido ${poNumber} encontrado. Material ${firstItem.MATNR} copiado.`, 'success');
                    }
                } else {
                    showStatus('Pedido no encontrado o no liberado.', 'error');
                }
            }
        } catch (err) {
            showStatus('Error buscando pedido: ' + err.message, 'error');
        }
    };

    const handlePost = async () => {
        if (!item.material) {
            showStatus('Debe especificar un material', 'error');
            return;
        }
        if (item.cantidad <= 0) {
            showStatus('La cantidad debe ser mayor a 0', 'error');
            return;
        }

        setIsSubmitting(true);

        // Preparar objeto de movimiento
        const movementData = {
            ...header,
            ...item,
            docMaterial: '50' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            refDoc: refDoc === 'R01' ? poNumber : null
        };

        // Simulate small delay for UX if onPost is fast
        await onPost(movementData);
        setIsSubmitting(false);
    };

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA]">
            {/* Toolbar Standard de SAP */}
            <div className="bg-[#E5E9F0] p-1 flex items-center justify-between border-b border-[#C4C4C4]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePost}
                        disabled={isSubmitting}
                        className={`sap-btn-icon ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'text-[#b00] hover:bg-[#D0D4DA]'}`}
                        title="Contabilizar (Ctrl+S)">
                        <Save size={16} />
                    </button>
                    <div className="w-px h-5 bg-gray-400 mx-1"></div>
                    <span className="text-xs font-bold text-[#32363A]">
                        {isSubmitting ? 'Procesando...' : 'MIGO - Movimiento de Mercancías'}
                    </span>
                </div>

                {/* Operación / Referencia */}
                <div className="flex gap-2 text-xs">
                    <select
                        value={action}
                        onChange={e => setAction(e.target.value)}
                        className="sap-input w-40 font-bold bg-white text-[#0854A0]"
                    >
                        <option value="A01">A01 Entrada mercancías</option>
                        <option value="A07">A07 Salida mercancías</option>
                    </select>
                    <select
                        value={refDoc}
                        onChange={handleRefChange}
                        className="sap-input w-40 font-bold bg-white text-[#0854A0]"
                    >
                        <option value="R10">R10 Otros</option>
                        <option value="R01">R01 Pedido</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">

                {/* BUSCADOR DE PEDIDO (Solo si R01) */}
                {refDoc === 'R01' && (
                    <div className="bg-[#E8F4FD] border border-blue-200 p-3 rounded flex items-center gap-3">
                        <span className="text-sm font-bold text-[#0854A0]">Pedido:</span>
                        <input
                            type="text"
                            value={poNumber}
                            onChange={(e) => setPoNumber(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && findPO()}
                            className="sap-input w-32"
                            placeholder="45xxxxxxxx"
                        />
                        <button onClick={findPO} className="sap-btn sap-btn-secondary text-xs">
                            Buscar
                        </button>
                    </div>
                )}

                {/* DATOS DE CABECERA */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center gap-2">
                        <ClipboardCheck size={14} className="text-[#0854A0]" />
                        <span className="text-xs font-bold text-[#32363A] uppercase">Datos de Cabecera</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Fecha Documento</label>
                            <input
                                type="date"
                                name="fechaDoc"
                                value={header.fechaDoc}
                                onChange={handleHeaderChange}
                                className="sap-input"
                            />
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Fecha Contab.</label>
                            <input
                                type="date"
                                name="fechaCont"
                                value={header.fechaCont}
                                onChange={handleHeaderChange}
                                className="sap-input"
                            />
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Nota de Entrega</label>
                            <input
                                type="text"
                                name="notaEntrega"
                                value={header.notaEntrega}
                                onChange={handleHeaderChange}
                                className="sap-input uppercase"
                                placeholder="Ej: 123456"
                            />
                        </div>

                        <div>
                            <label className="block text-[#6A6D70] mb-1 text-xs">Texto Cabecera</label>
                            <input
                                type="text"
                                name="textoCabecera"
                                value={header.textoCabecera}
                                onChange={handleHeaderChange}
                                className="sap-input"
                                placeholder="Ej: Ingreso inicial"
                            />
                        </div>
                    </div>
                </div>

                {/* DETALLE DE POSICIÓN */}
                <div className="bg-white border border-[#C4C4C4] rounded shadow-sm flex-1">
                    <div className="bg-[#EFF4F9] px-3 py-1 border-b border-[#C4C4C4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Box size={14} className="text-[#0854A0]" />
                            <span className="text-xs font-bold text-[#32363A] uppercase">Detalle de Posición</span>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-[#FAFAFA]">
                        {/* Pestañas simuladas */}
                        <div className="flex gap-1 text-xs pb-0 mb-4 border-b border-[#C4C4C4]">
                            <button className="px-3 py-1 bg-white border-t border-l border-r border-[#C4C4C4] font-bold text-[#0854A0] rounded-t relative -mb-px">Material</button>
                            <button className="px-3 py-1 text-[#6A6D70] hover:bg-[#E8F4FD]">Cantidad</button>
                            <button className="px-3 py-1 text-[#6A6D70] hover:bg-[#E8F4FD]">Dónde</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                            {/* Columna Izquierda */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[#6A6D70] mb-1 text-xs font-bold">Material</label>
                                    <input
                                        type="text"
                                        name="material"
                                        value={item.material}
                                        onChange={handleItemChange}
                                        className="sap-input uppercase font-mono border-l-4 border-l-[#E9730C]"
                                        placeholder="Ej: NEV-LB-001"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Ingrese el ID del material a recibir</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[#6A6D70] mb-1 text-xs font-bold">Cantidad</label>
                                        <input
                                            type="number"
                                            name="cantidad"
                                            value={item.cantidad}
                                            onChange={handleItemChange}
                                            className="sap-input"
                                            min="1"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[#6A6D70] mb-1 text-xs">Unidad</label>
                                        <input type="text" value="UN" disabled className="sap-input bg-gray-100" />
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[#6A6D70] mb-1 text-xs">Clase de Movimiento</label>
                                    <div className="flex items-center gap-2">
                                        <Layers size={14} className="text-[#0854A0]" />
                                        <select
                                            name="claseMov"
                                            value={item.claseMov}
                                            onChange={handleItemChange}
                                            className="sap-input font-bold"
                                        >
                                            <option value="101">101 - Entrada Mcía. p.pedido</option>
                                            <option value="501">501 - Entrada s/pedido</option>
                                            <option value="561">561 - Entrada inicial de stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[#6A6D70] mb-1 text-xs">Centro</label>
                                        <input type="text" value="1000" disabled className="sap-input bg-gray-100" />
                                    </div>
                                    <div>
                                        <label className="block text-[#6A6D70] mb-1 text-xs">Almacén</label>
                                        <input
                                            type="text"
                                            name="almacen"
                                            value={item.almacen}
                                            onChange={handleItemChange}
                                            className="sap-input"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="p-4 flex items-center gap-2 text-xs text-[#6A6D70] bg-[#F5F7FA]">
                        <Truck size={14} />
                        <span>El movimiento generará un Documento de Material y actualizará el stock en MMBE.</span>
                    </div>

                </div>

            </div>
        </div>
    );
}
