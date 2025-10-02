-- ============================================
-- TÜM BOM KAYITLARINI AKTİF HALE GETİR
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- ============================================

-- ADIM 1: Mevcut durumu göster
SELECT '========== MEVCUT DURUM ==========' as info;

SELECT 
    ana_urun_tipi,
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif_kayit,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif_kayit,
    ROUND(SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 2) as aktif_oran
FROM urun_agaci
GROUP BY ana_urun_tipi
ORDER BY ana_urun_tipi;

-- ADIM 2: TÜM BOM KAYITLARINI AKTİF HALE GETİR
SELECT '========== GÜNCELLEME YAPILIYOR ==========' as info;

UPDATE urun_agaci
SET 
    aktif = true,
    updated_at = NOW()
WHERE aktif = false OR aktif IS NULL;

-- Kaç kayıt güncellendi?
SELECT '========== GÜNCELLENEN KAYIT SAYISI ==========' as info;

-- ADIM 3: Güncelleme sonucunu göster
SELECT '========== GÜNCELLEME SONUCU ==========' as info;

SELECT 
    ana_urun_tipi,
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif_kayit,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif_kayit,
    ROUND(SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 2) as aktif_oran
FROM urun_agaci
GROUP BY ana_urun_tipi
ORDER BY ana_urun_tipi;

-- ADIM 4: Test ürünleri için BOM kontrol et
SELECT '========== TEST ÜRÜNLERİ BOM DURUMU ==========' as info;

SELECT 
    ua.ana_urun_id,
    n.ad as nihai_urun_adi,
    n.kod as nihai_urun_kodu,
    COUNT(*) as aktif_malzeme_sayisi
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai' 
  AND ua.aktif = true
  AND ua.ana_urun_id IN (177, 178, 179, 180, 181, 1090, 1171, 1240, 1241, 1242, 1243, 1244, 1245)
GROUP BY ua.ana_urun_id, n.ad, n.kod
ORDER BY ua.ana_urun_id;

-- ADIM 5: Product ID 1241 için detaylı BOM
SELECT '========== PRODUCT ID 1241 BOM DETAYI ==========' as info;

SELECT 
    ua.id as bom_id,
    ua.alt_urun_id,
    ua.alt_urun_tipi,
    ua.gerekli_miktar,
    ua.birim,
    ua.aktif,
    CASE 
        WHEN ua.alt_urun_tipi = 'hammadde' THEN h.ad
        WHEN ua.alt_urun_tipi = 'yarimamul' THEN ym.ad
        ELSE 'Bilinmeyen'
    END as malzeme_adi,
    CASE 
        WHEN ua.alt_urun_tipi = 'hammadde' THEN h.kod
        WHEN ua.alt_urun_tipi = 'yarimamul' THEN ym.kod
        ELSE 'N/A'
    END as malzeme_kodu
FROM urun_agaci ua
LEFT JOIN hammaddeler h ON ua.alt_urun_id = h.id AND ua.alt_urun_tipi = 'hammadde'
LEFT JOIN yarimamuller ym ON ua.alt_urun_id = ym.id AND ua.alt_urun_tipi = 'yarimamul'
WHERE ua.ana_urun_id = 1241 
  AND ua.ana_urun_tipi = 'nihai'
ORDER BY ua.alt_urun_tipi, ua.alt_urun_id;

-- ADIM 6: Nihai ürün kontrol et
SELECT '========== NİHAİ ÜRÜN DURUMU ==========' as info;

SELECT 
    id,
    ad,
    kod,
    aktif
FROM nihai_urunler
WHERE id IN (1240, 1241)
ORDER BY id;

-- ADIM 7: Özet rapor
SELECT '========== ÖZET RAPOR ==========' as info;

SELECT 
    'Toplam BOM Kayıtları' as kategori,
    COUNT(*) as sayi
FROM urun_agaci
UNION ALL
SELECT 
    'Aktif BOM Kayıtları' as kategori,
    COUNT(*) as sayi
FROM urun_agaci
WHERE aktif = true
UNION ALL
SELECT 
    'Pasif BOM Kayıtları' as kategori,
    COUNT(*) as sayi
FROM urun_agaci
WHERE aktif = false OR aktif IS NULL
UNION ALL
SELECT 
    'Nihai Ürünler (Aktif BOM ile)' as kategori,
    COUNT(DISTINCT ana_urun_id) as sayi
FROM urun_agaci
WHERE ana_urun_tipi = 'nihai' AND aktif = true;

