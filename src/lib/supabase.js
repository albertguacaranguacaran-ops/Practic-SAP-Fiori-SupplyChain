// Supabase Client Configuration
// Project: Dakafacil SAP Training Simulator

import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno (con fallback a valores hardcoded para desarrollo)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qmxepacnmbbpupxzjyur.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteGVwYWNubWJicHVweHpqeXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzODEsImV4cCI6MjA4NTkwMDM4MX0.NhF980IeQsNPw6UY4sNufwHeHtDTOs11KRccq_PXenI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for SAP-like operations
export const db = {
    // MARA - Material Master with full JOINs
    materials: {
        // Get first 1000 materials with all related data
        getAll: () => supabase
            .from('mara')
            .select(`
                *,
                makt(maktx, maktg),
                marc(minbe, werks),
                mard(labst, lgort, werks)
            `)
            .limit(1000),

        // Get paginated (for loading more)
        getPaginated: (offset = 0, limit = 1000) => supabase
            .from('mara')
            .select(`*, makt(maktx), marc(minbe), mard(labst)`)
            .range(offset, offset + limit - 1),

        getById: (matnr) => supabase.from('mara').select('*, makt(*), marc(*), mard(*)').eq('matnr', matnr).single(),
        create: (data) => supabase.from('mara').insert(data).select(),
        update: (matnr, data) => supabase.from('mara').update(data).eq('matnr', matnr).select(),
        delete: (matnr) => supabase.from('mara').delete().eq('matnr', matnr),
    },

    // MARD - Stock by Storage Location
    stock: {
        getAll: () => supabase.from('mard').select('*, mara(matnr, maktx:makt(maktx))'),
        getByMaterial: (matnr) => supabase.from('mard').select('*').eq('matnr', matnr),
        getByWarehouse: (lgort) => supabase.from('mard').select('*, mara(*)').eq('lgort', lgort),
        updateStock: (matnr, lgort, labst) =>
            supabase.from('mard').update({ labst }).match({ matnr, lgort }),
    },

    // VBAK/VBAP - Sales Orders
    salesOrders: {
        getAll: () => supabase.from('vbak').select('*, vbap(*)'),
        getById: (vbeln) => supabase.from('vbak').select('*, vbap(*)').eq('vbeln', vbeln).single(),
        create: async (header, items) => {
            const { data: order, error: orderError } = await supabase
                .from('vbak')
                .insert(header)
                .select()
                .single();

            if (orderError) throw orderError;

            const itemsWithOrderId = items.map((item, idx) => ({
                ...item,
                vbeln: order.vbeln,
                posnr: (idx + 1) * 10,
            }));

            const { data: orderItems, error: itemsError } = await supabase
                .from('vbap')
                .insert(itemsWithOrderId)
                .select();

            if (itemsError) throw itemsError;

            return { ...order, items: orderItems };
        },
    },

    // EKKO/EKPO - Purchase Orders
    purchaseOrders: {
        getAll: () => supabase.from('ekko').select('*, ekpo(*)'),
        getById: (ebeln) => supabase.from('ekko').select('*, ekpo(*)').eq('ebeln', ebeln).single(),
        create: async (header, items) => {
            const { data: po, error: poError } = await supabase
                .from('ekko')
                .insert(header)
                .select()
                .single();

            if (poError) throw poError;

            const itemsWithPoId = items.map((item, idx) => ({
                ...item,
                ebeln: po.ebeln,
                ebelp: (idx + 1) * 10,
            }));

            const { data: poItems, error: itemsError } = await supabase
                .from('ekpo')
                .insert(itemsWithPoId)
                .select();

            if (itemsError) throw itemsError;

            return { ...po, items: poItems };
        },
    },

    // CDHDR/CDPOS - Change Documents (Audit Log)
    auditLog: {
        getAll: () => supabase.from('cdhdr').select('*, cdpos(*)').order('udate', { ascending: false }),
        getByObject: (objectclas, objectid) =>
            supabase.from('cdhdr').select('*, cdpos(*)').match({ objectclas, objectid }),
        create: async (header, positions) => {
            const { data: log, error: logError } = await supabase
                .from('cdhdr')
                .insert(header)
                .select()
                .single();

            if (logError) throw logError;

            const positionsWithLogId = positions.map(pos => ({
                ...pos,
                changenr: log.changenr,
            }));

            await supabase.from('cdpos').insert(positionsWithLogId);

            return log;
        },
    },

    // SQL Query execution (for SE16)
    query: async (sql) => {
        // Note: For security, Supabase doesn't allow raw SQL from client
        // This will use RPC functions defined in the database
        const { data, error } = await supabase.rpc('execute_query', { query_text: sql });
        if (error) throw error;
        return data;
    },

    // Statistics
    stats: {
        getMaterialCount: () => supabase.from('mara').select('*', { count: 'exact', head: true }),
        getLowStockCount: () => supabase.from('mard').select('*', { count: 'exact', head: true }).lt('labst', 10),
        getDuplicateCount: () => supabase.rpc('count_duplicate_eans'),
        getSalesByBranch: () => supabase.rpc('get_sales_by_branch'),
    },
};

export default supabase;
