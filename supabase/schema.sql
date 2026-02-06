-- =====================================================
-- DAKAFACIL SAP S/4HANA TRAINING SIMULATOR
-- Schema para Supabase (PostgreSQL)
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS DE MATERIALES (MM)
-- =====================================================

-- MARA - Datos Generales del Material
CREATE TABLE IF NOT EXISTS mara (
    matnr VARCHAR(18) PRIMARY KEY,                    -- Número de material
    mtart VARCHAR(4) DEFAULT 'FERT',                  -- Tipo de material
    mbrsh VARCHAR(1) DEFAULT 'M',                     -- Ramo
    matkl VARCHAR(9),                                  -- Grupo de artículos
    meins VARCHAR(3) DEFAULT 'UN',                    -- Unidad de medida base
    brgew DECIMAL(13,3),                              -- Peso bruto
    ntgew DECIMAL(13,3),                              -- Peso neto
    gewei VARCHAR(3) DEFAULT 'KG',                    -- Unidad de peso
    volum DECIMAL(13,3),                              -- Volumen
    voleh VARCHAR(3) DEFAULT 'M3',                    -- Unidad de volumen
    laeng DECIMAL(13,3),                              -- Largo
    breit DECIMAL(13,3),                              -- Ancho
    hoehe DECIMAL(13,3),                              -- Alto
    meabm VARCHAR(3) DEFAULT 'CM',                    -- Unidad de dimensiones
    ean11 VARCHAR(18),                                 -- EAN/UPC
    numtp VARCHAR(2) DEFAULT 'HE',                    -- Tipo número EAN
    ersda DATE DEFAULT CURRENT_DATE,                   -- Fecha creación
    ernam VARCHAR(12) DEFAULT 'SYSTEM',               -- Creado por
    laeda DATE,                                        -- Fecha última modificación
    aenam VARCHAR(12),                                 -- Modificado por
    lvorm BOOLEAN DEFAULT FALSE,                       -- Marca borrado
    status VARCHAR(20) DEFAULT 'active',              -- Estado (active, duplicate, discontinued)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAKT - Textos de Material
CREATE TABLE IF NOT EXISTS makt (
    matnr VARCHAR(18) REFERENCES mara(matnr) ON DELETE CASCADE,
    spras VARCHAR(2) DEFAULT 'ES',                    -- Idioma
    maktx VARCHAR(40) NOT NULL,                        -- Descripción
    maktg VARCHAR(40),                                 -- Descripción mayúsculas
    PRIMARY KEY (matnr, spras)
);

-- MARC - Datos del Material por Centro
CREATE TABLE IF NOT EXISTS marc (
    matnr VARCHAR(18) REFERENCES mara(matnr) ON DELETE CASCADE,
    werks VARCHAR(4) NOT NULL,                         -- Centro
    ekgrp VARCHAR(3),                                  -- Grupo de compras
    dismm VARCHAR(2) DEFAULT 'ND',                    -- Tipo planificación
    minbe DECIMAL(13,3) DEFAULT 0,                    -- Punto de pedido
    mabst DECIMAL(13,3) DEFAULT 0,                    -- Stock máximo
    eisbe DECIMAL(13,3) DEFAULT 0,                    -- Stock seguridad
    PRIMARY KEY (matnr, werks)
);

-- MARD - Datos de Almacén (Stock)
CREATE TABLE IF NOT EXISTS mard (
    matnr VARCHAR(18) REFERENCES mara(matnr) ON DELETE CASCADE,
    werks VARCHAR(4) NOT NULL,                         -- Centro
    lgort VARCHAR(4) NOT NULL,                         -- Almacén
    labst DECIMAL(13,3) DEFAULT 0,                    -- Stock libre
    insme DECIMAL(13,3) DEFAULT 0,                    -- Stock en control calidad
    speme DECIMAL(13,3) DEFAULT 0,                    -- Stock bloqueado
    PRIMARY KEY (matnr, werks, lgort)
);

-- =====================================================
-- TABLAS DE VENTAS (SD)
-- =====================================================

-- VBAK - Cabecera de Pedido de Venta
CREATE TABLE IF NOT EXISTS vbak (
    vbeln VARCHAR(10) PRIMARY KEY,                     -- Número de documento
    auart VARCHAR(4) DEFAULT 'ZOR',                   -- Tipo de pedido
    vkorg VARCHAR(4) NOT NULL,                         -- Organización ventas
    vtweg VARCHAR(2) DEFAULT '01',                    -- Canal distribución
    spart VARCHAR(2) DEFAULT '00',                    -- Sector
    kunnr VARCHAR(10),                                 -- Cliente
    erdat DATE DEFAULT CURRENT_DATE,                   -- Fecha creación
    erzet TIME DEFAULT CURRENT_TIME,                   -- Hora creación
    ernam VARCHAR(12) DEFAULT 'CONSULTOR',            -- Creado por
    netwr DECIMAL(15,2) DEFAULT 0,                    -- Valor neto
    waerk VARCHAR(5) DEFAULT 'USD',                   -- Moneda
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VBAP - Posiciones de Pedido de Venta
CREATE TABLE IF NOT EXISTS vbap (
    vbeln VARCHAR(10) REFERENCES vbak(vbeln) ON DELETE CASCADE,
    posnr INTEGER NOT NULL,                            -- Posición
    matnr VARCHAR(18) REFERENCES mara(matnr),         -- Material
    matkl VARCHAR(9),                                  -- Grupo artículos
    arktx VARCHAR(40),                                 -- Descripción
    kwmeng DECIMAL(15,3) NOT NULL,                    -- Cantidad pedido
    meins VARCHAR(3) DEFAULT 'UN',                    -- Unidad
    netwr DECIMAL(15,2),                              -- Valor neto
    netpr DECIMAL(15,2),                              -- Precio neto
    PRIMARY KEY (vbeln, posnr)
);

-- =====================================================
-- TABLAS DE COMPRAS (MM-PUR)
-- =====================================================

-- EKKO - Cabecera de Orden de Compra
CREATE TABLE IF NOT EXISTS ekko (
    ebeln VARCHAR(10) PRIMARY KEY,                     -- Número OC
    bsart VARCHAR(4) DEFAULT 'NB',                    -- Tipo documento
    bstyp VARCHAR(1) DEFAULT 'F',                     -- Categoría
    lifnr VARCHAR(10),                                 -- Proveedor
    ekorg VARCHAR(4) NOT NULL,                         -- Organización compras
    ekgrp VARCHAR(3),                                  -- Grupo compras
    waers VARCHAR(5) DEFAULT 'USD',                   -- Moneda
    bedat DATE DEFAULT CURRENT_DATE,                   -- Fecha documento
    ernam VARCHAR(12) DEFAULT 'CONSULTOR',            -- Creado por
    netwr DECIMAL(15,2) DEFAULT 0,                    -- Valor neto
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EKPO - Posiciones de Orden de Compra
CREATE TABLE IF NOT EXISTS ekpo (
    ebeln VARCHAR(10) REFERENCES ekko(ebeln) ON DELETE CASCADE,
    ebelp INTEGER NOT NULL,                            -- Posición
    matnr VARCHAR(18) REFERENCES mara(matnr),         -- Material
    txz01 VARCHAR(40),                                 -- Descripción
    menge DECIMAL(13,3) NOT NULL,                     -- Cantidad
    meins VARCHAR(3) DEFAULT 'UN',                    -- Unidad
    netpr DECIMAL(15,2),                              -- Precio neto
    peinh DECIMAL(5,0) DEFAULT 1,                     -- Unidad de precio
    werks VARCHAR(4),                                  -- Centro
    lgort VARCHAR(4),                                  -- Almacén
    PRIMARY KEY (ebeln, ebelp)
);

-- =====================================================
-- TABLAS DE AUDITORÍA (CDHDR/CDPOS)
-- =====================================================

-- CDHDR - Cabecera de Documento de Cambios
CREATE TABLE IF NOT EXISTS cdhdr (
    changenr SERIAL PRIMARY KEY,                       -- Número de cambio
    objectclas VARCHAR(15) NOT NULL,                  -- Clase objeto (MATERIAL, ORDER, PO)
    objectid VARCHAR(90) NOT NULL,                    -- ID objeto (MATNR, VBELN, etc)
    username VARCHAR(12) DEFAULT 'CONSULTOR',         -- Usuario
    udate DATE DEFAULT CURRENT_DATE,                   -- Fecha
    utime TIME DEFAULT CURRENT_TIME,                   -- Hora
    tcode VARCHAR(20),                                 -- Transacción
    change_ind VARCHAR(1) DEFAULT 'U',                -- Indicador (I=Insert, U=Update, D=Delete)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CDPOS - Posiciones de Documento de Cambios
CREATE TABLE IF NOT EXISTS cdpos (
    changenr INTEGER REFERENCES cdhdr(changenr) ON DELETE CASCADE,
    tabname VARCHAR(30) NOT NULL,                      -- Nombre tabla
    fname VARCHAR(30) NOT NULL,                        -- Nombre campo
    value_old TEXT,                                    -- Valor anterior
    value_new TEXT,                                    -- Valor nuevo
    PRIMARY KEY (changenr, tabname, fname)
);

-- =====================================================
-- TABLAS MAESTRAS ADICIONALES
-- =====================================================

-- Centros/Plantas
CREATE TABLE IF NOT EXISTS t001w (
    werks VARCHAR(4) PRIMARY KEY,
    name1 VARCHAR(30) NOT NULL,
    stras VARCHAR(30),
    ort01 VARCHAR(25),
    land1 VARCHAR(3) DEFAULT 'VE'
);

-- Almacenes
CREATE TABLE IF NOT EXISTS t001l (
    werks VARCHAR(4) REFERENCES t001w(werks),
    lgort VARCHAR(4) NOT NULL,
    lgobe VARCHAR(16),
    PRIMARY KEY (werks, lgort)
);

-- Proveedores
CREATE TABLE IF NOT EXISTS lfa1 (
    lifnr VARCHAR(10) PRIMARY KEY,
    name1 VARCHAR(35),
    stras VARCHAR(35),
    ort01 VARCHAR(35),
    land1 VARCHAR(3) DEFAULT 'VE',
    telf1 VARCHAR(16)
);

-- Clientes
CREATE TABLE IF NOT EXISTS kna1 (
    kunnr VARCHAR(10) PRIMARY KEY,
    name1 VARCHAR(35),
    stras VARCHAR(35),
    ort01 VARCHAR(35),
    land1 VARCHAR(3) DEFAULT 'VE',
    telf1 VARCHAR(16)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_mara_ean ON mara(ean11);
CREATE INDEX IF NOT EXISTS idx_mara_status ON mara(status);
CREATE INDEX IF NOT EXISTS idx_mard_stock ON mard(labst);
CREATE INDEX IF NOT EXISTS idx_vbak_date ON vbak(erdat);
CREATE INDEX IF NOT EXISTS idx_ekko_date ON ekko(bedat);
CREATE INDEX IF NOT EXISTS idx_cdhdr_object ON cdhdr(objectclas, objectid);

-- =====================================================
-- FUNCIONES RPC PARA FRONTEND
-- =====================================================

-- Contar EANs duplicados
CREATE OR REPLACE FUNCTION count_duplicate_eans()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) FROM (
            SELECT ean11 FROM mara WHERE ean11 IS NOT NULL
            GROUP BY ean11 HAVING COUNT(*) > 1
        ) duplicates
    );
END;
$$ LANGUAGE plpgsql;

-- Ventas por sucursal
CREATE OR REPLACE FUNCTION get_sales_by_branch()
RETURNS TABLE (
    branch VARCHAR(4),
    total_orders BIGINT,
    total_value DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.vkorg as branch,
        COUNT(DISTINCT v.vbeln) as total_orders,
        COALESCE(SUM(v.netwr), 0) as total_value
    FROM vbak v
    GROUP BY v.vkorg
    ORDER BY total_value DESC;
END;
$$ LANGUAGE plpgsql;

-- Productos bajo stock
CREATE OR REPLACE FUNCTION get_low_stock_products(min_stock INTEGER DEFAULT 10)
RETURNS TABLE (
    matnr VARCHAR(18),
    descripcion VARCHAR(40),
    almacen VARCHAR(4),
    stock_actual DECIMAL(13,3),
    punto_reorden DECIMAL(13,3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.matnr,
        t.maktx as descripcion,
        d.lgort as almacen,
        d.labst as stock_actual,
        c.minbe as punto_reorden
    FROM mard d
    JOIN makt t ON d.matnr = t.matnr AND t.spras = 'ES'
    LEFT JOIN marc c ON d.matnr = c.matnr AND d.werks = c.werks
    WHERE d.labst < min_stock
    ORDER BY d.labst ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES - MAESTROS
-- =====================================================

-- Centros (Sucursales Daka)
INSERT INTO t001w (werks, name1, ort01, land1) VALUES
    ('1000', 'DAKA CARACAS CENTRO', 'Caracas', 'VE'),
    ('1100', 'DAKA VALENCIA', 'Valencia', 'VE'),
    ('1200', 'DAKA MARACAIBO', 'Maracaibo', 'VE'),
    ('1300', 'DAKA BARQUISIMETO', 'Barquisimeto', 'VE'),
    ('1400', 'DAKA MARACAY', 'Maracay', 'VE'),
    ('2000', 'CENTRO DISTRIBUCION NACIONAL', 'Guarenas', 'VE')
ON CONFLICT (werks) DO NOTHING;

-- Almacenes
INSERT INTO t001l (werks, lgort, lgobe) VALUES
    ('1000', '0001', 'PISO VENTA'),
    ('1000', '0002', 'BODEGA'),
    ('1000', '0003', 'TRANSITO'),
    ('1100', '0001', 'PISO VENTA'),
    ('1100', '0002', 'BODEGA'),
    ('1200', '0001', 'PISO VENTA'),
    ('1200', '0002', 'BODEGA'),
    ('1300', '0001', 'PISO VENTA'),
    ('1300', '0002', 'BODEGA'),
    ('1400', '0001', 'PISO VENTA'),
    ('1400', '0002', 'BODEGA'),
    ('2000', '0001', 'ALMACEN CENTRAL'),
    ('2000', '0002', 'PICKING'),
    ('2000', '0003', 'TRANSITO')
ON CONFLICT (werks, lgort) DO NOTHING;

-- Proveedores
INSERT INTO lfa1 (lifnr, name1, ort01) VALUES
    ('P0001', 'SAMSUNG ELECTRONICS VENEZUELA', 'Caracas'),
    ('P0002', 'LG ELECTRONICS', 'Caracas'),
    ('P0003', 'IMPORTADORA MABE', 'Valencia'),
    ('P0004', 'WHIRLPOOL DE VENEZUELA', 'Caracas'),
    ('P0005', 'OSTER VENEZUELA', 'Guarenas'),
    ('P0006', 'BLACK & DECKER', 'Caracas'),
    ('P0007', 'SONY ELECTRONICS', 'Caracas'),
    ('P0008', 'ELECTROLUX VENEZUELA', 'Valencia')
ON CONFLICT (lifnr) DO NOTHING;

-- Clientes
INSERT INTO kna1 (kunnr, name1, ort01) VALUES
    ('C0001', 'CLIENTE MOSTRADOR', 'Caracas'),
    ('C0002', 'EMPRESAS POLAR', 'Caracas'),
    ('C0003', 'HOTEL EUROBUILDING', 'Caracas'),
    ('C0004', 'RESTAURANT MOKAMBO', 'Valencia'),
    ('C0005', 'CLINICA METROPOLITANA', 'Caracas')
ON CONFLICT (kunnr) DO NOTHING;

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mara_updated_at
    BEFORE UPDATE ON mara
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
