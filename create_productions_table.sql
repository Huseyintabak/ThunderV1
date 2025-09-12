-- Productions Tablosu Oluşturma
-- ThunderV1 v1.5.0 - Üretim Yönetimi

-- Productions tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS productions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_type VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    quantity INTEGER NOT NULL,
    target_quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'paused'
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status);
CREATE INDEX IF NOT EXISTS idx_productions_product_id ON productions(product_id);
CREATE INDEX IF NOT EXISTS idx_productions_start_time ON productions(start_time);

-- RLS'yi etkinleştir
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları
CREATE POLICY "productions_select_policy" ON productions
    FOR SELECT
    USING (true);

CREATE POLICY "productions_insert_policy" ON productions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "productions_update_policy" ON productions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "productions_delete_policy" ON productions
    FOR DELETE
    USING (true);

-- Tamamlandı mesajı
SELECT 'Productions tablosu başarıyla oluşturuldu ve RLS politikaları eklendi!' as table_status;
