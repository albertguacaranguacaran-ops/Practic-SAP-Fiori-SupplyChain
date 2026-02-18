import { useState, useEffect, useCallback } from 'react';

export function usePurchaseOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar historial de pedidos
    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem('sap_ekko_data');
            if (saved) {
                setOrders(JSON.parse(saved));
            }
            setLoading(false);
        };
        load();
    }, []);

    // Crear Pedido (ME21N)
    const createOrder = useCallback((header, items) => {
        return new Promise((resolve, reject) => {
            try {
                // Simular número de pedido (Estándar 45xxxxxxxxx)
                // En SAP real, esto viene de un rango de números
                const nextId = '45' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

                const newOrder = {
                    EBELN: nextId,        // Número Pedido
                    BSTYP: 'F',           // Tipo documento (F=Pedido)
                    BSART: 'NB',          // Clase documento (NB=Estándar)
                    LIFNR: header.proveedor, // Proveedor
                    EKORG: header.orgCompras, // Org. Compras
                    EKGRP: header.gpoCompras, // Gpo. Compras
                    BEDAT: header.fechaDoc,   // Fecha documento
                    WAERS: 'USD',         // Moneda (Hardcoded por ahora)
                    NETWR: items.reduce((sum, i) => sum + (i.cantidad * i.precio), 0), // Valor Neto
                    ITEMS: items.map(i => ({
                        EBELP: i.pos,     // Posición
                        MATNR: i.material,// Material
                        MENGE: i.cantidad,// Cantidad
                        NETPR: i.precio,  // Precio Neto
                        WERKS: i.centro,  // Centro
                        LGORT: i.almacen  // Almacén
                    })),
                    STATUS: 'Hold' // Hold, Released, Received
                };

                const updatedList = [newOrder, ...orders];
                setOrders(updatedList);
                localStorage.setItem('sap_ekko_data', JSON.stringify(updatedList));

                // Simular delay SAP
                setTimeout(() => {
                    resolve({ success: true, id: nextId, order: newOrder });
                }, 1000);

            } catch (err) {
                reject(err);
            }
        });
    }, [orders]);

    // Liberar Pedido (ME28)
    const releaseOrder = useCallback((poNumber) => {
        return new Promise((resolve, reject) => {
            try {
                const updatedList = orders.map(o =>
                    o.EBELN === poNumber ? { ...o, STATUS: 'Released' } : o
                );

                // Si no cambió nanda es que no existe
                if (!orders.find(o => o.EBELN === poNumber)) {
                    throw new Error('Pedido no encontrado');
                }

                setOrders(updatedList);
                localStorage.setItem('sap_ekko_data', JSON.stringify(updatedList));

                setTimeout(() => {
                    resolve({ success: true, id: poNumber });
                }, 800);
            } catch (err) {
                reject(err);
            }
        });
    }, [orders]);

    // Recibir Pedido (MIGO 101)
    const receiveOrder = useCallback((poNumber) => {
        return new Promise((resolve, reject) => {
            try {
                const updatedList = orders.map(o =>
                    o.EBELN === poNumber ? { ...o, STATUS: 'Received' } : o
                );

                if (!orders.find(o => o.EBELN === poNumber)) {
                    throw new Error('Pedido no encontrado');
                }

                setOrders(updatedList);
                localStorage.setItem('sap_ekko_data', JSON.stringify(updatedList));
                resolve({ success: true });
            } catch (err) {
                reject(err);
            }
        });
    }, [orders]);

    return {
        orders,
        loading,
        createOrder,
        releaseOrder,
        receiveOrder
    };
}
