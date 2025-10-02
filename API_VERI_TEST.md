# 🔍 API Veri Test ve Düzeltme Rehberi

## 📋 Durum Analizi

Veritabanında veri var ama API endpoint'leri düzgün çalışmıyor. Reports sayfasında "Veri Bulunamadı" mesajı görünüyor.

## 🚀 Hızlı Test ve Düzeltme

### 1. API Endpoint'lerini Test Et

```bash
# Sunucuya bağlan
ssh vipkrom@192.168.1.250

# Proje dizinine git
cd /opt/thunder-production

# API endpoint'lerini test et
curl http://192.168.1.250/api/dashboard/statistics
curl http://192.168.1.250/api/dashboard/realtime
curl http://192.168.1.250/api/dashboard/advanced-stats
curl http://192.168.1.250/api/dashboard/stock-alerts
```

### 2. Supabase Veritabanını Kontrol Et

```bash
# Supabase Dashboard'a gidin
# https://supabase.com/dashboard/project/beynxlogttkrrkejvftz

# Tables sekmesinde kontrol edin:
# 1. productions tablosu
# 2. production_states tablosu
# 3. work_orders tablosu
```

### 3. Test Verisi Ekle

```sql
-- Supabase Dashboard > SQL Editor'da çalıştırın:

-- Productions tablosuna test verisi ekle
INSERT INTO productions (product_name, product_code, quantity, status, created_at, completed_at) VALUES
('Test Ürün 1', 'TEST001', 100, 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
('Test Ürün 2', 'TEST002', 50, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('Test Ürün 3', 'TEST003', 75, 'in_progress', NOW() - INTERVAL '2 days', NULL),
('Test Ürün 4', 'TEST004', 200, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour');

-- Production states tablosuna test verisi ekle
INSERT INTO production_states (product_name, product_code, target_quantity, produced_quantity, is_completed, start_time, completed_at, operator_name) VALUES
('Test Ürün 1', 'TEST001', 100, 100, true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', 'Operatör 1'),
('Test Ürün 2', 'TEST002', 50, 50, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Operatör 2'),
('Test Ürün 3', 'TEST003', 75, 25, false, NOW() - INTERVAL '2 days', NULL, 'Operatör 3'),
('Test Ürün 4', 'TEST004', 200, 200, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour', 'Operatör 1');

-- Work orders tablosuna test verisi ekle
INSERT INTO work_orders (work_order_number, product_name, product_code, quantity, status, priority, assigned_personnel, start_date, end_date, notes) VALUES
('WO-001', 'Test Ürün 1', 'TEST001', 100, 'completed', 'high', 'Operatör 1', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', 'Test iş emri'),
('WO-002', 'Test Ürün 2', 'TEST002', 50, 'completed', 'normal', 'Operatör 2', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Test iş emri'),
('WO-003', 'Test Ürün 3', 'TEST003', 75, 'in_progress', 'high', 'Operatör 3', NOW() - INTERVAL '2 days', NULL, 'Test iş emri'),
('WO-004', 'Test Ürün 4', 'TEST004', 200, 'completed', 'normal', 'Operatör 1', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour', 'Test iş emri');
```

### 4. API Endpoint'lerini Kontrol Et

```bash
# PM2 loglarını kontrol et
pm2 logs

# Son 50 satır
pm2 logs --lines 50

# Hata logları
pm2 logs --err
```

### 5. Server.js'de API Endpoint'lerini Kontrol Et

```bash
# Server.js dosyasını kontrol et
nano server.js

# Aşağıdaki endpoint'leri arayın:
# - /api/dashboard/statistics
# - /api/dashboard/realtime
# - /api/dashboard/advanced-stats
# - /api/dashboard/stock-alerts
```

## 🔧 Olası Sorunlar ve Çözümler

### Sorun 1: Supabase Bağlantı Hatası

```bash
# .env dosyasını kontrol et
cat .env

# Supabase değişkenlerini kontrol et
grep SUPABASE .env

# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE"
```

### Sorun 2: API Endpoint'leri Hatalı

```bash
# Server.js dosyasında API endpoint'lerini kontrol et
grep -n "app.get.*dashboard" server.js

# Eğer endpoint'ler yoksa, server.js dosyasını güncelle
```

### Sorun 3: Veri Formatı Yanlış

```bash
# API response'unu kontrol et
curl -v http://192.168.1.250/api/dashboard/statistics

# JSON formatında mı?
# Array mi object mi?
```

## 🛠️ Hızlı Çözüm

### 1. Test Verisi Ekle

```sql
-- Supabase Dashboard > SQL Editor'da çalıştırın:

-- Önce mevcut verileri temizle
DELETE FROM productions;
DELETE FROM production_states;
DELETE FROM work_orders;

-- Test verilerini ekle
INSERT INTO productions (product_name, product_code, quantity, status, created_at, completed_at) VALUES
('Test Ürün 1', 'TEST001', 100, 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
('Test Ürün 2', 'TEST002', 50, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('Test Ürün 3', 'TEST003', 75, 'in_progress', NOW() - INTERVAL '2 days', NULL),
('Test Ürün 4', 'TEST004', 200, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour');
```

### 2. PM2'yi Yeniden Başlat

```bash
# PM2'yi yeniden başlat
pm2 restart all

# Durumu kontrol et
pm2 status

# Logları kontrol et
pm2 logs
```

### 3. API'yi Test Et

```bash
# API endpoint'lerini test et
curl http://192.168.1.250/api/dashboard/statistics
curl http://192.168.1.250/api/dashboard/realtime
curl http://192.168.1.250/api/dashboard/advanced-stats
```

## 📊 Beklenen Sonuç

### API Endpoint'leri Çalıştığında:

```json
// /api/dashboard/statistics
{
  "productions": {
    "total": 4,
    "completed": 3,
    "in_progress": 1
  },
  "quality": {
    "total_checks": 0,
    "passed": 0,
    "failed": 0
  }
}

// /api/dashboard/advanced-stats
{
  "production": {
    "total_productions": 4,
    "completed_productions": 3,
    "total_quantity": 425
  },
  "customers": {
    "total_customers": 1,
    "customer_production": [...]
  }
}
```

### Reports Sayfasında:

- ✅ Üretim trendi grafiği görünür
- ✅ Müşteri analizi verileri görünür
- ✅ Operatör performansı tablosu dolu
- ✅ Stok alarmları listesi görünür

## 🚨 Acil Çözüm

Eğer hiçbir şey çalışmıyorsa:

```bash
# 1. PM2'yi durdur
pm2 kill

# 2. Uygulamayı manuel başlat
node server.js

# 3. Başka terminal'de test et
curl http://localhost:3000/api/dashboard/statistics

# 4. Eğer çalışıyorsa PM2'yi yeniden başlat
pm2 start ecosystem.config.js
```

---

**🎯 Durum**: API endpoint'leri test edilmeli ve test verisi eklenmeli!

