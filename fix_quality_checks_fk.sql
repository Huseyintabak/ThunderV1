-- Quality checks tablosunun foreign key constraint'ini düzelt
-- production_id'nin active_productions tablosuna referans vermesi için

-- Önce mevcut constraint'i kaldır
ALTER TABLE quality_checks DROP CONSTRAINT IF EXISTS quality_checks_production_id_fkey;

-- Yeni constraint'i ekle (active_productions tablosuna referans)
ALTER TABLE quality_checks 
ADD CONSTRAINT quality_checks_production_id_fkey 
FOREIGN KEY (production_id) REFERENCES active_productions(id) ON DELETE CASCADE;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON quality_checks(production_id);
