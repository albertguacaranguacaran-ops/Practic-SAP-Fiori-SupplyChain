// Dakafacil - 36,000 SKUs Generator with Realistic Problems
// Categories: Línea Blanca, Línea Marrón, Pequeños Electrodomésticos

const CATEGORIES = {
    LINEA_BLANCA: {
        name: 'Línea Blanca',
        prefix: 'LB',
        products: [
            { base: 'NEVERA', brands: ['SAMSUNG', 'LG', 'MABE', 'WHIRLPOOL', 'FRIGIDAIRE'], sizes: ['14 PIES', '16 PIES', '18 PIES', '20 PIES', '22 PIES'] },
            { base: 'LAVADORA', brands: ['SAMSUNG', 'LG', 'MABE', 'WHIRLPOOL', 'DAEWOO'], sizes: ['12 KG', '14 KG', '16 KG', '18 KG', '20 KG'] },
            { base: 'SECADORA', brands: ['SAMSUNG', 'LG', 'WHIRLPOOL', 'MABE'], sizes: ['10 KG', '12 KG', '14 KG', '16 KG'] },
            { base: 'AIRE ACONDICIONADO', brands: ['SAMSUNG', 'LG', 'CARRIER', 'DAIKIN', 'YORK'], sizes: ['9000 BTU', '12000 BTU', '18000 BTU', '24000 BTU'] },
            { base: 'COCINA', brands: ['MABE', 'WHIRLPOOL', 'SAMSUNG', 'FRIGIDAIRE'], sizes: ['4 HORNILLAS', '5 HORNILLAS', '6 HORNILLAS'] },
            { base: 'CONGELADOR', brands: ['MABE', 'WHIRLPOOL', 'FRIGIDAIRE', 'ELECTROLUX'], sizes: ['5 PIES', '7 PIES', '10 PIES', '15 PIES'] },
        ],
        weightRange: { min: 35, max: 120 },
        dimensions: { largo: [55, 80], ancho: [55, 85], alto: [80, 200] }
    },
    LINEA_MARRON: {
        name: 'Línea Marrón',
        prefix: 'LM',
        products: [
            { base: 'TELEVISOR', brands: ['SAMSUNG', 'LG', 'SONY', 'TCL', 'HISENSE'], sizes: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'] },
            { base: 'TEATRO EN CASA', brands: ['SAMSUNG', 'LG', 'SONY', 'BOSE', 'JBL'], sizes: ['5.1', '7.1', '2.1'] },
            { base: 'BARRA DE SONIDO', brands: ['SAMSUNG', 'LG', 'SONY', 'JBL', 'BOSE'], sizes: ['100W', '200W', '300W', '400W'] },
            { base: 'CONSOLA VIDEOJUEGOS', brands: ['SONY', 'MICROSOFT', 'NINTENDO'], sizes: ['PS5', 'XBOX SERIES X', 'SWITCH'] },
            { base: 'REPRODUCTOR BLU-RAY', brands: ['SAMSUNG', 'LG', 'SONY'], sizes: ['4K', 'STANDARD'] },
            { base: 'EQUIPO DE SONIDO', brands: ['SAMSUNG', 'LG', 'SONY', 'PANASONIC'], sizes: ['500W', '1000W', '1500W', '2000W'] },
        ],
        weightRange: { min: 3, max: 45 },
        dimensions: { largo: [30, 150], ancho: [10, 50], alto: [20, 100] }
    },
    PEQUENOS_ELECTRO: {
        name: 'Pequeños Electrodomésticos',
        prefix: 'PE',
        products: [
            { base: 'LICUADORA', brands: ['OSTER', 'BLACK+DECKER', 'HAMILTON BEACH', 'NINJA'], sizes: ['1.5L', '2L', '2.5L'] },
            { base: 'MICROONDAS', brands: ['SAMSUNG', 'LG', 'WHIRLPOOL', 'PANASONIC'], sizes: ['20L', '25L', '30L', '32L'] },
            { base: 'PLANCHA', brands: ['BLACK+DECKER', 'T-FAL', 'PHILIPS', 'OSTER'], sizes: ['VAPOR', 'SECA', 'VERTICAL'] },
            { base: 'TOSTADORA', brands: ['OSTER', 'BLACK+DECKER', 'HAMILTON BEACH'], sizes: ['2 PANES', '4 PANES'] },
            { base: 'CAFETERA', brands: ['OSTER', 'BLACK+DECKER', 'NESPRESSO', 'DELONGHI', 'CUISINART'], sizes: ['4 TAZAS', '8 TAZAS', '12 TAZAS', 'EXPRESSO'] },
            { base: 'BATIDORA', brands: ['KITCHENAID', 'OSTER', 'HAMILTON BEACH', 'CUISINART'], sizes: ['300W', '500W', '800W'] },
            { base: 'FREIDORA DE AIRE', brands: ['OSTER', 'NINJA', 'PHILIPS', 'GOURMIA'], sizes: ['3L', '4L', '5L', '6L', '8L'] },
            { base: 'ASPIRADORA', brands: ['DYSON', 'SAMSUNG', 'ELECTROLUX', 'BLACK+DECKER'], sizes: ['INALÁMBRICA', 'CON CABLE', 'ROBOT'] },
            { base: 'VENTILADOR', brands: ['SANKEY', 'IMACO', 'HONEYWELL'], sizes: ['16"', '18"', '20"', 'TORRE'] },
            { base: 'ARROCERA', brands: ['OSTER', 'BLACK+DECKER', 'HAMILTON BEACH'], sizes: ['3 TAZAS', '6 TAZAS', '10 TAZAS'] },
        ],
        weightRange: { min: 1, max: 15 },
        dimensions: { largo: [15, 50], ancho: [15, 40], alto: [15, 45] }
    }
};

// Generate random number in range
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate EAN-13 with checksum
const generateEAN = (prefix) => {
    const base = prefix + String(randInt(100000000, 999999999)).slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
};

// Problem flags
const PROBLEMS = {
    NONE: 'active',
    DUPLICATE: 'duplicate',
    LOW_STOCK: 'low_stock',
    DISCONTINUED: 'discontinued',
    MISSING_DATA: 'missing_data',
    OVERWEIGHT: 'overweight'
};

// Generate single product
const generateProduct = (id, category, productDef, sizeIndex, brandIndex, colorIndex) => {
    const colors = ['BLANCO', 'NEGRO', 'GRIS', 'PLATEADO', 'INOX', 'ROJO'];
    const size = productDef.sizes[sizeIndex % productDef.sizes.length];
    const brand = productDef.brands[brandIndex % productDef.brands.length];
    const color = colors[colorIndex % colors.length];

    const cat = CATEGORIES[category];
    const peso = randFloat(cat.weightRange.min, cat.weightRange.max);

    return {
        id: `${cat.prefix}-${String(id).padStart(6, '0')}`,
        ean: generateEAN('759'),
        descripcion: `${productDef.base} ${brand} ${size} ${color}`,
        marca: brand,
        modelo: `${brand.slice(0, 2)}${randInt(1000, 9999)}`,
        categoria: cat.name,
        subcategoria: productDef.base,
        color,
        pesoNeto: peso,
        pesoBruto: round2(peso * 1.12),
        largo: randInt(cat.dimensions.largo[0], cat.dimensions.largo[1]),
        ancho: randInt(cat.dimensions.ancho[0], cat.dimensions.ancho[1]),
        alto: randInt(cat.dimensions.alto[0], cat.dimensions.alto[1]),
        precioBase: randFloat(50, category === 'LINEA_BLANCA' ? 2500 : category === 'LINEA_MARRON' ? 1800 : 500),
        stockActual: randInt(0, 100),
        puntoReorden: randInt(5, 15),
        ubicacion: `A${randInt(1, 50)}-${randInt(1, 10)}-${randInt(1, 5)}`,
        proveedor: ['IMPORTADORA CENTRAL', 'DISTRIB. NACIONAL', 'MAYORISTA PLUS', 'COMERCIAL DELTA'][randInt(0, 3)],
        status: PROBLEMS.NONE,
        fechaCreacion: randomDate(2020, 2024),
        ultimaModificacion: randomDate(2024, 2026),
        duplicadoRef: null,
        alertas: []
    };
};

function round2(num) {
    return Math.round(num * 100) / 100;
}

function randomDate(startYear, endYear) {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

// Generate 36,000 products with realistic problems
export function generateDakafacilProducts(count = 36000) {
    const products = [];
    const categories = Object.keys(CATEGORIES);
    const usedEANs = new Map(); // Track EANs for duplicates

    let id = 1;

    // Distribution: 35% Línea Blanca, 35% Línea Marrón, 30% Pequeños
    const distribution = {
        LINEA_BLANCA: Math.floor(count * 0.35),
        LINEA_MARRON: Math.floor(count * 0.35),
        PEQUENOS_ELECTRO: count - Math.floor(count * 0.35) * 2
    };

    for (const category of categories) {
        const cat = CATEGORIES[category];
        const targetCount = distribution[category];
        let generated = 0;

        while (generated < targetCount) {
            for (const productDef of cat.products) {
                for (let sizeIdx = 0; sizeIdx < productDef.sizes.length && generated < targetCount; sizeIdx++) {
                    for (let brandIdx = 0; brandIdx < productDef.brands.length && generated < targetCount; brandIdx++) {
                        for (let colorIdx = 0; colorIdx < 6 && generated < targetCount; colorIdx++) {
                            const product = generateProduct(id, category, productDef, sizeIdx, brandIdx, colorIdx);

                            // Inject realistic problems (approx 15% of products)
                            const problemChance = Math.random();

                            if (problemChance < 0.03) {
                                // 3% - Duplicates (same EAN, different ID)
                                if (usedEANs.has(product.ean)) {
                                    product.status = PROBLEMS.DUPLICATE;
                                    product.duplicadoRef = usedEANs.get(product.ean);
                                    product.alertas.push('EAN duplicado');
                                } else {
                                    // Mark for potential future duplicate
                                    if (Math.random() < 0.5) {
                                        usedEANs.set(product.ean, product.id);
                                    }
                                }
                            } else if (problemChance < 0.08) {
                                // 5% - Low stock (below reorder point)
                                product.stockActual = randInt(0, product.puntoReorden - 1);
                                product.status = PROBLEMS.LOW_STOCK;
                                product.alertas.push('Stock bajo - Recompra urgente');
                            } else if (problemChance < 0.11) {
                                // 3% - Discontinued
                                product.status = PROBLEMS.DISCONTINUED;
                                product.stockActual = randInt(0, 5);
                                product.alertas.push('Producto descontinuado');
                            } else if (problemChance < 0.13) {
                                // 2% - Missing data
                                product.status = PROBLEMS.MISSING_DATA;
                                product.pesoNeto = null;
                                product.pesoBruto = null;
                                product.largo = null;
                                product.ancho = null;
                                product.alto = null;
                                product.alertas.push('Datos incompletos');
                            }

                            // Check overweight (>50kg)
                            if (product.pesoNeto && product.pesoNeto > 50) {
                                product.alertas.push('Peso excede 50kg - Manipulación especial');
                            }

                            products.push(product);
                            id++;
                            generated++;
                        }
                    }
                }
            }
        }
    }

    return products;
}

// Pre-generate a sample for initial load (1000 items for performance)
export const SAMPLE_PRODUCTS = generateDakafacilProducts(1000);

// Full dataset generator (lazy load)
let fullDataset = null;
export function getFullDataset() {
    if (!fullDataset) {
        fullDataset = generateDakafacilProducts(36000);
    }
    return fullDataset;
}

// Statistics
export function getDataStats(products) {
    const stats = {
        total: products.length,
        byCategory: {},
        byStatus: {},
        totalValue: 0,
        lowStock: 0,
        duplicates: 0,
        overweight: 0
    };

    for (const p of products) {
        // By category
        stats.byCategory[p.categoria] = (stats.byCategory[p.categoria] || 0) + 1;

        // By status
        stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;

        // Value
        stats.totalValue += p.precioBase * p.stockActual;

        // Alerts
        if (p.status === 'low_stock') stats.lowStock++;
        if (p.status === 'duplicate') stats.duplicates++;
        if (p.pesoNeto > 50) stats.overweight++;
    }

    stats.totalValue = round2(stats.totalValue);

    return stats;
}

// Export categories for filters
export const CATEGORY_LIST = Object.values(CATEGORIES).map(c => c.name);
export const SUBCATEGORY_MAP = {};
Object.values(CATEGORIES).forEach(cat => {
    SUBCATEGORY_MAP[cat.name] = cat.products.map(p => p.base);
});
