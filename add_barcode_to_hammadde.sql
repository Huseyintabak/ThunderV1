-- Hammadde tablosuna barkod sütunu ekle
ALTER TABLE hammaddeler ADD COLUMN IF NOT EXISTS barkod VARCHAR(50) UNIQUE;

-- Barkod için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_hammaddeler_barkod ON hammaddeler(barkod);

-- Mevcut kayıtlara örnek barkod değerleri ekle (isteğe bağlı)
-- UPDATE hammaddeler SET barkod = 'HMD' || LPAD(id::text, 6, '0') WHERE barkod IS NULL;
