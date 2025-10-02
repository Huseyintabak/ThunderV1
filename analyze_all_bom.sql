-- TÜM BOM VERİLERİNİ ANALİZ ET
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. GENEL BOM İSTATİSTİKLERİ
SELECT 'GENEL BOM İSTATİSTİKLERİ' as info;
SELECT 
    ana_urun_tipi,
    COUNT(*) as toplam_kayit,
    COUNT(DISTINCT ana_urun_id) as farkli_urun_sayisi,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif_kayit,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif_kayit
FROM urun_agaci
GROUP BY ana_urun_tipi
ORDER BY ana_urun_tipi;

-- 2. NİHAİ ÜRÜNLER İÇİN BOM DURUMU
SELECT 'NİHAİ ÜRÜNLER İÇİN BOM DURUMU' as info;
SELECT 
    n.id as nihai_urun_id,
    n.ad as nihai_urun_adi,
    n.kod as nihai_urun_kodu,
    COUNT(ua.id) as bom_kayit_sayisi,
    SUM(CASE WHEN ua.aktif = true THEN 1 ELSE 0 END) as aktif_bom,
    SUM(CASE WHEN ua.aktif = false THEN 1 ELSE 0 END) as pasif_bom
FROM nihai_urunler n
LEFT JOIN urun_agaci ua ON ua.ana_urun_id = n.id AND ua.ana_urun_tipi = 'nihai'
WHERE n.id IN (177, 178, 179, 1090, 1171, 1240, 1241)  -- Test edilen ürünler
GROUP BY n.id, n.ad, n.kod
ORDER BY n.id;

-- 3. PRODUCT ID 177 İÇİN DETAYLI BOM ANALİZİ
SELECT 'PRODUCT ID 177 İÇİN DETAYLI BOM' as info;
SELECT 
    ua.id as bom_id,
    ua.ana_urun_id,
    ua.ana_urun_tipi,
    ua.alt_urun_id,
    ua.alt_urun_tipi,
    ua.gerekli_miktar,
    ua.birim,
    ua.aktif,
    ua.created_at,
    CASE 
        WHEN ua.alt_urun_tipi = 'hammadde' THEN h.ad
        WHEN ua.alt_urun_tipi = 'yarimamul' THEN ym.ad
        ELSE 'Bilinmeyen'
    END as malzeme_adi
FROM urun_agaci ua
LEFT JOIN hammaddeler h ON ua.alt_urun_id = h.id AND ua.alt_urun_tipi = 'hammadde'
LEFT JOIN yarimamuller ym ON ua.alt_urun_id = ym.id AND ua.alt_urun_tipi = 'yarimamul'
WHERE ua.ana_urun_id = 177 AND ua.ana_urun_tipi = 'nihai'
ORDER BY ua.alt_urun_tipi, ua.alt_urun_id;

-- 4. TÜM NİHAİ ÜRÜNLER İÇİN AKTİF BOM KAYITLARI
SELECT 'TÜM AKTİF BOM KAYITLARI (NİHAİ ÜRÜNLER)' as info;
SELECT 
    ua.ana_urun_id,
    n.ad as nihai_urun_adi,
    n.kod as nihai_urun_kodu,
    COUNT(*) as aktif_malzeme_sayisi,
    STRING_AGG(
        CONCAT(ua.alt_urun_tipi, ':', ua.alt_urun_id, '(', ua.gerekli_miktar, ')'), 
        ', '
    ) as malzeme_listesi
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai' AND ua.aktif = true
GROUP BY ua.ana_urun_id, n.ad, n.kod
ORDER BY ua.ana_urun_id
LIMIT 20;

-- 5. PASİF BOM KAYITLARINI BUL
SELECT 'PASİF BOM KAYITLARI (NİHAİ ÜRÜNLER)' as info;
SELECT 
    ua.ana_urun_id,
    n.ad as nihai_urun_adi,
    COUNT(*) as pasif_malzeme_sayisi
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai' AND ua.aktif = false
GROUP BY ua.ana_urun_id, n.ad
ORDER BY pasif_malzeme_sayisi DESC
LIMIT 20;

-- 6. EKSIK BOM TANIMLI NİHAİ ÜRÜNLER
SELECT 'EKSIK BOM TANIMLI NİHAİ ÜRÜNLER' as info;
SELECT 
    n.id,
    n.ad,
    n.kod,
    n.aktif as urun_aktif
FROM nihai_urunler n
LEFT JOIN urun_agaci ua ON ua.ana_urun_id = n.id AND ua.ana_urun_tipi = 'nihai' AND ua.aktif = true
WHERE n.aktif = true
GROUP BY n.id, n.ad, n.kod, n.aktif
HAVING COUNT(ua.id) = 0
ORDER BY n.id
LIMIT 20;

-- 7. SON EKLENEN BOM KAYITLARI
SELECT 'SON EKLENEN BOM KAYITLARI' as info;
SELECT 
    ua.id,
    ua.ana_urun_id,
    ua.ana_urun_tipi,
    ua.alt_urun_id,
    ua.alt_urun_tipi,
    ua.gerekli_miktar,
    ua.aktif,
    ua.created_at,
    n.ad as nihai_urun_adi
FROM urun_agaci ua
JOIN nihai_urunler n ON ua.ana_urun_id = n.id
WHERE ua.ana_urun_tipi = 'nihai'
ORDER BY ua.created_at DESC
LIMIT 30;


