// Hook para cargar datos de Supabase con fallback a datos locales
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './supabase';
import { SAMPLE_PRODUCTS, getFullDataset, getDataStats } from '../data/dakaProducts';

// ─── localStorage keys ───────────────────────────
const LS_KEY = 'dataelectric_materials';
const LS_META = 'dataelectric_meta';

// ─── localStorage helpers ────────────────────────
function saveToLocal(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        const meta = { count: data.length, savedAt: new Date().toISOString() };
        localStorage.setItem(LS_META, JSON.stringify(meta));
        return meta;
    } catch (e) {
        console.warn('localStorage save failed:', e.message);
        return null;
    }
}
function loadFromLocal() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const meta = JSON.parse(localStorage.getItem(LS_META) || '{}');
        return { data, meta };
    } catch { return null; }
}
function clearLocal() {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_META);
}

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
    const [dataSource, setDataSource] = useState('loading'); // 'supabase', 'local', 'localStorage', 'imported'
    const [storageInfo, setStorageInfo] = useState({ savedAt: null, count: 0, synced: false });
    const skipAutoSave = useRef(false); // skip save during initial load

    // Cargar materiales
    const loadMaterials = useCallback(async () => {
        setLoading(true);
        setError(null);
        skipAutoSave.current = true; // don't re-save what we're loading

        // ── PRIORITY 1: localStorage ─────────────────
        const local = loadFromLocal();
        if (local && local.data && local.data.length > 0) {
            console.log(`✅ Loaded ${local.data.length} materials from localStorage (saved ${local.meta.savedAt})`);
            setMaterials(local.data);
            setDataSource('localStorage');
            setStorageInfo({ savedAt: local.meta.savedAt, count: local.data.length, synced: false });
            setLoading(false);
            skipAutoSave.current = false;
            return;
        }

        // ── PRIORITY 2: Supabase ─────────────────────
        try {
            const { data, error: fetchError } = await db.materials.getAll();
            if (fetchError) throw fetchError;

            if (data && data.length > 0) {
                const transformed = data.map(m => {
                    const desc = m.makt?.[0]?.maktx || 'Sin descripción';
                    const stock = m.mard?.[0]?.labst || 0;
                    const reorden = m.marc?.[0]?.minbe || 5;
                    let status = 'active';
                    if (m.lvorm) status = 'discontinued';
                    else if (stock < reorden) status = 'lowStock';
                    const parts = desc.split(' ');
                    return {
                        id: m.matnr, ean: m.ean11 || '', descripcion: desc,
                        marca: parts[1] || '', modelo: parts.slice(2).join(' ') || '',
                        categoria: m.matkl || 'General', subcategoria: '', color: '',
                        pesoNeto: m.ntgew || 0, pesoBruto: m.brgew || 0,
                        largo: m.laeng || 0, ancho: m.breit || 0, alto: 0,
                        stockActual: stock, puntoReorden: reorden,
                        ubicacion: m.mard?.[0]?.lgort || '0001', proveedor: '',
                        status, fechaCreacion: m.ersda || new Date().toISOString().split('T')[0],
                        ultimaModificacion: m.laeda
                    };
                });
                setMaterials(transformed);
                setDataSource('supabase');
                // Also save to localStorage for offline access
                const meta = saveToLocal(transformed);
                if (meta) setStorageInfo({ ...meta, synced: true });
            } else {
                // ── PRIORITY 3: Demo data ────────────────
                console.log('No data in Supabase or localStorage, using demo data');
                setMaterials(SAMPLE_PRODUCTS);
                setDataSource('local');
            }
        } catch (err) {
            console.warn('Supabase error, using demo data:', err);
            setMaterials(SAMPLE_PRODUCTS);
            setDataSource('local');
            setError(err);
        } finally {
            setLoading(false);
            skipAutoSave.current = false;
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
        let newData;
        if (mode === 'replace') {
            newData = importedData;
        } else {
            // Merge: replace matches by id, add new ones
            const existingMap = new Map(materials.map(m => [m.id, m]));
            for (const item of importedData) {
                existingMap.set(item.id, item);
            }
            newData = Array.from(existingMap.values());
        }
        setMaterials(newData);
        setDataSource('imported');
        // Auto-save to localStorage
        const meta = saveToLocal(newData);
        if (meta) setStorageInfo({ ...meta, synced: false });
        return { success: true, count: importedData.length };
    }, [materials]);

    // ── Sync to Supabase (optional) ──────────────────
    const syncToCloud = useCallback(async () => {
        try {
            // For now, we sync by upserting each material to the mara table
            // This is a simplified approach - in production you'd batch upsert
            let synced = 0;
            for (const m of materials) {
                const { error } = await db.materials.create({
                    matnr: m.id,
                    ean11: m.ean || null,
                    ntgew: m.pesoNeto || 0,
                    brgew: m.pesoBruto || 0,
                    laeng: m.largo || 0,
                    breit: m.ancho || 0,
                    hoehe: m.alto || 0,
                    matkl: m.categoria || 'General',
                    status: m.status || 'active'
                });
                if (!error) synced++;
            }
            setStorageInfo(prev => ({ ...prev, synced: true }));
            return { success: true, synced };
        } catch (err) {
            console.error('Sync to cloud failed:', err);
            return { success: false, error: err };
        }
    }, [materials]);

    // ── Clear local data ─────────────────────────────
    const clearLocalData = useCallback(() => {
        clearLocal();
        setStorageInfo({ savedAt: null, count: 0, synced: false });
        setMaterials(SAMPLE_PRODUCTS);
        setDataSource('local');
    }, []);

    // ── Auto-save to localStorage on changes ─────────
    useEffect(() => {
        if (skipAutoSave.current || loading || materials.length === 0) return;
        if (dataSource === 'local') return; // don't auto-save demo data
        const meta = saveToLocal(materials);
        if (meta) setStorageInfo(prev => ({ ...meta, synced: prev.synced }));
    }, [materials, loading, dataSource]);

    // Cargar al montar
    useEffect(() => {
        loadMaterials();
    }, [loadMaterials]);

    return {
        materials,
        loading,
        error,
        dataSource,
        storageInfo,
        loadMaterials,
        loadFullDataset,
        createMaterial,
        updateMaterial,
        importMaterials,
        syncToCloud,
        clearLocalData,
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
