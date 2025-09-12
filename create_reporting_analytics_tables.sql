-- Faz 6: Raporlama ve Analitik Tabloları
-- V1.6.0 - Raporlama ve Analitik Sistemi

-- Dashboard widget'ları tablosu
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id BIGSERIAL PRIMARY KEY,
    widget_name VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL, -- 'chart', 'table', 'metric', 'gauge', 'progress'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 4,
    height INTEGER DEFAULT 3,
    data_source VARCHAR(100), -- API endpoint veya SQL query
    config JSONB, -- Widget konfigürasyonu
    refresh_interval INTEGER DEFAULT 300, -- saniye
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rapor şablonları tablosu
CREATE TABLE IF NOT EXISTS report_templates (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'production', 'quality', 'inventory', 'financial', 'custom'
    description TEXT,
    sql_query TEXT NOT NULL,
    parameters JSONB, -- Rapor parametreleri
    output_format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'excel', 'csv', 'html'
    schedule_cron VARCHAR(100), -- Otomatik rapor zamanlaması
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rapor geçmişi tablosu
CREATE TABLE IF NOT EXISTS report_history (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES report_templates(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    parameters_used JSONB,
    generated_by VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'generating', 'completed', 'failed'
    error_message TEXT,
    download_count INTEGER DEFAULT 0
);

-- KPI tanımları tablosu
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id BIGSERIAL PRIMARY KEY,
    kpi_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'production', 'quality', 'efficiency', 'financial'
    description TEXT,
    calculation_method TEXT NOT NULL, -- SQL query veya formül
    target_value DECIMAL(15,4),
    unit VARCHAR(20),
    frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI değerleri tablosu
CREATE TABLE IF NOT EXISTS kpi_values (
    id BIGSERIAL PRIMARY KEY,
    kpi_id BIGINT REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    variance DECIMAL(15,4), -- Fark
    variance_percentage DECIMAL(5,2), -- Yüzde fark
    status VARCHAR(20) DEFAULT 'normal', -- 'excellent', 'good', 'normal', 'warning', 'critical'
    notes TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analitik olayları tablosu
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'user_action', 'system_event', 'error', 'performance'
    event_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    entity_type VARCHAR(50), -- 'production', 'order', 'quality', 'inventory'
    entity_id BIGINT,
    properties JSONB, -- Ek özellikler
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Performans metrikleri tablosu
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'response_time', 'throughput', 'error_rate', 'availability'
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20),
    context JSONB, -- Ek bağlam bilgileri
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Veri kalitesi kontrolleri tablosu
CREATE TABLE IF NOT EXISTS data_quality_checks (
    id BIGSERIAL PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'completeness', 'accuracy', 'consistency', 'validity'
    sql_query TEXT NOT NULL,
    expected_result VARCHAR(100),
    actual_result VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'warning'
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_by VARCHAR(100)
);

-- Rapor abonelikleri tablosu
CREATE TABLE IF NOT EXISTS report_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES report_templates(id) ON DELETE CASCADE,
    subscriber_email VARCHAR(200) NOT NULL,
    subscriber_name VARCHAR(100),
    frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    parameters JSONB, -- Abonelik parametreleri
    is_active BOOLEAN DEFAULT true,
    last_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_history_template ON report_history(template_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated ON report_history(generated_at);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON kpi_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_id ON kpi_values(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_period ON kpi_values(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_measured ON performance_metrics(measured_at);
CREATE INDEX IF NOT EXISTS idx_data_quality_checks_table ON data_quality_checks(table_name);
CREATE INDEX IF NOT EXISTS idx_data_quality_checks_status ON data_quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_template ON report_subscriptions(template_id);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_active ON report_subscriptions(is_active);

-- RLS (Row Level Security) politikaları
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Dashboard widgets RLS
DROP POLICY IF EXISTS "dashboard_widgets_select_policy" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_select_policy" ON dashboard_widgets FOR SELECT USING (true);
DROP POLICY IF EXISTS "dashboard_widgets_insert_policy" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_insert_policy" ON dashboard_widgets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "dashboard_widgets_update_policy" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_update_policy" ON dashboard_widgets FOR UPDATE USING (true);
DROP POLICY IF EXISTS "dashboard_widgets_delete_policy" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_delete_policy" ON dashboard_widgets FOR DELETE USING (true);

-- Report templates RLS
DROP POLICY IF EXISTS "report_templates_select_policy" ON report_templates;
CREATE POLICY "report_templates_select_policy" ON report_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "report_templates_insert_policy" ON report_templates;
CREATE POLICY "report_templates_insert_policy" ON report_templates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "report_templates_update_policy" ON report_templates;
CREATE POLICY "report_templates_update_policy" ON report_templates FOR UPDATE USING (true);
DROP POLICY IF EXISTS "report_templates_delete_policy" ON report_templates;
CREATE POLICY "report_templates_delete_policy" ON report_templates FOR DELETE USING (true);

-- Report history RLS
DROP POLICY IF EXISTS "report_history_select_policy" ON report_history;
CREATE POLICY "report_history_select_policy" ON report_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "report_history_insert_policy" ON report_history;
CREATE POLICY "report_history_insert_policy" ON report_history FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "report_history_update_policy" ON report_history;
CREATE POLICY "report_history_update_policy" ON report_history FOR UPDATE USING (true);
DROP POLICY IF EXISTS "report_history_delete_policy" ON report_history;
CREATE POLICY "report_history_delete_policy" ON report_history FOR DELETE USING (true);

-- KPI definitions RLS
DROP POLICY IF EXISTS "kpi_definitions_select_policy" ON kpi_definitions;
CREATE POLICY "kpi_definitions_select_policy" ON kpi_definitions FOR SELECT USING (true);
DROP POLICY IF EXISTS "kpi_definitions_insert_policy" ON kpi_definitions;
CREATE POLICY "kpi_definitions_insert_policy" ON kpi_definitions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kpi_definitions_update_policy" ON kpi_definitions;
CREATE POLICY "kpi_definitions_update_policy" ON kpi_definitions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "kpi_definitions_delete_policy" ON kpi_definitions;
CREATE POLICY "kpi_definitions_delete_policy" ON kpi_definitions FOR DELETE USING (true);

-- KPI values RLS
DROP POLICY IF EXISTS "kpi_values_select_policy" ON kpi_values;
CREATE POLICY "kpi_values_select_policy" ON kpi_values FOR SELECT USING (true);
DROP POLICY IF EXISTS "kpi_values_insert_policy" ON kpi_values;
CREATE POLICY "kpi_values_insert_policy" ON kpi_values FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "kpi_values_update_policy" ON kpi_values;
CREATE POLICY "kpi_values_update_policy" ON kpi_values FOR UPDATE USING (true);
DROP POLICY IF EXISTS "kpi_values_delete_policy" ON kpi_values;
CREATE POLICY "kpi_values_delete_policy" ON kpi_values FOR DELETE USING (true);

-- Analytics events RLS
DROP POLICY IF EXISTS "analytics_events_select_policy" ON analytics_events;
CREATE POLICY "analytics_events_select_policy" ON analytics_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "analytics_events_insert_policy" ON analytics_events;
CREATE POLICY "analytics_events_insert_policy" ON analytics_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "analytics_events_update_policy" ON analytics_events;
CREATE POLICY "analytics_events_update_policy" ON analytics_events FOR UPDATE USING (true);
DROP POLICY IF EXISTS "analytics_events_delete_policy" ON analytics_events;
CREATE POLICY "analytics_events_delete_policy" ON analytics_events FOR DELETE USING (true);

-- Performance metrics RLS
DROP POLICY IF EXISTS "performance_metrics_select_policy" ON performance_metrics;
CREATE POLICY "performance_metrics_select_policy" ON performance_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "performance_metrics_insert_policy" ON performance_metrics;
CREATE POLICY "performance_metrics_insert_policy" ON performance_metrics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "performance_metrics_update_policy" ON performance_metrics;
CREATE POLICY "performance_metrics_update_policy" ON performance_metrics FOR UPDATE USING (true);
DROP POLICY IF EXISTS "performance_metrics_delete_policy" ON performance_metrics;
CREATE POLICY "performance_metrics_delete_policy" ON performance_metrics FOR DELETE USING (true);

-- Data quality checks RLS
DROP POLICY IF EXISTS "data_quality_checks_select_policy" ON data_quality_checks;
CREATE POLICY "data_quality_checks_select_policy" ON data_quality_checks FOR SELECT USING (true);
DROP POLICY IF EXISTS "data_quality_checks_insert_policy" ON data_quality_checks;
CREATE POLICY "data_quality_checks_insert_policy" ON data_quality_checks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "data_quality_checks_update_policy" ON data_quality_checks;
CREATE POLICY "data_quality_checks_update_policy" ON data_quality_checks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "data_quality_checks_delete_policy" ON data_quality_checks;
CREATE POLICY "data_quality_checks_delete_policy" ON data_quality_checks FOR DELETE USING (true);

-- Report subscriptions RLS
DROP POLICY IF EXISTS "report_subscriptions_select_policy" ON report_subscriptions;
CREATE POLICY "report_subscriptions_select_policy" ON report_subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "report_subscriptions_insert_policy" ON report_subscriptions;
CREATE POLICY "report_subscriptions_insert_policy" ON report_subscriptions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "report_subscriptions_update_policy" ON report_subscriptions;
CREATE POLICY "report_subscriptions_update_policy" ON report_subscriptions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "report_subscriptions_delete_policy" ON report_subscriptions;
CREATE POLICY "report_subscriptions_delete_policy" ON report_subscriptions FOR DELETE USING (true);

-- Trigger'lar - updated_at otomatik güncelleme
CREATE TRIGGER update_dashboard_widgets_updated_at 
    BEFORE UPDATE ON dashboard_widgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_definitions_updated_at 
    BEFORE UPDATE ON kpi_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_subscriptions_updated_at 
    BEFORE UPDATE ON report_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek dashboard widget'ları
INSERT INTO dashboard_widgets (widget_name, widget_type, title, description, position_x, position_y, width, height, data_source, config, refresh_interval) VALUES
('production_overview', 'metric', 'Üretim Genel Bakış', 'Aktif üretim sayısı ve durumu', 0, 0, 3, 2, '/api/productions/statistics', '{"color": "primary", "icon": "factory"}', 60),
('quality_score', 'gauge', 'Kalite Skoru', 'Genel kalite performansı', 3, 0, 3, 2, '/api/quality/statistics', '{"min": 0, "max": 100, "thresholds": [70, 85, 95]}', 120),
('production_timeline', 'chart', 'Üretim Zaman Çizelgesi', 'Son 7 günlük üretim aktiviteleri', 0, 2, 6, 4, '/api/productions/timeline', '{"type": "line", "xAxis": "date", "yAxis": "count"}', 300),
('resource_utilization', 'chart', 'Kaynak Kullanımı', 'Makine ve operatör kullanım oranları', 6, 0, 6, 4, '/api/resources/utilization', '{"type": "bar", "stacked": true}', 180),
('quality_trends', 'chart', 'Kalite Trendleri', 'Kalite kontrol sonuçları trendi', 0, 6, 6, 3, '/api/quality/trends', '{"type": "area", "fill": true}', 240),
('alerts_summary', 'table', 'Uyarı Özeti', 'Son uyarılar ve bildirimler', 6, 4, 6, 5, '/api/notifications/recent', '{"columns": ["title", "priority", "created_at"]}', 30);

-- Örnek KPI tanımları
INSERT INTO kpi_definitions (kpi_name, category, description, calculation_method, target_value, unit, frequency) VALUES
('Üretim Verimliliği', 'production', 'Saatlik üretim miktarı', 'SELECT AVG(quantity) FROM productions WHERE created_at >= NOW() - INTERVAL ''1 hour''', 100.0, 'adet/saat', 'hourly'),
('Kalite Oranı', 'quality', 'Başarılı kalite kontrol yüzdesi', 'SELECT (passed_checks::float / total_checks * 100) FROM quality_checks WHERE check_time >= NOW() - INTERVAL ''1 day''', 95.0, '%', 'daily'),
('Makine Kullanım Oranı', 'efficiency', 'Makine kapasite kullanım yüzdesi', 'SELECT (booked_hours::float / available_hours * 100) FROM capacity_planning WHERE plan_date = CURRENT_DATE', 80.0, '%', 'daily'),
('Sipariş Teslim Süresi', 'efficiency', 'Ortalama sipariş teslim süresi', 'SELECT AVG(EXTRACT(EPOCH FROM (delivery_date - order_date))/86400) FROM order_management WHERE status = ''completed''', 7.0, 'gün', 'weekly'),
('Stok Devir Hızı', 'efficiency', 'Stok devir hızı', 'SELECT COUNT(*) FROM stok_hareketleri WHERE hareket_tipi = ''cikis'' AND created_at >= NOW() - INTERVAL ''1 month''', 12.0, 'ay', 'monthly');

-- Örnek rapor şablonları
INSERT INTO report_templates (template_name, report_type, description, sql_query, parameters, output_format, is_public) VALUES
('Günlük Üretim Raporu', 'production', 'Günlük üretim özeti ve detayları', 
 'SELECT p.id, p.product_type, p.quantity, p.status, p.created_at FROM productions p WHERE DATE(p.created_at) = $1::date ORDER BY p.created_at DESC',
 '{"date": {"type": "date", "label": "Rapor Tarihi", "required": true}}', 'pdf', true),

('Kalite Kontrol Raporu', 'quality', 'Kalite kontrol sonuçları ve analizi',
 'SELECT qc.*, p.product_type, p.quantity FROM quality_checks qc JOIN productions p ON qc.production_id = p.id WHERE qc.check_time BETWEEN $1::timestamp AND $2::timestamp ORDER BY qc.check_time DESC',
 '{"start_date": {"type": "datetime", "label": "Başlangıç Tarihi"}, "end_date": {"type": "datetime", "label": "Bitiş Tarihi"}}', 'excel', true),

('Stok Durumu Raporu', 'inventory', 'Mevcut stok seviyeleri ve hareketleri',
 'SELECT h.ad, h.miktar, h.birim, h.birim_fiyat, h.kategori FROM hammaddeler h WHERE h.aktif = true ORDER BY h.miktar ASC',
 '{}', 'csv', true),

('Maliyet Analizi', 'financial', 'Üretim maliyetleri ve analizi',
 'SELECT p.product_type, p.quantity, p.created_at, (p.quantity * h.birim_fiyat) as toplam_maliyet FROM productions p JOIN hammaddeler h ON p.product_id = h.id WHERE p.created_at BETWEEN $1::timestamp AND $2::timestamp',
 '{"start_date": {"type": "datetime", "label": "Başlangıç Tarihi"}, "end_date": {"type": "datetime", "label": "Bitiş Tarihi"}}', 'pdf', false);

-- Başarı mesajı
SELECT 'Raporlama ve analitik tabloları başarıyla oluşturuldu!' as message;
