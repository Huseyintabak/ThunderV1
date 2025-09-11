const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const config = require('./config');

// Supabase client oluştur
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function setupSupabaseTables() {
  try {
    console.log('Supabase tabloları oluşturuluyor...');
    
    // SQL dosyasını oku
    const sqlContent = fs.readFileSync('workflow_tables.sql', 'utf8');
    
    // SQL'i çalıştır
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('SQL çalıştırma hatası:', error);
      
      // Alternatif olarak tabloları tek tek oluştur
      await createTablesIndividually();
    } else {
      console.log('✅ Tüm tablolar başarıyla oluşturuldu!');
    }
    
  } catch (error) {
    console.error('Setup hatası:', error);
    console.log('Alternatif yöntemle tablolar oluşturuluyor...');
    await createTablesIndividually();
  }
}

async function createTablesIndividually() {
  const tables = [
    {
      name: 'workflows',
      sql: `
        CREATE TABLE IF NOT EXISTS workflows (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          steps JSONB NOT NULL,
          triggers JSONB,
          conditions JSONB,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'workflow_executions',
      sql: `
        CREATE TABLE IF NOT EXISTS workflow_executions (
          id SERIAL PRIMARY KEY,
          workflow_id INTEGER REFERENCES workflows(id),
          status VARCHAR(50) DEFAULT 'pending',
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          execution_data JSONB,
          progress INTEGER DEFAULT 0,
          current_step INTEGER DEFAULT 0,
          execution_log JSONB,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'work_orders',
      sql: `
        CREATE TABLE IF NOT EXISTS work_orders (
          id SERIAL PRIMARY KEY,
          work_order_number VARCHAR(50) UNIQUE NOT NULL,
          product_id INTEGER,
          product_name VARCHAR(255) NOT NULL,
          product_code VARCHAR(100),
          quantity INTEGER NOT NULL,
          priority VARCHAR(20) DEFAULT 'normal',
          start_date DATE,
          end_date DATE,
          assigned_personnel VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          bom_data JSONB,
          notes TEXT,
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'work_order_status_history',
      sql: `
        CREATE TABLE IF NOT EXISTS work_order_status_history (
          id SERIAL PRIMARY KEY,
          work_order_id INTEGER REFERENCES work_orders(id),
          status VARCHAR(50) NOT NULL,
          changed_by VARCHAR(255),
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`${table.name} tablosu oluşturuluyor...`);
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      
      if (error) {
        console.log(`⚠️  ${table.name} tablosu zaten mevcut veya hata:`, error.message);
      } else {
        console.log(`✅ ${table.name} tablosu oluşturuldu!`);
      }
    } catch (err) {
      console.log(`⚠️  ${table.name} tablosu oluşturulamadı:`, err.message);
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  setupSupabaseTables().then(() => {
    console.log('Setup tamamlandı!');
    process.exit(0);
  }).catch(error => {
    console.error('Setup başarısız:', error);
    process.exit(1);
  });
}

module.exports = { setupSupabaseTables };

