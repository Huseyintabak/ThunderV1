-- Mevcut tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'hammaddeler', 'yarimamuller', 'nihai_urunler', 'urun_agaci',
    'productions', 'stok_hareketleri',
    'production_stages', 'production_stage_templates',
    'quality_checkpoints', 'quality_checks', 'quality_standards', 'quality_reports',
    'production_plans', 'production_plan_details', 'resource_management',
    'production_scheduling', 'order_management', 'capacity_planning'
)
ORDER BY table_name;
