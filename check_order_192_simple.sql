-- Order ID 192 - Sadece mevcut kolonları kullan
-- Plan 187'den gelen order_id = 192

-- 1. Order Details tablosunun yapısını kontrol et
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_details'
ORDER BY ordinal_position;

-- 2. Order ID 192'nin tüm detaylarını kontrol et
SELECT * FROM order_details WHERE order_id = 192;

-- 3. Order Management tablosunu da kontrol et
SELECT * FROM order_management WHERE id = 192;

-- 4. Bu product_id'lerin nihai_urunler tablosundaki karşılıklarını bul
SELECT 
    nu.id,
    nu.ad,
    nu.kod,
    nu.barkod,
    nu.aktif
FROM nihai_urunler nu
WHERE nu.id IN (
    SELECT DISTINCT product_id 
    FROM order_details 
    WHERE order_id = 192
);
