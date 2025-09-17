-- Production stages tablosuna eksik sütunları ekle
ALTER TABLE production_stages 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;

ALTER TABLE production_stages 
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;

ALTER TABLE production_stages 
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';

-- Sütunlara yorum ekle
COMMENT ON COLUMN production_stages.estimated_duration IS 'Tahmini süre (dakika)';
COMMENT ON COLUMN production_stages.is_mandatory IS 'Zorunlu aşama mı?';
COMMENT ON COLUMN production_stages.required_skills IS 'Gerekli beceriler listesi';

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_production_stages_estimated_duration ON production_stages(estimated_duration);
CREATE INDEX IF NOT EXISTS idx_production_stages_is_mandatory ON production_stages(is_mandatory);



