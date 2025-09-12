-- Mevcut RLS Politikalarını Kontrol Et
-- ThunderV1 v1.5.0 - Veritabanı Analizi

-- 1. Tüm tabloların RLS durumunu kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('productions', 'barcode_scans', 'quality_checks', 'stok_hareketleri')
ORDER BY tablename;

-- 2. Mevcut politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('productions', 'barcode_scans', 'quality_checks', 'stok_hareketleri')
ORDER BY tablename, policyname;

-- 3. Tablo yapılarını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('productions', 'barcode_scans', 'quality_checks', 'stok_hareketleri')
ORDER BY table_name, ordinal_position;
