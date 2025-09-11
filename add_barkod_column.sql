-- Yarı mamul tablosuna barkod sütunu ekle
ALTER TABLE yarimamuller 
ADD COLUMN barkod VARCHAR(50) UNIQUE;

-- Nihai ürün tablosuna da barkod sütunu ekle (gelecekte kullanım için)
ALTER TABLE nihai_urunler 
ADD COLUMN barkod VARCHAR(50) UNIQUE;

-- Mevcut BR01 kaydını güncelle (eğer varsa)
UPDATE yarimamuller 
SET barkod = '8690000000012' 
WHERE kod = 'BR01' OR ad LIKE '%BR01%';

-- Barkod sütununa index ekle (performans için)
CREATE INDEX idx_yarimamuller_barkod ON yarimamuller(barkod);
CREATE INDEX idx_nihai_urunler_barkod ON nihai_urunler(barkod);
