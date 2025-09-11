-- Nihai Ürünler Tablosuna BOM Maliyet ve Barkod Sütunları Ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- BOM maliyet sütununu ekle
ALTER TABLE nihai_urunler 
ADD COLUMN IF NOT EXISTS bom_maliyet DECIMAL(15,4) DEFAULT 0;

-- Barkod sütununu ekle
ALTER TABLE nihai_urunler 
ADD COLUMN IF NOT EXISTS barkod VARCHAR(100);

-- Sütunlara açıklama ekle
COMMENT ON COLUMN nihai_urunler.bom_maliyet IS 'BOM''dan hesaplanan maliyet';
COMMENT ON COLUMN nihai_urunler.barkod IS 'Barkod numarası';

-- Mevcut veriler için varsayılan değerleri güncelle
UPDATE nihai_urunler 
SET bom_maliyet = 0 
WHERE bom_maliyet IS NULL;

-- Sütunları NOT NULL yap (varsayılan değerlerle)
ALTER TABLE nihai_urunler 
ALTER COLUMN bom_maliyet SET NOT NULL;

-- Barkod için unique constraint ekle (opsiyonel)
-- ALTER TABLE nihai_urunler 
-- ADD CONSTRAINT nihai_urunler_barkod_unique UNIQUE (barkod);

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_nihai_urunler_barkod ON nihai_urunler(barkod);
CREATE INDEX IF NOT EXISTS idx_nihai_urunler_bom_maliyet ON nihai_urunler(bom_maliyet);
