-- Product Details mapping kontrolü
-- Frontend'de Product ID 182 alınıyor ama doğrusu 1241 olmalı

-- 1. Production ID 182'nin product_details'ini kontrol et
SELECT 
    p.id as production_id,
    p.product_id,
    p.plan_id,
    p.product_details
FROM productions p
WHERE p.id = 182;

-- 2. Plan ID 187'nin order_details'ini kontrol et
SELECT 
    od.id,
    od.order_id,
    od.product_id,
    od.product_code,
    od.product_name,
    od.quantity
FROM order_details od
WHERE od.order_id = 192;  -- Plan 187'den gelen order_id

-- 3. TRX-2-GRAY-98-98 ürününün doğru ID'sini kontrol et
SELECT 
    id,
    ad,
    kod,
    barkod
FROM nihai_urunler 
WHERE kod = 'TRX-2-GRAY-98-98' 
   OR barkod = '8690000009855';

-- 4. Production ID 182'nin plan_id'sini kontrol et
SELECT 
    pp.id as plan_id,
    pp.order_id,
    pp.product_id,
    pp.product_name
FROM production_plans pp
WHERE pp.id = 187;

