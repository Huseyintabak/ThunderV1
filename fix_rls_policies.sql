-- RLS (Row Level Security) Politikalarını Düzelt
-- Bu dosya Supabase'de RLS politikalarını oluşturur

-- 1. Work Orders tablosu için RLS politikaları
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Work Orders için okuma politikası (herkes okuyabilir)
CREATE POLICY "work_orders_select_policy" ON work_orders
    FOR SELECT USING (true);

-- Work Orders için ekleme politikası (herkes ekleyebilir)
CREATE POLICY "work_orders_insert_policy" ON work_orders
    FOR INSERT WITH CHECK (true);

-- Work Orders için güncelleme politikası (herkes güncelleyebilir)
CREATE POLICY "work_orders_update_policy" ON work_orders
    FOR UPDATE USING (true);

-- Work Orders için silme politikası (herkes silebilir)
CREATE POLICY "work_orders_delete_policy" ON work_orders
    FOR DELETE USING (true);

-- 2. Work Order Status History tablosu için RLS politikaları
ALTER TABLE work_order_status_history ENABLE ROW LEVEL SECURITY;

-- Work Order Status History için okuma politikası
CREATE POLICY "work_order_status_history_select_policy" ON work_order_status_history
    FOR SELECT USING (true);

-- Work Order Status History için ekleme politikası
CREATE POLICY "work_order_status_history_insert_policy" ON work_order_status_history
    FOR INSERT WITH CHECK (true);

-- Work Order Status History için güncelleme politikası
CREATE POLICY "work_order_status_history_update_policy" ON work_order_status_history
    FOR UPDATE USING (true);

-- Work Order Status History için silme politikası
CREATE POLICY "work_order_status_history_delete_policy" ON work_order_status_history
    FOR DELETE USING (true);

-- 3. Workflow Executions tablosu için RLS politikaları
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Workflow Executions için okuma politikası
CREATE POLICY "workflow_executions_select_policy" ON workflow_executions
    FOR SELECT USING (true);

-- Workflow Executions için ekleme politikası
CREATE POLICY "workflow_executions_insert_policy" ON workflow_executions
    FOR INSERT WITH CHECK (true);

-- Workflow Executions için güncelleme politikası
CREATE POLICY "workflow_executions_update_policy" ON workflow_executions
    FOR UPDATE USING (true);

-- Workflow Executions için silme politikası
CREATE POLICY "workflow_executions_delete_policy" ON workflow_executions
    FOR DELETE USING (true);

-- 4. Workflows tablosu için RLS politikaları
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Workflows için okuma politikası
CREATE POLICY "workflows_select_policy" ON workflows
    FOR SELECT USING (true);

-- Workflows için ekleme politikası
CREATE POLICY "workflows_insert_policy" ON workflows
    FOR INSERT WITH CHECK (true);

-- Workflows için güncelleme politikası
CREATE POLICY "workflows_update_policy" ON workflows
    FOR UPDATE USING (true);

-- Workflows için silme politikası
CREATE POLICY "workflows_delete_policy" ON workflows
    FOR DELETE USING (true);

-- 5. Diğer tablolar için de RLS politikalarını kontrol et
-- Hammaddeler tablosu
ALTER TABLE hammaddeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hammaddeler_select_policy" ON hammaddeler FOR SELECT USING (true);
CREATE POLICY "hammaddeler_insert_policy" ON hammaddeler FOR INSERT WITH CHECK (true);
CREATE POLICY "hammaddeler_update_policy" ON hammaddeler FOR UPDATE USING (true);
CREATE POLICY "hammaddeler_delete_policy" ON hammaddeler FOR DELETE USING (true);

-- Yarimamuller tablosu
ALTER TABLE yarimamuller ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yarimamuller_select_policy" ON yarimamuller FOR SELECT USING (true);
CREATE POLICY "yarimamuller_insert_policy" ON yarimamuller FOR INSERT WITH CHECK (true);
CREATE POLICY "yarimamuller_update_policy" ON yarimamuller FOR UPDATE USING (true);
CREATE POLICY "yarimamuller_delete_policy" ON yarimamuller FOR DELETE USING (true);

-- Nihai Urunler tablosu
ALTER TABLE nihai_urunler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nihai_urunler_select_policy" ON nihai_urunler FOR SELECT USING (true);
CREATE POLICY "nihai_urunler_insert_policy" ON nihai_urunler FOR INSERT WITH CHECK (true);
CREATE POLICY "nihai_urunler_update_policy" ON nihai_urunler FOR UPDATE USING (true);
CREATE POLICY "nihai_urunler_delete_policy" ON nihai_urunler FOR DELETE USING (true);

-- Urun Agaci tablosu
ALTER TABLE urun_agaci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "urun_agaci_select_policy" ON urun_agaci FOR SELECT USING (true);
CREATE POLICY "urun_agaci_insert_policy" ON urun_agaci FOR INSERT WITH CHECK (true);
CREATE POLICY "urun_agaci_update_policy" ON urun_agaci FOR UPDATE USING (true);
CREATE POLICY "urun_agaci_delete_policy" ON urun_agaci FOR DELETE USING (true);

-- RLS politikalarının başarıyla oluşturulduğunu kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
