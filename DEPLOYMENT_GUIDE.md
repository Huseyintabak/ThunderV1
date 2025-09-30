# 🚀 Canlı Sunucuya Aktarma Rehberi

## 📋 Ön Gereksinimler

### 1. Sunucu Gereksinimleri
- **İşletim Sistemi**: Ubuntu 20.04+ veya CentOS 7+
- **Node.js**: v18+ (LTS önerilir)
- **NPM**: v8+
- **PM2**: Process Manager (production için)
- **Nginx**: Reverse proxy (opsiyonel)
- **SSL Sertifikası**: Let's Encrypt (önerilir)

### 2. Veritabanı
- **Supabase**: Production environment
- **Environment Variables**: `.env` dosyası

## 🔧 Kurulum Adımları

### 1. Sunucuya Bağlanma
```bash
ssh kullanici@sunucu-ip-adresi
```

### 2. Sistem Güncelleme
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Node.js Kurulumu
```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js kur
sudo apt-get install -y nodejs

# Versiyon kontrolü
node --version
npm --version
```

### 4. PM2 Kurulumu
```bash
sudo npm install -g pm2
```

### 5. Proje Klonlama
```bash
# Proje dizinine git
cd /var/www

# GitHub'dan klonla
git clone https://github.com/Huseyintabak/ThunderV1.git
cd ThunderV1

# Bağımlılıkları kur
npm install
```

### 6. Environment Variables
```bash
# .env dosyası oluştur
nano .env
```

**`.env` dosyası içeriği:**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DATABASE_URL=your_database_url
```

### 7. PM2 ile Başlatma
```bash
# PM2 ecosystem dosyası oluştur
nano ecosystem.config.js
```

**`ecosystem.config.js` içeriği:**
```javascript
module.exports = {
  apps: [{
    name: 'thunder-v1',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Log dizini oluştur
mkdir logs

# PM2 ile başlat
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

### 8. Nginx Konfigürasyonu (Opsiyonel)
```bash
# Nginx kur
sudo apt install nginx -y

# Konfigürasyon dosyası oluştur
sudo nano /etc/nginx/sites-available/thunder-v1
```

**Nginx konfigürasyonu:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Site'ı aktifleştir
sudo ln -s /etc/nginx/sites-available/thunder-v1 /etc/nginx/sites-enabled/

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 9. SSL Sertifikası (Let's Encrypt)
```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al
sudo certbot --nginx -d your-domain.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

## 🔄 Güncelleme İşlemi

### 1. Kod Güncelleme
```bash
# Proje dizinine git
cd /var/www/ThunderV1

# Son değişiklikleri çek
git pull origin main

# Bağımlılıkları güncelle (gerekirse)
npm install

# PM2'yi yeniden başlat
pm2 restart thunder-v1
```

### 2. Veritabanı Güncelleme
```bash
# Supabase Dashboard'dan migration'ları çalıştır
# veya SQL script'leri manuel olarak çalıştır
```

## 📊 Monitoring ve Loglar

### 1. PM2 Monitoring
```bash
# Uygulama durumu
pm2 status

# Logları görüntüle
pm2 logs thunder-v1

# Real-time monitoring
pm2 monit
```

### 2. Sistem Monitoring
```bash
# Sistem kaynakları
htop

# Disk kullanımı
df -h

# Memory kullanımı
free -h
```

## 🛠️ Sorun Giderme

### 1. Uygulama Başlamıyor
```bash
# Logları kontrol et
pm2 logs thunder-v1 --lines 100

# Manuel başlat
node server.js
```

### 2. Port Çakışması
```bash
# Port kullanımını kontrol et
sudo netstat -tulpn | grep :3000

# Process'i sonlandır
sudo kill -9 PID
```

### 3. Veritabanı Bağlantı Sorunu
```bash
# Environment variables kontrol et
cat .env

# Supabase bağlantısını test et
curl -X GET "https://your-project.supabase.co/rest/v1/"
```

## 🔒 Güvenlik

### 1. Firewall
```bash
# UFW kur
sudo apt install ufw -y

# Temel kurallar
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL/TLS
- Let's Encrypt sertifikası kullan
- HTTPS yönlendirmesi aktif et
- Güvenli header'lar ekle

### 3. Environment Variables
- `.env` dosyasını `.gitignore`'a ekle
- Production'da farklı API key'ler kullan
- Hassas bilgileri güvenli tut

## 📈 Performans Optimizasyonu

### 1. PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'thunder-v1',
    script: 'server.js',
    instances: 'max', // CPU core sayısı kadar
    exec_mode: 'cluster'
  }]
};
```

### 2. Nginx Caching
```nginx
# Static dosyalar için cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization
- Supabase connection pooling
- Query optimization
- Index'ler ekle

## 🚨 Acil Durum

### 1. Rollback
```bash
# Önceki commit'e dön
git log --oneline
git reset --hard COMMIT_HASH
pm2 restart thunder-v1
```

### 2. Backup
```bash
# Veritabanı backup
# Supabase Dashboard'dan export al

# Kod backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/ThunderV1
```

## 📞 Destek

- **GitHub Issues**: https://github.com/Huseyintabak/ThunderV1/issues
- **Documentation**: README.md
- **Logs**: `/var/www/ThunderV1/logs/`

---

**Not**: Bu rehber production environment için hazırlanmıştır. Test environment'da önce deneyiniz.