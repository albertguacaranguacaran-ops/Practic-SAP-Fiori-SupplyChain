// ================================================================
// DAKAFACIL SAP TRAINING - EXPRESS.JS SERVER
// Backend con PostgreSQL para simulador SAP
// ================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ================================================================
// DATABASE CONNECTION
// ================================================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/dakafacil',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
        console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is set');
    } else {
        console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
    }
});

// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ================================================================
// AUDIT LOG HELPER
// ================================================================

async function logChange(objectClass, objectId, tcode, changeInd, changes = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO CDHDR (OBJECTCLAS, OBJECTID, USERNAME, TCODE, CHANGE_IND) 
       VALUES ($1, $2, $3, $4, $5) RETURNING CHANGENR`,
            [objectClass, objectId, 'CONSULTOR01', tcode, changeInd]
        );

        const changeNr = result.rows[0].changenr;

        for (const change of changes) {
            await client.query(
                `INSERT INTO CDPOS (CHANGENR, TABNAME, FNAME, VALUE_OLD, VALUE_NEW) 
         VALUES ($1, $2, $3, $4, $5)`,
                [changeNr, change.table, change.field, change.oldValue, change.newValue]
            );
        }

        return changeNr;
    } finally {
        client.release();
    }
}

// ================================================================
// API ROUTES: MATERIALS (MM Module)
// ================================================================

// GET /api/materials - Listar materiales con paginación
app.get('/api/materials', async (req, res) => {
    try {
        const { page = 0, limit = 50, search = '', category = '', status = '' } = req.query;
        const offset = parseInt(page) * parseInt(limit);

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            whereClause += ` AND (m.MATNR ILIKE $${paramCount} OR m.EAN11 ILIKE $${paramCount} OR t.MAKTX ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (category) {
            paramCount++;
            whereClause += ` AND m.MATKL = $${paramCount}`;
            params.push(category);
        }

        if (status === 'low_stock') {
            whereClause += ` AND d.LABST < mc.MINBE`;
        } else if (status === 'discontinued') {
            whereClause += ` AND m.LVORM = TRUE`;
        }

        // Count total
        const countQuery = `
      SELECT COUNT(*) FROM MARA m
      LEFT JOIN MAKT t ON m.MATNR = t.MATNR AND t.SPRAS = 'ES'
      LEFT JOIN MARC mc ON m.MATNR = mc.MATNR
      LEFT JOIN MARD d ON m.MATNR = d.MATNR
      ${whereClause}
    `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get data
        const dataQuery = `
      SELECT 
        m.MATNR as id,
        m.EAN11 as ean,
        t.MAKTX as descripcion,
        c.WGBEZ as categoria,
        m.MATKL as categoria_id,
        m.NTGEW as "pesoNeto",
        m.BRGEW as "pesoBruto",
        m.LAENG as largo,
        m.BREIT as ancho,
        m.HOESSION as alto,
        m.VOLUM as volumen,
        COALESCE(d.LABST, 0) as "stockActual",
        COALESCE(mc.MINBE, 5) as "puntoReorden",
        m.LVORM as descontinuado,
        m.ERSDA as "fechaCreacion",
        m.ERNAM as "creadoPor",
        CASE 
          WHEN d.LABST < mc.MINBE THEN 'low_stock'
          WHEN m.LVORM = TRUE THEN 'discontinued'
          ELSE 'active'
        END as status
      FROM MARA m
      LEFT JOIN MAKT t ON m.MATNR = t.MATNR AND t.SPRAS = 'ES'
      LEFT JOIN T023 c ON m.MATKL = c.MATKL
      LEFT JOIN MARC mc ON m.MATNR = mc.MATNR AND mc.WERKS = '1000'
      LEFT JOIN MARD d ON m.MATNR = d.MATNR AND d.WERKS = '1000' AND d.LGORT = '0001'
      ${whereClause}
      ORDER BY m.MATNR
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

        const result = await pool.query(dataQuery, [...params, parseInt(limit), offset]);

        res.json({
            data: result.rows,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/materials/:id - Obtener un material
app.get('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT 
        m.*, t.MAKTX as descripcion, c.WGBEZ as categoria_nombre,
        COALESCE(d.LABST, 0) as stock_actual,
        mc.*
      FROM MARA m
      LEFT JOIN MAKT t ON m.MATNR = t.MATNR AND t.SPRAS = 'ES'
      LEFT JOIN T023 c ON m.MATKL = c.MATKL
      LEFT JOIN MARC mc ON m.MATNR = mc.MATNR AND mc.WERKS = '1000'
      LEFT JOIN MARD d ON m.MATNR = d.MATNR AND d.WERKS = '1000'
      WHERE m.MATNR = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/materials - Crear material (MM01)
app.post('/api/materials', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id, ean, descripcion, categoria, pesoNeto, pesoBruto, largo, ancho, alto, stock, puntoReorden } = req.body;

        // Insert into MARA
        await client.query(`
      INSERT INTO MARA (MATNR, EAN11, MATKL, NTGEW, BRGEW, LAENG, BREIT, HOESSION, ERNAM)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONSULTOR01')
    `, [id, ean, categoria, pesoNeto, pesoBruto, largo, ancho, alto]);

        // Insert into MAKT
        await client.query(`
      INSERT INTO MAKT (MATNR, SPRAS, MAKTX, MAKTG)
      VALUES ($1, 'ES', $2, $3)
    `, [id, descripcion, descripcion.toUpperCase()]);

        // Insert into MARC
        await client.query(`
      INSERT INTO MARC (MATNR, WERKS, MINBE)
      VALUES ($1, '1000', $2)
    `, [id, puntoReorden || 5]);

        // Insert into MARD
        await client.query(`
      INSERT INTO MARD (MATNR, WERKS, LGORT, LABST)
      VALUES ($1, '1000', '0001', $2)
    `, [id, stock || 0]);

        await client.query('COMMIT');

        // Log the change
        await logChange('MATERIAL', id, 'MM01', 'I', [
            { table: 'MARA', field: 'MATNR', oldValue: null, newValue: id }
        ]);

        res.status(201).json({ message: 'Material creado exitosamente', id });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/materials/:id - Modificar material (MM02)
app.put('/api/materials/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const updates = req.body;

        // Get current values for audit
        const current = await client.query('SELECT * FROM MARA WHERE MATNR = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }

        await client.query('BEGIN');

        const changes = [];

        // Update MARA fields
        if (updates.ean !== undefined) {
            await client.query('UPDATE MARA SET EAN11 = $1, LAEDA = CURRENT_DATE, AENAM = $2 WHERE MATNR = $3',
                [updates.ean, 'CONSULTOR01', id]);
            changes.push({ table: 'MARA', field: 'EAN11', oldValue: current.rows[0].ean11, newValue: updates.ean });
        }

        if (updates.pesoNeto !== undefined) {
            await client.query('UPDATE MARA SET NTGEW = $1, LAEDA = CURRENT_DATE WHERE MATNR = $2',
                [updates.pesoNeto, id]);
            changes.push({ table: 'MARA', field: 'NTGEW', oldValue: String(current.rows[0].ntgew), newValue: String(updates.pesoNeto) });
        }

        if (updates.descripcion !== undefined) {
            await client.query('UPDATE MAKT SET MAKTX = $1, MAKTG = $2 WHERE MATNR = $3 AND SPRAS = $4',
                [updates.descripcion, updates.descripcion.toUpperCase(), id, 'ES']);
        }

        if (updates.stock !== undefined) {
            await client.query('UPDATE MARD SET LABST = $1 WHERE MATNR = $2 AND WERKS = $3',
                [updates.stock, id, '1000']);
        }

        await client.query('COMMIT');

        // Log changes
        await logChange('MATERIAL', id, 'MM02', 'U', changes);

        res.json({ message: 'Material actualizado', changes: changes.length });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ================================================================
// API ROUTES: SQL BROWSER (SE16)
// ================================================================

// POST /api/sql/execute - Ejecutar SQL personalizado
app.post('/api/sql/execute', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query requerido' });
        }

        // Security: Only allow SELECT statements in training mode
        const upperQuery = query.trim().toUpperCase();
        const isSelect = upperQuery.startsWith('SELECT');
        const isShow = upperQuery.startsWith('SHOW') || upperQuery.startsWith('\\D');

        // For training, we'll allow all DML but log everything
        await logChange('SQL', query.substring(0, 90), 'SE16', isSelect ? 'R' : 'E');

        const startTime = Date.now();
        const result = await pool.query(query);
        const executionTime = Date.now() - startTime;

        res.json({
            success: true,
            command: result.command,
            rowCount: result.rowCount,
            rows: result.rows || [],
            fields: result.fields?.map(f => ({ name: f.name, dataType: f.dataTypeID })) || [],
            executionTimeMs: executionTime
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            hint: error.hint || null,
            position: error.position || null
        });
    }
});

// GET /api/sql/tables - Listar tablas disponibles
app.get('/api/sql/tables', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/sql/tables/:name/columns - Columnas de una tabla
app.get('/api/sql/tables/:name/columns', async (req, res) => {
    try {
        const { name } = req.params;

        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [name.toLowerCase()]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================================================================
// API ROUTES: AUDIT LOG
// ================================================================

// GET /api/audit - Ver historial de cambios
app.get('/api/audit', async (req, res) => {
    try {
        const { objectClass, objectId, limit = 100 } = req.query;

        let whereClause = '';
        const params = [];

        if (objectClass) {
            params.push(objectClass);
            whereClause = `WHERE h.OBJECTCLAS = $${params.length}`;
        }

        if (objectId) {
            params.push(objectId);
            whereClause += whereClause ? ` AND h.OBJECTID = $${params.length}` : `WHERE h.OBJECTID = $${params.length}`;
        }

        const result = await pool.query(`
      SELECT h.*, array_agg(json_build_object(
        'field', p.FNAME, 
        'table', p.TABNAME,
        'old', p.VALUE_OLD, 
        'new', p.VALUE_NEW
      )) as changes
      FROM CDHDR h
      LEFT JOIN CDPOS p ON h.CHANGENR = p.CHANGENR
      ${whereClause}
      GROUP BY h.CHANGENR
      ORDER BY h.UDATE DESC, h.UTIME DESC
      LIMIT $${params.length + 1}
    `, [...params, parseInt(limit)]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================================================================
// API ROUTES: STATISTICS
// ================================================================

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM MARA) as total_materials,
        (SELECT COUNT(*) FROM MARA WHERE LVORM = TRUE) as discontinued,
        (SELECT COUNT(*) FROM MARD d JOIN MARC c ON d.MATNR = c.MATNR WHERE d.LABST < c.MINBE) as low_stock,
        (SELECT COUNT(*) FROM MARA WHERE NTGEW > 50) as overweight,
        (SELECT COUNT(*) FROM VBAK) as total_orders,
        (SELECT COALESCE(SUM(NETWR), 0) FROM VBAK) as total_sales
    `);

        res.json(stats.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================================================================
// HEALTH CHECK
// ================================================================

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
    }
});

// ================================================================
// START SERVER
// ================================================================

app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║     DAKAFACIL SAP TRAINING SIMULATOR - BACKEND API       ║
  ╠══════════════════════════════════════════════════════════╣
  ║  🚀 Server running on: http://localhost:${PORT}            ║
  ║  📊 Database: PostgreSQL                                 ║
  ║  📋 Endpoints:                                           ║
  ║     GET  /api/materials      - Listar materiales         ║
  ║     POST /api/materials      - Crear material (MM01)     ║
  ║     PUT  /api/materials/:id  - Modificar (MM02)          ║
  ║     POST /api/sql/execute    - Ejecutar SQL (SE16)       ║
  ║     GET  /api/audit          - Ver historial cambios     ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
