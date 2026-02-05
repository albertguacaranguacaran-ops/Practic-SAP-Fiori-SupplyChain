// ================================================================
// SEED DATABASE - Poblar 36,000 SKUs en PostgreSQL
// ================================================================

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/dakafacil'
});

// Categories
const CATEGORIES = {
    LB: {
        name: 'Línea Blanca',
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
    LM: {
        name: 'Línea Marrón',
        products: [
            { base: 'TELEVISOR', brands: ['SAMSUNG', 'LG', 'SONY', 'TCL', 'HISENSE'], sizes: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'] },
            { base: 'TEATRO EN CASA', brands: ['SAMSUNG', 'LG', 'SONY', 'BOSE', 'JBL'], sizes: ['5.1', '7.1', '2.1'] },
            { base: 'BARRA DE SONIDO', brands: ['SAMSUNG', 'LG', 'SONY', 'JBL', 'BOSE'], sizes: ['100W', '200W', '300W', '400W'] },
            { base: 'CONSOLA VIDEOJUEGOS', brands: ['SONY', 'MICROSOFT', 'NINTENDO'], sizes: ['PS5', 'XBOX SERIES X', 'SWITCH'] },
            { base: 'EQUIPO DE SONIDO', brands: ['SAMSUNG', 'LG', 'SONY', 'PANASONIC'], sizes: ['500W', '1000W', '1500W', '2000W'] },
        ],
        weightRange: { min: 3, max: 45 },
        dimensions: { largo: [30, 150], ancho: [10, 50], alto: [20, 100] }
    },
    PE: {
        name: 'Pequeños Electro',
        products: [
            { base: 'LICUADORA', brands: ['OSTER', 'BLACK+DECKER', 'HAMILTON BEACH', 'NINJA'], sizes: ['1.5L', '2L', '2.5L'] },
            { base: 'MICROONDAS', brands: ['SAMSUNG', 'LG', 'WHIRLPOOL', 'PANASONIC'], sizes: ['20L', '25L', '30L', '32L'] },
            { base: 'PLANCHA', brands: ['BLACK+DECKER', 'T-FAL', 'PHILIPS', 'OSTER'], sizes: ['VAPOR', 'SECA', 'VERTICAL'] },
            { base: 'CAFETERA', brands: ['OSTER', 'BLACK+DECKER', 'NESPRESSO', 'DELONGHI', 'CUISINART'], sizes: ['4 TAZAS', '8 TAZAS', '12 TAZAS', 'EXPRESSO'] },
            { base: 'FREIDORA DE AIRE', brands: ['OSTER', 'NINJA', 'PHILIPS', 'GOURMIA'], sizes: ['3L', '4L', '5L', '6L', '8L'] },
            { base: 'ASPIRADORA', brands: ['DYSON', 'SAMSUNG', 'ELECTROLUX', 'BLACK+DECKER'], sizes: ['INALÁMBRICA', 'CON CABLE', 'ROBOT'] },
            { base: 'VENTILADOR', brands: ['SANKEY', 'IMACO', 'HONEYWELL'], sizes: ['16"', '18"', '20"', 'TORRE'] },
        ],
        weightRange: { min: 1, max: 15 },
        dimensions: { largo: [15, 50], ancho: [15, 40], alto: [15, 45] }
    }
};

const COLORS = ['BLANCO', 'NEGRO', 'GRIS', 'PLATEADO', 'INOX', 'ROJO'];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

const generateEAN = () => {
    const prefix = '759';
    const base = prefix + String(randInt(100000000, 999999999)).slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
};

async function seedDatabase(targetCount = 36000) {
    const client = await pool.connect();

    try {
        console.log('📋 Reading schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🗄️ Creating tables...');
        await client.query(schema);

        console.log(`🌱 Seeding ${targetCount.toLocaleString()} materials...`);

        const categories = Object.keys(CATEGORIES);
        const distribution = {
            LB: Math.floor(targetCount * 0.35),
            LM: Math.floor(targetCount * 0.35),
            PE: targetCount - Math.floor(targetCount * 0.35) * 2
        };

        let totalInserted = 0;
        const batchSize = 500;
        const usedEANs = new Set();

        for (const catCode of categories) {
            const cat = CATEGORIES[catCode];
            const targetForCat = distribution[catCode];
            let insertedForCat = 0;

            console.log(`  📦 ${cat.name}: ${targetForCat.toLocaleString()} items...`);

            let batch = [];

            while (insertedForCat < targetForCat) {
                for (const product of cat.products) {
                    for (const size of product.sizes) {
                        for (const brand of product.brands) {
                            for (const color of COLORS) {
                                if (insertedForCat >= targetForCat) break;

                                const id = `${catCode}-${String(totalInserted + 1).padStart(6, '0')}`;
                                let ean = generateEAN();

                                // 3% chance of duplicate EAN
                                if (Math.random() < 0.03 && usedEANs.size > 0) {
                                    const eansArray = Array.from(usedEANs);
                                    ean = eansArray[randInt(0, eansArray.length - 1)];
                                } else {
                                    usedEANs.add(ean);
                                }

                                const descripcion = `${product.base} ${brand} ${size} ${color}`;
                                const peso = randFloat(cat.weightRange.min, cat.weightRange.max);
                                const largo = randInt(cat.dimensions.largo[0], cat.dimensions.largo[1]);
                                const ancho = randInt(cat.dimensions.ancho[0], cat.dimensions.ancho[1]);
                                const alto = randInt(cat.dimensions.alto[0], cat.dimensions.alto[1]);
                                const stock = randInt(0, 100);
                                const puntoReorden = randInt(5, 15);
                                // 5% low stock
                                const actualStock = Math.random() < 0.05 ? randInt(0, puntoReorden - 1) : stock;
                                // 3% discontinued
                                const discontinued = Math.random() < 0.03;

                                batch.push({
                                    id, ean, descripcion, catCode, peso, largo, ancho, alto,
                                    pesoBruto: Math.round(peso * 1.12 * 100) / 100,
                                    stock: actualStock, puntoReorden, discontinued
                                });

                                insertedForCat++;
                                totalInserted++;

                                // Insert batch
                                if (batch.length >= batchSize || insertedForCat >= targetForCat) {
                                    await insertBatch(client, batch);
                                    batch = [];
                                    process.stdout.write(`\r    Inserted: ${totalInserted.toLocaleString()} / ${targetCount.toLocaleString()}`);
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log('\n\n✅ Database seeded successfully!');
        console.log(`   Total materials: ${totalInserted.toLocaleString()}`);

        // Show stats
        const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM MARA) as total,
        (SELECT COUNT(*) FROM MARA WHERE LVORM = TRUE) as discontinued,
        (SELECT COUNT(*) FROM MARD d JOIN MARC c ON d.MATNR = c.MATNR WHERE d.LABST < c.MINBE) as low_stock,
        (SELECT COUNT(*) FROM MARA WHERE NTGEW > 50) as overweight
    `);

        console.log('\n📊 Statistics:');
        console.log(`   Discontinued: ${stats.rows[0].discontinued}`);
        console.log(`   Low Stock: ${stats.rows[0].low_stock}`);
        console.log(`   Overweight (>50kg): ${stats.rows[0].overweight}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

async function insertBatch(client, batch) {
    for (const item of batch) {
        try {
            // MARA
            await client.query(`
        INSERT INTO MARA (MATNR, EAN11, MATKL, NTGEW, BRGEW, LAENG, BREIT, HOESSION, ERNAM, LVORM)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SEED', $9)
        ON CONFLICT (MATNR) DO NOTHING
      `, [item.id, item.ean, item.catCode, item.peso, item.pesoBruto, item.largo, item.ancho, item.alto, item.discontinued]);

            // MAKT
            await client.query(`
        INSERT INTO MAKT (MATNR, SPRAS, MAKTX, MAKTG)
        VALUES ($1, 'ES', $2, $3)
        ON CONFLICT (MATNR, SPRAS) DO NOTHING
      `, [item.id, item.descripcion, item.descripcion.toUpperCase()]);

            // MARC
            await client.query(`
        INSERT INTO MARC (MATNR, WERKS, MINBE)
        VALUES ($1, '1000', $2)
        ON CONFLICT (MATNR, WERKS) DO NOTHING
      `, [item.id, item.puntoReorden]);

            // MARD
            await client.query(`
        INSERT INTO MARD (MATNR, WERKS, LGORT, LABST)
        VALUES ($1, '1000', '0001', $2)
        ON CONFLICT (MATNR, WERKS, LGORT) DO NOTHING
      `, [item.id, item.stock]);

        } catch (err) {
            // Skip duplicates
        }
    }
}

// Run if called directly
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 36000;
    seedDatabase(count)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
