-- Zamanlama alanlarını production_plans tablosuna ekle
ALTER TABLE production_plans 
ADD COLUMN IF NOT EXISTS working_days INTEGER,
ADD COLUMN IF NOT EXISTS net_work_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS daily_capacity INTEGER,
ADD COLUMN IF NOT EXISTS total_capacity INTEGER,
ADD COLUMN IF NOT EXISTS scheduling_settings JSONB;

-- Yorum ekle
COMMENT ON COLUMN production_plans.working_days IS 'Plan süresindeki çalışma günü sayısı';
COMMENT ON COLUMN production_plans.net_work_hours IS 'Günlük net çalışma saati';
COMMENT ON COLUMN production_plans.daily_capacity IS 'Günlük üretim kapasitesi';
COMMENT ON COLUMN production_plans.total_capacity IS 'Toplam üretim kapasitesi';
COMMENT ON COLUMN production_plans.scheduling_settings IS 'Zamanlama ayarları (JSON format)';

