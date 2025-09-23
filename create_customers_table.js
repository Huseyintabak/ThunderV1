const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Supabase client oluştur
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function createCustomersTable() {
  try {
    console.log('🔍 Müşteri tablosu oluşturuluyor...');
    
    // Önce tabloyu kontrol et
    const { data: existingTable, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('📋 Müşteri tablosu bulunamadı, oluşturuluyor...');
      
      // Tablo yoksa, varsayılan müşterileri ekle
      const defaultCustomers = [
        { name: 'LTSAUTO', code: 'LTS-001', email: 'info@ltsauto.com', phone: '+90 555 123 45 67', address: 'İstanbul, Türkiye', notes: 'Ana müşteri' },
        { name: 'ACME Corp', code: 'ACME-001', email: 'orders@acme.com', phone: '+90 555 234 56 78', address: 'Ankara, Türkiye', notes: 'Kurumsal müşteri' },
        { name: 'Tech Solutions', code: 'TECH-001', email: 'contact@techsolutions.com', phone: '+90 555 345 67 89', address: 'İzmir, Türkiye', notes: 'Teknoloji şirketi' },
        { name: 'Industrial Ltd', code: 'IND-001', email: 'sales@industrial.com', phone: '+90 555 456 78 90', address: 'Bursa, Türkiye', notes: 'Endüstriyel müşteri' },
        { name: 'Manufacturing Co', code: 'MFG-001', email: 'orders@manufacturing.com', phone: '+90 555 567 89 01', address: 'Kocaeli, Türkiye', notes: 'Üretim şirketi' }
      ];
      
      const { data, error } = await supabase
        .from('customers')
        .insert(defaultCustomers);
      
      if (error) {
        console.error('❌ Varsayılan müşteriler eklenemedi:', error);
      } else {
        console.log('✅ Varsayılan müşteriler eklendi');
      }
    } else if (checkError) {
      console.error('❌ Müşteri tablosu kontrol hatası:', checkError);
    } else {
      console.log('✅ Müşteri tablosu mevcut');
    }
  } catch (error) {
    console.error('❌ Müşteri tablosu oluşturma hatası:', error);
  }
}

// Script'i çalıştır
createCustomersTable().then(() => {
  console.log('✅ Müşteri tablosu işlemi tamamlandı');
  process.exit(0);
}).catch(error => {
  console.error('❌ Hata:', error);
  process.exit(1);
});
