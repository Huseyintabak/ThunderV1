-- active_productions tablosuna tamamlanma tarihi alanı ekle
ALTER TABLE active_productions 
ADD COLUMN IF NOT EXISTS completed_time TIMESTAMP WITH TIME ZONE;

-- Mevcut kayıtları güncelle (eğer status 'completed' ise completed_time'ı set et)
UPDATE active_productions 
SET completed_time = updated_at 
WHERE status = 'completed' AND completed_time IS NULL;

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_active_productions_completed_time ON active_productions(completed_time);

-- Yorum ekle
COMMENT ON COLUMN active_productions.completed_time IS 'Üretimin tamamlandığı tarih ve saat';
