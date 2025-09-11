const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://beynxlogttkrrkejvftz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  try {
    console.log('RLS politikaları uygulanıyor...');
    
    // SQL dosyasını oku
    const sqlContent = fs.readFileSync('./fix_rls_policies.sql', 'utf8');
    
    // SQL'i parçalara böl (her policy ayrı ayrı çalıştır)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Toplam ${statements.length} SQL statement bulundu`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Statement ${i + 1}/${statements.length} çalıştırılıyor...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.error(`Statement ${i + 1} hatası:`, error.message);
            // Hata olsa bile devam et
          } else {
            console.log(`Statement ${i + 1} başarılı`);
          }
        } catch (err) {
          console.error(`Statement ${i + 1} exception:`, err.message);
        }
      }
    }
    
    console.log('RLS politikaları uygulama tamamlandı');
    
    // Politikaları kontrol et
    console.log('\nMevcut politikalar kontrol ediliyor...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public');
    
    if (policyError) {
      console.error('Politika kontrol hatası:', policyError.message);
    } else {
      console.log(`Toplam ${policies.length} politika bulundu`);
      policies.forEach(policy => {
        console.log(`- ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    }
    
  } catch (error) {
    console.error('Genel hata:', error.message);
  }
}

// Alternatif olarak direkt SQL çalıştırma
async function applyRLSFixDirect() {
  try {
    console.log('RLS politikaları direkt uygulanıyor...');
    
    const sqlContent = fs.readFileSync('./fix_rls_policies.sql', 'utf8');
    
    // SQL'i Supabase'e gönder
    const { data, error } = await supabase
      .from('pg_stat_activity')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase bağlantı hatası:', error.message);
      return;
    }
    
    console.log('Supabase bağlantısı başarılı');
    console.log('SQL dosyası hazır, manuel olarak Supabase SQL Editor\'da çalıştırın');
    console.log('Dosya: fix_rls_policies.sql');
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

// Çalıştır
applyRLSFixDirect();
