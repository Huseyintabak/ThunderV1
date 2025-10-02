-- Productions tablosu kolonlarını kontrol et
-- Hangi kolonlar var, hangileri yok?

-- 1. Productions tablosunun yapısını kontrol et
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'productions'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı göster (tüm kolonlarla)
SELECT * FROM productions LIMIT 5;

-- 3. Production ID 182'nin bilgilerini kontrol et
SELECT 
    id,
    product_id,
    product_name,
    product_code,
    quantity,
    status,
    created_at
FROM productions 
WHERE id = 182;

-- 4. Plan ID 187'nin bilgilerini kontrol et
SELECT 
    id,
    order_id,
    product_id,
    product_name,
    product_code,
    quantity,
    status
FROM production_plans 
WHERE id = 187;

