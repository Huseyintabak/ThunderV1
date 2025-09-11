-- Workflow tabloları
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- hammadde, yarimamul, nihai, kalite, genel
    steps JSONB NOT NULL, -- Workflow adımları
    triggers JSONB, -- Tetikleyiciler
    conditions JSONB, -- Koşullar
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eğer tablo zaten varsa eksik sütunları ekle
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS conditions JSONB;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS triggers JSONB;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, paused
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_data JSONB, -- Çalıştırma verileri
    progress INTEGER DEFAULT 0, -- 0-100
    current_step INTEGER DEFAULT 0,
    execution_log JSONB, -- Adım adım log
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eğer tablo zaten varsa eksik sütunları ekle
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS execution_data JSONB;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS execution_log JSONB;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100),
  quantity INTEGER NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  start_date DATE,
  end_date DATE,
  assigned_personnel VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  bom_data JSONB,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eğer tablo zaten varsa eksik sütunları ekle
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_personnel VARCHAR(255);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS bom_data JSONB;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Work Order Status History
CREATE TABLE IF NOT EXISTS work_order_status_history (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES work_orders(id),
  status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Eğer tablo zaten varsa eksik sütunları ekle
ALTER TABLE work_order_status_history ADD COLUMN IF NOT EXISTS work_order_id INTEGER REFERENCES work_orders(id);
ALTER TABLE work_order_status_history ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL;
ALTER TABLE work_order_status_history ADD COLUMN IF NOT EXISTS changed_by VARCHAR(255);
ALTER TABLE work_order_status_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE work_order_status_history ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_personnel ON work_orders(assigned_personnel);
CREATE INDEX IF NOT EXISTS idx_work_orders_start_date ON work_orders(start_date);

-- Örnek workflow'lar
INSERT INTO workflows (name, description, type, steps, triggers, conditions) VALUES
(
    'Hammadde Girişi',
    'Yeni hammadde sisteme giriş workflow''u',
    'hammadde',
    '[
        {
            "id": 1,
            "name": "Veri Doğrulama",
            "type": "data_validation",
            "config": {
                "fields": ["ad", "kod", "miktar", "birim_fiyat"],
                "description": "Hammadde bilgileri kontrol edilir"
            }
        },
        {
            "id": 2,
            "name": "Hammadde Kaydı",
            "type": "api_call",
            "config": {
                "endpoint": "/api/hammaddeler",
                "method": "POST",
                "description": "Hammadde veritabanına kaydedilir"
            }
        },
        {
            "id": 3,
            "name": "Maliyet Hesaplama",
            "type": "calculation",
            "config": {
                "formula": "miktar * birim_fiyat",
                "description": "Toplam maliyet hesaplanır"
            }
        },
        {
            "id": 4,
            "name": "Bildirim",
            "type": "notification",
            "config": {
                "message": "Hammadde başarıyla eklendi",
                "description": "Kullanıcıya bildirim gönderilir"
            }
        }
    ]',
    '{"type": "manual", "conditions": []}',
    '{"min_stock_level": 0}'
),
(
    'Yarı Mamul Üretimi',
    'Yarı mamul üretim workflow''u',
    'yarimamul',
    '[
        {
            "id": 1,
            "name": "BOM Kontrolü",
            "type": "data_validation",
            "config": {
                "check_bom": true,
                "description": "Gerekli hammaddeler kontrol edilir"
            }
        },
        {
            "id": 2,
            "name": "Malzeme Çekimi",
            "type": "api_call",
            "config": {
                "endpoint": "/api/consume-materials",
                "method": "POST",
                "description": "Hammaddeler stoktan düşülür"
            }
        },
        {
            "id": 3,
            "name": "Üretim İşlemi",
            "type": "calculation",
            "config": {
                "duration": "uretim_suresi",
                "description": "Yarı mamul üretilir"
            }
        },
        {
            "id": 4,
            "name": "Yarı Mamul Kaydı",
            "type": "api_call",
            "config": {
                "endpoint": "/api/yarimamuller",
                "method": "POST",
                "description": "Üretilen yarı mamul kaydedilir"
            }
        }
    ]',
    '{"type": "manual", "conditions": []}',
    '{"min_bom_items": 1}'
),
(
    'Nihai Ürün Üretimi',
    'Nihai ürün üretim workflow''u',
    'nihai',
    '[
        {
            "id": 1,
            "name": "Ürün Ağacı Kontrolü",
            "type": "data_validation",
            "config": {
                "check_bom": true,
                "product_type": "nihai",
                "description": "Gerekli malzemeler kontrol edilir"
            }
        },
        {
            "id": 2,
            "name": "Malzeme Çekimi",
            "type": "api_call",
            "config": {
                "endpoint": "/api/consume-materials",
                "method": "POST",
                "description": "Gerekli malzemeler çekilir"
            }
        },
        {
            "id": 3,
            "name": "Üretim İşlemi",
            "type": "calculation",
            "config": {
                "duration": "uretim_suresi",
                "description": "Nihai ürün üretilir"
            }
        },
        {
            "id": 4,
            "name": "Kalite Kontrol",
            "type": "data_validation",
            "config": {
                "quality_check": true,
                "description": "Ürün kalitesi kontrol edilir"
            }
        },
        {
            "id": 5,
            "name": "Nihai Ürün Kaydı",
            "type": "api_call",
            "config": {
                "endpoint": "/api/nihai_urunler",
                "method": "POST",
                "description": "Nihai ürün kaydedilir"
            }
        }
    ]',
    '{"type": "manual", "conditions": []}',
    '{"min_bom_items": 1}'
);
