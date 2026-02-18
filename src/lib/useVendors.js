import { useState, useEffect, useCallback } from 'react';

// Simulación de Tabla LFA1 (Maestro de Proveedores)
// Campos Clave: LIFNR (Número Proveedor), NAME1 (Nombre), ORT01 (Ciudad), LAND1 (País)
const INITIAL_VENDORS = [
    {
        LIFNR: '100001',
        NAME1: 'Samsung Electronics',
        ORT01: 'Seoul',
        LAND1: 'KR',
        STRAS: '123 Samsung-ro',
        AKONT: '160000', // Cuenta asociada
        ZTERM: '0001',   // Cond. pago
        WAERS: 'USD'     // Moneda
    },
    {
        LIFNR: '100002',
        NAME1: 'LG Corp',
        ORT01: 'Seoul',
        LAND1: 'KR',
        STRAS: '20 Yeouido-dong',
        AKONT: '160000',
        ZTERM: '0002',
        WAERS: 'USD'
    },
    {
        LIFNR: '200001',
        NAME1: 'Mabe',
        ORT01: 'Mexico City',
        LAND1: 'MX',
        STRAS: 'Av. Palmas 100',
        AKONT: '161000', // Proveedor nacional
        ZTERM: '0003',
        WAERS: 'MXN'
    }
];

export function useVendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar al inicio
    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem('sap_lfa1_data');
            if (saved) {
                setVendors(JSON.parse(saved));
            } else {
                setVendors(INITIAL_VENDORS);
                localStorage.setItem('sap_lfa1_data', JSON.stringify(INITIAL_VENDORS));
            }
            setLoading(false);
        };
        load();
    }, []);

    // Crear proveedor (XK01)
    const createVendor = useCallback((vendorData) => {
        return new Promise((resolve, reject) => {
            try {
                // Generar ID (Simulado: 10000X)
                const nextId = String(parseInt(vendors.length > 0 ? Math.max(...vendors.map(v => parseInt(v.LIFNR))) : 100000) + 1);

                const newVendor = {
                    ...vendorData,
                    LIFNR: nextId,
                    ERDAT: new Date().toISOString().split('T')[0] // Fecha creación
                };

                const updatedList = [...vendors, newVendor];
                setVendors(updatedList);
                localStorage.setItem('sap_lfa1_data', JSON.stringify(updatedList));

                // Simular delay de red
                setTimeout(() => {
                    resolve({ success: true, id: nextId, vendor: newVendor });
                }, 800);

            } catch (err) {
                reject(err);
            }
        });
    }, [vendors]);

    // Buscar proveedor (XK03)
    const getVendor = useCallback((id) => {
        return vendors.find(v => v.LIFNR === id);
    }, [vendors]);

    return {
        vendors,
        loading,
        createVendor,
        getVendor
    };
}
