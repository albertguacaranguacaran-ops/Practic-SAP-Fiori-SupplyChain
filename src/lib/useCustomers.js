import { useState, useEffect } from 'react';

const MOCK_CUSTOMERS = [
    { id: 'C-1001', name: 'Tiendas Daka - Las Mercedes', region: 'Capital', type: 'Retail' },
    { id: 'C-1002', name: 'Tiendas Daka - Boleíta', region: 'Capital', type: 'Retail' },
    { id: 'C-1003', name: 'Tiendas Daka - Valencia', region: 'Central', type: 'Retail' },
    { id: 'C-1004', name: 'Distribuidora Los Andes', region: 'Andes', type: 'Wholesale' },
    { id: 'C-1005', name: 'Cliente Final (Mostrador)', region: 'Capital', type: 'Walk-in' },
];

export function useCustomers() {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        // Simulate API load
        setCustomers(MOCK_CUSTOMERS);
    }, []);

    return {
        customers
    };
}
