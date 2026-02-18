import { useState, useEffect, useCallback } from 'react';

export function useSalesOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('sap_vbak_data');
        if (stored) {
            setOrders(JSON.parse(stored));
        }
    }, []);

    // Create Sales Order (VA01)
    const createSalesOrder = useCallback((newOrder) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            setTimeout(() => {
                try {
                    // Generate Order ID (Standard SAP range 10000...)
                    const orderId = '10' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');

                    const orderWithMetadata = {
                        ...newOrder,
                        VBELN: orderId, // Sales Document
                        ERDAT: new Date().toISOString().split('T')[0], // Creation Date
                        ERNAM: 'CONSULTOR01', // Created By
                        STATUS: 'Open', // Initial Status
                        NETWR: newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) // Net Value
                    };

                    const updatedOrders = [...orders, orderWithMetadata];
                    setOrders(updatedOrders);
                    localStorage.setItem('sap_vbak_data', JSON.stringify(updatedOrders));

                    resolve({ success: true, id: orderId });
                } catch (err) {
                    reject(err);
                } finally {
                    setLoading(false);
                }
            }, 800); // Simulate network delay
        });
    }, [orders]);

    // Create Delivery (VL01N) - Picking & PGI
    const createDelivery = useCallback((orderId) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            setTimeout(() => {
                try {
                    const updatedOrders = orders.map(order => {
                        if (order.VBELN === orderId) {
                            return { ...order, STATUS: 'Completed' }; // Simulating full delivery
                        }
                        return order;
                    });

                    setOrders(updatedOrders);
                    localStorage.setItem('sap_vbak_data', JSON.stringify(updatedOrders));

                    resolve({ success: true });
                } catch (err) {
                    reject(err);
                } finally {
                    setLoading(false);
                }
            }, 800);
        });
    }, [orders]);

    return {
        orders,
        loading,
        createSalesOrder,
        createDelivery
    };
}
