import { useState, useCallback } from 'react';

export function useBilling({ orders, updateOrder }) {
    const [invoices, setInvoices] = useState(() => {
        const saved = localStorage.getItem('sap_vbrk_data');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);

    const createInvoice = useCallback(async (deliveryId) => {
        setLoading(true);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // 1. Find the Delivery (which is an Order with STATUS 'Completed' or similar)
                    // In our simplified model, we look for the Order by ID (VBELN)
                    const order = orders.find(o => o.VBELN === deliveryId);

                    if (!order) {
                        throw new Error(`Entrega/Pedido ${deliveryId} no encontrado.`);
                    }

                    if (order.STATUS === 'Invoiced') {
                        throw new Error(`El documento ${deliveryId} ya ha sido facturado.`);
                    }

                    // 2. Generate Invoice ID (90000000)
                    const invoiceId = '90' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');

                    // 3. Create Invoice Record
                    const newInvoice = {
                        VBELN: invoiceId, // Billing Document
                        VGBEL: deliveryId, // Reference (Delivery)
                        FKDAT: new Date().toISOString().split('T')[0], // Billing Date
                        KUNNR: order.kunnr,
                        NETWR: order.totalValue || order.NETWR, // Net Value
                        WAERK: 'USD',
                        items: order.items.map((item, idx) => ({
                            POSNR: (idx + 1) * 10,
                            MATNR: item.material,
                            FKIMG: item.quantity, // Billed Quantity
                            NETWR: item.total
                        }))
                    };

                    // 4. Update State
                    const updatedInvoices = [...invoices, newInvoice];
                    setInvoices(updatedInvoices);
                    localStorage.setItem('sap_vbrk_data', JSON.stringify(updatedInvoices));

                    resolve({ success: true, id: invoiceId });

                } catch (err) {
                    reject(err);
                } finally {
                    setLoading(false);
                }
            }, 1000);
        });
    }, [orders, invoices]);

    return {
        createInvoice,
        invoices,
        loading
    };
}
