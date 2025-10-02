-- Product ID 182 için BOM kontrolü
-- TRX-2-GRAY-98-98 ürünü için doğru Product ID'yi bulalım

-- 1. Product ID 182'nin bilgilerini kontrol et
SELECT 
    id,
    ad,
    kod,
    barkod,
    aktif
FROM nihai_urunler 
WHERE id = 182;

-- 2. Product ID 182 için BOM kayıtları var mı?
SELECT 
    COUNT(*) as bom_count
FROM urun_agaci 
WHERE ana_urun_id = 182 
  AND ana_urun_tipi = 'nihai';

-- 3. TRX-2-GRAY-98-98 ürününün doğru ID'sini bul
SELECT 
    id,
    ad,
    kod,
    barkod,
    aktif
FROM nihai_urunler 
WHERE kod = 'TRX-2-GRAY-98-98' 
   OR barkod = '8690000009855';

-- 4. Product ID 1241'in bilgilerini kontrol et
SELECT 
    id,
    ad,
    kod,
    barkod,
    aktif
FROM nihai_urunler 
WHERE id = 1241;

