-- Workflow Yönetimi için Veritabanı Yapısı

-- Workflow tanımları tablosu
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai', 'maliyet', 'custom'
    steps JSONB NOT NULL, -- Workflow adımları
    triggers JSONB, -- Tetikleyiciler
    conditions JSONB, -- Koşullar
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow çalıştırma geçmişi
CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed', 'paused', 'cancelled'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    execution_data JSONB,
    progress INTEGER DEFAULT 0, -- 0-100 arası ilerleme yüzdesi
    current_step INTEGER DEFAULT 0, -- Mevcut adım numarası
    user_id VARCHAR(100), -- Çalıştıran kullanıcı
    execution_log JSONB -- Detaylı log verileri
);

-- Workflow adımları için yardımcı tablo
CREATE TABLE IF NOT EXISTS workflow_step_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    step_type VARCHAR(50) NOT NULL, -- 'api_call', 'data_validation', 'calculation', 'notification'
    config JSONB NOT NULL, -- Adım konfigürasyonu
    created_at TIMESTAMP DEFAULT NOW()
);

-- Varsayılan workflow'ları ekle
INSERT INTO workflows (name, description, type, steps, triggers, conditions) VALUES
('Hammadde Girişi', 'Yeni hammadde sisteme giriş workflow''u', 'hammadde', 
 '[
   {"id": 1, "name": "Hammadde Kaydı", "type": "data_validation", "config": {"fields": ["ad", "kod", "miktar", "birim_fiyat"], "description": "Hammadde bilgileri sisteme girilir (ad, kod, miktar, fiyat)"}},
   {"id": 2, "name": "Stok Güncelleme", "type": "api_call", "config": {"endpoint": "/api/hammaddeler", "method": "POST", "description": "Hammadde stok miktarı güncellenir"}},
   {"id": 3, "name": "Maliyet Hesaplama", "type": "calculation", "config": {"formula": "miktar * birim_fiyat", "description": "Toplam hammadde maliyeti hesaplanır"}},
   {"id": 4, "name": "Bildirim Gönder", "type": "notification", "config": {"message": "Hammadde başarıyla eklendi", "description": "Kullanıcıya başarı bildirimi gönderilir"}}
 ]',
 '{"type": "manual", "conditions": []}',
 '{"min_stock_level": 0}'
),

('Yarı Mamul Üretimi', 'Yarı mamul üretim workflow''u', 'yarimamul',
 '[
   {"id": 1, "name": "BOM Kontrolü", "type": "data_validation", "config": {"check_bom": true}},
   {"id": 2, "name": "Hammadde Tüketimi", "type": "api_call", "config": {"endpoint": "/api/consume-materials", "method": "POST"}},
   {"id": 3, "name": "Yarı Mamul Kaydı", "type": "api_call", "config": {"endpoint": "/api/yarimamuller", "method": "POST"}},
   {"id": 4, "name": "BOM Maliyet Hesaplama", "type": "api_call", "config": {"endpoint": "/api/calculate-bom-cost", "method": "POST"}},
   {"id": 5, "name": "Stok Güncelleme", "type": "api_call", "config": {"endpoint": "/api/update-stock", "method": "PUT"}}
 ]',
 '{"type": "manual", "conditions": []}',
 '{"min_bom_items": 1}'
),

('Nihai Ürün Üretimi', 'Nihai ürün üretim workflow''u', 'nihai',
 '[
   {"id": 1, "name": "Ürün Ağacı Kontrolü", "type": "data_validation", "config": {"check_bom": true, "product_type": "nihai"}},
   {"id": 2, "name": "Malzeme Çekimi", "type": "api_call", "config": {"endpoint": "/api/consume-materials", "method": "POST"}},
   {"id": 3, "name": "Üretim İşlemi", "type": "calculation", "config": {"duration": "uretim_suresi"}},
   {"id": 4, "name": "Kalite Kontrol", "type": "data_validation", "config": {"quality_check": true}},
   {"id": 5, "name": "Nihai Ürün Kaydı", "type": "api_call", "config": {"endpoint": "/api/nihai_urunler", "method": "POST"}},
   {"id": 6, "name": "BOM Maliyet Hesaplama", "type": "api_call", "config": {"endpoint": "/api/calculate-bom-cost", "method": "POST"}}
 ]',
 '{"type": "manual", "conditions": []}',
 '{"min_bom_items": 1}'
),

('Otomatik Stok Uyarısı', 'Stok seviyesi düşük olduğunda otomatik uyarı', 'notification',
 '[
   {"id": 1, "name": "Stok Kontrolü", "type": "data_validation", "config": {"check_stock_levels": true}},
   {"id": 2, "name": "Uyarı Gönder", "type": "notification", "config": {"message": "Stok seviyesi düşük!", "recipients": ["admin"]}}
 ]',
 '{"type": "scheduled", "schedule": "0 */6 * * *"}',
 '{"check_interval": "6 hours"}'
);

-- Varsayılan adım şablonları
INSERT INTO workflow_step_templates (name, description, step_type, config) VALUES
('API Çağrısı', 'Harici API''ye istek gönder', 'api_call', 
 '{"endpoint": "", "method": "POST", "headers": {}, "body_template": ""}'),
('Veri Doğrulama', 'Gelen veriyi doğrula', 'data_validation', 
 '{"required_fields": [], "validation_rules": {}}'),
('Hesaplama', 'Matematiksel hesaplama yap', 'calculation', 
 '{"formula": "", "variables": []}'),
('Bildirim', 'Kullanıcıya bildirim gönder', 'notification', 
 '{"message": "", "type": "info", "recipients": []}'),
('Stok Kontrolü', 'Stok seviyelerini kontrol et', 'data_validation', 
 '{"check_stock": true, "min_level": 0}'),
('BOM Kontrolü', 'Ürün ağacı kontrolü yap', 'data_validation', 
 '{"check_bom": true, "product_type": ""}');

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

-- Yorumlar
COMMENT ON TABLE workflows IS 'Workflow tanımları';
COMMENT ON TABLE workflow_executions IS 'Workflow çalıştırma geçmişi';
COMMENT ON TABLE workflow_step_templates IS 'Workflow adım şablonları';

COMMENT ON COLUMN workflows.steps IS 'Workflow adımları JSON formatında';
COMMENT ON COLUMN workflows.triggers IS 'Workflow tetikleyicileri';
COMMENT ON COLUMN workflows.conditions IS 'Workflow koşulları';
COMMENT ON COLUMN workflow_executions.execution_data IS 'Workflow çalıştırma verileri';
COMMENT ON COLUMN workflow_executions.execution_log IS 'Detaylı çalıştırma logları';
