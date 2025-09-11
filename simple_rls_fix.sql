-- Basit RLS Politikaları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Work Orders tablosu
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders_all_access" ON work_orders FOR ALL USING (true);

-- 2. Work Order Status History tablosu  
ALTER TABLE work_order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_order_status_history_all_access" ON work_order_status_history FOR ALL USING (true);

-- 3. Workflow Executions tablosu
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_executions_all_access" ON workflow_executions FOR ALL USING (true);

-- 4. Workflows tablosu
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_all_access" ON workflows FOR ALL USING (true);

-- 5. Diğer tablolar
ALTER TABLE hammaddeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hammaddeler_all_access" ON hammaddeler FOR ALL USING (true);

ALTER TABLE yarimamuller ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yarimamuller_all_access" ON yarimamuller FOR ALL USING (true);

ALTER TABLE nihai_urunler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nihai_urunler_all_access" ON nihai_urunler FOR ALL USING (true);

ALTER TABLE urun_agaci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "urun_agaci_all_access" ON urun_agaci FOR ALL USING (true);

