-- ================================================================
-- DAKAFACIL SAP Training Simulator - PostgreSQL Schema
-- Tablas basadas en estructura SAP real
-- ================================================================

-- ================================================================
-- MATERIAL MASTER (Módulo MM)
-- ================================================================

-- MARA: Datos Generales del Material
CREATE TABLE IF NOT EXISTS MARA (
    MATNR VARCHAR(18) PRIMARY KEY,      -- Número de Material
    EAN11 VARCHAR(18),                   -- Código EAN
    MTART VARCHAR(4) DEFAULT 'FERT',     -- Tipo de Material (FERT=Producto Terminado)
    MATKL VARCHAR(9),                    -- Grupo de Mercancías (Categoría)
    MEINS VARCHAR(3) DEFAULT 'UN',       -- Unidad de Medida Base
    MBRSH VARCHAR(1) DEFAULT 'M',        -- Ramo Industrial
    BRGEW DECIMAL(13,3),                 -- Peso Bruto
    NTGEW DECIMAL(13,3),                 -- Peso Neto
    GEWEI VARCHAR(3) DEFAULT 'KG',       -- Unidad de Peso
    VOLUM DECIMAL(13,3),                 -- Volumen
    VOLEH VARCHAR(3) DEFAULT 'M3',       -- Unidad de Volumen
    LAENG DECIMAL(13,3),                 -- Largo
    BREIT DECIMAL(13,3),                 -- Ancho
    HOESSION DECIMAL(13,3),              -- Alto
    MEABM VARCHAR(3) DEFAULT 'CM',       -- Unidad de Dimensión
    ERNAM VARCHAR(12),                   -- Creado por
    ERSDA DATE DEFAULT CURRENT_DATE,     -- Fecha Creación
    AENAM VARCHAR(12),                   -- Modificado por
    LAEDA DATE,                          -- Fecha Modificación
    LVORM BOOLEAN DEFAULT FALSE,         -- Marcado para borrar
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAKT: Textos de Material
CREATE TABLE IF NOT EXISTS MAKT (
    MATNR VARCHAR(18) NOT NULL,          -- Número de Material
    SPRAS VARCHAR(2) DEFAULT 'ES',       -- Idioma
    MAKTX VARCHAR(40) NOT NULL,          -- Descripción Corta
    MAKTG VARCHAR(40),                   -- Descripción en Mayúsculas
    PRIMARY KEY (MATNR, SPRAS),
    FOREIGN KEY (MATNR) REFERENCES MARA(MATNR) ON DELETE CASCADE
);

-- MARC: Datos del Material por Centro
CREATE TABLE IF NOT EXISTS MARC (
    MATNR VARCHAR(18) NOT NULL,          -- Número de Material
    WERKS VARCHAR(4) DEFAULT '1000',     -- Centro
    EKGRP VARCHAR(3),                    -- Grupo de Compras
    DISGR VARCHAR(4),                    -- Grupo MRP
    MINBE DECIMAL(13,3),                 -- Punto de Reorden
    MABST DECIMAL(13,3),                 -- Stock Máximo
    EISBE DECIMAL(13,3),                 -- Stock de Seguridad
    BSTMI DECIMAL(13,3),                 -- Lote Mínimo
    BSTMA DECIMAL(13,3),                 -- Lote Máximo
    LGPRO VARCHAR(4),                    -- Almacén Producción
    LGFSB VARCHAR(4),                    -- Almacén Propuesto
    PLIFZ INTEGER DEFAULT 0,             -- Tiempo Entrega
    PRIMARY KEY (MATNR, WERKS),
    FOREIGN KEY (MATNR) REFERENCES MARA(MATNR) ON DELETE CASCADE
);

-- MARD: Stock por Almacén
CREATE TABLE IF NOT EXISTS MARD (
    MATNR VARCHAR(18) NOT NULL,          -- Número de Material
    WERKS VARCHAR(4) DEFAULT '1000',     -- Centro
    LGORT VARCHAR(4) DEFAULT '0001',     -- Almacén
    LABST DECIMAL(13,3) DEFAULT 0,       -- Stock Libre Utilización
    INSME DECIMAL(13,3) DEFAULT 0,       -- Stock en Control Calidad
    SPEME DECIMAL(13,3) DEFAULT 0,       -- Stock Bloqueado
    PRIMARY KEY (MATNR, WERKS, LGORT),
    FOREIGN KEY (MATNR) REFERENCES MARA(MATNR) ON DELETE CASCADE
);

-- ================================================================
-- DATOS COMERCIALES
-- ================================================================

-- MVKE: Datos de Ventas del Material
CREATE TABLE IF NOT EXISTS MVKE (
    MATNR VARCHAR(18) NOT NULL,          -- Número de Material
    VKORG VARCHAR(4) DEFAULT '1000',     -- Organización de Ventas
    VTWEG VARCHAR(2) DEFAULT '01',       -- Canal de Distribución
    KONDM VARCHAR(2),                    -- Grupo Condición Material
    PRODH VARCHAR(18),                   -- Jerarquía de Productos
    VMSTA VARCHAR(2),                    -- Estado Distribución
    PRIMARY KEY (MATNR, VKORG, VTWEG),
    FOREIGN KEY (MATNR) REFERENCES MARA(MATNR) ON DELETE CASCADE
);

-- ================================================================
-- VENTAS Y DISTRIBUCIÓN (Módulo SD)
-- ================================================================

-- VBAK: Cabecera de Documento de Ventas
CREATE TABLE IF NOT EXISTS VBAK (
    VBELN VARCHAR(10) PRIMARY KEY,       -- Número de Documento
    ERDAT DATE DEFAULT CURRENT_DATE,     -- Fecha Creación
    ERZET TIME DEFAULT CURRENT_TIME,     -- Hora Creación
    ERNAM VARCHAR(12),                   -- Creado por
    AUART VARCHAR(4) DEFAULT 'ZPED',     -- Tipo de Documento
    VKORG VARCHAR(4) DEFAULT '1000',     -- Organización Ventas
    VTWEG VARCHAR(2) DEFAULT '01',       -- Canal Distribución
    SPART VARCHAR(2) DEFAULT '01',       -- Sector
    KUNNR VARCHAR(10),                   -- Cliente
    NETWR DECIMAL(15,2) DEFAULT 0,       -- Valor Neto
    WAERK VARCHAR(5) DEFAULT 'USD',      -- Moneda
    VBTYP VARCHAR(1) DEFAULT 'C',        -- Categoría Documento
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VBAP: Posiciones de Documento de Ventas
CREATE TABLE IF NOT EXISTS VBAP (
    VBELN VARCHAR(10) NOT NULL,          -- Número de Documento
    POSNR VARCHAR(6) NOT NULL,           -- Número de Posición
    MATNR VARCHAR(18),                   -- Número de Material
    ARKTX VARCHAR(40),                   -- Descripción
    KWMENG DECIMAL(13,3),                -- Cantidad Pedido
    MEINS VARCHAR(3) DEFAULT 'UN',       -- Unidad de Medida
    NETPR DECIMAL(11,2),                 -- Precio Neto
    NETWR DECIMAL(15,2),                 -- Valor Neto Posición
    WAERK VARCHAR(5) DEFAULT 'USD',      -- Moneda
    WERKS VARCHAR(4) DEFAULT '1000',     -- Centro
    PRIMARY KEY (VBELN, POSNR),
    FOREIGN KEY (VBELN) REFERENCES VBAK(VBELN) ON DELETE CASCADE
);

-- ================================================================
-- HISTORIAL DE CAMBIOS (Audit Log)
-- ================================================================

-- CDHDR: Cabecera de Historial de Cambios
CREATE TABLE IF NOT EXISTS CDHDR (
    CHANGENR SERIAL PRIMARY KEY,         -- Número de Cambio
    OBJECTCLAS VARCHAR(15),              -- Clase de Objeto (MATERIAL, ORDER)
    OBJECTID VARCHAR(90),                -- ID del Objeto
    USERNAME VARCHAR(12),                -- Usuario
    UDATE DATE DEFAULT CURRENT_DATE,     -- Fecha
    UTIME TIME DEFAULT CURRENT_TIME,     -- Hora
    TCODE VARCHAR(20),                   -- Transacción
    CHANGE_IND VARCHAR(1)                -- Indicador (I=Insert, U=Update, D=Delete)
);

-- CDPOS: Posiciones de Historial de Cambios
CREATE TABLE IF NOT EXISTS CDPOS (
    CHANGENR INTEGER NOT NULL,           -- Número de Cambio
    TABNAME VARCHAR(30),                 -- Nombre de Tabla
    FNAME VARCHAR(30),                   -- Nombre de Campo
    VALUE_OLD VARCHAR(254),              -- Valor Anterior
    VALUE_NEW VARCHAR(254),              -- Valor Nuevo
    FOREIGN KEY (CHANGENR) REFERENCES CDHDR(CHANGENR) ON DELETE CASCADE
);

-- ================================================================
-- DATOS AUXILIARES
-- ================================================================

-- Categorías (Grupos de Mercancías)
CREATE TABLE IF NOT EXISTS T023 (
    MATKL VARCHAR(9) PRIMARY KEY,        -- Grupo de Mercancías
    WGBEZ VARCHAR(20)                    -- Descripción
);

-- Proveedores (simplificado)
CREATE TABLE IF NOT EXISTS LFA1 (
    LIFNR VARCHAR(10) PRIMARY KEY,       -- Número de Proveedor
    NAME1 VARCHAR(35),                   -- Nombre
    LAND1 VARCHAR(3) DEFAULT 'VE'        -- País
);

-- ================================================================
-- DATOS INICIALES
-- ================================================================

-- Categorías predefinidas
INSERT INTO T023 (MATKL, WGBEZ) VALUES 
    ('LB', 'Línea Blanca'),
    ('LM', 'Línea Marrón'),
    ('PE', 'Pequeños Electro')
ON CONFLICT (MATKL) DO NOTHING;

-- Proveedores predefinidos
INSERT INTO LFA1 (LIFNR, NAME1) VALUES
    ('PROV001', 'IMPORTADORA CENTRAL'),
    ('PROV002', 'DISTRIB. NACIONAL'),
    ('PROV003', 'MAYORISTA PLUS'),
    ('PROV004', 'COMERCIAL DELTA')
ON CONFLICT (LIFNR) DO NOTHING;

-- ================================================================
-- ÍNDICES PARA RENDIMIENTO
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_mara_ean ON MARA(EAN11);
CREATE INDEX IF NOT EXISTS idx_mara_matkl ON MARA(MATKL);
CREATE INDEX IF NOT EXISTS idx_mard_stock ON MARD(LABST);
CREATE INDEX IF NOT EXISTS idx_vbak_date ON VBAK(ERDAT);
CREATE INDEX IF NOT EXISTS idx_cdhdr_object ON CDHDR(OBJECTCLAS, OBJECTID);

-- ================================================================
-- VISTA ÚTIL: Material con todos sus datos
-- ================================================================

CREATE OR REPLACE VIEW V_MATERIAL_COMPLETO AS
SELECT 
    m.MATNR as "ID Material",
    m.EAN11 as "EAN",
    t.MAKTX as "Descripción",
    c.WGBEZ as "Categoría",
    m.NTGEW as "Peso Neto (kg)",
    m.BRGEW as "Peso Bruto (kg)",
    m.LAENG as "Largo (cm)",
    m.BREIT as "Ancho (cm)",
    m.HOESSION as "Alto (cm)",
    m.VOLUM as "Volumen (m³)",
    d.LABST as "Stock Actual",
    mc.MINBE as "Punto Reorden",
    CASE 
        WHEN d.LABST < mc.MINBE THEN 'STOCK BAJO'
        WHEN m.LVORM = TRUE THEN 'DESCONTINUADO'
        ELSE 'ACTIVO'
    END as "Estado",
    m.ERSDA as "Fecha Creación",
    m.ERNAM as "Creado Por"
FROM MARA m
LEFT JOIN MAKT t ON m.MATNR = t.MATNR AND t.SPRAS = 'ES'
LEFT JOIN T023 c ON m.MATKL = c.MATKL
LEFT JOIN MARC mc ON m.MATNR = mc.MATNR AND mc.WERKS = '1000'
LEFT JOIN MARD d ON m.MATNR = d.MATNR AND d.WERKS = '1000' AND d.LGORT = '0001';
