-- work_orders tablosuna total_cost kolonu ekle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0.00;

-- Kolonun eklendiğini kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_orders' 
AND table_schema = 'public'
AND column_name = 'total_cost';

