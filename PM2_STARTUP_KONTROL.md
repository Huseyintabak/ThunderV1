# 🔄 PM2 Otomatik Başlatma Kontrol Rehberi

## 📋 Mevcut Durum

PM2 process'leri çalışıyor ancak sunucu yeniden başlatıldığında otomatik çalışması için startup konfigürasyonu gerekli.

## 🔍 Kontrol Adımları

### 1. PM2 Startup Durumunu Kontrol Et

```bash
# Sunucuya bağlan
ssh vipkrom@192.168.1.250

# PM2 startup durumunu kontrol et
pm2 startup

# Çıktı şöyle olmalı:
# [PM2] Init System found: systemd
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u vipkrom --hp /home/vipkrom
```

### 2. PM2 Startup'ı Kur

```bash
# PM2 startup komutunu çalıştır (yukarıdaki çıktıdaki komutu)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u vipkrom --hp /home/vipkrom

# PM2'yi kaydet
pm2 save

# Durumu kontrol et
pm2 status
```

### 3. Test Et

```bash
# Sunucuyu yeniden başlat
sudo reboot

# Sunucu açıldıktan sonra bağlan
ssh vipkrom@192.168.1.250

# PM2 durumunu kontrol et
pm2 status

# Eğer çalışmıyorsa manuel başlat
pm2 start ecosystem.config.js
```

## 🚀 Otomatik Kurulum Scripti

```bash
#!/bin/bash
# pm2-startup-setup.sh

echo "🔄 PM2 Startup Konfigürasyonu Kuruluyor..."

# PM2 startup durumunu kontrol et
echo "PM2 startup durumu:"
pm2 startup

echo ""
echo "Yukarıdaki komutu çalıştırın ve ardından 'pm2 save' komutunu çalıştırın"
echo ""

# PM2'yi kaydet
pm2 save

echo "✅ PM2 startup konfigürasyonu tamamlandı!"
echo "Sunucu yeniden başlatıldığında PM2 otomatik çalışacak."
```

## 🔧 Manuel Kurulum Adımları

### Adım 1: PM2 Startup Komutunu Çalıştır

```bash
# PM2 startup komutunu çalıştır
pm2 startup

# Çıktıdaki komutu kopyala ve çalıştır
# Örnek:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u vipkrom --hp /home/vipkrom
```

### Adım 2: PM2'yi Kaydet

```bash
# Mevcut PM2 process'lerini kaydet
pm2 save

# Durumu kontrol et
pm2 status
```

### Adım 3: Test Et

```bash
# Sunucuyu yeniden başlat
sudo reboot

# Sunucu açıldıktan sonra bağlan
ssh vipkrom@192.168.1.250

# PM2 durumunu kontrol et
pm2 status

# Eğer çalışmıyorsa:
pm2 start ecosystem.config.js
pm2 save
```

## 🔍 Sorun Giderme

### Eğer PM2 otomatik başlamıyorsa:

#### 1. Startup Script'ini Kontrol Et

```bash
# Systemd service dosyasını kontrol et
sudo systemctl status pm2-vipkrom

# Service dosyasını görüntüle
sudo cat /etc/systemd/system/pm2-vipkrom.service
```

#### 2. Manuel Başlatma

```bash
# PM2'yi manuel başlat
pm2 start ecosystem.config.js

# PM2'yi kaydet
pm2 save

# Startup'ı yeniden kur
pm2 startup
```

#### 3. Log Kontrolü

```bash
# Systemd logları
sudo journalctl -u pm2-vipkrom -f

# PM2 logları
pm2 logs
```

## 📊 Beklenen Sonuç

### Sunucu Yeniden Başlatıldıktan Sonra:

```bash
# PM2 durumu
pm2 status

# Çıktı şöyle olmalı:
# ┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0  │ thunder-production │ cluster  │ 0    │ online    │ 0%       │ 72.7mb   │
# │ 1  │ thunder-production │ cluster  │ 0    │ online    │ 0%       │ 72.9mb   │
# └────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### Uygulama Erişimi:

```bash
# Ana sayfa
curl http://192.168.1.250

# Reports sayfası
curl http://192.168.1.250/reports.html
```

## 🎯 Özet

- ✅ **PM2 Startup**: Kurulmalı
- ✅ **PM2 Save**: Çalıştırılmalı
- ✅ **Test**: Sunucu yeniden başlatıldıktan sonra kontrol edilmeli
- ✅ **Uygulama**: http://192.168.1.250 adresinde erişilebilir olmalı

---

**🎯 Durum**: PM2 startup konfigürasyonu kurulmalı, ardından sunucu yeniden başlatıldığında otomatik çalışacak!
