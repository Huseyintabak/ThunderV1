-- Mevcut RLS Politikalarını Temizleme Scripti
-- Bu script mevcut politikaları siler ve yeniden oluşturur

-- Production Stages tablosu politikalarını sil
DROP POLICY IF EXISTS "production_stages_select_policy" ON production_stages;
DROP POLICY IF EXISTS "production_stages_insert_policy" ON production_stages;
DROP POLICY IF EXISTS "production_stages_update_policy" ON production_stages;
DROP POLICY IF EXISTS "production_stages_delete_policy" ON production_stages;

-- Production Stage Templates tablosu politikalarını sil
DROP POLICY IF EXISTS "production_stage_templates_select_policy" ON production_stage_templates;
DROP POLICY IF EXISTS "production_stage_templates_insert_policy" ON production_stage_templates;
DROP POLICY IF EXISTS "production_stage_templates_update_policy" ON production_stage_templates;
DROP POLICY IF EXISTS "production_stage_templates_delete_policy" ON production_stage_templates;

-- Quality Checkpoints tablosu politikalarını sil
DROP POLICY IF EXISTS "quality_checkpoints_select_policy" ON quality_checkpoints;
DROP POLICY IF EXISTS "quality_checkpoints_insert_policy" ON quality_checkpoints;
DROP POLICY IF EXISTS "quality_checkpoints_update_policy" ON quality_checkpoints;
DROP POLICY IF EXISTS "quality_checkpoints_delete_policy" ON quality_checkpoints;

-- Quality Checks tablosu politikalarını sil
DROP POLICY IF EXISTS "quality_checks_select_policy" ON quality_checks;
DROP POLICY IF EXISTS "quality_checks_insert_policy" ON quality_checks;
DROP POLICY IF EXISTS "quality_checks_update_policy" ON quality_checks;
DROP POLICY IF EXISTS "quality_checks_delete_policy" ON quality_checks;

-- Quality Standards tablosu politikalarını sil
DROP POLICY IF EXISTS "quality_standards_select_policy" ON quality_standards;
DROP POLICY IF EXISTS "quality_standards_insert_policy" ON quality_standards;
DROP POLICY IF EXISTS "quality_standards_update_policy" ON quality_standards;
DROP POLICY IF EXISTS "quality_standards_delete_policy" ON quality_standards;

-- Quality Reports tablosu politikalarını sil
DROP POLICY IF EXISTS "quality_reports_select_policy" ON quality_reports;
DROP POLICY IF EXISTS "quality_reports_insert_policy" ON quality_reports;
DROP POLICY IF EXISTS "quality_reports_update_policy" ON quality_reports;
DROP POLICY IF EXISTS "quality_reports_delete_policy" ON quality_reports;

-- Production Plans tablosu politikalarını sil
DROP POLICY IF EXISTS "production_plans_select_policy" ON production_plans;
DROP POLICY IF EXISTS "production_plans_insert_policy" ON production_plans;
DROP POLICY IF EXISTS "production_plans_update_policy" ON production_plans;
DROP POLICY IF EXISTS "production_plans_delete_policy" ON production_plans;

-- Production Plan Details tablosu politikalarını sil
DROP POLICY IF EXISTS "production_plan_details_select_policy" ON production_plan_details;
DROP POLICY IF EXISTS "production_plan_details_insert_policy" ON production_plan_details;
DROP POLICY IF EXISTS "production_plan_details_update_policy" ON production_plan_details;
DROP POLICY IF EXISTS "production_plan_details_delete_policy" ON production_plan_details;

-- Resource Management tablosu politikalarını sil
DROP POLICY IF EXISTS "resource_management_select_policy" ON resource_management;
DROP POLICY IF EXISTS "resource_management_insert_policy" ON resource_management;
DROP POLICY IF EXISTS "resource_management_update_policy" ON resource_management;
DROP POLICY IF EXISTS "resource_management_delete_policy" ON resource_management;

-- Production Scheduling tablosu politikalarını sil
DROP POLICY IF EXISTS "production_scheduling_select_policy" ON production_scheduling;
DROP POLICY IF EXISTS "production_scheduling_insert_policy" ON production_scheduling;
DROP POLICY IF EXISTS "production_scheduling_update_policy" ON production_scheduling;
DROP POLICY IF EXISTS "production_scheduling_delete_policy" ON production_scheduling;

-- Order Management tablosu politikalarını sil
DROP POLICY IF EXISTS "order_management_select_policy" ON order_management;
DROP POLICY IF EXISTS "order_management_insert_policy" ON order_management;
DROP POLICY IF EXISTS "order_management_update_policy" ON order_management;
DROP POLICY IF EXISTS "order_management_delete_policy" ON order_management;

-- Capacity Planning tablosu politikalarını sil
DROP POLICY IF EXISTS "capacity_planning_select_policy" ON capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_insert_policy" ON capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_update_policy" ON capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_delete_policy" ON capacity_planning;

-- Stok Hareketleri tablosu politikalarını sil
DROP POLICY IF EXISTS "stok_hareketleri_select_policy" ON stok_hareketleri;
DROP POLICY IF EXISTS "stok_hareketleri_insert_policy" ON stok_hareketleri;
DROP POLICY IF EXISTS "stok_hareketleri_update_policy" ON stok_hareketleri;
DROP POLICY IF EXISTS "stok_hareketleri_delete_policy" ON stok_hareketleri;

-- Tamamlandı mesajı
SELECT 'Mevcut RLS politikaları başarıyla temizlendi!' as cleanup_status;
