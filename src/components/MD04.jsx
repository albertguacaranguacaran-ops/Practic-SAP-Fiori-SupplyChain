import { useState, useEffect } from 'react';
import {
    ArrowLeft, TriangleAlert, CircleCheck,
    ShoppingCart, Truck, Calendar, Activity,
    TrendingDown, TrendingUp, Package, Search
} from 'lucide-react';

export default function MD04({ onClose, onNavigate }) {
    const [material, setMaterial] = useState('LAVADORA SAMSUNG WA19');
    const [plant] = useState('1000 - DATAELECTRIC CCS');
    const [stock, setStock] = useState(10);
    const [safetyStock] = useState(15);

    // MRP Elements Simulation
    const [mrpList, setMrpList] = useState([
        { date: '12.02.2026', element: 'Stock', data: '-', receipt: 0, req: 0, avail: 10 },
        { date: '15.02.2026', element: 'Ord. Venta', data: '20000145 / Cliente A', receipt: 0, req: -5, avail: 5 },
        { date: '18.02.2026', element: 'Ord. Venta', data: '20000148 / Cliente B', receipt: 0, req: -8, avail: -3 },
    ]);

    const calculateTrafficLight = () => {
        const lastAvail = mrpList[mrpList.length - 1].avail;
        if (lastAvail < 0) return 'red';
        if (lastAvail < safetyStock) return 'yellow';
        return 'green';
    };

    const statusColor = calculateTrafficLight();

    const handleCreateSolPed = () => {
        // Add a simulation line for a Purchase Requisition
        const newReq = {
            date: '20.02.2026',
            element: 'SolPed',
            data: '10000567 / Auto-Generada',
            receipt: 50,
            req: 0,
            avail: mrpList[mrpList.length - 1].avail + 50
        };
        setMrpList([...mrpList, newReq]);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col font-sans">
            {/* Header SAP Style */}
            <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-bold text-sm">Lista Nec./Stock Actual (MD04)</h1>
                </div>
                <div className="text-xs opacity-90">
                    Centro: {plant}
                </div>
            </div>

            {/* Filter / Material Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-gray-100 p-2 rounded border border-gray-300">
                        <Package className="text-gray-500" size={24} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Material</label>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-800">{material}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Mat: 50001234</span>
                        </div>
                    </div>
                </div>

                {/* Status Indicator (The Traffic Light) */}
                <div className={`px-6 py-2 rounded-lg border-2 flex items-center gap-4 ${statusColor === 'red' ? 'bg-red-50 border-red-200' :
                    statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Estado Disponibilidad</span>
                        <span className={`font-black text-xl ${statusColor === 'red' ? 'text-red-600' :
                            statusColor === 'yellow' ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>
                            {statusColor === 'red' ? 'AGOTADO' :
                                statusColor === 'yellow' ? 'REORDEN' :
                                    'OK'}
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full shadow-inner flex items-center justify-center ${statusColor === 'red' ? 'bg-red-500' :
                        statusColor === 'yellow' ? 'bg-yellow-400' :
                            'bg-green-500'
                        }`}>
                        {statusColor === 'red' && <TriangleAlert className="text-white" size={24} />}
                        {statusColor === 'yellow' && <Activity className="text-white" size={24} />}
                        {statusColor === 'green' && <CircleCheck className="text-white" size={24} />}
                    </div>
                </div>
            </div>

            {/* Main Content: MRP List */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3">Fecha</th>
                                <th className="text-left px-4 py-3">Elemento MRP</th>
                                <th className="text-left px-4 py-3">Datos del Elemento MRP</th>
                                <th className="text-right px-4 py-3">Entrada (+)</th>
                                <th className="text-right px-4 py-3">Salida (-)</th>
                                <th className="text-right px-4 py-3 bg-gray-50 text-gray-800 border-l border-gray-200">Stock Disp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mrpList.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-blue-50 transition-colors ${row.avail < 0 ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-4 py-3 text-gray-600 font-mono">{row.date}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                        {row.element === 'Stock' && <Package size={14} className="text-gray-400" />}
                                        {row.element === 'Ord. Venta' && <ShoppingCart size={14} className="text-orange-500" />}
                                        {row.element === 'SolPed' && <Truck size={14} className="text-blue-500" />}
                                        {row.element}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{row.data}</td>
                                    <td className="px-4 py-3 text-right text-green-600 font-medium tracking-wide">
                                        {row.receipt > 0 ? `+${row.receipt}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-500 font-medium tracking-wide">
                                        {row.req < 0 ? row.req : ''}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold border-l border-gray-200 ${row.avail < 0 ? 'text-red-600 bg-red-100' : 'text-gray-800 bg-gray-50'
                                        }`}>
                                        {row.avail}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State / Call to Action */}
                    {statusColor !== 'green' && (
                        <div className="p-6 bg-red-50 border-t border-red-100 flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="text-red-500 mt-1" />
                                <div>
                                    <h3 className="font-bold text-red-800">Se detectó Rotura de Stock</h3>
                                    <p className="text-sm text-red-600" >El stock proyectado es negativo. Las ventas no podrán ser entregadas.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCreateSolPed}
                                className="sap-btn-primary bg-red-600 hover:bg-red-700 text-white shadow-lg animate-pulse"
                            >
                                Crear SolPed de Emergencia (/nME51N)
                            </button>
                        </div>
                    )}
                </div>

                <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Resumen de Ventas</h4>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="text-orange-500" />
                            <span className="text-2xl font-bold">13</span>
                            <span className="text-sm text-gray-400">unids. reservadas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
