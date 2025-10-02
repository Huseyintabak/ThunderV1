# 🔧 PM2 Hata Çözüm Rehberi

## 📋 Durum Analizi

PM2 process'leri "errored" durumunda:
- Process 0: 9 kez yeniden başlatılmış (errored)
- Process 1: 9 kez yeniden başlatılmış (errored)
- CPU: 0%
- Memory: 0b

## 🚀 Hızlı Çözüm Adımları

### 1. PM2 Loglarını Kontrol Et

```bash
# Tüm logları görüntüle
pm2 logs

# Sadece hata loglarını görüntüle
pm2 logs --err

# Son 50 satırı görüntüle
pm2 logs --lines 50
```

### 2. PM2 Process'lerini Temizle

```bash
# Tüm process'leri durdur
pm2 stop all

# Tüm process'leri sil
pm2 delete all

# PM2'yi temizle
pm2 kill
```

### 3. Uygulamayı Manuel Test Et

```bash
# Proje dizinine git
cd /opt/thunder-production

# Manuel olarak başlat
node server.js
```

### 4. Environment Dosyasını Kontrol Et

```bash
# .env dosyasını kontrol et
cat .env

# Supabase bağlantısını test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/"
```

### 5. PM2'yi Yeniden Başlat

```bash
# PM2'yi yeniden başlat
pm2 start ecosystem.config.js

# Durumu kontrol et
pm2 status
```

## 🔍 Yaygın Hata Nedenleri

### 1. Port Çakışması
```bash
# Port 3000 kullanımını kontrol et
sudo lsof -i :3000

# Process'i sonlandır
sudo kill -9 PID
```

### 2. Environment Variables Eksik
```bash
# .env dosyasını kontrol et
ls -la .env

# Eğer yoksa oluştur
cp env-template.txt .env
nano .env
```

### 3. Supabase Bağlantı Hatası
```bash
# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/"

# Eğer hata alıyorsanız .env dosyasını kontrol edin
```

### 4. Node.js Modül Hatası
```bash
# node_modules'ı temizle ve yeniden kur
rm -rf node_modules package-lock.json
npm install
```

### 5. Dosya İzinleri
```bash
# Dosya izinlerini düzelt
sudo chown -R $USER:$USER /opt/thunder-production
chmod -R 755 /opt/thunder-production
```

## 🛠️ Detaylı Sorun Giderme

### Adım 1: Log Analizi
```bash
# PM2 loglarını detaylı görüntüle
pm2 logs --lines 100

# Sistem loglarını kontrol et
sudo journalctl -u pm2-vipkrom -f
```

### Adım 2: Manuel Test
```bash
# Uygulamayı manuel başlat
cd /opt/thunder-production
node server.js

# Eğer hata alıyorsanız, hata mesajını not edin
```

### Adım 3: Environment Kontrolü
```bash
# .env dosyasını kontrol et
cat .env

# Eksik değişkenleri tespit et
grep -E "SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" .env
```

### Adım 4: Veritabanı Bağlantısı
```bash
# Supabase bağlantısını test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE"
```

### Adım 5: PM2 Yeniden Kurulum
```bash
# PM2'yi tamamen temizle
pm2 kill
pm2 unstartup

# PM2'yi yeniden kur
sudo npm install -g pm2

# PM2'yi yeniden başlat
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 📊 Beklenen Sonuç

```bash
# PM2 durumu
pm2 status

# Çıktı şöyle olmalı:
# ┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0  │ thunder-production │ cluster  │ 0    │ online    │ 0%       │ 45.2mb   │
# │ 1  │ thunder-production │ cluster  │ 0    │ online    │ 0%       │ 45.1mb   │
# └────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

## 🚨 Acil Durum Çözümü

Eğer hiçbir şey çalışmıyorsa:

```bash
# 1. Tüm PM2 process'lerini durdur
pm2 kill

# 2. Uygulamayı manuel başlat
cd /opt/thunder-production
node server.js

# 3. Eğer manuel başlatma çalışıyorsa, PM2'yi tek instance ile başlat
pm2 start server.js --name thunder-production

# 4. PM2'yi kaydet
pm2 save
```

## 📞 Destek

Eğer sorun devam ediyorsa:

1. **PM2 loglarını** paylaşın: `pm2 logs --lines 100`
2. **Manuel test sonucunu** paylaşın: `node server.js`
3. **Environment dosyasını** kontrol edin: `cat .env`
4. **Sistem loglarını** kontrol edin: `sudo journalctl -u pm2-vipkrom`

---

**🎯 Durum**: PM2 process'leri errored durumunda, log analizi gerekiyor!

