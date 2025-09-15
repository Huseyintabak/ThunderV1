-- Eksik sütunları ekle
-- Production Plans tablosuna eksik sütunları ekle
ALTER TABLE production_plans 
ADD COLUMN IF NOT EXISTS assigned_operator VARCHAR(100),
ADD COLUMN IF NOT EXISTS operator_notes TEXT;

-- Resource Management tablosuna eksik sütunları ekle
ALTER TABLE resource_management 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50);

-- Mevcut operatörlere department ve skill_level ekle
UPDATE resource_management 
SET department = 'Üretim', 
    skill_level = 'Uzman'
WHERE resource_type = 'operator' 
AND (department IS NULL OR skill_level IS NULL);
