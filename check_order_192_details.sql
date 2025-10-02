-- Order ID 192'nin detaylarını kontrol et
-- Plan 187'den gelen order_id = 192

-- 1. Order ID 192'nin detaylarını kontrol et
SELECT * FROM order_details WHERE order_id = 192;

-- 2. Order Management tablosunu da kontrol et
SELECT * FROM order_management WHERE id = 192;

-- 3. Order ID 192'deki ürün bilgilerini kontrol et
SELECT 
    od.id,
    od.order_id,
    od.product_id,
    od.product_code,
    od.product_name,
    od.quantity,
    od.unit_price
FROM order_details od
WHERE od.order_id = 192;

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

