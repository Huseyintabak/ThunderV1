-- Production Stages Foreign Key Constraint Düzeltme
-- production_stages tablosunun production_id sütunu active_productions tablosuna referans vermeli

-- Önce mevcut foreign key constraint'i kaldır
ALTER TABLE production_stages 
DROP CONSTRAINT IF EXISTS production_stages_production_id_fkey;

-- Yeni foreign key constraint ekle (active_productions tablosuna)
ALTER TABLE production_stages 
ADD CONSTRAINT production_stages_production_id_fkey 
FOREIGN KEY (production_id) REFERENCES active_productions(id) ON DELETE CASCADE;

-- Index oluştur
CREATE INDEX IF NOT EXISTS idx_production_stages_production_id ON production_stages(production_id);
