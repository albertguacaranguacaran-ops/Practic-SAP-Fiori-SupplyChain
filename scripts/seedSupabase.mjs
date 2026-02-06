// ================================================================
// SEED SUPABASE - Dakafacil SAP Training Simulator
// 36,000 Products for SAP Practice
// ================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qmxepacnmbbpupxzjyur.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteGVwYWNubWJicHVweHpqeXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzODEsImV4cCI6MjA4NTkwMDM4MX0.NhF980IeQsNPw6UY4sNufwHeHtDTOs11KRccq_PXenI'
);

// Venezuelan Electronics Retailer Categories (DAKA style)
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
        dimensions: { largo: [55, 80], ancho: [55, 85] }
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
        dimensions: { largo: [30, 150], ancho: [10, 50] }
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
        dimensions: { largo: [15, 50], ancho: [15, 40] }
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
    return base + ((10 - (sum % 10)) % 10);
};

async function seedSupabase(targetCount = 1000) {
    console.log(`\n🌱 DAKAFACIL SAP - Seeding ${targetCount.toLocaleString()} products\n`);
    console.log('='.repeat(60));

    const distribution = {
        LB: Math.floor(targetCount * 0.35),
        LM: Math.floor(targetCount * 0.35),
        PE: targetCount - Math.floor(targetCount * 0.35) * 2
    };

    let totalInserted = 0;
    const batchSize = 100;
    const usedEANs = new Set();

    for (const catCode of Object.keys(CATEGORIES)) {
        const cat = CATEGORIES[catCode];
        const targetForCat = distribution[catCode];
        let insertedForCat = 0;

        console.log(`\n📦 ${cat.name}: ${targetForCat.toLocaleString()} items...`);

        let batch = [];

        while (insertedForCat < targetForCat) {
            for (const product of cat.products) {
                for (const size of product.sizes) {
                    for (const brand of product.brands) {
                        for (const color of COLORS) {
                            if (insertedForCat >= targetForCat) break;

                            const id = `${catCode}-${String(totalInserted + 1).padStart(6, '0')}`;
                            let ean = generateEAN();

                            // 3% duplicate EANs for training scenarios
                            if (Math.random() < 0.03 && usedEANs.size > 0) {
                                const arr = Array.from(usedEANs);
                                ean = arr[randInt(0, arr.length - 1)];
                            } else {
                                usedEANs.add(ean);
                            }

                            const desc = `${product.base} ${brand} ${size} ${color}`;
                            const peso = randFloat(cat.weightRange.min, cat.weightRange.max);
                            const stock = randInt(0, 150);
                            const reorden = randInt(5, 20);
                            // 5% low stock for training
                            const actualStock = Math.random() < 0.05 ? randInt(0, reorden - 1) : stock;

                            batch.push({
                                matnr: id,
                                ean11: ean,
                                matkl: catCode,
                                ntgew: peso,
                                brgew: Math.round(peso * 1.12 * 100) / 100,
                                laeng: randInt(cat.dimensions.largo[0], cat.dimensions.largo[1]),
                                breit: randInt(cat.dimensions.ancho[0], cat.dimensions.ancho[1]),
                                ernam: 'SEED',
                                lvorm: Math.random() < 0.03,
                                // For related tables
                                _desc: desc,
                                _stock: actualStock,
                                _reorden: reorden
                            });

                            insertedForCat++;
                            totalInserted++;

                            if (batch.length >= batchSize || insertedForCat >= targetForCat) {
                                await insertBatch(batch);
                                process.stdout.write(`\r   ✓ ${totalInserted.toLocaleString()} / ${targetCount.toLocaleString()}`);
                                batch = [];
                            }
                        }
                    }
                }
            }
        }
    }

    console.log('\n\n' + '='.repeat(60));
    await showStats();
    console.log('\n🎉 ¡Refresca tu app (F5) para ver los datos de Supabase!\n');
}

async function insertBatch(items) {
    // MARA - Master data (only valid columns)
    const maraData = items.map(({ _desc, _stock, _reorden, ...rest }) => rest);

    const { error: maraError } = await supabase
        .from('mara')
        .upsert(maraData, { onConflict: 'matnr', ignoreDuplicates: true });

    if (maraError) {
        console.error('\n❌ MARA:', maraError.message);
        return;
    }

    // Small delay for FK
    await new Promise(r => setTimeout(r, 50));

    // MAKT - Descriptions
    const maktData = items.map(i => ({
        matnr: i.matnr,
        spras: 'ES',
        maktx: i._desc,
        maktg: i._desc.toUpperCase()
    }));
    await supabase.from('makt').upsert(maktData, { onConflict: 'matnr,spras', ignoreDuplicates: true });

    // MARC - Plant data
    const marcData = items.map(i => ({
        matnr: i.matnr,
        werks: '1000',
        minbe: i._reorden
    }));
    await supabase.from('marc').upsert(marcData, { onConflict: 'matnr,werks', ignoreDuplicates: true });

    // MARD - Stock
    const mardData = items.map(i => ({
        matnr: i.matnr,
        werks: '1000',
        lgort: '0001',
        labst: i._stock
    }));
    await supabase.from('mard').upsert(mardData, { onConflict: 'matnr,werks,lgort', ignoreDuplicates: true });
}

async function showStats() {
    const { count: total } = await supabase.from('mara').select('*', { count: 'exact', head: true });
    const { count: makt } = await supabase.from('makt').select('*', { count: 'exact', head: true });
    const { count: marc } = await supabase.from('marc').select('*', { count: 'exact', head: true });
    const { count: mard } = await supabase.from('mard').select('*', { count: 'exact', head: true });

    console.log('✅ ¡Seed completado exitosamente!');
    console.log(`\n📊 Tablas pobladas:`);
    console.log(`   MARA (materiales): ${total?.toLocaleString() || 0}`);
    console.log(`   MAKT (descripciones): ${makt?.toLocaleString() || 0}`);
    console.log(`   MARC (datos planta): ${marc?.toLocaleString() || 0}`);
    console.log(`   MARD (stocks): ${mard?.toLocaleString() || 0}`);
}

// Run - default 1000, can pass number as arg
const count = parseInt(process.argv[2]) || 1000;
seedSupabase(count);
