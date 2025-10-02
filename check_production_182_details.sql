-- Production ID 182'nin product_details kolonunu kontrol et
-- Bu kolonda yanlış Product ID (182) var mı?

-- 1. Productions tablosunun yapısını kontrol et
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'productions'
ORDER BY ordinal_position;

-- 2. Production ID 182'nin tüm bilgilerini kontrol et
SELECT * FROM productions WHERE id = 182;

-- 3. Production ID 187'nin (aktif) tüm bilgilerini kontrol et
SELECT * FROM productions WHERE id = 187;

-- 4. Plan ID 187'nin bilgilerini kontrol et
SELECT * FROM production_plans WHERE id = 187;

-- 5. Order ID 192'nin product_details'ini kontrol et (DOĞRU VERİ)
SELECT 
    id,
    order_number,
    product_details
FROM order_management 
WHERE id = 192;

