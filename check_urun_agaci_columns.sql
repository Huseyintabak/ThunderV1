-- Ürün Ağacı Tablosu Kolonlarını Kontrol Et
-- Hangi kolonlar var, hangileri yok?

-- 1. Tablo yapısını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'urun_agaci' 
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı göster (tüm kolonlarla)
SELECT * FROM urun_agaci LIMIT 5;

-- 3. Toplam kayıt sayısı
SELECT COUNT(*) as total_records FROM urun_agaci;

-- 4. Aktif kayıt sayısı (eğer aktif kolonu varsa)
SELECT COUNT(*) as active_records FROM urun_agaci WHERE aktif = true;

-- 5. Ana ürün ID'leri (eğer ana_urun_id kolonu varsa)
SELECT DISTINCT ana_urun_id FROM urun_agaci ORDER BY ana_urun_id LIMIT 10;
