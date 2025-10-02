-- TÜM BOM KAYITLARINI AKTİF HALE GETİR
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut durumu kontrol et
SELECT 'MEVCUT DURUM' as info;
SELECT 
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif_kayit,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif_kayit
FROM urun_agaci
WHERE ana_urun_tipi = 'nihai';

-- 2. TÜM NİHAİ ÜRÜN BOM KAYITLARINI AKTİF HALE GETİR
UPDATE urun_agaci
SET aktif = true,
    updated_at = NOW()
WHERE ana_urun_tipi = 'nihai' 
  AND aktif = false;

-- 3. Güncelleme sonucunu kontrol et
SELECT 'GÜNCELLENME SONUCU' as info;
SELECT 
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif_kayit,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif_kayit
FROM urun_agaci
WHERE ana_urun_tipi = 'nihai';

-- 4. Test ürünleri için BOM kontrol et
SELECT 'TEST ÜRÜNLERİ BOM DURUMU' as info;
SELECT 
    ua.ana_urun_id,
    n.ad as nihai_urun_adi,
    n.kod as nihai_urun_kodu,
    COUNT(*) as aktif_malzeme_sayisi
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai' 
  AND ua.aktif = true
  AND ua.ana_urun_id IN (177, 178, 179, 1090, 1171, 1240, 1241)
GROUP BY ua.ana_urun_id, n.ad, n.kod
ORDER BY ua.ana_urun_id;

-- 5. Product ID 177 için detaylı BOM listele
SELECT 'PRODUCT ID 177 BOM DETAYI' as info;
SELECT 
    ua.alt_urun_id,
    ua.alt_urun_tipi,
    ua.gerekli_miktar,
    ua.birim,
    ua.aktif,
    CASE 
        WHEN ua.alt_urun_tipi = 'hammadde' THEN h.ad
        WHEN ua.alt_urun_tipi = 'yarimamul' THEN ym.ad
        ELSE 'Bilinmeyen'
    END as malzeme_adi
FROM urun_agaci ua
LEFT JOIN hammaddeler h ON ua.alt_urun_id = h.id AND ua.alt_urun_tipi = 'hammadde'
LEFT JOIN yarimamuller ym ON ua.alt_urun_id = ym.id AND ua.alt_urun_tipi = 'yarimamul'
WHERE ua.ana_urun_id = 177 
  AND ua.ana_urun_tipi = 'nihai'
ORDER BY ua.alt_urun_tipi, ua.alt_urun_id;

-- 6. Product ID 1241 için detaylı BOM listele
SELECT 'PRODUCT ID 1241 BOM DETAYI' as info;
SELECT 
    ua.alt_urun_id,
    ua.alt_urun_tipi,
    ua.gerekli_miktar,
    ua.birim,
    ua.aktif,
    CASE 
        WHEN ua.alt_urun_tipi = 'hammadde' THEN h.ad
        WHEN ua.alt_urun_tipi = 'yarimamul' THEN ym.ad
        ELSE 'Bilinmeyen'
    END as malzeme_adi
FROM urun_agaci ua
LEFT JOIN hammaddeler h ON ua.alt_urun_id = h.id AND ua.alt_urun_tipi = 'hammadde'
LEFT JOIN yarimamuller ym ON ua.alt_urun_id = ym.id AND ua.alt_urun_tipi = 'yarimamul'
WHERE ua.ana_urun_id = 1241 
  AND ua.ana_urun_tipi = 'nihai'
ORDER BY ua.alt_urun_tipi, ua.alt_urun_id;


