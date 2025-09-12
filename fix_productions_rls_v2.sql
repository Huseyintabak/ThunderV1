-- Productions Tablosu RLS Politikalarını Düzeltme - V2
-- ThunderV1 v1.5.0 - Güvenlik Güncellemesi
-- Mevcut politikaları kontrol et ve güncelle

-- 1. Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "productions_select_policy" ON productions;
DROP POLICY IF EXISTS "productions_insert_policy" ON productions;
DROP POLICY IF EXISTS "productions_update_policy" ON productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON productions;

-- 2. Productions tablosu için RLS'yi etkinleştir
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- 3. Yeni politikaları oluştur
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

-- 4. Barcode_scans tablosu için RLS (eğer varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barcode_scans') THEN
        ALTER TABLE barcode_scans ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "barcode_scans_select_policy" ON barcode_scans;
        DROP POLICY IF EXISTS "barcode_scans_insert_policy" ON barcode_scans;
        
        CREATE POLICY "barcode_scans_select_policy" ON barcode_scans
            FOR SELECT
            USING (true);

        CREATE POLICY "barcode_scans_insert_policy" ON barcode_scans
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 5. Quality_checks tablosu için RLS (eğer varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_checks') THEN
        ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "quality_checks_select_policy" ON quality_checks;
        DROP POLICY IF EXISTS "quality_checks_insert_policy" ON quality_checks;
        DROP POLICY IF EXISTS "quality_checks_update_policy" ON quality_checks;
        
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
    END IF;
END $$;

-- 6. Mevcut politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('productions', 'barcode_scans', 'quality_checks')
ORDER BY tablename, policyname;

-- Tamamlandı mesajı
SELECT 'Productions tablosu RLS politikaları başarıyla güncellendi!' as rls_status;
