const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Supabase client oluştur
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function checkSupabaseTables() {
  try {
    console.log('Supabase tabloları kontrol ediliyor...');
    
    // Mevcut tabloları listele
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Tablolar listelenemedi:', tablesError.message);
    } else {
      console.log('Mevcut tablolar:', tables?.map(t => t.table_name) || []);
    }
    
    // work_orders tablosunu test et
    console.log('\nwork_orders tablosu test ediliyor...');
    const { data: workOrders, error: workOrdersError } = await supabase
      .from('work_orders')
      .select('*')
      .limit(1);
    
    if (workOrdersError) {
      console.log('work_orders tablosu hatası:', workOrdersError.message);
    } else {
      console.log('work_orders tablosu çalışıyor!');
    }
    
    // workflow_executions tablosunu test et
    console.log('\nworkflow_executions tablosu test ediliyor...');
    const { data: executions, error: executionsError } = await supabase
      .from('workflow_executions')
      .select('*')
      .limit(1);
    
    if (executionsError) {
      console.log('workflow_executions tablosu hatası:', executionsError.message);
    } else {
      console.log('workflow_executions tablosu çalışıyor!');
    }
    
  } catch (error) {
    console.error('Kontrol hatası:', error);
  }
}

// Script'i çalıştır
if (require.main === module) {
  checkSupabaseTables().then(() => {
    console.log('\nKontrol tamamlandı!');
    process.exit(0);
  }).catch(error => {
    console.error('Kontrol başarısız:', error);
    process.exit(1);
  });
}

module.exports = { checkSupabaseTables };

