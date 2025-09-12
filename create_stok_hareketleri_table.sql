-- Stok hareketleri tablosunu oluştur
CREATE TABLE IF NOT EXISTS stok_hareketleri (
    id BIGSERIAL PRIMARY KEY,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    hareket_tipi VARCHAR(20) NOT NULL, -- 'giris', 'cikis', 'uretim', 'transfer'
    miktar DECIMAL(15,4) NOT NULL,
    birim VARCHAR(50) NOT NULL,
    birim_fiyat DECIMAL(15,4) DEFAULT 0,
    toplam_tutar DECIMAL(15,4) DEFAULT 0,
    aciklama TEXT,
    referans_no VARCHAR(100), -- Üretim ID, transfer ID vb.
    operator VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler oluştur
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun_id ON stok_hareketleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun_tipi ON stok_hareketleri(urun_tipi);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_hareket_tipi ON stok_hareketleri(hareket_tipi);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_created_at ON stok_hareketleri(created_at);

-- RLS politikaları
ALTER TABLE stok_hareketleri ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar okuyabilir
CREATE POLICY "stok_hareketleri_select_policy" ON stok_hareketleri
    FOR SELECT USING (true);

-- Tüm kullanıcılar ekleyebilir
CREATE POLICY "stok_hareketleri_insert_policy" ON stok_hareketleri
    FOR INSERT WITH CHECK (true);

-- Tüm kullanıcılar güncelleyebilir
CREATE POLICY "stok_hareketleri_update_policy" ON stok_hareketleri
    FOR UPDATE USING (true);

-- Tüm kullanıcılar silebilir
CREATE POLICY "stok_hareketleri_delete_policy" ON stok_hareketleri
    FOR DELETE USING (true);
