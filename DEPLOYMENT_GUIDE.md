# ThunderV1 - Canlıya Alma ve Deployment Rehberi

## 📋 **İÇİNDEKİLER**
1. [Deployment Öncesi Hazırlık](#deployment-öncesi-hazırlık)
2. [Sunucu Gereksinimleri](#sunucu-gereksinimleri)
3. [Veritabanı Kurulumu](#veritabanı-kurulumu)
4. [Uygulama Deployment](#uygulama-deployment)
5. [Domain ve SSL Kurulumu](#domain-ve-ssl-kurulumu)
6. [Monitoring ve Logging](#monitoring-ve-logging)
7. [Backup ve Güvenlik](#backup-ve-güvenlik)
8. [Performans Optimizasyonu](#performans-optimizasyonu)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## 🔧 **DEPLOYMENT ÖNCESİ HAZIRLIK**

### **1.1 Kod Hazırlığı**
- [ ] **Code Review**: Tüm kodlar gözden geçirildi
- [ ] **Testing**: Unit testler ve integration testler tamamlandı
- [ ] **Security Audit**: Güvenlik açıkları kontrol edildi
- [ ] **Performance Testing**: Performans testleri yapıldı
- [ ] **Environment Variables**: Tüm environment değişkenleri tanımlandı
- [ ] **Database Migrations**: Veritabanı migration'ları hazırlandı

### **1.2 Environment Konfigürasyonu**
```bash
# Production Environment Variables
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

### **1.3 Build Optimizasyonu**
- [ ] **Minification**: CSS/JS dosyaları minify edildi
- [ ] **Compression**: Gzip/Brotli compression aktif
- [ ] **Image Optimization**: Resimler optimize edildi
- [ ] **Bundle Analysis**: Bundle boyutu analiz edildi
- [ ] **Tree Shaking**: Gereksiz kodlar temizlendi

---

## 🖥️ **SUNUCU GEREKSİNİMLERİ**

### **2.1 Minimum Sistem Gereksinimleri**
- **CPU**: 2 vCPU (4 vCPU önerilen)
- **RAM**: 4GB (8GB önerilen)
- **Storage**: 50GB SSD (100GB önerilen)
- **Network**: 100 Mbps (1 Gbps önerilen)
- **OS**: Ubuntu 20.04 LTS veya üzeri

### **2.2 Önerilen Sunucu Konfigürasyonu**
- **CPU**: 4 vCPU
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

### **2.3 Cloud Provider Seçenekleri**

#### **AWS EC2**
```bash
# Instance Type: t3.medium (2 vCPU, 4GB RAM)
# Storage: gp3 50GB
# Security Groups: HTTP(80), HTTPS(443), SSH(22)
# Key Pair: ThunderV1-keypair
```

#### **DigitalOcean Droplet**
```bash
# Droplet Size: 4GB RAM, 2 vCPUs, 80GB SSD
# Image: Ubuntu 22.04 LTS
# Region: Frankfurt (Avrupa)
# VPC: Default
```

#### **Google Cloud Platform**
```bash
# Machine Type: e2-medium (2 vCPU, 4GB RAM)
# Boot Disk: 50GB SSD
# Region: europe-west1
# Network: default
```

---

## 🗄️ **VERİTABANI KURULUMU**

### **3.1 Supabase (Önerilen)**
```bash
# 1. Supabase Proje Oluşturma
# 2. Database URL ve API Key'leri alma
# 3. RLS (Row Level Security) politikaları aktifleştirme
# 4. Database backup'ı alma
```

### **3.2 PostgreSQL (Self-hosted)**
```bash
# Ubuntu'da PostgreSQL kurulumu
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL servisini başlatma
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database oluşturma
sudo -u postgres psql
CREATE DATABASE thunderv1_production;
CREATE USER thunderv1_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE thunderv1_production TO thunderv1_user;
```

### **3.3 Redis Kurulumu**
```bash
# Redis kurulumu
sudo apt install redis-server

# Redis servisini başlatma
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Redis konfigürasyonu
sudo nano /etc/redis/redis.conf
# requirepass your_redis_password
# maxmemory 256mb
# maxmemory-policy allkeys-lru
```

---

## 🚀 **UYGULAMA DEPLOYMENT**

### **4.1 Sunucu Hazırlığı**
```bash
# 1. Sunucuya bağlanma
ssh -i your-key.pem ubuntu@your-server-ip

# 2. Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# 3. Node.js kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. PM2 kurulumu (Process Manager)
sudo npm install -g pm2

# 5. Nginx kurulumu
sudo apt install nginx

# 6. UFW (Firewall) konfigürasyonu
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **4.2 Uygulama Kurulumu**
```bash
# 1. Proje dizini oluşturma
sudo mkdir -p /var/www/thunderv1
sudo chown ubuntu:ubuntu /var/www/thunderv1
cd /var/www/thunderv1

# 2. Git repository'den klonlama
git clone https://github.com/Huseyintabak/ThunderV1.git .

# 3. Dependencies kurulumu
npm install --production

# 4. Environment variables ayarlama
nano .env
```

### **4.3 Environment Variables (.env)**
```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_very_secure_jwt_secret
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_session_secret
```

### **4.4 PM2 Konfigürasyonu**
```bash
# ecosystem.config.js oluşturma
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'thunderv1',
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

### **4.5 Uygulamayı Başlatma**
```bash
# 1. Log dizini oluşturma
mkdir logs

# 2. PM2 ile uygulamayı başlatma
pm2 start ecosystem.config.js

# 3. PM2'yi sistem başlangıcında çalıştırma
pm2 startup
pm2 save

# 4. Uygulama durumunu kontrol etme
pm2 status
pm2 logs thunderv1
```

---

## 🌐 **DOMAIN VE SSL KURULUMU**

### **5.1 Domain Konfigürasyonu**
```bash
# 1. Domain DNS ayarları
# A Record: @ -> your-server-ip
# CNAME: www -> your-domain.com
# CNAME: api -> your-domain.com
```

### **5.2 Nginx Konfigürasyonu**
```bash
# Nginx konfigürasyon dosyası oluşturma
sudo nano /etc/nginx/sites-available/thunderv1
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # HTTP'den HTTPS'e yönlendirme
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Sertifikası
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Konfigürasyonu
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Static Files
    location / {
        root /var/www/thunderv1/public;
        index index.html;
        try_files $uri $uri/ @nodejs;
    }

    # API Routes
    location /api {
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

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Node.js Fallback
    location @nodejs {
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

### **5.3 SSL Sertifikası (Let's Encrypt)**
```bash
# 1. Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# 2. SSL sertifikası alma
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 3. Otomatik yenileme testi
sudo certbot renew --dry-run

# 4. Nginx'i yeniden başlatma
sudo systemctl reload nginx
```

---

## 📊 **MONITORING VE LOGGING**

### **6.1 PM2 Monitoring**
```bash
# PM2 monitoring dashboard
pm2 install pm2-logrotate
pm2 install pm2-server-monit

# Monitoring komutları
pm2 monit
pm2 logs thunderv1 --lines 100
pm2 restart thunderv1
pm2 reload thunderv1
```

### **6.2 Nginx Logging**
```bash
# Nginx log dosyaları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Log rotation konfigürasyonu
sudo nano /etc/logrotate.d/nginx
```

### **6.3 System Monitoring**
```bash
# System monitoring araçları
sudo apt install htop iotop nethogs

# Disk kullanımı
df -h

# Memory kullanımı
free -h

# CPU kullanımı
top
```

### **6.4 Application Monitoring (Opsional)**
```bash
# New Relic kurulumu
npm install newrelic

# Sentry kurulumu
npm install @sentry/node

# Winston logging
npm install winston
```

---

## 🔒 **BACKUP VE GÜVENLİK**

### **7.1 Database Backup**
```bash
# PostgreSQL backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U thunderv1_user thunderv1_production > /backup/thunderv1_$DATE.sql
gzip /backup/thunderv1_$DATE.sql

# Otomatik backup (crontab)
0 2 * * * /path/to/backup_script.sh
```

### **7.2 Application Backup**
```bash
# Uygulama dosyaları backup
tar -czf /backup/thunderv1_app_$(date +%Y%m%d).tar.gz /var/www/thunderv1
```

### **7.3 Security Hardening**
```bash
# 1. SSH güvenliği
sudo nano /etc/ssh/sshd_config
# Port 22 değiştir
# PasswordAuthentication no
# PermitRootLogin no

# 2. Fail2ban kurulumu
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 3. UFW firewall
sudo ufw status
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 4. Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## ⚡ **PERFORMANS OPTİMİZASYONU**

### **8.1 Nginx Optimizasyonu**
```nginx
# /etc/nginx/nginx.conf optimizasyonları
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **8.2 Node.js Optimizasyonu**
```javascript
// server.js optimizasyonları
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    // Uygulama kodu
}
```

### **8.3 Database Optimizasyonu**
```sql
-- PostgreSQL optimizasyonları
-- Index'ler oluşturma
CREATE INDEX idx_orders_status ON order_management(status);
CREATE INDEX idx_orders_date ON order_management(order_date);
CREATE INDEX idx_production_plans_status ON production_plans(status);

-- Query optimizasyonu
EXPLAIN ANALYZE SELECT * FROM order_management WHERE status = 'approved';
```

---

## 🔧 **TROUBLESHOOTING**

### **9.1 Yaygın Sorunlar**

#### **Uygulama Başlamıyor**
```bash
# PM2 loglarını kontrol et
pm2 logs thunderv1

# Port kullanımını kontrol et
sudo netstat -tlnp | grep :3000

# Process'leri kontrol et
ps aux | grep node
```

#### **Nginx 502 Bad Gateway**
```bash
# Nginx error loglarını kontrol et
sudo tail -f /var/log/nginx/error.log

# Node.js uygulamasının çalışıp çalışmadığını kontrol et
curl http://localhost:3000/api/health
```

#### **Database Bağlantı Sorunu**
```bash
# PostgreSQL servisini kontrol et
sudo systemctl status postgresql

# Database bağlantısını test et
psql -h localhost -U thunderv1_user -d thunderv1_production
```

### **9.2 Log Analizi**
```bash
# Hata loglarını filtrele
grep "ERROR" /var/log/nginx/error.log
grep "ERROR" /var/www/thunderv1/logs/err.log

# Performans logları
grep "slow" /var/www/thunderv1/logs/combined.log
```

---

## 🔄 **MAINTENANCE**

### **10.1 Günlük Bakım**
```bash
# 1. Sistem durumunu kontrol et
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# 2. Disk kullanımını kontrol et
df -h

# 3. Log dosyalarını temizle
sudo find /var/log -name "*.log" -type f -mtime +7 -delete
```

### **10.2 Haftalık Bakım**
```bash
# 1. Sistem güncellemeleri
sudo apt update && sudo apt upgrade -y

# 2. Uygulama güncellemeleri
cd /var/www/thunderv1
git pull origin main
npm install
pm2 reload thunderv1

# 3. Database optimizasyonu
sudo -u postgres psql -d thunderv1_production -c "VACUUM ANALYZE;"
```

### **10.3 Aylık Bakım**
```bash
# 1. SSL sertifika yenileme kontrolü
sudo certbot renew --dry-run

# 2. Backup testi
# Backup dosyalarının restore edilebilirliğini test et

# 3. Security audit
sudo apt list --upgradable
sudo fail2ban-client status
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Kod review tamamlandı
- [ ] Testler başarılı
- [ ] Environment variables hazırlandı
- [ ] Database migration'ları hazırlandı
- [ ] SSL sertifikası hazırlandı
- [ ] Domain DNS ayarları yapıldı

### **Deployment**
- [ ] Sunucu kurulumu tamamlandı
- [ ] Uygulama kurulumu tamamlandı
- [ ] Nginx konfigürasyonu yapıldı
- [ ] SSL sertifikası kuruldu
- [ ] PM2 ile uygulama başlatıldı
- [ ] Monitoring kuruldu

### **Post-Deployment**
- [ ] Uygulama erişilebilir durumda
- [ ] API endpoint'leri çalışıyor
- [ ] Database bağlantısı aktif
- [ ] SSL sertifikası geçerli
- [ ] Monitoring çalışıyor
- [ ] Backup sistemi aktif

---

## 🎯 **SONUÇ**

Bu deployment rehberi ile ThunderV1 uygulamasını güvenli ve performanslı bir şekilde canlıya alabilirsiniz. Her adımı dikkatli bir şekilde takip ederek, production-ready bir sistem kurmuş olacaksınız.

**Önemli Notlar:**
- Her adımı test edin
- Backup'ları düzenli olarak kontrol edin
- Monitoring sistemlerini aktif tutun
- Security güncellemelerini takip edin
- Performance metriklerini izleyin

**Destek:**
- GitHub Issues: https://github.com/Huseyintabak/ThunderV1/issues
- Documentation: https://github.com/Huseyintabak/ThunderV1/wiki
- Email: support@thunderv1.com

---

*Bu rehber, ThunderV1 uygulamasının production ortamına deployment'ı için hazırlanmıştır. Güncellemeler ve iyileştirmeler için GitHub repository'sini takip edin.*
