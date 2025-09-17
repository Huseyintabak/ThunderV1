-- Production plans tablosuna order_id sütunu ekle
ALTER TABLE production_plans 
ADD COLUMN IF NOT EXISTS order_id BIGINT REFERENCES order_management(id);

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_production_plans_order_id ON production_plans(order_id);

-- Mevcut planlara varsayılan order_id değeri ata (opsiyonel)
-- UPDATE production_plans SET order_id = 1 WHERE order_id IS NULL;
