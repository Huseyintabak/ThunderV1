-- Hammadde tablosuna barkod sütunu ekle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Barkod sütununu ekle
ALTER TABLE hammaddeler ADD COLUMN barkod VARCHAR(50);

-- 2. Unique constraint ekle
ALTER TABLE hammaddeler ADD CONSTRAINT hammaddeler_barkod_key UNIQUE (barkod);

-- 3. Index oluştur (performans için)
CREATE INDEX idx_hammaddeler_barkod ON hammaddeler(barkod);

-- 4. Mevcut kayıtlara örnek barkod değerleri ekle (isteğe bağlı)
-- UPDATE hammaddeler SET barkod = 'HMD' || LPAD(id::text, 6, '0') WHERE barkod IS NULL;

-- 5. Kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hammaddeler' 
ORDER BY ordinal_position;
