# 🚀 ThunderV1 Production Deployment Guide

## 📋 Genel Bakış

Bu rehber, ThunderV1 üretim yönetim sistemini Ubuntu sunucuya kurmak için gerekli tüm adımları içerir.

## 🎯 Sistem Gereksinimleri

### Minimum Gereksinimler
- **OS**: Ubuntu 20.04 LTS veya üzeri
- **RAM**: 2GB (4GB önerilir)
- **CPU**: 2 Core (4 Core önerilir)
- **Disk**: 20GB (50GB önerilir)
- **Network**: İnternet bağlantısı

### Önerilen Gereksinimler
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 8GB
- **CPU**: 4 Core
- **Disk**: 100GB SSD
- **Network**: Yüksek hızlı internet bağlantısı

## 🔧 Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketlerin kurulumu
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Node.js 18.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulumu
sudo npm install -g pm2

# Git kurulumu (eğer yoksa)
sudo apt install -y git
```

### 2. Proje İndirme

```bash
# Proje dizinine git
cd /opt
sudo mkdir -p thunder-production
sudo chown $USER:$USER thunder-production
cd thunder-production

# GitHub'dan projeyi klonla
git clone https://github.com/Huseyintabak/ThunderV1.git .
```

### 3. Bağımlılıkları Kurma

```bash
# NPM paketlerini kur
npm install

# Production bağımlılıklarını kur
npm install --production
```

### 4. Environment Variables Ayarlama

```bash
# Environment dosyasını oluştur
cp production.env.example .env

# Environment dosyasını düzenle
nano .env
```

**`.env` dosyası içeriği:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Email Configuration (Opsiyonel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 5. PM2 Konfigürasyonu

```bash
# PM2 ecosystem dosyasını kullan
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

### 6. Nginx Konfigürasyonu

```bash
# Nginx konfigürasyon dosyasını kopyala
sudo cp nginx-thunderv1.conf /etc/nginx/sites-available/thunderv1

# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/thunderv1 /etc/nginx/sites-enabled/

# Default site'ı devre dışı bırak
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. SSL Sertifikası Kurulumu

```bash
# SSL kurulum scriptini çalıştır
sudo chmod +x ssl-setup.sh
sudo ./ssl-setup.sh yourdomain.com
```

### 8. Firewall Konfigürasyonu

```bash
# UFW firewall'u etkinleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# Firewall durumunu kontrol et
sudo ufw status
```

## 🔍 Sistem Kontrolleri

### 1. Servis Durumları

```bash
# PM2 durumu
pm2 status

# Nginx durumu
sudo systemctl status nginx

# SSL sertifikası durumu
sudo certbot certificates
```

### 2. Log Kontrolleri

```bash
# PM2 logları
pm2 logs

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistem logları
sudo journalctl -u nginx -f
```

### 3. Performans Kontrolleri

```bash
# Sistem kaynakları
htop
free -h
df -h

# Network bağlantıları
netstat -tlnp
ss -tlnp
```

## 🚀 Deployment Script

Otomatik deployment için `deploy.sh` scriptini kullanın:

```bash
# Deployment scriptini çalıştır
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Bakım ve Güncellemeler

### 1. Kod Güncellemeleri

```bash
# Proje dizinine git
cd /opt/thunder-production

# Değişiklikleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# PM2'yi yeniden başlat
pm2 restart ecosystem.config.js
```

### 2. Sistem Güncellemeleri

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Nginx güncellemesi
sudo systemctl restart nginx

# SSL sertifikası yenileme
sudo certbot renew --dry-run
```

### 3. Backup

```bash
# Proje backup
tar -czf thunder-backup-$(date +%Y%m%d).tar.gz /opt/thunder-production

# Database backup (Supabase kullanıyorsanız)
# Supabase dashboard'dan backup alın
```

## 🛠️ Sorun Giderme

### 1. Yaygın Sorunlar

**Port 3000 kullanımda:**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

**Nginx 502 hatası:**
```bash
# PM2 durumunu kontrol et
pm2 status

# PM2'yi yeniden başlat
pm2 restart ecosystem.config.js
```

**SSL sertifikası hatası:**
```bash
# Sertifikayı yenile
sudo certbot renew

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 2. Log Analizi

```bash
# Hata logları
pm2 logs --err

# Nginx hata logları
sudo tail -f /var/log/nginx/error.log

# Sistem logları
sudo journalctl -u nginx --since "1 hour ago"
```

## 📊 Monitoring

### 1. PM2 Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 web interface
pm2 web
```

### 2. Nginx Monitoring

```bash
# Nginx status
sudo systemctl status nginx

# Nginx metrics
curl http://localhost/nginx_status
```

## 🔒 Güvenlik

### 1. Güvenlik Kontrolleri

```bash
# Firewall durumu
sudo ufw status

# SSL sertifikası durumu
sudo certbot certificates

# Sistem güncellemeleri
sudo apt list --upgradable
```

### 2. Güvenlik Önerileri

- Düzenli sistem güncellemeleri yapın
- Güçlü şifreler kullanın
- SSH key authentication kullanın
- Düzenli backup alın
- Log dosyalarını izleyin

## 📞 Destek

### 1. Teknik Destek

- **GitHub Issues**: https://github.com/Huseyintabak/ThunderV1/issues
- **Email**: support@thunderproduction.com
- **Documentation**: Bu rehber

### 2. Acil Durum

```bash
# Sistem yeniden başlatma
sudo reboot

# PM2 yeniden başlatma
pm2 restart all

# Nginx yeniden başlatma
sudo systemctl restart nginx
```

## 📝 Changelog

### v1.0.0 (Production Ready)
- ✅ Modern work order generation
- ✅ A4 printing optimization
- ✅ Operator management system
- ✅ Production planning
- ✅ Order management
- ✅ Real-time updates
- ✅ SSL support
- ✅ PM2 process management
- ✅ Nginx reverse proxy
- ✅ Automated deployment

## 🎯 Sonraki Adımlar

1. **Domain ayarlama**: DNS kayıtlarını sunucu IP'sine yönlendirin
2. **SSL kurulumu**: Let's Encrypt ile SSL sertifikası alın
3. **Monitoring**: Sistem monitoring araçları kurun
4. **Backup**: Otomatik backup sistemi kurun
5. **Scaling**: Load balancer ve multiple instance kurun

---

**🚀 ThunderV1 Production System - Ready for Launch!**

*Bu rehber ile sisteminiz production ortamında çalışmaya hazır!*
