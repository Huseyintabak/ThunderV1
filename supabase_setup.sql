-- Thunder V1 Üretim Yönetim Sistemi - Supabase Veritabanı Kurulumu
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. HAMMADDE TABLOSU
CREATE TABLE IF NOT EXISTS hammaddeler (
    id BIGSERIAL PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    kod VARCHAR(100) UNIQUE NOT NULL,
    miktar DECIMAL(15,4) NOT NULL DEFAULT 0,
    birim VARCHAR(50) NOT NULL,
    birim_fiyat DECIMAL(15,4) NOT NULL DEFAULT 0,
    aciklama TEXT,
    kategori VARCHAR(100),
    tedarikci VARCHAR(255),
    minimum_stok DECIMAL(15,4) DEFAULT 0,
    maksimum_stok DECIMAL(15,4) DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. YARI MAMUL TABLOSU
CREATE TABLE IF NOT EXISTS yarimamuller (
    id BIGSERIAL PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    kod VARCHAR(100) UNIQUE NOT NULL,
    miktar DECIMAL(15,4) NOT NULL DEFAULT 0,
    birim VARCHAR(50) NOT NULL,
    birim_maliyet DECIMAL(15,4) NOT NULL DEFAULT 0,
    aciklama TEXT,
    kategori VARCHAR(100),
    uretim_suresi INTEGER DEFAULT 0, -- dakika cinsinden
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NİHAİ ÜRÜN TABLOSU
CREATE TABLE IF NOT EXISTS nihai_urunler (
    id BIGSERIAL PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    kod VARCHAR(100) UNIQUE NOT NULL,
    miktar DECIMAL(15,4) NOT NULL DEFAULT 0,
    birim VARCHAR(50) NOT NULL,
    satis_fiyati DECIMAL(15,4) NOT NULL DEFAULT 0,
    bom_maliyet DECIMAL(15,4) DEFAULT 0, -- BOM'dan hesaplanan maliyet
    barkod VARCHAR(100), -- Barkod numarası
    aciklama TEXT,
    kategori VARCHAR(100),
    uretim_suresi INTEGER DEFAULT 0, -- dakika cinsinden
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÜRÜN AĞACI TABLOSU (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS urun_agaci (
    id BIGSERIAL PRIMARY KEY,
    ana_urun_id BIGINT NOT NULL,
    ana_urun_tipi VARCHAR(20) NOT NULL CHECK (ana_urun_tipi IN ('hammadde', 'yarimamul', 'nihai')),
    alt_urun_id BIGINT NOT NULL,
    alt_urun_tipi VARCHAR(20) NOT NULL CHECK (alt_urun_tipi IN ('hammadde', 'yarimamul', 'nihai')),
    gerekli_miktar DECIMAL(15,4) NOT NULL DEFAULT 1,
    birim VARCHAR(50) NOT NULL,
    maliyet_orani DECIMAL(5,4) DEFAULT 1.0000, -- Fire oranı için
    sira_no INTEGER DEFAULT 1,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ana_urun_id, ana_urun_tipi, alt_urun_id, alt_urun_tipi)
);

-- 5. ÜRETİM SÜREÇLERİ TABLOSU
CREATE TABLE IF NOT EXISTS uretim_surecleri (
    id BIGSERIAL PRIMARY KEY,
    ad VARCHAR(255) NOT NULL,
    kod VARCHAR(100) UNIQUE NOT NULL,
    aciklama TEXT,
    sira_no INTEGER DEFAULT 1,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ÜRETİM SÜREÇ DETAYLARI
CREATE TABLE IF NOT EXISTS uretim_surec_detaylari (
    id BIGSERIAL PRIMARY KEY,
    surec_id BIGINT NOT NULL REFERENCES uretim_surecleri(id) ON DELETE CASCADE,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL CHECK (urun_tipi IN ('hammadde', 'yarimamul', 'nihai')),
    gerekli_miktar DECIMAL(15,4) NOT NULL DEFAULT 1,
    birim VARCHAR(50) NOT NULL,
    sira_no INTEGER DEFAULT 1,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. STOK HAREKETLERİ TABLOSU
CREATE TABLE IF NOT EXISTS stok_hareketleri (
    id BIGSERIAL PRIMARY KEY,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL CHECK (urun_tipi IN ('hammadde', 'yarimamul', 'nihai')),
    hareket_tipi VARCHAR(20) NOT NULL CHECK (hareket_tipi IN ('giris', 'cikis', 'uretim', 'tuketim', 'sayim', 'transfer')),
    miktar DECIMAL(15,4) NOT NULL,
    birim VARCHAR(50) NOT NULL,
    birim_fiyat DECIMAL(15,4) DEFAULT 0,
    toplam_tutar DECIMAL(15,4) DEFAULT 0,
    referans_no VARCHAR(100),
    aciklama TEXT,
    tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ÜRETİM TALEPLERİ TABLOSU
CREATE TABLE IF NOT EXISTS uretim_talepleri (
    id BIGSERIAL PRIMARY KEY,
    talep_no VARCHAR(100) UNIQUE NOT NULL,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL CHECK (urun_tipi IN ('yarimamul', 'nihai')),
    talep_miktari DECIMAL(15,4) NOT NULL,
    birim VARCHAR(50) NOT NULL,
    talep_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    teslim_tarihi TIMESTAMP WITH TIME ZONE,
    durum VARCHAR(20) DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'planlandi', 'uretimde', 'tamamlandi', 'iptal')),
    oncelik INTEGER DEFAULT 1,
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ÜRETİM SİPARİŞLERİ TABLOSU
CREATE TABLE IF NOT EXISTS uretim_siparisleri (
    id BIGSERIAL PRIMARY KEY,
    siparis_no VARCHAR(100) UNIQUE NOT NULL,
    talep_id BIGINT REFERENCES uretim_talepleri(id),
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL CHECK (urun_tipi IN ('yarimamul', 'nihai')),
    planlanan_miktar DECIMAL(15,4) NOT NULL,
    uretilen_miktar DECIMAL(15,4) DEFAULT 0,
    birim VARCHAR(50) NOT NULL,
    baslangic_tarihi TIMESTAMP WITH TIME ZONE,
    bitis_tarihi TIMESTAMP WITH TIME ZONE,
    durum VARCHAR(20) DEFAULT 'planlandi' CHECK (durum IN ('planlandi', 'basladi', 'tamamlandi', 'iptal')),
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. MALİYET HESAPLAMA TABLOSU
CREATE TABLE IF NOT EXISTS maliyet_hesaplamalari (
    id BIGSERIAL PRIMARY KEY,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL CHECK (urun_tipi IN ('hammadde', 'yarimamul', 'nihai')),
    hesaplama_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hammadde_maliyeti DECIMAL(15,4) DEFAULT 0,
    iscilik_maliyeti DECIMAL(15,4) DEFAULT 0,
    genel_uretim_maliyeti DECIMAL(15,4) DEFAULT 0,
    toplam_maliyet DECIMAL(15,4) DEFAULT 0,
    birim_maliyet DECIMAL(15,4) DEFAULT 0,
    kar_marji DECIMAL(5,4) DEFAULT 0,
    satis_fiyati DECIMAL(15,4) DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_hammaddeler_kod ON hammaddeler(kod);
CREATE INDEX IF NOT EXISTS idx_hammaddeler_aktif ON hammaddeler(aktif);
CREATE INDEX IF NOT EXISTS idx_yarimamuller_kod ON yarimamuller(kod);
CREATE INDEX IF NOT EXISTS idx_yarimamuller_aktif ON yarimamuller(aktif);
CREATE INDEX IF NOT EXISTS idx_nihai_urunler_kod ON nihai_urunler(kod);
CREATE INDEX IF NOT EXISTS idx_nihai_urunler_aktif ON nihai_urunler(aktif);
CREATE INDEX IF NOT EXISTS idx_urun_agaci_ana_urun ON urun_agaci(ana_urun_id, ana_urun_tipi);
CREATE INDEX IF NOT EXISTS idx_urun_agaci_alt_urun ON urun_agaci(alt_urun_id, alt_urun_tipi);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun ON stok_hareketleri(urun_id, urun_tipi);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_tarih ON stok_hareketleri(tarih);
CREATE INDEX IF NOT EXISTS idx_uretim_talepleri_durum ON uretim_talepleri(durum);
CREATE INDEX IF NOT EXISTS idx_uretim_siparisleri_durum ON uretim_siparisleri(durum);

-- TRIGGER FONKSİYONLARI
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER'LAR
CREATE TRIGGER update_hammaddeler_updated_at BEFORE UPDATE ON hammaddeler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yarimamuller_updated_at BEFORE UPDATE ON yarimamuller FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nihai_urunler_updated_at BEFORE UPDATE ON nihai_urunler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_urun_agaci_updated_at BEFORE UPDATE ON urun_agaci FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uretim_surecleri_updated_at BEFORE UPDATE ON uretim_surecleri FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uretim_surec_detaylari_updated_at BEFORE UPDATE ON uretim_surec_detaylari FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uretim_talepleri_updated_at BEFORE UPDATE ON uretim_talepleri FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uretim_siparisleri_updated_at BEFORE UPDATE ON uretim_siparisleri FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ÖRNEK VERİLER
INSERT INTO hammaddeler (ad, kod, miktar, birim, birim_fiyat, kategori, tedarikci, minimum_stok, maksimum_stok) VALUES
('Çelik Levha', 'CL001', 1000, 'kg', 25.50, 'Metal', 'Metal A.Ş.', 100, 2000),
('Alüminyum Profil', 'AP001', 500, 'metre', 15.75, 'Metal', 'Alüminyum Ltd.', 50, 1000),
('Plastik Granül', 'PG001', 2000, 'kg', 8.25, 'Plastik', 'Plastik San.', 200, 5000),
('Vida M6x20', 'VM001', 10000, 'adet', 0.15, 'Bağlantı', 'Vida A.Ş.', 1000, 50000),
('Conta Kauçuk', 'CK001', 500, 'adet', 2.50, 'Seal', 'Kauçuk Ltd.', 100, 2000);

INSERT INTO yarimamuller (ad, kod, miktar, birim, birim_maliyet, kategori, uretim_suresi) VALUES
('Çelik Kasa', 'CK001', 0, 'adet', 150.00, 'Metal İşleme', 120),
('Alüminyum Çerçeve', 'AC001', 0, 'adet', 75.50, 'Metal İşleme', 90),
('Plastik Kapak', 'PK001', 0, 'adet', 25.75, 'Plastik İşleme', 60);

INSERT INTO nihai_urunler (ad, kod, miktar, birim, satis_fiyati, kategori, uretim_suresi) VALUES
('Elektronik Kutu', 'EK001', 0, 'adet', 450.00, 'Elektronik', 180),
('Endüstriyel Panel', 'EP001', 0, 'adet', 750.00, 'Endüstriyel', 240);

-- ÜRÜN AĞACI ÖRNEKLERİ
INSERT INTO urun_agaci (ana_urun_id, ana_urun_tipi, alt_urun_id, alt_urun_tipi, gerekli_miktar, birim) VALUES
-- Elektronik Kutu için
(1, 'nihai', 1, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Çelik Kasa
(1, 'nihai', 2, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Alüminyum Çerçeve
(1, 'nihai', 3, 'yarimamul', 1, 'adet'), -- Elektronik Kutu -> Plastik Kapak
(1, 'nihai', 4, 'hammadde', 20, 'adet'), -- Elektronik Kutu -> Vida M6x20
(1, 'nihai', 5, 'hammadde', 4, 'adet'),  -- Elektronik Kutu -> Conta Kauçuk

-- Çelik Kasa için
(1, 'yarimamul', 1, 'hammadde', 5, 'kg'), -- Çelik Kasa -> Çelik Levha
(1, 'yarimamul', 4, 'hammadde', 10, 'adet'), -- Çelik Kasa -> Vida M6x20

-- Alüminyum Çerçeve için
(2, 'yarimamul', 2, 'hammadde', 2, 'metre'), -- Alüminyum Çerçeve -> Alüminyum Profil

-- Plastik Kapak için
(3, 'yarimamul', 3, 'hammadde', 0.5, 'kg'); -- Plastik Kapak -> Plastik Granül

-- ÜRETİM SÜREÇLERİ
INSERT INTO uretim_surecleri (ad, kod, aciklama, sira_no) VALUES
('Kesim İşlemi', 'KES001', 'Metal ve plastik malzemelerin kesilmesi', 1),
('Şekillendirme', 'SEK001', 'Malzemelerin istenen şekle getirilmesi', 2),
('Delme İşlemi', 'DEL001', 'Gerekli deliklerin açılması', 3),
('Montaj', 'MON001', 'Parçaların birleştirilmesi', 4),
('Kalite Kontrol', 'KAL001', 'Ürün kalitesinin kontrol edilmesi', 5),
('Paketleme', 'PAK001', 'Ürünlerin paketlenmesi', 6);

-- RLS (Row Level Security) POLİTİKALARI
ALTER TABLE hammaddeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarimamuller ENABLE ROW LEVEL SECURITY;
ALTER TABLE nihai_urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE urun_agaci ENABLE ROW LEVEL SECURITY;
ALTER TABLE uretim_surecleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE uretim_surec_detaylari ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE uretim_talepleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE uretim_siparisleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE maliyet_hesaplamalari ENABLE ROW LEVEL SECURITY;

-- Genel okuma/yazma politikaları (geliştirme için)
CREATE POLICY "Enable all operations for all users" ON hammaddeler FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON yarimamuller FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON nihai_urunler FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON urun_agaci FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON uretim_surecleri FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON uretim_surec_detaylari FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON stok_hareketleri FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON uretim_talepleri FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON uretim_siparisleri FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON maliyet_hesaplamalari FOR ALL USING (true);

-- BAŞARILI MESAJI
SELECT 'Thunder V1 veritabanı başarıyla oluşturuldu!' as mesaj;
