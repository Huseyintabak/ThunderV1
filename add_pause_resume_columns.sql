-- active_productions tablosuna duraklatma ve devam etme alanları ekle
ALTER TABLE active_productions 
ADD COLUMN IF NOT EXISTS pause_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resume_time TIMESTAMP WITH TIME ZONE;

-- Mevcut kayıtları güncelle (eğer status 'paused' ise pause_time'ı set et)
UPDATE active_productions 
SET pause_time = updated_at 
WHERE status = 'paused' AND pause_time IS NULL;

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_active_productions_status ON active_productions(status);
CREATE INDEX IF NOT EXISTS idx_active_productions_pause_time ON active_productions(pause_time);

-- Yorum ekle
COMMENT ON COLUMN active_productions.pause_time IS 'Üretimin duraklatıldığı tarih ve saat';
COMMENT ON COLUMN active_productions.resume_time IS 'Üretime devam edildiği tarih ve saat';
