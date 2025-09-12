-- Productions Tablosu RLS Politikalarını Düzeltme
-- ThunderV1 v1.5.0 - Güvenlik Güncellemesi

-- 1. Productions tablosu için RLS'yi etkinleştir
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- 2. Tüm kullanıcılar için okuma izni
CREATE POLICY "productions_select_policy" ON productions
    FOR SELECT
    USING (true);

-- 3. Tüm kullanıcılar için ekleme izni
CREATE POLICY "productions_insert_policy" ON productions
    FOR INSERT
    WITH CHECK (true);

-- 4. Tüm kullanıcılar için güncelleme izni
CREATE POLICY "productions_update_policy" ON productions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 5. Tüm kullanıcılar için silme izni
CREATE POLICY "productions_delete_policy" ON productions
    FOR DELETE
    USING (true);

-- 6. Barcode_scans tablosu için RLS (eğer varsa)
ALTER TABLE barcode_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barcode_scans_select_policy" ON barcode_scans
    FOR SELECT
    USING (true);

CREATE POLICY "barcode_scans_insert_policy" ON barcode_scans
    FOR INSERT
    WITH CHECK (true);

-- 7. Quality_checks tablosu için RLS (eğer varsa)
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quality_checks_select_policy" ON quality_checks
    FOR SELECT
    USING (true);

CREATE POLICY "quality_checks_insert_policy" ON quality_checks
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "quality_checks_update_policy" ON quality_checks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Tamamlandı mesajı
SELECT 'Productions tablosu RLS politikaları başarıyla eklendi!' as rls_status;
