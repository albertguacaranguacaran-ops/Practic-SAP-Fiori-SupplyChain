// Hook para cargar datos de Supabase con fallback a datos locales
import { useState, useEffect, useCallback } from 'react';
import { db } from './supabase';
import { SAMPLE_PRODUCTS, getFullDataset, getDataStats } from '../data/dakaProducts';

// Estado de la conexión
let connectionStatus = 'unknown'; // 'connected', 'error', 'fallback'

// Verificar conexión con Supabase
async function checkConnection() {
    try {
        const { count, error } = await db.stats.getMaterialCount();
        if (error) throw error;
        connectionStatus = count > 0 ? 'connected' : 'empty';
        return { connected: true, count: count || 0 };
    } catch (error) {
        console.warn('Supabase connection failed, using local data:', error.message);
        connectionStatus = 'fallback';
        return { connected: false, count: 0, error };
    }
}

// Hook principal para gestionar materiales
export function useMaterials() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataSource, setDataSource] = useState('loading'); // 'supabase', 'local'

    // Cargar materiales
    const loadMaterials = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Intentar cargar de Supabase
            const { data, error: fetchError } = await db.materials.getAll();

            if (fetchError) throw fetchError;

            if (data && data.length > 0) {
                // Transformar datos de Supabase al formato del frontend
                // Los JOINs de Supabase devuelven arrays (makt[], marc[], mard[])
                const transformed = data.map(m => {
                    // Acceder a datos relacionados (vienen como arrays)
                    const desc = m.makt?.[0]?.maktx || 'Sin descripción';
                    const stock = m.mard?.[0]?.labst || 0;
                    const reorden = m.marc?.[0]?.minbe || 5;

                    // Determinar estado
                    let status = 'active';
                    if (m.lvorm) status = 'discontinued';
                    else if (stock < reorden) status = 'lowStock';

                    // Extraer marca y otros datos del descripción
                    const parts = desc.split(' ');
                    const marca = parts[1] || '';

                    return {
                        id: m.matnr,
                        ean: m.ean11 || '',
                        descripcion: desc,
                        marca: marca,
                        modelo: parts.slice(2).join(' ') || '',
                        categoria: m.matkl || 'General',
                        subcategoria: '',
                        color: '',
                        pesoNeto: m.ntgew || 0,
                        pesoBruto: m.brgew || 0,
                        largo: m.laeng || 0,
                        ancho: m.breit || 0,
                        alto: 0,
                        stockActual: stock,
                        puntoReorden: reorden,
                        ubicacion: m.mard?.[0]?.lgort || '0001',
                        proveedor: '',
                        status: status,
                        fechaCreacion: m.ersda || new Date().toISOString().split('T')[0],
                        ultimaModificacion: m.laeda
                    };
                });

                setMaterials(transformed);
                setDataSource('supabase');
            } else {
                // Sin datos en Supabase, usar datos locales
                console.log('No hay datos en Supabase, usando datos de demostración');
                setMaterials(SAMPLE_PRODUCTS);
                setDataSource('local');
            }
        } catch (err) {
            console.warn('Error cargando de Supabase, usando datos locales:', err);
            setMaterials(SAMPLE_PRODUCTS);
            setDataSource('local');
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar dataset completo (36K)
    const loadFullDataset = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            const fullData = getFullDataset();
            setMaterials(fullData);
            setDataSource('local');
            setLoading(false);
        }, 1000);
    }, []);

    // Crear material
    const createMaterial = useCallback(async (material) => {
        if (dataSource === 'supabase') {
            try {
                // Generar nuevo ID
                const newId = `DF-${String(materials.length + 1).padStart(6, '0')}`;

                // Insertar en MARA
                const { data: maraData, error: maraError } = await db.materials.create({
                    matnr: newId,
                    ean11: material.ean,
                    ntgew: material.pesoNeto,
                    brgew: material.pesoBruto,
                    laeng: material.largo,
                    breit: material.ancho,
                    hoehe: material.alto,
                    matkl: material.categoria,
                    status: material.status || 'active'
                });

                if (maraError) throw maraError;

                // Insertar descripción en MAKT
                const { error: maktError } = await db.supabase.from('makt').insert({
                    matnr: newId,
                    spras: 'ES',
                    maktx: material.descripcion
                });

                if (maktError) console.warn('Error insertando MAKT:', maktError);

                // Actualizar estado local
                const newMaterial = { ...material, id: newId };
                setMaterials(prev => [newMaterial, ...prev]);

                return { success: true, id: newId };
            } catch (err) {
                console.error('Error creando material:', err);
                return { success: false, error: err };
            }
        } else {
            // Modo local
            const newId = `DF-${String(materials.length + 1).padStart(6, '0')}`;
            const newMaterial = {
                ...material,
                id: newId,
                fechaCreacion: new Date().toISOString().split('T')[0]
            };
            setMaterials(prev => [newMaterial, ...prev]);
            return { success: true, id: newId };
        }
    }, [dataSource, materials.length]);

    // Actualizar material
    const updateMaterial = useCallback(async (material) => {
        if (dataSource === 'supabase') {
            try {
                const { error: updateError } = await db.materials.update(material.id, {
                    ean11: material.ean,
                    ntgew: material.pesoNeto,
                    brgew: material.pesoBruto,
                    laeng: material.largo,
                    breit: material.ancho,
                    hoehe: material.alto,
                    matkl: material.categoria,
                    status: material.status
                });

                if (updateError) throw updateError;

                setMaterials(prev =>
                    prev.map(m => m.id === material.id ? material : m)
                );

                return { success: true };
            } catch (err) {
                console.error('Error actualizando material:', err);
                return { success: false, error: err };
            }
        } else {
            // Modo local
            setMaterials(prev =>
                prev.map(m => m.id === material.id ? material : m)
            );
            return { success: true };
        }
    }, [dataSource]);

    // Import materials from external source (Excel, etc.)
    const importMaterials = useCallback((importedData, mode = 'merge') => {
        if (mode === 'replace') {
            setMaterials(importedData);
        } else {
            // Merge: replace matches by id, add new ones
            setMaterials(prev => {
                const existingMap = new Map(prev.map(m => [m.id, m]));
                for (const item of importedData) {
                    existingMap.set(item.id, item);
                }
                return Array.from(existingMap.values());
            });
        }
        setDataSource('imported');
        return { success: true, count: importedData.length };
    }, []);

    // Cargar al montar
    useEffect(() => {
        loadMaterials();
    }, [loadMaterials]);

    return {
        materials,
        loading,
        error,
        dataSource,
        loadMaterials,
        loadFullDataset,
        createMaterial,
        updateMaterial,
        importMaterials,
        getStats: () => getDataStats(materials)
    };
}

// Hook para verificar estado de conexión
export function useConnectionStatus() {
    const [status, setStatus] = useState({
        checking: true,
        connected: false,
        count: 0
    });

    useEffect(() => {
        checkConnection().then(result => {
            setStatus({
                checking: false,
                ...result
            });
        });
    }, []);

    return status;
}

export { connectionStatus };
