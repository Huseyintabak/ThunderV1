# 🔍 API Endpoint Test Rehberi

## 📋 Durum Analizi

Reports sayfasında "Veri Bulunamadı" mesajı görünüyor. API endpoint'leri çalışmıyor veya veri döndürmüyor.

## 🚀 Hızlı Test Adımları

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

### 2. Supabase Bağlantısını Test Et

```bash
# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE"

# Production history endpoint'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/productions" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE"
```

### 3. PM2 Loglarını Kontrol Et

```bash
# PM2 logları
pm2 logs

# Son 50 satır
pm2 logs --lines 50

# Hata logları
pm2 logs --err
```

### 4. Environment Variables Kontrol Et

```bash
# .env dosyasını kontrol et
cat .env

# Supabase değişkenlerini kontrol et
grep SUPABASE .env
```

## 🔧 Olası Sorunlar ve Çözümler

### Sorun 1: Supabase Bağlantı Hatası

```bash
# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/"

# Eğer hata alıyorsanız:
# 1. .env dosyasını kontrol edin
# 2. Supabase projesinin aktif olduğundan emin olun
# 3. API key'lerin doğru olduğundan emin olun
```

### Sorun 2: Veritabanında Veri Yok

```bash
# Supabase Dashboard'a gidin
# https://supabase.com/dashboard/project/beynxlogttkrrkejvftz

# Tables sekmesinde:
# 1. productions tablosunu kontrol edin
# 2. production_states tablosunu kontrol edin
# 3. Veri varsa API endpoint'leri çalışmalı
```

### Sorun 3: API Endpoint'leri Hatalı

```bash
# Server.js dosyasını kontrol et
nano server.js

# API endpoint'lerinin doğru çalıştığından emin olun
# Özellikle:
# - /api/dashboard/statistics
# - /api/dashboard/realtime
# - /api/dashboard/advanced-stats
```

## 🛠️ Veri Ekleme (Test İçin)

### 1. Manuel Veri Ekleme

```bash
# Supabase Dashboard'da SQL Editor'ı açın
# Aşağıdaki SQL'i çalıştırın:

INSERT INTO productions (product_name, product_code, quantity, status, created_at) VALUES
('Test Ürün 1', 'TEST001', 100, 'completed', NOW()),
('Test Ürün 2', 'TEST002', 50, 'in_progress', NOW()),
('Test Ürün 3', 'TEST003', 75, 'completed', NOW());
```

### 2. API Test Verisi

```bash
# Test verisi eklemek için API'yi kullanın
curl -X POST http://192.168.1.250/api/productions \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Ürün",
    "product_code": "TEST001",
    "quantity": 100,
    "status": "completed"
  }'
```

## 📊 Beklenen Sonuç

### API Endpoint'leri Çalıştığında:

```json
// /api/dashboard/statistics
{
  "productions": {
    "total": 3,
    "today": 1,
    "completed": 2,
    "in_progress": 1
  },
  "quality": {
    "total_checks": 5,
    "passed": 4,
    "failed": 1
  }
}

// /api/dashboard/realtime
{
  "active_productions": [],
  "recent_notifications": [],
  "system_status": {
    "status": "healthy",
    "uptime": 3600
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

**🎯 Durum**: API endpoint'leri test edilmeli ve veri eklenmeli!

