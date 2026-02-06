// Quick test to see actual column names in Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qmxepacnmbbpupxzjyur.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteGVwYWNubWJicHVweHpqeXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzODEsImV4cCI6MjA4NTkwMDM4MX0.NhF980IeQsNPw6UY4sNufwHeHtDTOs11KRccq_PXenI'
);

async function testInsert() {
    // Try minimal insert to see what works
    console.log('Testing minimal insert...\n');

    const testData = {
        matnr: 'TEST-001',
        ean11: '7591234567890',
        matkl: 'LB',
        ntgew: 50.5,
        brgew: 56.0,
        laeng: 70,
        breit: 60,
        ernam: 'TEST'
    };

    console.log('Inserting:', testData);

    const { data, error } = await supabase
        .from('mara')
        .upsert([testData], { onConflict: 'matnr' })
        .select();

    if (error) {
        console.log('\n❌ Error:', error.message);
        console.log('\nHint:', error.hint || 'none');
        console.log('Details:', error.details || 'none');
    } else {
        console.log('\n✅ Success! Inserted:', data);
    }

    // Cleanup
    await supabase.from('mara').delete().eq('matnr', 'TEST-001');
}

testInsert();
