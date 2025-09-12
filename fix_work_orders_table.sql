-- work_orders tablosunu düzelt
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. materials kolonunu ekle (JSONB tipinde)
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;

-- 2. ID kolonunu BIGINT yap (integer yerine)
ALTER TABLE work_orders 
ALTER COLUMN id TYPE BIGINT;

-- 3. workflow_executions tablosunda da ID'yi BIGINT yap
ALTER TABLE workflow_executions 
ALTER COLUMN id TYPE BIGINT;

-- 4. work_order_status_history tablosunda da ID'yi BIGINT yap
ALTER TABLE work_order_status_history 
ALTER COLUMN id TYPE BIGINT;

-- 5. workflows tablosunda da ID'yi BIGINT yap
ALTER TABLE workflows 
ALTER COLUMN id TYPE BIGINT;

-- 6. Diğer tablolarda da ID'leri kontrol et
ALTER TABLE hammaddeler 
ALTER COLUMN id TYPE BIGINT;

ALTER TABLE yarimamuller 
ALTER COLUMN id TYPE BIGINT;

ALTER TABLE nihai_urunler 
ALTER COLUMN id TYPE BIGINT;

ALTER TABLE urun_agaci 
ALTER COLUMN id TYPE BIGINT;

-- 7. Kolonları kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'work_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;


